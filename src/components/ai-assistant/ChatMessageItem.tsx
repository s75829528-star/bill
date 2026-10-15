import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import {
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  Lightbulb,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import type { ChatMessage } from "../../services/aiConversations";
import type { CopilotAction, KeyMetric, SupportingRecord } from "../../services/ai-assistant";
import { AssistantChart } from "./AssistantChart";

interface ChatMessageItemProps {
  message: ChatMessage;
  onRetry?: (content: string) => void;
  onSelectFollowUp?: (followUp: string) => void;
  onTriggerAction?: (action: CopilotAction) => void;
  userInitials?: string;
}

export function ChatMessageItem({
  message,
  onRetry,
  onSelectFollowUp,
  onTriggerAction,
  userInitials = "U",
}: ChatMessageItemProps) {
  const [copied, setCopied] = useState(false);
  const [showDerivation, setShowDerivation] = useState(false);
  const [showAllRecords, setShowAllRecords] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const isUser = message.role === "user";
  const structured = message.structuredData;

  const handleCopy = () => {
    let copyText = message.content;
    if (structured) {
      copyText = `### ${structured.conciseAnswer}\n\n`;
      if (structured.metrics?.length) {
        copyText += structured.metrics
          .map((m) => `• **${m.label}**: ${m.value}${m.sub ? ` (${m.sub})` : ""}`)
          .join("\n");
        copyText += "\n\n";
      }
      if (structured.recommendations?.length) {
        copyText +=
          `### Recommendations:\n` + structured.recommendations.map((r) => `• ${r}`).join("\n");
      }
    }

    navigator.clipboard
      .writeText(copyText)
      .then(() => {
        setCopied(true);
        toast.success("Insight copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        toast.error("Failed to copy insight");
      });
  };

  const handleShare = () => {
    handleCopy();
    toast.info("Insight ready to share.");
  };

  // Safe formatting for markdown bold tokens
  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  if (isUser) {
    return (
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
        className="flex w-full justify-end px-3 py-2 sm:px-4"
      >
        <div className="flex max-w-[85%] sm:max-w-[70%] items-start gap-2.5">
          <div className="rounded-2xl rounded-tr-xs border border-[#6D5EF7]/40 bg-[#4338CA] px-4 py-2.5 text-sm font-medium leading-relaxed text-white">
            {message.content}
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-200 shadow-2xs">
            {userInitials}
          </div>
        </div>
      </motion.div>
    );
  }

  // Assistant Message
  const displayedRecords = structured?.supportingData?.records
    ? showAllRecords
      ? structured.supportingData.records
      : structured.supportingData.records.slice(0, 3)
    : [];

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
      className="flex w-full justify-start px-2 py-3 sm:px-4"
    >
      <div className="flex w-full max-w-3xl items-start gap-3.5">
        {/* Avatar with deep obsidian styling & subtle glow ring */}
        <div className="relative flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-[#29264A] text-[#A89FFF] ring-1 ring-[#6D5EF7]/25">
          <Sparkles className="h-4.5 w-4.5" />
        </div>

        {/* Message Content Container */}
        <div className="flex-1 overflow-hidden space-y-3.5">
          {/* Header pill & Status */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-200 tracking-tight">
                Nexora Business Copilot
              </span>
              {structured?.statusLabel && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {structured.statusLabel}
                </span>
              )}
            </div>
            <span className="text-[11px] font-medium text-zinc-500">
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {/* Concise Direct Answer Card */}
          <div className="rounded-xl border border-[#272B38] bg-[#191C27] p-4 text-sm leading-relaxed text-[#D1D5DB]">
            {structured ? renderFormattedText(structured.conciseAnswer) : message.content}
          </div>

          {/* Key Metrics Grid (Bento Grid) */}
          {structured?.metrics && structured.metrics.length > 0 && (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {structured.metrics.map((metric: KeyMetric, idx: number) => (
                <div
                  key={idx}
                  className="rounded-xl border border-[#272B38] bg-[#191C27] p-3.5 transition-colors hover:border-[#3A3F50] motion-reduce:transition-none"
                >
                  <div className="text-[11px] font-medium text-zinc-400">{metric.label}</div>
                  <div className="mt-1 text-lg font-bold text-white tracking-tight sm:text-xl font-mono">
                    {metric.value}
                  </div>
                  {metric.trend && (
                    <div
                      className={`mt-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                        metric.trend.positive
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {metric.trend.positive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span>{metric.trend.value}</span>
                    </div>
                  )}
                  {metric.sub && !metric.trend && (
                    <div className="mt-1 text-[10px] text-zinc-500 truncate">{metric.sub}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Interactive Recharts Chart Visual */}
          {structured?.chart && <AssistantChart chart={structured.chart} />}

          {/* Derivation Details (Accordion / Expandable) */}
          {structured?.derivation && (
            <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950/70 text-xs transition-all">
              <button
                type="button"
                onClick={() => setShowDerivation((v) => !v)}
                className="flex w-full items-center justify-between p-3 text-left font-medium text-zinc-300 hover:bg-zinc-900/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-800 text-indigo-400">
                    <Info className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Audit Trail & Calculation Scope
                  </span>
                </div>
                {showDerivation ? (
                  <ChevronUp className="h-4 w-4 text-zinc-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-zinc-500" />
                )}
              </button>

              {showDerivation && (
                <div className="space-y-2 border-t border-zinc-800/80 p-3.5 text-[11px] text-zinc-300 bg-zinc-900/40">
                  <p className="leading-relaxed font-medium text-zinc-200">
                    {structured.derivation.explanation}
                  </p>
                  {structured.derivation.formula && (
                    <div className="rounded-lg bg-zinc-950 p-2 font-mono text-[10px] text-zinc-300 border border-zinc-800">
                      Formula: {structured.derivation.formula}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-zinc-400 pt-1">
                    {structured.derivation.dateRange && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-zinc-500" />
                        <span>Date Scope: {structured.derivation.dateRange}</span>
                      </div>
                    )}
                    {structured.derivation.sourceModules && (
                      <div className="flex items-center gap-1.5">
                        <Layers className="h-3 w-3 text-zinc-500" />
                        <span>Modules: {structured.derivation.sourceModules.join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Supporting Records Table */}
          {structured?.supportingData && structured.supportingData.records.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/80 shadow-[0_2px_12px_rgba(0,0,0,0.3)] backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/70 px-4 py-2.5">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  {structured.supportingData.title}
                </span>
                <span className="text-[10px] font-medium text-zinc-500">
                  {structured.supportingData.records.length} records returned
                </span>
              </div>
              <div className="divide-y divide-zinc-800/60">
                {displayedRecords.map((rec: SupportingRecord) => (
                  <div
                    key={rec.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs hover:bg-zinc-800/50 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-white">{rec.title}</div>
                      {rec.subtitle && (
                        <div className="text-[11px] text-zinc-400 mt-0.5">{rec.subtitle}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      {rec.date && (
                        <span className="text-[11px] text-zinc-500 hidden sm:inline">
                          {rec.date}
                        </span>
                      )}
                      {rec.badge && (
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                            rec.badge.variant === "emerald"
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                              : rec.badge.variant === "rose"
                                ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                                : rec.badge.variant === "amber"
                                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                  : "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                          }`}
                        >
                          {rec.badge.text}
                        </span>
                      )}
                      {rec.value && (
                        <span className="font-bold font-mono text-white text-sm">
                          {rec.value}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {structured.supportingData.records.length > 3 && (
                <div className="border-t border-zinc-800/80 bg-zinc-950/40 p-2 text-center">
                  <button
                    type="button"
                    onClick={() => setShowAllRecords((v) => !v)}
                    className="text-xs font-semibold text-indigo-400 hover:underline inline-flex items-center gap-1"
                  >
                    {showAllRecords
                      ? "Show less records"
                      : `View all ${structured.supportingData.records.length} records`}
                    {showAllRecords ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Actionable Recommendations Callout */}
          {structured?.recommendations && structured.recommendations.length > 0 && (
            <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/50 via-zinc-900/80 to-zinc-900/80 p-4 shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
              <div className="flex items-center gap-2 mb-2 text-indigo-400">
                <Lightbulb className="h-4 w-4" />
                <span className="font-bold text-xs uppercase tracking-wider">
                  Copilot Operational Recommendations
                </span>
              </div>
              <div className="space-y-2">
                {structured.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs text-zinc-300 leading-relaxed"
                  >
                    <span className="text-indigo-400 font-extrabold">•</span>
                    <span>{renderFormattedText(rec)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Direct Actions Buttons */}
          {structured?.actions && structured.actions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {structured.actions.map((act, i) => {
                if (act.to) {
                  return (
                    <Link
                      key={i}
                      to={act.to}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:border-indigo-500/50 hover:bg-zinc-850 hover:text-white transition-all shadow-2xs"
                    >
                      <span>{act.label}</span>
                      <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
                    </Link>
                  );
                }

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onTriggerAction?.(act)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:border-indigo-500/50 hover:bg-zinc-850 hover:text-white transition-all shadow-2xs"
                  >
                    <span>{act.label}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Suggested Follow-up Question Chips */}
          {structured?.suggestedFollowUps && structured.suggestedFollowUps.length > 0 && (
            <div className="pt-2">
              <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Suggested follow-up questions
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {structured.suggestedFollowUps.map((question, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onSelectFollowUp?.(question)}
                    className="group inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-indigo-500/50 hover:bg-zinc-800 hover:text-white transition-all shadow-2xs text-left"
                  >
                    <Sparkles className="h-3 w-3 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                    <span>"{question}"</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Toolbar with Copy, Share & Retry */}
          <div className="flex items-center gap-2 pt-2 text-zinc-500 border-t border-zinc-800/70">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
              title="Copy response"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>{copied ? "Copied" : "Copy Insight"}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
              title="Share insight"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {onRetry && (
              <button
                type="button"
                onClick={() => onRetry(message.content)}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                title="Retry response"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Re-run</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function LoadingMessageItem() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full justify-start px-2 py-3 sm:px-4"
    >
      <div className="flex w-full max-w-3xl items-start gap-3.5">
        <div className="relative flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-700 to-zinc-950 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] ring-1 ring-white/20">
          <Sparkles className="h-4 w-4 animate-spin [animation-duration:3s]" />
        </div>
        <div className="flex-1 space-y-3 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-200">Nexora Business Copilot</span>
            <span className="text-[11px] font-medium text-zinc-400 animate-pulse">
              Querying verified business ledger records…
            </span>
          </div>

          <div className="flex items-center gap-1.5 py-1">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" />
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
          </div>

          <div className="h-1.5 w-48 overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full w-2/3 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
