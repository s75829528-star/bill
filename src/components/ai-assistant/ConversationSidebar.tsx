import { useState } from "react";
import {
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Search,
  Sparkles,
  Database,
  Lock,
  Building2,
  ShieldCheck,
  Clock,
} from "lucide-react";
import type { Conversation } from "../../services/aiConversations";

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  persistenceMode: "database" | "session";
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  businessName?: string;
  ownerName?: string;
}

export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
  persistenceMode,
  isOpen,
  onClose,
  isMobile,
  businessName = "Nexora Enterprise",
  ownerName,
}: ConversationSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const startRename = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      onRename(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setEditTitle("");
  };

  // Filter conversations by search term
  const filtered = searchQuery.trim()
    ? conversations.filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    : conversations;

  // Group conversations chronologically
  const groupConversations = () => {
    const today: Conversation[] = [];
    const yesterday: Conversation[] = [];
    const previous7Days: Conversation[] = [];
    const older: Conversation[] = [];

    const now = new Date().setHours(0, 0, 0, 0);
    const oneDay = 24 * 60 * 60 * 1000;

    filtered.forEach((conv) => {
      const convDate = new Date(conv.updatedAt).setHours(0, 0, 0, 0);
      const diffDays = Math.floor((now - convDate) / oneDay);

      if (diffDays === 0) {
        today.push(conv);
      } else if (diffDays === 1) {
        yesterday.push(conv);
      } else if (diffDays <= 7) {
        previous7Days.push(conv);
      } else {
        older.push(conv);
      }
    });

    return [
      { label: "Today", items: today },
      { label: "Yesterday", items: yesterday },
      { label: "Previous 7 Days", items: previous7Days },
      { label: "Older", items: older },
    ].filter((g) => g.items.length > 0);
  };

  const groups = groupConversations();

  const content = (
    <div className="flex h-full min-h-0 flex-col bg-[#10121B] text-[#F5F5FA] border-r border-[#292D3B] select-none">
      {/* Top Header & New Chat Button */}
      <div className="space-y-2.5 border-b border-[#292D3B] p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#7667FF] text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-semibold text-[#F5F5FA] tracking-wide">
              Conversations
            </span>
          </div>

          {isMobile ? (
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-[#A1A5B7] hover:bg-[#171A26] hover:text-[#F5F5FA]"
              aria-label="Close conversation drawer"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <span className="rounded-md bg-[#171A26] border border-[#292D3B] px-1.5 py-0.5 text-[10px] font-semibold text-[#A1A5B7]">
              {conversations.length}
            </span>
          )}
        </div>

        {/* New Chat Primary Button */}
        <button
          type="button"
          onClick={() => {
            onNew();
            if (isMobile) onClose();
          }}
          className="flex w-full items-center justify-between rounded-lg border border-[#292D3B] bg-[#171A26] px-3 py-2 text-xs font-semibold text-[#F5F5FA] transition-colors hover:border-[#7667FF]/50 hover:bg-[#202534] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7667FF]"
        >
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 stroke-[2.5] text-[#7667FF]" />
            <span>New Conversation</span>
          </div>
          <kbd className="rounded bg-[#10121B] border border-[#292D3B] px-1.5 py-0.5 text-[9px] font-mono text-[#A1A5B7]">
            ⌘N
          </kbd>
        </button>

        {/* Search Past Chats */}
        {conversations.length > 2 && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#A1A5B7]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations…"
              className="w-full rounded-lg border border-[#292D3B] bg-[#0D0F17] py-1.5 pl-8 pr-7 text-xs text-[#F5F5FA] placeholder:text-[#A1A5B7]/60 focus:border-[#7667FF] focus:outline-none focus:ring-1 focus:ring-[#7667FF]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#A1A5B7] hover:text-[#F5F5FA]"
                title="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Conversations List */}
      <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto overscroll-contain px-2 py-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <MessageSquare className="h-7 w-7 text-[#A1A5B7]/40 stroke-1" />
            <p className="mt-2 text-xs font-semibold text-[#A1A5B7]">
              {searchQuery ? "No matches found" : "No conversations yet"}
            </p>
            <p className="mt-1 text-[11px] text-[#A1A5B7]/60">
              {searchQuery
                ? "Try a different search query"
                : "Ask a question to start your first session"}
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="space-y-1">
              <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#A1A5B7]/70">
                {group.label}
              </div>
              {group.items.map((conv) => {
                const isActive = conv.id === activeId;
                const isEditing = conv.id === editingId;

                if (isEditing) {
                  return (
                    <div
                      key={conv.id}
                      className="flex items-center gap-1.5 rounded-lg border border-[#7667FF] bg-[#171A26] p-1.5 shadow-sm"
                    >
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveRename(conv.id);
                          if (e.key === "Escape") handleCancelRename();
                        }}
                        autoFocus
                        className="w-full bg-transparent px-1.5 text-xs text-[#F5F5FA] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveRename(conv.id)}
                        className="rounded p-1 text-emerald-400 hover:bg-emerald-950/40"
                        title="Save title"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelRename}
                        className="rounded p-1 text-[#A1A5B7] hover:bg-[#202534]"
                        title="Cancel"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={conv.id}
                    className={`group relative flex items-center justify-between rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors focus-within:ring-1 focus-within:ring-[#7667FF] ${
                      isActive
                        ? "border-[#7667FF]/30 bg-[#171A26] text-[#F5F5FA] font-semibold"
                        : "border-transparent text-[#A1A5B7] hover:bg-[#171A26]/60 hover:text-[#F5F5FA]"
                    }`}
                  >
                    {/* Active Accent indicator */}
                    {isActive && (
                      <span className="absolute bottom-2 left-0 top-2 w-0.5 rounded-r-full bg-[#7667FF]" />
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onSelect(conv.id);
                        if (isMobile) onClose();
                      }}
                      className="flex flex-1 items-center gap-2 truncate text-left pl-1"
                    >
                      <MessageSquare
                        className={`h-3.5 w-3.5 shrink-0 ${
                          isActive ? "text-[#7667FF]" : "text-[#A1A5B7]/60"
                        }`}
                      />
                      <span className="truncate">{conv.title}</span>
                    </button>

                    {/* Actions: Rename / Delete */}
                    <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          startRename(conv);
                        }}
                        className="rounded p-1 text-[#A1A5B7] hover:bg-[#202534] hover:text-[#F5F5FA]"
                        title="Rename conversation"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(conv.id);
                        }}
                        className="rounded p-1 text-[#A1A5B7] hover:bg-rose-950/40 hover:text-rose-400"
                        title="Delete conversation"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Business Identity & Persistence Status Footer */}
      <div className="border-t border-[#292D3B] bg-[#10121B] p-3 space-y-2">
        {/* Compact Business Context */}
        <div className="flex items-center gap-2 rounded-lg bg-[#171A26] p-2 border border-[#292D3B]/80">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#7667FF]/15 text-[#7667FF]">
            <Building2 className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#F5F5FA] truncate leading-tight">
              {businessName}
            </p>
            <p className="text-[10px] text-[#A1A5B7] truncate leading-tight mt-0.5">
              {ownerName ? `Owner: ${ownerName}` : "Tenant Workspace"}
            </p>
          </div>
        </div>

        {/* Persistence Status */}
        <div className="flex items-start gap-2 pt-1 text-[11px]">
          <span
            className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
              persistenceMode === "database"
                ? "bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                : "bg-amber-400"
            }`}
          />
          <div className="flex-1 truncate">
            <p className="font-medium text-[#F5F5FA] leading-tight flex items-center gap-1">
              {persistenceMode === "database" ? (
                <>
                  <Database className="h-3 w-3 text-emerald-400" />
                  <span>Cloud DB Synced</span>
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3 text-amber-400" />
                  <span>In-Memory Session</span>
                </>
              )}
            </p>
            <p className="mt-0.5 text-[10px] text-[#A1A5B7] leading-tight flex items-center gap-1">
              <ShieldCheck className="h-2.5 w-2.5 text-[#7667FF]" />
              {persistenceMode === "database"
                ? "Row-Level Security Active"
                : "Protected from local storage leaks"}
            </p>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-[#292D3B] bg-[#10121B] p-5 shadow-2xl text-[#F5F5FA]">
            <h4 className="text-sm font-semibold text-[#F5F5FA]">Delete conversation?</h4>
            <p className="mt-1.5 text-xs text-[#A1A5B7] leading-normal">
              Are you sure you want to remove this conversation and its audit records?
            </p>
            <div className="mt-4 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl border border-[#292D3B] bg-[#171A26] px-3.5 py-1.5 text-xs font-semibold text-[#A1A5B7] hover:bg-[#202534] hover:text-[#F5F5FA] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 shadow-sm transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-40 flex">
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={onClose} />
        <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-50">{content}</div>
      </div>
    );
  }

  // Desktop sidebar
  if (!isOpen) return null;
  return <aside className="w-64 h-full shrink-0 select-none">{content}</aside>;
}
