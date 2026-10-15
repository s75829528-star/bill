// ── Shared UI primitives for the Settings & Administration module ──
// Reuses the generic atoms already established by the Inventory module
// (rounded-2xl white cards, slate borders, brand gradient accents) and
// adds settings-specific pieces (toggle switch, form field, save bar,
// permission-level pill).

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { PrimaryButton } from "@/components/inventory/shared";

export {
  SectionCard,
  StatTile,
  SearchInput,
  Select,
  Pagination,
  PrimaryButton,
  SecondaryButton,
  EmptyState,
  StatusPill,
  fmtDate,
} from "@/components/inventory/shared";

// ── Toggle switch ─────────────────────────────────────────────────

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none ${
          checked ? "bg-[image:var(--gradient-brand)]" : "bg-slate-200"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

// ── Form field wrapper ────────────────────────────────────────────

export function FormField({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
}: {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)] ${className}`}
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <textarea
      value={value}
      placeholder={placeholder}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)] ${className}`}
    />
  );
}

// ── Save bar ──────────────────────────────────────────────────────

export function SavedBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
      <Check className="h-4 w-4" />
      Changes saved successfully.
    </div>
  );
}

export function SaveBar({
  saved,
  onSave,
  label = "Save Changes",
  note = "Changes are stored for this session only and reset on page reload.",
}: {
  saved: boolean;
  onSave: () => void;
  label?: string;
  note?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
      <SavedBanner visible={saved} />
      {!saved && <p className="text-xs text-muted-foreground">{note}</p>}
      <div className="ml-auto">
        <PrimaryButton onClick={onSave}>{label}</PrimaryButton>
      </div>
    </div>
  );
}

// ── Permission level pill ─────────────────────────────────────────

const permissionStyles: Record<string, string> = {
  full: "bg-emerald-50 text-emerald-700 border-emerald-200",
  edit: "bg-blue-50 text-blue-700 border-blue-200",
  view: "bg-amber-50 text-amber-700 border-amber-200",
  none: "bg-slate-100 text-slate-500 border-slate-200",
};

const permissionLabels: Record<string, string> = {
  full: "Full",
  edit: "Edit",
  view: "View",
  none: "None",
};

export function PermissionPill({ level }: { level: "full" | "edit" | "view" | "none" }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${permissionStyles[level]}`}>
      {permissionLabels[level]}
    </span>
  );
}
