// ── Shared UI primitives for the Billing module ────────────────────
// Re-exports the generic UI atoms already established by the Inventory
// module (same design language: rounded-2xl white cards, slate borders,
// brand gradient accents) and adds billing-specific pieces (status pill
// covering invoice/quotation/payment statuses, payment mode badge).

import type { ReactNode } from "react";
import {
  Banknote,
  Smartphone,
  CreditCard,
  Landmark,
  Clock3,
  Wallet as WalletIcon,
  ArrowRightLeft,
  Zap,
  FileCheck,
} from "lucide-react";
import type { PaymentMode } from "@/lib/billing-data";

export {
  SectionCard,
  StatTile,
  SearchInput,
  Select,
  Pagination,
  PrimaryButton,
  SecondaryButton,
  EmptyState,
  fmtDate,
} from "@/components/inventory/shared";

const statusStyles: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600 border-slate-200",
  sent: "bg-blue-50 text-blue-700 border-blue-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  partial: "bg-amber-50 text-amber-700 border-amber-200",
  overdue: "bg-red-50 text-red-700 border-red-200",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  expired: "bg-slate-100 text-slate-500 border-slate-200",
  converted: "bg-violet-50 text-violet-700 border-violet-200",
  issued: "bg-blue-50 text-blue-700 border-blue-200",
  adjusted: "bg-violet-50 text-violet-700 border-violet-200",
  refunded: "bg-cyan-50 text-cyan-700 border-cyan-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  paused: "bg-slate-100 text-slate-600 border-slate-200",
  received: "bg-emerald-50 text-emerald-700 border-emerald-200",
  applied: "bg-emerald-50 text-emerald-700 border-emerald-200",
  voided: "bg-slate-100 text-slate-500 border-slate-200",
};

export function BillingStatusPill({ status, label }: { status: string; label?: string }) {
  const cls = statusStyles[status] ?? "bg-slate-100 text-slate-600 border-slate-200";
  const text = label ?? status.replace(/-/g, " ");
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${cls}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {text}
    </span>
  );
}

const paymentModeIcons: Record<PaymentMode, React.ElementType> = {
  cash: Banknote,
  upi: Smartphone,
  card: CreditCard,
  "bank-transfer": Landmark,
  neft: ArrowRightLeft,
  rtgs: Zap,
  credit: Clock3,
  wallet: WalletIcon,
  cheque: FileCheck,
};

export function PaymentModeBadge({ mode }: { mode: PaymentMode }) {
  const Icon = paymentModeIcons[mode];
  const label =
    mode === "bank-transfer" ? "Bank Transfer" : mode.charAt(0).toUpperCase() + mode.slice(1);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

export function Checkbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 rounded border-slate-300 text-[color:var(--brand-electric)] focus:ring-[color:var(--brand-electric)]"
      onClick={(e) => e.stopPropagation()}
    />
  );
}

export function ModalShell({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative max-h-[90vh] w-full ${wide ? "max-w-4xl" : "max-w-lg"} overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
