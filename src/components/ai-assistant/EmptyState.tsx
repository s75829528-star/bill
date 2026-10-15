import {
  Activity,
  ArrowUpRight,
  Building2,
  Database,
  Package,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
  businessName?: string;
}

const suggestionCards = [
  {
    title: "Revenue & Growth",
    prompt: "How is my revenue performing this month?",
    description: "Review this month's sales and revenue trends.",
    icon: TrendingUp,
  },
  {
    title: "Customer Receivables",
    prompt: "Which customers owe the most?",
    description: "See which customer accounts have the largest balances.",
    icon: Users,
  },
  {
    title: "Inventory Intelligence",
    prompt: "What is our total inventory valuation?",
    description: "Understand the value of the inventory on hand.",
    icon: Package,
  },
  {
    title: "Daily Business Briefing",
    prompt: "What should I prioritize today?",
    description: "Surface the operational priorities that need your attention.",
    icon: Activity,
  },
];

export function EmptyState({ onSelectPrompt, businessName }: EmptyStateProps) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col items-center justify-center px-3 py-5 text-center sm:px-4 sm:py-7">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#6D5EF7]/15 bg-[#F0ECFF] text-[#6D5EF7] shadow-sm">
        <Sparkles className="h-6 w-6" />
      </div>

      <h2 className="text-xl font-semibold tracking-tight text-[#19172A] sm:text-2xl">
        Your business, one conversation away.
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#6B6880]">
        Ask Nexora about your numbers, discover insights, and simplify daily operations.
      </p>

      {businessName && (
        <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-[#E7E2F3] bg-white px-3 py-1.5 text-xs text-[#6B6880]">
          <Building2 className="h-3.5 w-3.5 shrink-0 text-[#6D5EF7]" />
          <span className="truncate font-medium text-[#19172A]">{businessName}</span>
        </div>
      )}

      <div className="mt-5 grid w-full grid-cols-1 gap-3 text-left sm:grid-cols-2">
        {suggestionCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.title}
              type="button"
              onClick={() => onSelectPrompt(card.prompt)}
              className="group flex min-h-32 cursor-pointer flex-col rounded-xl border border-[#E7E2F3] bg-white p-4 text-left shadow-[0_1px_3px_rgba(25,23,42,0.04)] transition-colors hover:border-[#6D5EF7]/35 hover:bg-[#F0ECFF]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5EF7] focus-visible:ring-offset-2"
            >
              <div className="flex w-full items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F0ECFF] text-[#6D5EF7]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold text-[#19172A]">{card.title}</span>
                </div>
                <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-[#8A879D] transition-colors group-hover:text-[#6D5EF7]" />
              </div>
              <p className="mt-3 text-sm font-medium leading-snug text-[#19172A] group-hover:text-[#5B4BE8]">
                {card.prompt}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#6B6880]">{card.description}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-medium text-[#6B6880]">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
          Business-scoped data access
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Database className="h-3.5 w-3.5 text-[#6D5EF7]" />
          Calculations use available records
        </span>
      </div>
    </div>
  );
}
