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
  persistenceMode = "session",
}: HeaderProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleClear = () => {
    setShowClearConfirm(false);
    onClearChat?.();
  };

  const hasCloudMemory = persistenceMode === "database";

  return (
    <header className="z-20 flex h-14 shrink-0 items-center justify-between border-b border-[#E7E2F3] bg-[#FFFFFF] px-3 transition-colors sm:px-5 select-none">
      {/* Left side: Toggle button + Title & Status */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className={`flex h-8 w-8 items-center justify-center rounded-lg border border-[#E7E2F3] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5EF7] ${
            isSidebarOpen
              ? "bg-[#FFFFFF] text-[#19172A]"
              : "bg-transparent text-[#6B6880] hover:bg-[#FFFFFF] hover:text-[#19172A]"
          }`}
          title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <PanelLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2.5">
          {/* AI Emblem Icon */}
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6D5EF7]/15 border border-[#6D5EF7]/30 text-[#6D5EF7]">
            <Sparkles className="h-3.5 w-3.5" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-[#19172A] leading-none tracking-tight">
                Nexora Copilot
              </h1>

              {/* Memory mode reflects where conversation history is persisted. */}
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                  hasCloudMemory
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-[#E7E2F3] bg-[#F0ECFF] text-[#6B6880]"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    hasCloudMemory ? "bg-emerald-600" : "bg-[#8A879D]"
                  }`}
                />
                {hasCloudMemory ? "Cloud Memory" : "Session Memory"}
              </span>

              {/* Model / Engine Pill */}
              <span className="hidden lg:inline-flex items-center gap-1 rounded-md border border-[#6D5EF7]/15 bg-[#F0ECFF] px-2 py-0.5 text-[10px] font-medium text-[#5B4BE8]">
                <Cpu className="h-3 w-3 text-[#6D5EF7]" />
                Grounded Intelligence
              </span>
            </div>

            <p className="mt-1 hidden text-[11px] font-normal leading-none text-[#6B6880] md:block">
              Your intelligent business copilot.
            </p>
          </div>
        </div>
      </div>

      {/* Right side: Connected business, Export, Clear & New Chat */}
      <div className="flex items-center gap-2">
        {/* Connected business indicator */}
        <div className="hidden max-w-[200px] items-center gap-1.5 rounded-lg border border-[#E7E2F3] bg-[#FFFFFF] px-2.5 py-1.5 text-[11px] font-medium text-[#6B6880] sm:flex">
          <Building2 className="h-3.5 w-3.5 text-[#6D5EF7]" />
          <span className="max-w-[140px] truncate font-medium text-[#19172A]">
            {businessName || "Nexora Enterprise"}
          </span>
        </div>

        {/* Export conversation */}
        {hasMessages && onExportChat && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E7E2F3] bg-[#FFFFFF] text-[#6B6880] transition-colors hover:bg-[#F0ECFF] hover:text-[#19172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5EF7]"
              title="Export report"
            >
              <Download className="h-4 w-4" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-[#E7E2F3] bg-[#FFFFFF] p-1.5 shadow-2xl z-50 text-[#19172A]">
                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    onExportChat();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-xs text-[#19172A] hover:bg-[#FFFFFF] transition-colors font-medium"
                >
                  <Download className="h-3.5 w-3.5 text-[#6D5EF7]" />
                  <span>Download Markdown (.md)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    onExportChat();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-xs text-[#6B6880] hover:bg-[#FFFFFF] hover:text-[#19172A] transition-colors font-medium"
                >
                  <Copy className="h-3.5 w-3.5 text-[#6B6880]" />
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
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E7E2F3] bg-[#FFFFFF] text-[#6B6880] transition-colors hover:border-rose-900/50 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5EF7]"
              title="Clear conversation"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            {showClearConfirm && (
              <div className="absolute right-0 top-full mt-1.5 w-60 rounded-xl border border-[#E7E2F3] bg-[#FFFFFF] p-4 shadow-2xl z-50 text-xs">
                <p className="font-semibold text-[#19172A]">Clear chat history?</p>
                <p className="text-[11px] text-[#6B6880] mt-1 leading-relaxed">
                  This will remove current messages from this conversation view.
                </p>
                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-[#6B6880] hover:bg-[#FFFFFF] hover:text-[#19172A]"
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
          className="flex items-center gap-1.5 rounded-lg bg-[#6D5EF7] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#5B4BE8] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5EF7] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFFFF]"
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
