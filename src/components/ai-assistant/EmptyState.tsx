import { useState } from "react";
import {
  TrendingUp,
  AlertCircle,
  Package,
  Activity,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Database,
  Users,
  Wallet,
  Clock,
  ArrowUpRight,
  Zap,
} from "lucide-react";

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
  businessName?: string;
  ownerName?: string;
}

type CategoryTab = "all" | "sales" | "inventory" | "receivables" | "performance";

interface SuggestionItem {
  id: string;
  category: "sales" | "inventory" | "receivables" | "performance";
  categoryLabel: string;
  title: string;
  prompt: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  badgeBg: string;
}

export function EmptyState({ onSelectPrompt, businessName, ownerName }: EmptyStateProps) {
  const [activeTab, setActiveTab] = useState<CategoryTab>("all");

  const allSuggestions: SuggestionItem[] = [
    {
      id: "sales-overview",
      category: "sales",
      categoryLabel: "Sales & Revenue",
      title: "Sales overview",
      prompt: "How much revenue did we generate this month?",
      description:
        "Analyzes paid & pending invoices, month-over-month growth, and average order value.",
      icon: TrendingUp,
      iconBg: "text-indigo-400 bg-indigo-500/15 border-indigo-500/30",
      badgeBg: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    },
    {
      id: "outstanding-payments",
      category: "receivables",
      categoryLabel: "Billing & Receivables",
      title: "Outstanding payments",
      prompt: "Which invoices are overdue?",
      description:
        "Audits unpaid bills past their due date, aging breakdown, and highest collection debtors.",
      icon: AlertCircle,
      iconBg: "text-amber-400 bg-amber-500/15 border-amber-500/30",
      badgeBg: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    },
    {
      id: "inventory-insights",
      category: "inventory",
      categoryLabel: "Inventory & Stock",
      title: "Inventory insights",
      prompt: "Which products need restocking?",
      description:
        "Scans stock levels against minimum safety thresholds and highlights critical deficits.",
      icon: Package,
      iconBg: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
      badgeBg: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    },
    {
      id: "business-performance",
      category: "performance",
      categoryLabel: "Executive 360°",
      title: "Business performance",
      prompt: "Summarize my business performance.",
      description:
        "Synthesizes sales velocity, cash flow stability, stock health score, and operational index.",
      icon: Activity,
      iconBg: "text-violet-400 bg-violet-500/15 border-violet-500/30",
      badgeBg: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    },
    {
      id: "sales-compare",
      category: "sales",
      categoryLabel: "Sales & Revenue",
      title: "Monthly comparison",
      prompt: "Compare sales with last month.",
      description:
        "Benchmarks current MTD performance directly against the prior 30-day billing cycle.",
      icon: ArrowUpRight,
      iconBg: "text-sky-400 bg-sky-500/15 border-sky-500/30",
      badgeBg: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    },
    {
      id: "top-debtors",
      category: "receivables",
      categoryLabel: "Billing & Receivables",
      title: "Top debtors",
      prompt: "Which customers owe the most?",
      description:
        "Ranks customers by outstanding balance and surfaces urgent collection priorities.",
      icon: Users,
      iconBg: "text-rose-400 bg-rose-500/15 border-rose-500/30",
      badgeBg: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    },
    {
      id: "stock-valuation",
      category: "inventory",
      categoryLabel: "Inventory & Stock",
      title: "Stock valuation",
      prompt: "What is our total inventory valuation?",
      description: "Calculates total asset value of all warehouse SKUs at current purchase prices.",
      icon: Wallet,
      iconBg: "text-teal-400 bg-teal-500/15 border-teal-500/30",
      badgeBg: "bg-teal-500/15 text-teal-300 border-teal-500/30",
    },
    {
      id: "daily-priorities",
      category: "performance",
      categoryLabel: "Executive 360°",
      title: "Today's priorities",
      prompt: "What should I prioritize today?",
      description:
        "Generates an actionable executive agenda combining urgent collections, low stock, and reconciliation.",
      icon: Clock,
      iconBg: "text-amber-400 bg-amber-500/15 border-amber-500/30",
      badgeBg: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    },
  ];

  const filteredSuggestions =
    activeTab === "all"
      ? allSuggestions
      : allSuggestions.filter((item) => item.category === activeTab);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center px-4 py-7 text-center text-[#F3F4F6] sm:py-10">
      {/* Brand Icon with Glowing Ambient Indigo Ring */}
      <div className="relative mb-6">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-[#6D5EF7]/30 bg-[#29264A] text-[#A89FFF]">
          <Sparkles className="h-7 w-7 text-white" />
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-[#0F111A]">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
          </span>
        </div>
      </div>

      {/* Heading & Subtitle */}
      <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl md:text-3xl">
        What would you like to know about your business?
      </h2>
      <p className="mt-2.5 max-w-xl text-xs font-normal leading-relaxed text-[#9CA3AF] sm:text-sm">
        Ask Nexora Copilot about your sales, cash flow, inventory, debtors, or operational health.
      </p>

      {/* Connected Business Status Bar */}
      <div className="mt-4 inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-[#272B38] bg-[#171923] px-3.5 py-1 text-xs text-[#9CA3AF]">
        <Zap className="h-3.5 w-3.5 text-indigo-400 fill-indigo-400/20" />
        <span>Connected to</span>
        <span className="font-semibold text-white">
          {businessName || "Your Enterprise Ledger"}
        </span>
        <span className="text-zinc-600">•</span>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
          <CheckCircle2 className="h-3 w-3" />
          Grounded Mode Active
        </span>
      </div>

      {/* Category Filter Pills */}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-1.5 rounded-xl border border-[#272B38] bg-[#171923] p-1">
        {[
          { id: "all", label: "All Topics" },
          { id: "sales", label: "Sales & Revenue" },
          { id: "receivables", label: "Billing & Receivables" },
          { id: "inventory", label: "Stock & Inventory" },
          { id: "performance", label: "Executive Summary" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as CategoryTab)}
            className={`rounded-xl px-3 py-1.5 text-xs transition-all ${
              activeTab === tab.id
                ? "bg-[#29264A] font-semibold text-white"
                : "font-medium text-[#9CA3AF] hover:bg-[#191C27] hover:text-zinc-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Interactive Suggestion Cards Grid (Deep Obsidian Luminescent Cards) */}
      <div className="mt-5 grid w-full grid-cols-1 gap-3 text-left sm:grid-cols-2">
        {filteredSuggestions.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectPrompt(item.prompt)}
              className="group relative flex flex-col justify-between rounded-xl border border-[#272B38] bg-[#191C27] p-4.5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-[#6D5EF7]/50 hover:bg-[#1D202C] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5EF7]/60 motion-reduce:transform-none motion-reduce:transition-none"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${item.iconBg} transition-transform duration-200 group-hover:scale-105 shadow-2xs`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-100 tracking-tight">
                        {item.title}
                      </div>
                      <span
                        className={`inline-block rounded-md border px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider ${item.badgeBg}`}
                      >
                        {item.categoryLabel}
                      </span>
                    </div>
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-850 text-zinc-400 group-hover:border-indigo-500/40 group-hover:bg-indigo-950/60 group-hover:text-indigo-300 transition-colors">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>

                <p className="mt-3 text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors leading-snug">
                  "{item.prompt}"
                </p>

                <p className="mt-1 text-xs text-zinc-400 leading-normal line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-zinc-800/70 pt-2.5 text-[11px] text-zinc-500">
                <span>Direct ledger audit</span>
                <span className="font-semibold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Ask Copilot →
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Trust & Enterprise Badges */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-zinc-500">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Tenant Isolated (RLS)</span>
        </span>
        <span className="text-zinc-700">•</span>
        <span className="flex items-center gap-1.5">
          <Database className="h-4 w-4 text-indigo-400" />
          <span>Verified Supabase Ledger</span>
        </span>
        <span className="text-zinc-700">•</span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-violet-400" />
          <span>Zero Hallucinations</span>
        </span>
      </div>
    </div>
  );
}
