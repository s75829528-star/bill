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
    <div className="flex h-full min-h-0 flex-col bg-[#0B0D14] text-[#F3F4F6]">
      {/* Top Header & New Chat Button */}
      <div className="space-y-2.5 border-b border-[#272B38] p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#6D5EF7] text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Conversations
            </span>
          </div>
          {isMobile ? (
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <span className="rounded-md bg-zinc-800/80 border border-zinc-700/60 px-1.5 py-0.5 text-[10px] font-bold text-zinc-300">
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
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#272B38] bg-[#171923] px-3 py-2 text-xs font-semibold text-white transition-colors hover:border-[#3A3F50] hover:bg-[#191C27] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5EF7] motion-reduce:transition-none"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>New Conversation</span>
        </button>

        {/* Search Past Chats */}
        {conversations.length > 2 && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations…"
              className="w-full rounded-lg border border-[#272B38] bg-[#11141D] py-1.5 pl-8 pr-7 text-xs text-white placeholder:text-[#737B8B] focus:border-[#6D5EF7] focus:outline-none focus:ring-2 focus:ring-[#6D5EF7]/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Conversations List */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-2 py-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <MessageSquare className="h-7 w-7 text-zinc-600 stroke-1" />
            <p className="mt-2 text-xs font-semibold text-zinc-400">
              {searchQuery ? "No matches found" : "No conversations yet"}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">
              {searchQuery
                ? "Try a different search query"
                : "Ask a question to start your first session"}
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="space-y-1">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                {group.label}
              </div>
              {group.items.map((conv) => {
                const isActive = conv.id === activeId;
                const isEditing = conv.id === editingId;

                if (isEditing) {
                  return (
                    <div
                      key={conv.id}
                      className="flex items-center gap-1.5 rounded-xl border border-indigo-500/60 bg-zinc-900 p-1.5 shadow-2xs"
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
                        className="w-full bg-transparent px-1.5 text-xs text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveRename(conv.id)}
                        className="rounded p-1 text-emerald-400 hover:bg-emerald-950/60"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelRename}
                        className="rounded p-1 text-zinc-400 hover:bg-zinc-800"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={conv.id}
                    className={`group relative flex items-center justify-between rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors focus-within:ring-2 focus-within:ring-[#6D5EF7]/50 ${
                      isActive
                        ? "border-[#3A365E] bg-[#19182A] font-semibold text-white"
                        : "border-transparent text-[#9CA3AF] hover:bg-[#141722] hover:text-zinc-200"
                    }`}
                  >
                    {/* Left Accent indicator for active state */}
                    {isActive && (
                      <span className="absolute bottom-2 left-0 top-2 w-0.5 rounded-r-full bg-[#6D5EF7]" />
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
                          isActive ? "text-indigo-400" : "text-zinc-500"
                        }`}
                      />
                      <span className="truncate">{conv.title}</span>
                    </button>

                    {/* Actions: Rename / Delete */}
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          startRename(conv);
                        }}
                        className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                        title="Rename"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(conv.id);
                        }}
                        className="rounded p-1 text-zinc-500 hover:bg-rose-950/60 hover:text-rose-400"
                        title="Delete"
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

      {/* Persistence indicator footer */}
      <div className="border-t border-[#272B38] bg-[#0B0D14] p-3">
        <div className="flex items-start gap-2.5 text-[11px]">
          <span
            className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
              persistenceMode === "database" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-500"
            }`}
          />
          <div className="flex-1 truncate">
            <p className="font-semibold text-zinc-200 leading-tight flex items-center gap-1">
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
            <p className="mt-0.5 text-[10px] text-zinc-500 leading-tight">
              {persistenceMode === "database"
                ? "Row-Level Security Active"
                : "Protected from local storage leaks"}
            </p>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl text-zinc-100">
            <h4 className="text-sm font-bold text-white">Delete conversation?</h4>
            <p className="mt-1.5 text-xs text-zinc-400 leading-normal">
              Are you sure you want to remove this conversation?
            </p>
            <div className="mt-4 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl border border-zinc-800 px-3.5 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 shadow-2xs"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
        <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-50">{content}</div>
      </div>
    );
  }

  // Desktop sidebar
  if (!isOpen) return null;
  return <div className="w-64 h-full shrink-0 select-none">{content}</div>;
}
