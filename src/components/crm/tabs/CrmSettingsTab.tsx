// ── CRM Settings Tab ──────────────────────────────────────────────
import { useState, useEffect } from "react";
import { Check, Hash, Globe, CreditCard, Tag, Plus, X, ShieldCheck } from "lucide-react";
import { crmSettings } from "@/lib/crm-data";
import { SectionCard, PrimaryButton, Select } from "@/components/crm/shared";

// ── Saved Banner ──────────────────────────────────────────────────
function SavedBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
      <Check className="h-4 w-4" />
      Settings saved successfully.
    </div>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────
function Field({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      {children}
    </div>
  );
}

// ── Text input ─────────────────────────────────────────────────────
function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition-colors focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
    />
  );
}

// ── Number input ───────────────────────────────────────────────────
function NumberInput({ value, onChange, min = 0 }: { value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <input
      type="number"
      min={min}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value) || 0)}
      className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition-colors focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
    />
  );
}

// ── Category chip ──────────────────────────────────────────────────
function CategoryChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

const CURRENCY_OPTIONS = [
  { value: "INR", label: "INR — Indian Rupee (₹)" },
  { value: "USD", label: "USD — US Dollar ($)" },
  { value: "EUR", label: "EUR — Euro (€)" },
  { value: "GBP", label: "GBP — British Pound (£)" },
  { value: "AED", label: "AED — UAE Dirham" },
];

const COUNTRY_OPTIONS = [
  { value: "India", label: "India" },
  { value: "United States", label: "United States" },
  { value: "United Kingdom", label: "United Kingdom" },
  { value: "UAE", label: "UAE" },
  { value: "Singapore", label: "Singapore" },
];

const CREDIT_DAYS_OPTIONS = [
  { value: "0", label: "0 days (Immediate)" },
  { value: "15", label: "15 days" },
  { value: "30", label: "30 days" },
  { value: "45", label: "45 days" },
  { value: "60", label: "60 days" },
  { value: "90", label: "90 days" },
];

// ── Main Tab ──────────────────────────────────────────────────────
export function CrmSettingsTab() {
  // Seeded from crmSettings (local state only, not persisted)
  const [prefix, setPrefix] = useState(crmSettings.customerNumberPrefix);
  const [nextValue, setNextValue] = useState(crmSettings.customerNumberNextValue);
  const [creditDays, setCreditDays] = useState(String(crmSettings.defaultCreditDays));
  const [currency, setCurrency] = useState(crmSettings.defaultCurrency);
  const [country, setCountry] = useState(crmSettings.defaultCountry);
  const [categories, setCategories] = useState<string[]>([...crmSettings.customerCategories]);
  const [newCategory, setNewCategory] = useState("");

  // Save state
  const [saved, setSaved] = useState(false);
  const [timerId, setTimerId] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (timerId) clearTimeout(timerId); };
  }, [timerId]);

  function handleSave() {
    if (timerId) clearTimeout(timerId);
    setSaved(true);
    const id = setTimeout(() => setSaved(false), 2500);
    setTimerId(id);
  }

  function addCategory() {
    const trimmed = newCategory.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    setCategories((prev) => [...prev, trimmed]);
    setNewCategory("");
  }

  function removeCategory(cat: string) {
    setCategories((prev) => prev.filter((c) => c !== cat));
  }

  const preview = `${prefix}-${String(nextValue).padStart(4, "0")}`;

  return (
    <div className="space-y-6">
      {/* 1. Customer Number Format */}
      <SectionCard
        title="Customer Number Format"
        subtitle="Configure the auto-generated customer code format"
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
            <Hash className="h-4 w-4 text-violet-600" />
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Field label="Prefix" description="Added before the customer sequence number.">
            <TextInput value={prefix} onChange={setPrefix} placeholder="e.g. CUS" />
          </Field>
          <Field label="Next Number" description="The next customer will use this sequence number.">
            <NumberInput value={nextValue} onChange={setNextValue} min={1} />
          </Field>
          <Field label="Preview" description="What the next customer code will look like.">
            <div className="flex h-9 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold font-mono text-foreground">
              {preview}
            </div>
          </Field>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => setNextValue(1)}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
          >
            Reset to 1
          </button>
          <p className="text-xs text-muted-foreground">Customer codes must be unique — reset with caution.</p>
        </div>
      </SectionCard>

      {/* 2. Credit & Payment Defaults */}
      <SectionCard
        title="Credit &amp; Payment Defaults"
        subtitle="Default credit terms applied to new customers"
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
            <CreditCard className="h-4 w-4 text-amber-600" />
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Default Credit Days" description="Applied to all new customers unless overridden.">
            <Select
              value={creditDays}
              onChange={setCreditDays}
              options={CREDIT_DAYS_OPTIONS}
            />
          </Field>
          <Field label="Preview" description="Credit term that will appear on new customer records.">
            <div className="flex h-9 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-foreground">
              {creditDays === "0" ? "Immediate payment" : `Net ${creditDays} days`}
            </div>
          </Field>
        </div>
      </SectionCard>

      {/* 3. Customer Categories */}
      <SectionCard
        title="Customer Categories"
        subtitle="Manage the customer group/category list available across the CRM"
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
            <Tag className="h-4 w-4 text-blue-600" />
          </div>
        }
      >
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((cat) => (
            <CategoryChip key={cat} label={cat} onRemove={() => removeCategory(cat)} />
          ))}
          {categories.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No categories defined. Add one below.</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCategory(); } }}
            placeholder="New category name…"
            className="h-9 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition-colors focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)] placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={addCategory}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-foreground hover:bg-slate-50 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Press Enter or click Add to create a new category. Click × to remove one.</p>
      </SectionCard>

      {/* 4. Regional Defaults */}
      <SectionCard
        title="Regional Defaults"
        subtitle="Default currency and country for new customer records"
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
            <Globe className="h-4 w-4 text-emerald-600" />
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Default Currency" description="Currency used for pricing and invoicing.">
            <Select value={currency} onChange={setCurrency} options={CURRENCY_OPTIONS} />
          </Field>
          <Field label="Default Country" description="Pre-filled country for new customer addresses.">
            <Select value={country} onChange={setCountry} options={COUNTRY_OPTIONS} />
          </Field>
        </div>
      </SectionCard>

      {/* Save bar */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div>
          <SavedBanner visible={saved} />
          {!saved && (
            <p className="text-xs text-muted-foreground">
              Changes are stored for this session only and reset on page reload.
            </p>
          )}
        </div>
        <div className="ml-auto shrink-0">
          <PrimaryButton icon={ShieldCheck} onClick={handleSave}>
            Save Settings
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
