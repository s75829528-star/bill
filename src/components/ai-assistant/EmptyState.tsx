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
  ArrowUpRight,
  Zap,
  Users,
  Wallet,
} from "lucide-react";

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
  businessName?: string;
  ownerName?: string;
}

type CategoryTab = "all" | "revenue" | "collections" | "inventory" | "briefing";

interface SuggestionCard {
  id: string;
  category: "revenue" | "collections" | "inventory" | "briefing";
  categoryLabel: string;
  title: string;
  prompt: string;
  description: string;
  icon: React.ElementType;
}

export function EmptyState({ onSelectPrompt, businessName, ownerName }: EmptyStateProps) {
  const [activeTab, setActiveTab] = useState<CategoryTab>("all");

  // The 4 primary interactive cards specified in design requirements
  const primaryCards: SuggestionCard[] = [
    {
      id: "revenue-growth",
      category: "revenue",
      categoryLabel: "Revenue & Growth",
      title: "Revenue & Growth",
      prompt: "How is my revenue performing this month?",
      description:
        "Analyzes paid & pending invoices, month-over-month growth, and average order value.",
      icon: TrendingUp,
    },
    {
      id: "collections",
      category: "collections",
      categoryLabel: "Collections",
      title: "Collections",
      prompt: "Which invoices need my attention?",
      description:
        "Audits overdue bills past their due date, aging breakdown, and highest collection priorities.",
      icon: AlertCircle,
    },
    {
      id: "inventory-intelligence",
      category: "inventory",
      categoryLabel: "Inventory Intelligence",
      title: "Inventory Intelligence",
      prompt: "Which products are running low?",
      description:
        "Scans stock levels against minimum safety thresholds and highlights critical deficits.",
      icon: Package,
    },
    {
      id: "daily-briefing",
      category: "briefing",
      categoryLabel: "Daily Business Briefing",
      title: "Daily Business Briefing",
      prompt: "Summarize the most important things I should know today.",
      description:
        "Synthesizes sales velocity, cash flow stability, stock health score, and operational priorities.",
      icon: Activity,
    },
    {
      id: "top-debtors",
      category: "collections",
      categoryLabel: "Collections",
      title: "Customer Receivables",
      prompt: "Which customers owe the most?",
      description: "Ranks customer accounts by outstanding balance and flags overdue payment risk.",
      icon: Users,
    },
    {
      id: "inventory-valuation",
      category: "inventory",
      categoryLabel: "Inventory Intelligence",
      title: "Asset Valuation",
      prompt: "What is our total inventory valuation?",
      description:
        "Calculates the total valuation of all warehouse SKUs at current purchase prices.",
      icon: Wallet,
    },
  ];

  const filteredCards =
    activeTab === "all" ? primaryCards : primaryCards.filter((card) => card.category === activeTab);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center px-4 py-8 text-center text-[#F5F5FA] sm:py-12">
      {/* Center Tasteful AI Emblem */}
      <div className="relative mb-5 flex items-center justify-center">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-[#7667FF]/30 bg-[#171A26] shadow-lg shadow-[#7667FF]/10 text-[#7667FF]">
          <Sparkles className="h-7 w-7 text-[#7667FF]" />
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#10B981] ring-2 ring-[#0D0F17]">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
          </span>
        </div>
      </div>

      {/* Main Heading */}
      <h2 className="text-xl font-bold tracking-tight text-[#F5F5FA] sm:text-2xl md:text-3xl">
        Your business, one conversation away.
      </h2>

      {/* Supporting Text */}
      <p className="mt-2.5 max-w-xl text-xs sm:text-sm font-normal leading-relaxed text-[#A1A5B7]">
        Ask Nexora to uncover insights, understand your numbers, and simplify your daily operations.
      </p>

      {/* Connected Business Status Bar */}
      <div className="mt-4 inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-[#292D3B] bg-[#171A26] px-3.5 py-1 text-xs text-[#A1A5B7]">
        <Zap className="h-3.5 w-3.5 text-[#7667FF] fill-[#7667FF]/20" />
        <span>Connected to</span>
        <span className="font-semibold text-[#F5F5FA]">
          {businessName || "Your Enterprise Ledger"}
        </span>
        <span className="text-[#292D3B]">•</span>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#10B981]">
          <CheckCircle2 className="h-3 w-3" />
          Grounded Mode Active
        </span>
      </div>

      {/* Topic Filter Pills */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5 rounded-xl border border-[#292D3B] bg-[#10121B] p-1">
        {[
          { id: "all", label: "All Topics" },
          { id: "revenue", label: "Revenue & Growth" },
          { id: "collections", label: "Collections" },
          { id: "inventory", label: "Inventory Intelligence" },
          { id: "briefing", label: "Daily Briefing" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as CategoryTab)}
            className={`rounded-lg px-3 py-1.5 text-xs transition-all ${
              activeTab === tab.id
                ? "bg-[#171A26] font-semibold text-[#F5F5FA] shadow-xs border border-[#292D3B]"
                : "font-medium text-[#A1A5B7] hover:bg-[#171A26]/50 hover:text-[#F5F5FA]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Interactive Suggestion Cards Grid */}
      <div className="mt-5 grid w-full grid-cols-1 gap-3 text-left sm:grid-cols-2">
        {filteredCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelectPrompt(card.prompt)}
              className="group relative flex flex-col justify-between rounded-xl border border-[#292D3B] bg-[#171A26] p-4 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-[#7667FF]/50 hover:bg-[#1C2030] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7667FF]/60 cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#292D3B] bg-[#10121B] text-[#7667FF] group-hover:border-[#7667FF]/30 transition-colors">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#F5F5FA] tracking-tight">
                        {card.title}
                      </div>
                      <span className="text-[10px] font-medium text-[#A1A5B7]">
                        {card.categoryLabel}
                      </span>
                    </div>
                  </div>

                  <div className="flex h-7 w-7 items-center justify-center rounded-md border border-[#292D3B] bg-[#10121B] text-[#A1A5B7] group-hover:border-[#7667FF]/40 group-hover:text-[#7667FF] transition-colors">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </div>
                </div>

                <p className="mt-3 text-sm font-medium text-[#F5F5FA] group-hover:text-[#897BFF] transition-colors leading-snug">
                  "{card.prompt}"
                </p>

                <p className="mt-1 text-xs text-[#A1A5B7] leading-relaxed line-clamp-2">
                  {card.description}
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-[#292D3B]/70 pt-2 text-[11px] text-[#A1A5B7]">
                <span>Direct ledger audit</span>
                <span className="font-semibold text-[#7667FF] opacity-0 group-hover:opacity-100 transition-opacity">
                  Ask Copilot →
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Trust & Enterprise Badges */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-[#A1A5B7]">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-[#10B981]" />
          <span>Tenant Isolated (RLS)</span>
        </span>
        <span className="text-[#292D3B]">•</span>
        <span className="flex items-center gap-1.5">
          <Database className="h-4 w-4 text-[#7667FF]" />
          <span>Verified Ledger Records</span>
        </span>
        <span className="text-[#292D3B]">•</span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-violet-400" />
          <span>Zero Hallucinations</span>
        </span>
      </div>
    </div>
  );
}
