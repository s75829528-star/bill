import { useState } from "react";
import { Sparkles, PanelLeft, Plus, Download, Trash2, Building2, Copy, Cpu } from "lucide-react";

interface HeaderProps {
  onToggleSidebar: () => void;
  onNewChat: () => void;
  onExportChat?: () => void;
  onClearChat?: () => void;
  hasMessages?: boolean;
  isSidebarOpen: boolean;
  businessName?: string;
  isLiveDb?: boolean;
  persistenceMode?: "database" | "session";
}

export function Header({
  onToggleSidebar,
  onNewChat,
  onExportChat,
  onClearChat,
  hasMessages = false,
  isSidebarOpen,
  businessName,
  isLiveDb = false,
  persistenceMode = "session",
}: HeaderProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleClear = () => {
    setShowClearConfirm(false);
    onClearChat?.();
  };

  const isConnected = isLiveDb || persistenceMode === "database";

  return (
    <header className="z-20 flex h-14 shrink-0 items-center justify-between border-b border-[#292D3B] bg-[#10121B] px-3 transition-colors sm:px-5 select-none">
      {/* Left side: Toggle button + Title & Status */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className={`flex h-8 w-8 items-center justify-center rounded-lg border border-[#292D3B] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7667FF] ${
            isSidebarOpen
              ? "bg-[#171A26] text-[#F5F5FA]"
              : "bg-transparent text-[#A1A5B7] hover:bg-[#171A26] hover:text-[#F5F5FA]"
          }`}
          title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <PanelLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2.5">
          {/* AI Emblem Icon */}
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#7667FF]/15 border border-[#7667FF]/30 text-[#7667FF]">
            <Sparkles className="h-3.5 w-3.5" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-[#F5F5FA] leading-none tracking-tight">
                Nexora Copilot
              </h1>

              {/* Verified Backend Connection Status Pill */}
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                  isConnected
                    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
                    : "border-amber-500/25 bg-amber-500/10 text-amber-400"
                }`}
              >
                <span className="relative flex h-1.5 w-1.5">
                  {isConnected && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                      isConnected ? "bg-emerald-500" : "bg-amber-400"
                    }`}
                  />
                </span>
                {isConnected ? "Live DB" : "Session Memory"}
              </span>

              {/* Model / Engine Pill */}
              <span className="hidden lg:inline-flex items-center gap-1 rounded-md border border-[#292D3B] bg-[#171A26] px-2 py-0.5 text-[10px] font-medium text-[#A1A5B7]">
                <Cpu className="h-3 w-3 text-[#7667FF]" />
                Grounded Intelligence
              </span>
            </div>

            <p className="mt-1 hidden text-[11px] font-normal leading-none text-[#A1A5B7] md:block">
              Your intelligent business copilot.
            </p>
          </div>
        </div>
      </div>

      {/* Right side: Connected business, Export, Clear & New Chat */}
      <div className="flex items-center gap-2">
        {/* Connected business indicator */}
        <div className="hidden max-w-[200px] items-center gap-1.5 rounded-lg border border-[#292D3B] bg-[#171A26] px-2.5 py-1.5 text-[11px] font-medium text-[#A1A5B7] sm:flex">
          <Building2 className="h-3.5 w-3.5 text-[#7667FF]" />
          <span className="max-w-[140px] truncate font-medium text-[#F5F5FA]">
            {businessName || "Nexora Enterprise"}
          </span>
        </div>

        {/* Export conversation */}
        {hasMessages && onExportChat && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#292D3B] bg-[#171A26] text-[#A1A5B7] transition-colors hover:bg-[#202534] hover:text-[#F5F5FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7667FF]"
              title="Export report"
            >
              <Download className="h-4 w-4" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-[#292D3B] bg-[#10121B] p-1.5 shadow-2xl z-50 text-[#F5F5FA]">
                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    onExportChat();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-xs text-[#F5F5FA] hover:bg-[#171A26] transition-colors font-medium"
                >
                  <Download className="h-3.5 w-3.5 text-[#7667FF]" />
                  <span>Download Markdown (.md)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    onExportChat();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-xs text-[#A1A5B7] hover:bg-[#171A26] hover:text-[#F5F5FA] transition-colors font-medium"
                >
                  <Copy className="h-3.5 w-3.5 text-[#A1A5B7]" />
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
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#292D3B] bg-[#171A26] text-[#A1A5B7] transition-colors hover:border-rose-900/50 hover:bg-rose-950/40 hover:text-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7667FF]"
              title="Clear conversation"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            {showClearConfirm && (
              <div className="absolute right-0 top-full mt-1.5 w-60 rounded-xl border border-[#292D3B] bg-[#10121B] p-4 shadow-2xl z-50 text-xs">
                <p className="font-semibold text-[#F5F5FA]">Clear chat history?</p>
                <p className="text-[11px] text-[#A1A5B7] mt-1 leading-relaxed">
                  This will remove current messages from this conversation view.
                </p>
                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-[#A1A5B7] hover:bg-[#171A26] hover:text-[#F5F5FA]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-rose-500 shadow-sm transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* New Chat Primary Action */}
        <button
          type="button"
          onClick={onNewChat}
          className="flex items-center gap-1.5 rounded-lg bg-[#7667FF] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#897BFF] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7667FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#10121B]"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">New Chat</span>
          <kbd className="hidden md:inline rounded bg-white/15 px-1 py-0.5 text-[9px] font-mono text-white/90">
            ⌘N
          </kbd>
        </button>
      </div>
    </header>
  );
}
