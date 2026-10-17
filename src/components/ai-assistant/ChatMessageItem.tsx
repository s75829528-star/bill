import { lazy, Suspense, useState } from "react";
import { Link } from "@tanstack/react-router";
import ReactMarkdown, { type Components } from "react-markdown";
import { motion, useReducedMotion } from "framer-motion";
import remarkGfm from "remark-gfm";
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

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h2 className="mb-2 mt-4 text-base font-semibold leading-snug first:mt-0">{children}</h2>
  ),
  h2: ({ children }) => (
    <h3 className="mb-2 mt-4 text-sm font-semibold leading-snug first:mt-0">{children}</h3>
  ),
  h3: ({ children }) => (
    <h4 className="mb-1.5 mt-3 text-sm font-semibold leading-snug first:mt-0">{children}</h4>
  ),
  h4: ({ children }) => (
    <h5 className="mb-1.5 mt-3 text-sm font-semibold leading-snug first:mt-0">{children}</h5>
  ),
  h5: ({ children }) => (
    <h6 className="mb-1.5 mt-3 text-sm font-semibold leading-snug first:mt-0">{children}</h6>
  ),
  h6: ({ children }) => (
    <h6 className="mb-1.5 mt-3 text-xs font-semibold leading-snug first:mt-0">{children}</h6>
  ),
  p: ({ children }) => <p className="my-2 leading-6 first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="my-2 list-disc space-y-1 pl-5 marker:text-[#6D5EF7]">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 list-decimal space-y-1 pl-5 marker:font-semibold">{children}</ol>
  ),
  li: ({ children }) => <li className="pl-0.5 leading-6">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-[#19172A]">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-[#6D5EF7]/40 pl-3 text-[#6B6880]">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-0 border-t border-[#E7E2F3]" />,
  a: ({ href, children }) => {
    const safeHref = isSafeMarkdownHref(href) ? href : undefined;
    if (!safeHref) return <span>{children}</span>;

    const isExternal = /^https?:\/\//i.test(safeHref);
    return (
      <a
        href={safeHref}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="font-medium text-[#5B4BE8] underline decoration-[#6D5EF7]/40 underline-offset-2 hover:decoration-[#6D5EF7]"
      >
        {children}
      </a>
    );
  },
  code: ({ children, className }) => (
    <code
      className={`${className || ""} rounded bg-[#F0ECFF] px-1 py-0.5 font-mono text-[0.9em] text-[#40358F]`}
    >
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-3 max-w-full overflow-x-auto rounded-lg border border-[#E7E2F3] bg-[#F7F5FF] p-3 text-[0.85em] leading-5">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-3 max-w-full overflow-x-auto rounded-lg border border-[#E7E2F3]">
      <table className="w-full min-w-[480px] border-collapse text-left text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-[#F0ECFF] text-[#19172A]">{children}</thead>,
  th: ({ children }) => (
    <th scope="col" className="border-b border-[#E7E2F3] px-3 py-2 font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-t border-[#E7E2F3]/70 px-3 py-2 align-top">{children}</td>
  ),
};

function isSafeMarkdownHref(href?: string): boolean {
  if (!href) return false;
  const scheme = href.match(/^([a-z][a-z\d+.-]*):/i)?.[1]?.toLowerCase();
  return !scheme || scheme === "http" || scheme === "https" || scheme === "mailto";
}

function normalizeEscapedEmphasis(text: string): string {
  return text
    .replace(/\\\*\\\*(.+?)\\\*\\\*/g, "**$1**")
    .replace(/\\_\\_(.+?)\\_\\_/g, "__$1__")
    .replace(/\\\*(.+?)\\\*/g, "*$1*");
}

function findClosingBacktickRun(line: string, start: number, length: number): number {
  let index = line.indexOf("`", start);
  while (index !== -1) {
    let runEnd = index;
    while (line[runEnd] === "`") runEnd += 1;
    if (runEnd - index === length) return index;
    index = line.indexOf("`", runEnd);
  }
  return -1;
}

function normalizeEscapedMarkdown(text: string): string {
  let fenceCharacter = "";
  let fenceLength = 0;
  let inlineCodeLength = 0;

  return text
    .split("\n")
    .map((line) => {
      const fence = line.match(/^ {0,3}(`{3,}|~{3,})/);
      if (fenceCharacter) {
        if (
          fence &&
          fence[1][0] === fenceCharacter &&
          fence[1].length >= fenceLength &&
          /^[ \t]*$/.test(line.slice(fence[0].length))
        ) {
          fenceCharacter = "";
          fenceLength = 0;
        }
        return line;
      }
      if (fence) {
        fenceCharacter = fence[1][0];
        fenceLength = fence[1].length;
        inlineCodeLength = 0;
        return line;
      }

      let normalizedLine = "";
      let cursor = 0;
      while (cursor < line.length) {
        if (inlineCodeLength) {
          const closingIndex = findClosingBacktickRun(line, cursor, inlineCodeLength);
          if (closingIndex === -1) {
            normalizedLine += line.slice(cursor);
            break;
          }
          const closingEnd = closingIndex + inlineCodeLength;
          normalizedLine += line.slice(cursor, closingEnd);
          cursor = closingEnd;
          inlineCodeLength = 0;
          continue;
        }

        const openingIndex = line.indexOf("`", cursor);
        if (openingIndex === -1) {
          normalizedLine += normalizeEscapedEmphasis(line.slice(cursor));
          break;
        }
        normalizedLine += normalizeEscapedEmphasis(line.slice(cursor, openingIndex));
        let openingEnd = openingIndex;
        while (line[openingEnd] === "`") openingEnd += 1;
        inlineCodeLength = openingEnd - openingIndex;
        normalizedLine += line.slice(openingIndex, openingEnd);
        cursor = openingEnd;
      }
      return normalizedLine;
    })
    .join("\n");
}

function ChatMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {normalizeEscapedMarkdown(content)}
    </ReactMarkdown>
  );
}

const AssistantChart = lazy(() =>
  import("./AssistantChart").then((module) => ({ default: module.AssistantChart })),
);

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

  if (isUser) {
    return (
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
        className="flex w-full justify-end px-3 py-2 sm:px-4"
      >
        <div className="flex max-w-[85%] sm:max-w-[75%] items-start gap-2.5">
          <div className="rounded-2xl rounded-tr-xs border border-[#6D5EF7]/40 bg-[#F0ECFF] px-4 py-2.5 text-xs sm:text-sm font-normal leading-relaxed text-[#19172A] shadow-sm">
            {message.content}
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FFFFFF] border border-[#E7E2F3] text-xs font-semibold text-[#19172A] shadow-xs">
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
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FFFFFF] text-[#6D5EF7] border border-[#6D5EF7]/30 shadow-xs">
          <Sparkles className="h-4 w-4" />
        </div>

        {/* Message Content Container */}
        <div className="flex-1 overflow-hidden space-y-3">
          {/* Header pill & Status */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#19172A] tracking-tight">
                Nexora Copilot
              </span>
              {structured?.statusLabel && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {structured.statusLabel}
                </span>
              )}
            </div>
            <span className="text-[11px] font-medium text-[#6B6880]">
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {/* Concise Direct Answer Card */}
          <div className="rounded-xl border border-[#E7E2F3] bg-[#FFFFFF] p-4 text-xs text-[#19172A] sm:text-sm">
            <ChatMarkdown content={structured ? structured.conciseAnswer : message.content} />
          </div>

          {/* Key Metrics Bento Grid */}
          {structured?.metrics && structured.metrics.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {structured.metrics.map((metric: KeyMetric, idx: number) => (
                <div
                  key={idx}
                  className="rounded-xl border border-[#E7E2F3] bg-[#FFFFFF] p-3 transition-colors hover:border-[#6D5EF7]/40"
                >
                  <div className="text-[11px] font-medium text-[#6B6880]">{metric.label}</div>
                  <div className="mt-1 text-base sm:text-lg font-bold text-[#19172A] tracking-tight font-mono">
                    {metric.value}
                  </div>
                  {metric.trend && (
                    <div
                      className={`mt-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                        metric.trend.positive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
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
                    <div className="mt-1 text-[10px] text-[#6B6880] truncate">{metric.sub}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Interactive Recharts Visual */}
          {structured?.chart && (
            <Suspense
              fallback={
                <div
                  aria-label="Loading chart"
                  aria-busy="true"
                  className="h-72 animate-pulse rounded-xl bg-slate-100"
                />
              }
            >
              <AssistantChart chart={structured.chart} />
            </Suspense>
          )}

          {/* Derivation Details (Accordion / Expandable) */}
          {structured?.derivation && (
            <div className="overflow-hidden rounded-xl border border-[#E7E2F3] bg-[#FFFFFF] text-xs">
              <button
                type="button"
                onClick={() => setShowDerivation((v) => !v)}
                className="flex w-full items-center justify-between p-3 text-left font-medium text-[#6B6880] hover:bg-[#FFFFFF] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#FFFFFF] text-[#6D5EF7]">
                    <Info className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6880]">
                    Audit Trail & Calculation Scope
                  </span>
                </div>
                {showDerivation ? (
                  <ChevronUp className="h-4 w-4 text-[#6B6880]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[#6B6880]" />
                )}
              </button>

              {showDerivation && (
                <div className="space-y-2 border-t border-[#E7E2F3] p-3 text-[11px] text-[#6B6880] bg-[#FFFFFF]/50">
                  <p className="leading-relaxed font-medium text-[#19172A]">
                    {structured.derivation.explanation}
                  </p>
                  {structured.derivation.formula && (
                    <div className="rounded-lg bg-[#FFFFFF] p-2 font-mono text-[10px] text-[#19172A] border border-[#E7E2F3]">
                      Formula: {structured.derivation.formula}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-[#6B6880] pt-1">
                    {structured.derivation.dateRange && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-[#6D5EF7]" />
                        <span>Date Scope: {structured.derivation.dateRange}</span>
                      </div>
                    )}
                    {structured.derivation.sourceModules && (
                      <div className="flex items-center gap-1.5">
                        <Layers className="h-3 w-3 text-[#6D5EF7]" />
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
            <div className="overflow-hidden rounded-xl border border-[#E7E2F3] bg-[#FFFFFF]">
              <div className="flex items-center justify-between border-b border-[#E7E2F3] bg-[#FFFFFF] px-4 py-2.5">
                <span className="text-xs font-semibold text-[#19172A] uppercase tracking-wider">
                  {structured.supportingData.title}
                </span>
                <span className="text-[10px] font-medium text-[#6B6880]">
                  {structured.supportingData.records.length} records returned
                </span>
              </div>
              <div className="divide-y divide-[#E7E2F3]/60">
                {displayedRecords.map((rec: SupportingRecord) => (
                  <div
                    key={rec.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-xs hover:bg-[#F0ECFF] transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-[#19172A]">{rec.title}</div>
                      {rec.subtitle && (
                        <div className="text-[11px] text-[#6B6880] mt-0.5">{rec.subtitle}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      {rec.date && (
                        <span className="text-[11px] text-[#6B6880] hidden sm:inline">
                          {rec.date}
                        </span>
                      )}
                      {rec.badge && (
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                            rec.badge.variant === "emerald"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : rec.badge.variant === "rose"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : rec.badge.variant === "amber"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-[#6D5EF7]/10 text-[#6D5EF7] border border-[#6D5EF7]/25"
                          }`}
                        >
                          {rec.badge.text}
                        </span>
                      )}
                      {rec.value && (
                        <span className="font-bold font-mono text-[#19172A] text-xs sm:text-sm">
                          {rec.value}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {structured.supportingData.records.length > 3 && (
                <div className="border-t border-[#E7E2F3] bg-[#FFFFFF] p-2 text-center">
                  <button
                    type="button"
                    onClick={() => setShowAllRecords((v) => !v)}
                    className="text-xs font-semibold text-[#6D5EF7] hover:text-[#5B4BE8] inline-flex items-center gap-1 cursor-pointer"
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
            <div className="rounded-xl border border-[#6D5EF7]/30 bg-[#FFFFFF] p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-[#6D5EF7]">
                <Lightbulb className="h-4 w-4" />
                <span className="font-semibold text-xs uppercase tracking-wider">
                  Copilot Operational Recommendations
                </span>
              </div>
              <div className="space-y-1.5">
                {structured.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs text-[#19172A] leading-relaxed"
                  >
                    <span className="text-[#6D5EF7] font-bold">•</span>
                    <div className="min-w-0 flex-1">
                      <ChatMarkdown content={rec} />
                    </div>
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
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#E7E2F3] bg-[#FFFFFF] px-3 py-1.5 text-xs font-medium text-[#19172A] hover:border-[#6D5EF7]/50 hover:bg-[#F0ECFF] transition-all"
                    >
                      <span>{act.label}</span>
                      <ExternalLink className="h-3.5 w-3.5 text-[#6B6880]" />
                    </Link>
                  );
                }

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onTriggerAction?.(act)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#E7E2F3] bg-[#FFFFFF] px-3 py-1.5 text-xs font-medium text-[#19172A] hover:border-[#6D5EF7]/50 hover:bg-[#F0ECFF] transition-all cursor-pointer"
                  >
                    <span>{act.label}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-[#6B6880]" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Follow-up Question Chips */}
          {structured?.suggestedFollowUps && structured.suggestedFollowUps.length > 0 && (
            <div className="pt-2">
              <div className="text-[10px] font-semibold text-[#6B6880] uppercase tracking-wider mb-2">
                Suggested follow-up questions
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {structured.suggestedFollowUps.map((question, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onSelectFollowUp?.(question)}
                    className="group inline-flex items-center gap-1.5 rounded-lg border border-[#E7E2F3] bg-[#FFFFFF] px-2.5 py-1 text-xs font-normal text-[#6B6880] hover:border-[#6D5EF7]/50 hover:bg-[#F0ECFF] hover:text-[#19172A] transition-all cursor-pointer text-left"
                  >
                    <Sparkles className="h-3 w-3 text-[#6B6880] group-hover:text-[#6D5EF7] transition-colors" />
                    <span>"{question}"</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Secondary Action Toolbar: Copy, Share & Retry */}
          <div className="flex items-center gap-2 pt-1 text-[#6B6880] border-t border-[#E7E2F3]/60">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs hover:bg-[#FFFFFF] hover:text-[#19172A] transition-colors cursor-pointer"
              title="Copy response"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-700" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs hover:bg-[#FFFFFF] hover:text-[#19172A] transition-colors cursor-pointer"
              title="Share insight"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {onRetry && (
              <button
                type="button"
                onClick={() => onRetry(message.content)}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs hover:bg-[#FFFFFF] hover:text-[#19172A] transition-colors cursor-pointer"
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
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FFFFFF] text-[#6D5EF7] border border-[#6D5EF7]/40 shadow-sm">
          <Sparkles className="h-4 w-4 animate-spin [animation-duration:3s]" />
        </div>
        <div className="flex-1 space-y-2.5 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#19172A]">Nexora Copilot</span>
            <span className="text-[11px] font-normal text-[#6B6880]">
              Analyzing available business records…
            </span>
          </div>

          <div className="flex items-center gap-1.5 py-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#6D5EF7] animate-pulse" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#6D5EF7] animate-pulse [animation-delay:0.2s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#6D5EF7] animate-pulse [animation-delay:0.4s]" />
          </div>

          <div className="h-1 w-40 overflow-hidden rounded-full bg-[#E7E2F3]">
            <div className="h-full w-2/3 bg-gradient-to-r from-[#6D5EF7] to-[#5B4BE8] rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
