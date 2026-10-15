/**
 * aiConversations.ts — Conversation management service for Nexora AI Assistant.
 *
 * Implements dual-mode persistence:
 * 1. Database persistence via Supabase when schema_ai_conversations.sql is applied.
 * 2. In-memory session persistence when database tables are unavailable, ensuring
 *    sensitive business conversations are NEVER leaked into insecure browser localStorage.
 */

import { supabase } from "../lib/supabase";
import type { StructuredAssistantResponse } from "./ai-assistant";

export interface Conversation {
  id: string;
  businessId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
  lastMessageSnippet?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  structuredData?: StructuredAssistantResponse;
  createdAt: string;
  isError?: boolean;
}

// In-memory session store (ephemeral, secure per-browser-session)
let inMemoryConversations: Conversation[] = [];
const inMemoryMessages = new Map<string, ChatMessage[]>();
let hasCheckedDbTable = false;
let isDbTableAvailable = false;

async function checkDbAvailability(): Promise<boolean> {
  if (hasCheckedDbTable) return isDbTableAvailable;
  try {
    const { error } = await supabase.from("ai_conversations").select("id").limit(1);

    if (error) {
      // 404, 42P01 (relation does not exist), or PGRST204
      isDbTableAvailable = false;
    } else {
      isDbTableAvailable = true;
    }
  } catch {
    isDbTableAvailable = false;
  }
  hasCheckedDbTable = true;
  return isDbTableAvailable;
}

export const aiConversationsService = {
  /**
   * Returns current persistence mode ('database' | 'session')
   */
  async getPersistenceMode(): Promise<"database" | "session"> {
    const available = await checkDbAvailability();
    return available ? "database" : "session";
  },

  /**
   * Fetch all conversations for a given business
   */
  async getConversations(businessId: string): Promise<Conversation[]> {
    const dbAvailable = await checkDbAvailability();

    if (dbAvailable) {
      try {
        const { data, error } = await supabase
          .from("ai_conversations")
          .select("id, business_id, title, created_at, updated_at")
          .eq("business_id", businessId)
          .order("updated_at", { ascending: false });

        if (!error && data) {
          return (
            data as Array<{
              id: string;
              business_id: string;
              title: string;
              created_at: string;
              updated_at: string;
            }>
          ).map((row) => ({
            id: row.id,
            businessId: row.business_id,
            title: row.title,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }));
        }
      } catch (e) {
        console.warn("Falling back to session conversation store:", e);
      }
    }

    // In-memory fallback
    return inMemoryConversations.filter((c) => c.businessId === businessId);
  },

  /**
   * Create a new conversation
   */
  async createConversation(businessId: string, title = "New Conversation"): Promise<Conversation> {
    const dbAvailable = await checkDbAvailability();

    if (dbAvailable) {
      try {
        const { data, error } = await supabase
          .from("ai_conversations")
          .insert({
            business_id: businessId,
            title,
          })
          .select()
          .single();

        if (!error && data) {
          return {
            id: data.id,
            businessId: data.business_id,
            title: data.title,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      } catch (e) {
        console.warn("Failed to create in DB, using in-memory store:", e);
      }
    }

    const newConv: Conversation = {
      id: "conv-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      businessId,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    inMemoryConversations = [newConv, ...inMemoryConversations];
    inMemoryMessages.set(newConv.id, []);
    return newConv;
  },

  /**
   * Rename an existing conversation
   */
  async renameConversation(conversationId: string, newTitle: string): Promise<void> {
    const dbAvailable = await checkDbAvailability();

    if (dbAvailable && !conversationId.startsWith("conv-")) {
      try {
        await supabase
          .from("ai_conversations")
          .update({ title: newTitle, updated_at: new Date().toISOString() })
          .eq("id", conversationId);
      } catch (e) {
        console.warn("Failed to rename in DB:", e);
      }
    }

    inMemoryConversations = inMemoryConversations.map((c) =>
      c.id === conversationId ? { ...c, title: newTitle, updatedAt: new Date().toISOString() } : c,
    );
  },

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    const dbAvailable = await checkDbAvailability();

    if (dbAvailable && !conversationId.startsWith("conv-")) {
      try {
        await supabase.from("ai_conversations").delete().eq("id", conversationId);
      } catch (e) {
        console.warn("Failed to delete from DB:", e);
      }
    }

    inMemoryConversations = inMemoryConversations.filter((c) => c.id !== conversationId);
    inMemoryMessages.delete(conversationId);
  },

  /**
   * Get all messages for a conversation
   */
  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const dbAvailable = await checkDbAvailability();

    if (dbAvailable && !conversationId.startsWith("conv-")) {
      try {
        const { data, error } = await supabase
          .from("ai_messages")
          .select("id, conversation_id, role, content, structured_data, created_at")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (!error && data) {
          return (
            data as Array<{
              id: string;
              conversation_id: string;
              role: "user" | "assistant" | "system";
              content: string;
              structured_data?: StructuredAssistantResponse;
              created_at: string;
            }>
          ).map((row) => ({
            id: row.id,
            conversationId: row.conversation_id,
            role: row.role,
            content: row.content,
            structuredData: row.structured_data,
            createdAt: row.created_at,
          }));
        }
      } catch (e) {
        console.warn("Failed to fetch messages from DB:", e);
      }
    }

    return inMemoryMessages.get(conversationId) || [];
  },

  /**
   * Add a message to a conversation
   */
  async addMessage(
    conversationId: string,
    message: Omit<ChatMessage, "id" | "createdAt">,
  ): Promise<ChatMessage> {
    const dbAvailable = await checkDbAvailability();
    const now = new Date().toISOString();

    if (dbAvailable && !conversationId.startsWith("conv-")) {
      try {
        const { data, error } = await supabase
          .from("ai_messages")
          .insert({
            conversation_id: conversationId,
            role: message.role,
            content: message.content,
            structured_data: message.structuredData ?? null,
          })
          .select()
          .single();

        if (!error && data) {
          // Touch parent conversation updated_at
          await supabase
            .from("ai_conversations")
            .update({ updated_at: now })
            .eq("id", conversationId);

          return {
            id: data.id,
            conversationId: data.conversation_id,
            role: data.role,
            content: data.content,
            structuredData: data.structured_data,
            createdAt: data.created_at,
          };
        }
      } catch (e) {
        console.warn("Failed to save message to DB, keeping in memory:", e);
      }
    }

    const newMessage: ChatMessage = {
      id: "msg-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      conversationId,
      role: message.role,
      content: message.content,
      structuredData: message.structuredData,
      createdAt: now,
      isError: message.isError,
    };

    const existing = inMemoryMessages.get(conversationId) || [];
    inMemoryMessages.set(conversationId, [...existing, newMessage]);

    inMemoryConversations = inMemoryConversations.map((c) =>
      c.id === conversationId ? { ...c, updatedAt: now } : c,
    );

    return newMessage;
  },
};
