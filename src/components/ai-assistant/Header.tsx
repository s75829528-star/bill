import { useState } from "react";
import {
  Sparkles,
  PanelLeft,
  Plus,
  Download,
  Trash2,
  Building2,
  Copy,
} from "lucide-react";

interface HeaderProps {
  onToggleSidebar: () => void;
  onNewChat: () => void;
  onExportChat?: () => void;
  onClearChat?: () => void;
  hasMessages?: boolean;
  isSidebarOpen: boolean;
  businessName?: string;
  isLiveDb?: boolean;
}

export function Header({
  onToggleSidebar,
  onNewChat,
  onExportChat,
  onClearChat,
  hasMessages = false,
  isSidebarOpen,
  businessName,
  isLiveDb,
}: HeaderProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleClear = () => {
    setShowClearConfirm(false);
    onClearChat?.();
  };

  return (
    <div className="z-20 flex h-14 shrink-0 items-center justify-between border-b border-[#272B38] bg-[#0B0D14] px-3 transition-colors sm:px-5">
      {/* Left side: Toggle button + Title & Status */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className={`flex h-8 w-8 items-center justify-center rounded-lg border border-[#272B38] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5EF7] ${
            isSidebarOpen
              ? "bg-[#191C27] text-white"
              : "bg-transparent text-[#9CA3AF] hover:bg-[#191C27] hover:text-white"
          }`}
          title="Toggle conversation history"
        >
          <PanelLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white leading-none tracking-tight">
                Nexora Copilot
              </h1>

              {/* Status pill with electric emerald luminescence */}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                Live DB
              </span>
            </div>
            <p className="mt-1 hidden text-[11px] font-medium leading-none text-[#9CA3AF] md:block">
              Verified business intelligence & ledger copilot
            </p>
          </div>
        </div>
      </div>

      {/* Right side: Connected business, Export, Clear & New Chat */}
      <div className="flex items-center gap-2">
        {/* Connected business indicator */}
        <div className="hidden max-w-[190px] items-center gap-1.5 rounded-lg border border-[#272B38] bg-[#11141D] px-2.5 py-1.5 text-[11px] font-medium text-[#9CA3AF] sm:flex">
          <Building2 className="h-3.5 w-3.5 text-zinc-400" />
          <span className="max-w-[140px] truncate font-semibold text-[#F3F4F6]">
            {businessName || "Your Enterprise"}
          </span>
        </div>

        {/* Export conversation */}
        {hasMessages && onExportChat && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#272B38] bg-[#11141D] text-[#9CA3AF] transition-colors hover:bg-[#191C27] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5EF7]"
              title="Export report"
            >
              <Download className="h-4 w-4" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-48 rounded-2xl border border-zinc-800 bg-zinc-900 p-1 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    onExportChat();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl p-2 text-left text-xs text-zinc-200 hover:bg-zinc-800 transition-colors font-medium"
                >
                  <Download className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Download Markdown (.md)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    onExportChat();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl p-2 text-left text-xs text-zinc-200 hover:bg-zinc-800 transition-colors font-medium"
                >
                  <Copy className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Copy Audit Transcript</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Clear chat */}
        {hasMessages && onClearChat && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#272B38] bg-[#11141D] text-[#9CA3AF] transition-colors hover:border-rose-900/50 hover:bg-rose-950/60 hover:text-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5EF7]"
              title="Clear conversation"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            {showClearConfirm && (
              <div className="absolute right-0 top-full mt-1.5 w-56 rounded-2xl border border-zinc-800 bg-zinc-900 p-3.5 shadow-2xl z-50 text-xs animate-in fade-in zoom-in-95">
                <p className="font-bold text-white">Clear chat history?</p>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  This will remove current messages from this view.
                </p>
                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-2xs hover:bg-rose-500"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* New Chat Primary Action (Electric Luminescent Accent) */}
        <button
          type="button"
          onClick={onNewChat}
          className="flex items-center gap-1.5 rounded-lg bg-[#6D5EF7] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#5B4CE0] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A89FFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0D14] motion-reduce:transition-none"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">New Chat</span>
          <kbd className="hidden md:inline rounded bg-indigo-700/80 border border-indigo-400/30 px-1 py-0.2 text-[9px] font-mono text-indigo-100">
            ⌘N
          </kbd>
        </button>
      </div>
    </div>
  );
}
