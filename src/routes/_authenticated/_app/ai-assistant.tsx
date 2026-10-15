import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "../../../contexts/AuthContext";
import { useBusiness } from "../../../contexts/BusinessContext";
import { useIsMobile } from "../../../hooks/use-mobile";

import {
  aiConversationsService,
  type Conversation,
  type ChatMessage,
} from "../../../services/aiConversations";
import { aiAssistantService, type CopilotAction } from "../../../services/ai-assistant";

import { Header } from "../../../components/ai-assistant/Header";
import { ConversationSidebar } from "../../../components/ai-assistant/ConversationSidebar";
import { EmptyState } from "../../../components/ai-assistant/EmptyState";
import {
  ChatMessageItem,
  LoadingMessageItem,
} from "../../../components/ai-assistant/ChatMessageItem";
import { MessageComposer } from "../../../components/ai-assistant/MessageComposer";
import { ActionConfirmModal } from "../../../components/ai-assistant/ActionConfirmModal";

export const Route = createFileRoute("/_authenticated/_app/ai-assistant")({
  component: AiAssistantPage,
});

function AiAssistantPage() {
  const { user } = useAuth();
  const { business } = useBusiness();
  const isMobile = useIsMobile();

  const businessId = business?.id ?? null;
  const businessName = business?.business_name ?? "Nexora Enterprise";
  const ownerName = business?.owner_name || undefined;
  const userInitials = user?.email ? user.email.slice(0, 2).toUpperCase() : "U";

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [persistenceMode, setPersistenceMode] = useState<"database" | "session">("session");
  const [pendingAction, setPendingAction] = useState<CopilotAction | null>(null);

  // References
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  // Initialize persistence mode & load conversations
  useEffect(() => {
    let mounted = true;
    async function init() {
      const mode = await aiConversationsService.getPersistenceMode();
      if (!mounted) return;
      setPersistenceMode(mode);

      if (businessId) {
        const loaded = await aiConversationsService.getConversations(businessId);
        if (!mounted) return;
        setConversations(loaded);
        if (loaded.length > 0) {
          setActiveConversationId((prev) => prev ?? loaded[0].id);
        }
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, [businessId]);

  // Load messages whenever active conversation changes
  useEffect(() => {
    let mounted = true;
    async function loadConvMessages() {
      if (!activeConversationId) {
        setMessages([]);
        return;
      }
      const msgs = await aiConversationsService.getMessages(activeConversationId);
      if (!mounted) return;
      setMessages(msgs);
    }
    loadConvMessages();
    return () => {
      mounted = false;
    };
  }, [activeConversationId]);

  // Track if user has scrolled away from bottom
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distanceToBottom < 100;
  }, []);

  // Auto-scroll when messages update, only if user was already at bottom
  useEffect(() => {
    if (isNearBottomRef.current && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isGenerating]);

  // Create new chat
  const handleNewChat = useCallback(async () => {
    if (isGenerating) {
      abortControllerRef.current?.abort();
      setIsGenerating(false);
    }

    if (!businessId) {
      // In-memory blank session
      setActiveConversationId(null);
      setMessages([]);
      return;
    }

    try {
      const newConv = await aiConversationsService.createConversation(
        businessId,
        "New Conversation",
      );
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      setMessages([]);
    } catch (e) {
      console.error("Failed to create conversation:", e);
      toast.error("Failed to start new conversation");
    }
  }, [businessId, isGenerating]);

  // Global keyboard shortcut (⌘N for new chat)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNewChat]);

  // Rename conversation
  const handleRename = useCallback(async (id: string, newTitle: string) => {
    await aiConversationsService.renameConversation(id, newTitle);
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c)));
    toast.success("Conversation renamed");
  }, []);

  // Delete conversation
  const handleDelete = useCallback(
    async (id: string) => {
      await aiConversationsService.deleteConversation(id);
      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);

      if (activeConversationId === id) {
        if (remaining.length > 0) {
          setActiveConversationId(remaining[0].id);
        } else {
          setActiveConversationId(null);
          setMessages([]);
        }
      }
      toast.success("Conversation deleted");
    },
    [conversations, activeConversationId],
  );

  // Clear current messages
  const handleClearCurrentChat = useCallback(async () => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    await aiConversationsService.deleteConversation(activeConversationId);
    setMessages([]);
    if (businessId) {
      const freshConv = await aiConversationsService.createConversation(
        businessId,
        "New Conversation",
      );
      setConversations((prev) => [freshConv, ...prev.filter((c) => c.id !== activeConversationId)]);
      setActiveConversationId(freshConv.id);
    }
    toast.success("Current conversation cleared");
  }, [activeConversationId, businessId]);

  // Export current conversation to Markdown file
  const handleExportChat = useCallback(() => {
    if (messages.length === 0) return;

    const dateStr = new Date().toISOString().slice(0, 10);
    let md = `# Nexora Copilot Session Report\n`;
    md += `**Date:** ${dateStr}\n`;
    md += `**Business:** ${businessName}\n\n---\n\n`;

    messages.forEach((m) => {
      if (m.role === "user") {
        md += `### 👤 Owner Query\n${m.content}\n\n`;
      } else {
        md += `### ✨ Nexora Grounded Analysis\n`;
        if (m.structuredData) {
          md += `${m.structuredData.conciseAnswer}\n\n`;
          if (m.structuredData.metrics?.length) {
            md += `#### Key Metrics\n`;
            m.structuredData.metrics.forEach((k) => {
              md += `- **${k.label}**: ${k.value} ${k.sub ? `(${k.sub})` : ""}\n`;
            });
            md += `\n`;
          }
          if (m.structuredData.recommendations?.length) {
            md += `#### Recommendations\n`;
            m.structuredData.recommendations.forEach((r) => {
              md += `- ${r}\n`;
            });
            md += `\n`;
          }
        } else {
          md += `${m.content}\n\n`;
        }
      }
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexora-copilot-report-${dateStr}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit report exported as Markdown");
  }, [messages, businessName]);

  // Send message
  const handleSendMessage = useCallback(
    async (promptToSend?: string) => {
      const text = (promptToSend ?? input).trim();
      if (!text || isGenerating) return;

      setInput("");

      // Ensure active conversation
      let targetConvId = activeConversationId;
      if (!targetConvId) {
        const dummyBusinessId = businessId || "demo-business";
        const newConv = await aiConversationsService.createConversation(
          dummyBusinessId,
          text.length > 32 ? text.slice(0, 32) + "…" : text,
        );
        setConversations((prev) => [newConv, ...prev]);
        setActiveConversationId(newConv.id);
        targetConvId = newConv.id;
      }

      // Add user message
      const userMsg = await aiConversationsService.addMessage(targetConvId, {
        conversationId: targetConvId,
        role: "user",
        content: text,
      });

      setMessages((prev) => [...prev, userMsg]);
      setIsGenerating(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const structuredResponse = await aiAssistantService.processQuery(text, {
          businessId,
          businessName,
          ownerName: ownerName,
          signal: controller.signal,
        });

        // Save assistant response
        const assistantMsg = await aiConversationsService.addMessage(targetConvId, {
          conversationId: targetConvId,
          role: "assistant",
          content: structuredResponse.conciseAnswer,
          structuredData: structuredResponse,
        });

        setMessages((prev) => [...prev, assistantMsg]);

        // Auto-rename conversation if "New Conversation"
        const currentConv = conversations.find((c) => c.id === targetConvId);
        if (currentConv && currentConv.title === "New Conversation") {
          const autoTitle = text.length > 28 ? text.slice(0, 28) + "…" : text;
          await aiConversationsService.renameConversation(targetConvId, autoTitle);
          setConversations((prev) =>
            prev.map((c) => (c.id === targetConvId ? { ...c, title: autoTitle } : c)),
          );
        }
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") {
          toast.info("Generation stopped");
        } else {
          console.error("Assistant execution error:", err);
          const errorMsg = await aiConversationsService.addMessage(targetConvId, {
            conversationId: targetConvId,
            role: "assistant",
            content:
              "I encountered an error querying your business ledger. Please verify your connection and retry.",
            isError: true,
          });
          setMessages((prev) => [...prev, errorMsg]);
          toast.error("Query failed to complete");
        }
      } finally {
        setIsGenerating(false);
        abortControllerRef.current = null;
      }
    },
    [input, isGenerating, activeConversationId, businessId, businessName, ownerName, conversations],
  );

  // Stop generation
  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  }, []);

  // Action trigger
  const handleTriggerAction = useCallback((action: CopilotAction) => {
    if (action.requiresConfirmation) {
      setPendingAction(action);
    } else if (action.to) {
      window.location.href = action.to;
    }
  }, []);

  // Confirm action callback
  const handleConfirmAction = useCallback(
    (action: CopilotAction) => {
      if (action.actionType === "prepare_reminder") {
        const customer = (action.payload?.customer as string) || "the customer";
        const amount = action.payload?.amount
          ? `₹${Number(action.payload.amount).toLocaleString("en-IN")}`
          : "";
        const text = `Dear ${customer}, this is a gentle reminder regarding overdue invoice payment of ${amount}. Please settle at your earliest convenience. Thank you, ${businessName}.`;
        navigator.clipboard.writeText(text);
        toast.success(`Payment reminder copied to clipboard for ${customer}`);
      } else {
        toast.success(`Action "${action.label}" processed successfully.`);
      }
    },
    [businessName],
  );

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#0F111A] text-[#F3F4F6] selection:bg-[#6D5EF7]/30">
      {/* Deep Obsidian Header */}
      <Header
        onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
        onNewChat={handleNewChat}
        onExportChat={handleExportChat}
        onClearChat={handleClearCurrentChat}
        hasMessages={messages.length > 0}
        isSidebarOpen={isSidebarOpen}
        businessName={businessName}
      />

      {/* Main Workspace: Sidebar + Conversation Canvas */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {/* Collapsible Sidebar in Midnight Obsidian */}
        <ConversationSidebar
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={(id) => setActiveConversationId(id)}
          onNew={handleNewChat}
          onRename={handleRename}
          onDelete={handleDelete}
          persistenceMode={persistenceMode}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isMobile={isMobile}
        />

        {/* Conversation Workspace Canvas with Deep Ambient Luminescence */}
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#0F111A]">

          {/* Scrollable Message History or Empty State */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-4 sm:px-4"
          >
            {messages.length === 0 ? (
              <EmptyState
                onSelectPrompt={(prompt) => handleSendMessage(prompt)}
                businessName={businessName}
                ownerName={ownerName}
              />
            ) : (
              <div className="mx-auto w-full max-w-3xl space-y-3">
                {messages.map((msg) => (
                  <ChatMessageItem
                    key={msg.id}
                    message={msg}
                    onRetry={(content) => handleSendMessage(content)}
                    onSelectFollowUp={(q) => handleSendMessage(q)}
                    onTriggerAction={handleTriggerAction}
                    userInitials={userInitials}
                  />
                ))}

                {/* Loading indicator during inference */}
                {isGenerating && <LoadingMessageItem />}
              </div>
            )}
          </div>

          <div className="relative z-10 shrink-0 border-t border-[#272B38] bg-[#0F111A]">
            <MessageComposer
              input={input}
              onChange={setInput}
              onSubmit={() => handleSendMessage()}
              onStop={handleStop}
              onQuickPrompt={(prompt) => handleSendMessage(prompt)}
              isGenerating={isGenerating}
              disabled={isGenerating}
              showQuickPills={messages.length > 0}
            />
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Consequential Actions */}
      <ActionConfirmModal
        action={pendingAction}
        onClose={() => setPendingAction(null)}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}
