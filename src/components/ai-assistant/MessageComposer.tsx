import { useRef, useEffect } from "react";
import {
  ArrowUp,
  Square,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Package,
  Clock,
  X,
  CornerDownLeft,
} from "lucide-react";

interface MessageComposerProps {
  input: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  onQuickPrompt?: (prompt: string) => void;
  isGenerating: boolean;
  disabled?: boolean;
  placeholder?: string;
  showQuickPills?: boolean;
}

export function MessageComposer({
  input,
  onChange,
  onSubmit,
  onStop,
  onQuickPrompt,
  isGenerating,
  disabled = false,
  placeholder = "Ask Nexora Copilot about your sales, invoices, stock, or business health…",
  showQuickPills = true,
}: MessageComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const nextHeight = Math.min(textareaRef.current.scrollHeight, 180);
      textareaRef.current.style.height = `${Math.max(nextHeight, 46)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerating && input.trim() && !disabled) {
        onSubmit();
      }
    }
  };

  const quickPills = [
    {
      label: "Month's Revenue",
      prompt: "How much revenue did we generate this month?",
      icon: TrendingUp,
    },
    {
      label: "Overdue Invoices",
      prompt: "Which invoices are overdue?",
      icon: AlertCircle,
    },
    {
      label: "Low Stock",
      prompt: "Which products need restocking?",
      icon: Package,
    },
    {
      label: "Today's Priorities",
      prompt: "What should I prioritize today?",
      icon: Clock,
    },
  ];

  const canSubmit = input.trim().length > 0 && !disabled && !isGenerating;

  return (
    <div className="mx-auto w-full max-w-3xl px-3 pb-3 pt-2 sm:px-4 sm:pb-4">
      {/* Quick Action Contextual Toolbar above Composer */}
      {showQuickPills && !isGenerating && (
        <div className="flex items-center gap-1.5 pb-2 overflow-x-auto no-scrollbar scroll-smooth">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6880]/70 shrink-0 mr-1 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-[#6D5EF7]" />
            Quick:
          </span>
          {quickPills.map((pill) => {
            const Icon = pill.icon;
            return (
              <button
                key={pill.label}
                type="button"
                onClick={() => onQuickPrompt?.(pill.prompt)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#E7E2F3] bg-[#FFFFFF] px-2.5 py-1 text-[11px] font-medium text-[#6B6880] transition-colors hover:border-[#6D5EF7]/50 hover:bg-[#F0ECFF] hover:text-[#19172A] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#6D5EF7] cursor-pointer"
              >
                <Icon className="h-3 w-3 text-[#6D5EF7]" />
                <span>{pill.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Integrated Composer Box */}
      <div className="relative rounded-xl border border-[#E7E2F3] bg-[#FFFFFF] shadow-sm transition-all duration-150 focus-within:border-[#6D5EF7] focus-within:ring-2 focus-within:ring-[#6D5EF7]/25">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isGenerating}
          rows={1}
          placeholder={placeholder}
          className="w-full resize-none bg-transparent px-4 pb-12 pt-3.5 text-xs font-normal leading-relaxed text-[#19172A] placeholder:text-[#6B6880] focus:outline-none disabled:opacity-60 sm:text-sm"
        />

        {/* Clear text button if input is non-empty */}
        {input.length > 0 && !isGenerating && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-12 top-3 rounded-lg p-1 text-[#6B6880] hover:text-[#19172A] hover:bg-[#F0ECFF] transition-colors"
            title="Clear text"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Bottom bar inside composer */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
          {/* Keyboard shortcut guidance */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#6B6880] font-medium">
            <span>Press</span>
            <kbd className="inline-flex items-center gap-0.5 rounded border border-[#E7E2F3] bg-[#FFFFFF] px-1.5 py-0.5 text-[10px] text-[#6B6880]">
              <CornerDownLeft className="h-2.5 w-2.5" /> Return
            </kbd>
            <span>to send ·</span>
            <kbd className="rounded border border-[#E7E2F3] bg-[#FFFFFF] px-1.5 py-0.5 text-[10px] text-[#6B6880]">
              Shift + Return
            </kbd>
            <span>for new line</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {isGenerating ? (
              <button
                type="button"
                onClick={onStop}
                className="group flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/40 bg-rose-50 text-rose-700 transition-colors hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400 cursor-pointer"
                title="Stop generation"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onSubmit}
                disabled={!canSubmit}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                  canSubmit
                    ? "cursor-pointer bg-[#6D5EF7] text-white hover:bg-[#5B4BE8] active:scale-95 shadow-sm"
                    : "cursor-not-allowed bg-[#E7E2F3]/60 text-[#6B6880]/50"
                }`}
                title="Send query"
              >
                <ArrowUp className="h-4 w-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
