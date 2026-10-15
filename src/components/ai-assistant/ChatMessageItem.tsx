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
    toast.info("Insight ready to share");
  };

  // Safe formatting for markdown bold tokens
  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-semibold text-[#F5F5FA]">
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
        initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
        className="flex w-full justify-end px-3 py-2 sm:px-4"
      >
        <div className="flex max-w-[85%] sm:max-w-[75%] items-start gap-2.5">
          <div className="rounded-2xl rounded-tr-xs border border-[#7667FF]/40 bg-[#282361] px-4 py-2.5 text-xs sm:text-sm font-normal leading-relaxed text-[#F5F5FA] shadow-sm">
            {message.content}
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#171A26] border border-[#292D3B] text-xs font-semibold text-[#F5F5FA] shadow-xs">
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
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
      className="flex w-full justify-start px-2 py-3 sm:px-4"
    >
      <div className="flex w-full max-w-3xl items-start gap-3">
        {/* Tasteful AI Emblem Avatar */}
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#171A26] text-[#7667FF] border border-[#7667FF]/30 shadow-xs">
          <Sparkles className="h-4 w-4" />
        </div>

        {/* Message Content Container */}
        <div className="flex-1 overflow-hidden space-y-3">
          {/* Header pill & Status */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#F5F5FA] tracking-tight">
                Nexora Copilot
              </span>
              {structured?.statusLabel && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {structured.statusLabel}
                </span>
              )}
            </div>
            <span className="text-[11px] font-medium text-[#A1A5B7]">
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {/* Concise Direct Answer Card */}
          <div className="rounded-xl border border-[#292D3B] bg-[#171A26] p-4 text-xs sm:text-sm leading-relaxed text-[#F5F5FA]">
            {structured ? renderFormattedText(structured.conciseAnswer) : message.content}
          </div>

          {/* Key Metrics Bento Grid */}
          {structured?.metrics && structured.metrics.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {structured.metrics.map((metric: KeyMetric, idx: number) => (
                <div
                  key={idx}
                  className="rounded-xl border border-[#292D3B] bg-[#10121B] p-3 transition-colors hover:border-[#7667FF]/40"
                >
                  <div className="text-[11px] font-medium text-[#A1A5B7]">{metric.label}</div>
                  <div className="mt-1 text-base sm:text-lg font-bold text-[#F5F5FA] tracking-tight font-mono">
                    {metric.value}
                  </div>
                  {metric.trend && (
                    <div
                      className={`mt-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                        metric.trend.positive
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/25"
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
                    <div className="mt-1 text-[10px] text-[#A1A5B7] truncate">{metric.sub}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Interactive Recharts Visual */}
          {structured?.chart && <AssistantChart chart={structured.chart} />}

          {/* Derivation Details (Accordion / Expandable) */}
          {structured?.derivation && (
            <div className="overflow-hidden rounded-xl border border-[#292D3B] bg-[#10121B] text-xs">
              <button
                type="button"
                onClick={() => setShowDerivation((v) => !v)}
                className="flex w-full items-center justify-between p-3 text-left font-medium text-[#A1A5B7] hover:bg-[#171A26] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#171A26] text-[#7667FF]">
                    <Info className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A1A5B7]">
                    Audit Trail & Calculation Scope
                  </span>
                </div>
                {showDerivation ? (
                  <ChevronUp className="h-4 w-4 text-[#A1A5B7]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[#A1A5B7]" />
                )}
              </button>

              {showDerivation && (
                <div className="space-y-2 border-t border-[#292D3B] p-3 text-[11px] text-[#A1A5B7] bg-[#171A26]/50">
                  <p className="leading-relaxed font-medium text-[#F5F5FA]">
                    {structured.derivation.explanation}
                  </p>
                  {structured.derivation.formula && (
                    <div className="rounded-lg bg-[#10121B] p-2 font-mono text-[10px] text-[#F5F5FA] border border-[#292D3B]">
                      Formula: {structured.derivation.formula}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-[#A1A5B7] pt-1">
                    {structured.derivation.dateRange && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-[#7667FF]" />
                        <span>Date Scope: {structured.derivation.dateRange}</span>
                      </div>
                    )}
                    {structured.derivation.sourceModules && (
                      <div className="flex items-center gap-1.5">
                        <Layers className="h-3 w-3 text-[#7667FF]" />
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
            <div className="overflow-hidden rounded-xl border border-[#292D3B] bg-[#171A26]">
              <div className="flex items-center justify-between border-b border-[#292D3B] bg-[#10121B] px-4 py-2.5">
                <span className="text-xs font-semibold text-[#F5F5FA] uppercase tracking-wider">
                  {structured.supportingData.title}
                </span>
                <span className="text-[10px] font-medium text-[#A1A5B7]">
                  {structured.supportingData.records.length} records returned
                </span>
              </div>
              <div className="divide-y divide-[#292D3B]/60">
                {displayedRecords.map((rec: SupportingRecord) => (
                  <div
                    key={rec.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-xs hover:bg-[#202534] transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-[#F5F5FA]">{rec.title}</div>
                      {rec.subtitle && (
                        <div className="text-[11px] text-[#A1A5B7] mt-0.5">{rec.subtitle}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      {rec.date && (
                        <span className="text-[11px] text-[#A1A5B7] hidden sm:inline">
                          {rec.date}
                        </span>
                      )}
                      {rec.badge && (
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                            rec.badge.variant === "emerald"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                              : rec.badge.variant === "rose"
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/25"
                                : rec.badge.variant === "amber"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/25"
                                  : "bg-[#7667FF]/10 text-[#7667FF] border border-[#7667FF]/25"
                          }`}
                        >
                          {rec.badge.text}
                        </span>
                      )}
                      {rec.value && (
                        <span className="font-bold font-mono text-[#F5F5FA] text-xs sm:text-sm">
                          {rec.value}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {structured.supportingData.records.length > 3 && (
                <div className="border-t border-[#292D3B] bg-[#10121B] p-2 text-center">
                  <button
                    type="button"
                    onClick={() => setShowAllRecords((v) => !v)}
                    className="text-xs font-semibold text-[#7667FF] hover:text-[#897BFF] inline-flex items-center gap-1 cursor-pointer"
                  >
                    {showAllRecords
                      ? "Show fewer records"
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

          {/* Operational Recommendations Box */}
          {structured?.recommendations && structured.recommendations.length > 0 && (
            <div className="rounded-xl border border-[#7667FF]/30 bg-[#171A26] p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-[#7667FF]">
                <Lightbulb className="h-4 w-4" />
                <span className="font-semibold text-xs uppercase tracking-wider">
                  Copilot Operational Recommendations
                </span>
              </div>
              <div className="space-y-1.5">
                {structured.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs text-[#F5F5FA] leading-relaxed"
                  >
                    <span className="text-[#7667FF] font-bold">•</span>
                    <span>{renderFormattedText(rec)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Direct Navigation / Action Buttons */}
          {structured?.actions && structured.actions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {structured.actions.map((act, i) => {
                if (act.to) {
                  return (
                    <Link
                      key={i}
                      to={act.to}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#292D3B] bg-[#171A26] px-3 py-1.5 text-xs font-medium text-[#F5F5FA] hover:border-[#7667FF]/50 hover:bg-[#202534] transition-all"
                    >
                      <span>{act.label}</span>
                      <ExternalLink className="h-3.5 w-3.5 text-[#A1A5B7]" />
                    </Link>
                  );
                }

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onTriggerAction?.(act)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#292D3B] bg-[#171A26] px-3 py-1.5 text-xs font-medium text-[#F5F5FA] hover:border-[#7667FF]/50 hover:bg-[#202534] transition-all cursor-pointer"
                  >
                    <span>{act.label}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-[#A1A5B7]" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Follow-up Question Chips */}
          {structured?.suggestedFollowUps && structured.suggestedFollowUps.length > 0 && (
            <div className="pt-2">
              <div className="text-[10px] font-semibold text-[#A1A5B7] uppercase tracking-wider mb-2">
                Suggested follow-up questions
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {structured.suggestedFollowUps.map((question, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onSelectFollowUp?.(question)}
                    className="group inline-flex items-center gap-1.5 rounded-lg border border-[#292D3B] bg-[#171A26] px-2.5 py-1 text-xs font-normal text-[#A1A5B7] hover:border-[#7667FF]/50 hover:bg-[#202534] hover:text-[#F5F5FA] transition-all cursor-pointer text-left"
                  >
                    <Sparkles className="h-3 w-3 text-[#A1A5B7] group-hover:text-[#7667FF] transition-colors" />
                    <span>"{question}"</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Secondary Action Toolbar: Copy, Share & Retry */}
          <div className="flex items-center gap-2 pt-1 text-[#A1A5B7] border-t border-[#292D3B]/60">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs hover:bg-[#171A26] hover:text-[#F5F5FA] transition-colors cursor-pointer"
              title="Copy response"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs hover:bg-[#171A26] hover:text-[#F5F5FA] transition-colors cursor-pointer"
              title="Share insight"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {onRetry && (
              <button
                type="button"
                onClick={() => onRetry(message.content)}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs hover:bg-[#171A26] hover:text-[#F5F5FA] transition-colors cursor-pointer"
                title="Retry response"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Retry</span>
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
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full justify-start px-2 py-3 sm:px-4"
    >
      <div className="flex w-full max-w-3xl items-start gap-3">
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#171A26] text-[#7667FF] border border-[#7667FF]/40 shadow-sm">
          <Sparkles className="h-4 w-4 animate-spin [animation-duration:3s]" />
        </div>
        <div className="flex-1 space-y-2.5 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#F5F5FA]">Nexora Copilot</span>
            <span className="text-[11px] font-normal text-[#A1A5B7]">
              Querying verified business ledger records…
            </span>
          </div>

          <div className="flex items-center gap-1.5 py-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7667FF] animate-pulse" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#7667FF] animate-pulse [animation-delay:0.2s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#7667FF] animate-pulse [animation-delay:0.4s]" />
          </div>

          <div className="h-1 w-40 overflow-hidden rounded-full bg-[#292D3B]">
            <div className="h-full w-2/3 bg-gradient-to-r from-[#7667FF] to-[#897BFF] rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
