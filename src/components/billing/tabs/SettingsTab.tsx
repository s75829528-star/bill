// ── Billing Settings Tab ──────────────────────────────────────────
import { useState, useEffect } from "react";
import { Check, Bell, Building2, Hash, FileText, Calculator, ShieldCheck } from "lucide-react";
import { company } from "@/lib/billing-data";
import { SectionCard, PrimaryButton, Select } from "@/components/billing/shared";

// ── Toggle Switch ─────────────────────────────────────────────────
function Toggle({
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
          checked ? "bg-blue-500" : "bg-slate-200"
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

// ── Save confirmation banner ──────────────────────────────────────
function SavedBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
      <Check className="h-4 w-4" />
      Settings saved successfully.
    </div>
  );
}

// ── Field Row ─────────────────────────────────────────────────────
function Field({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      {children}
    </div>
  );
}

// ── Text input helper ─────────────────────────────────────────────
function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
    />
  );
}

// ── Main Tab ──────────────────────────────────────────────────────
export function SettingsTab() {
  // ── 1. Business Information ──
  const [bizName, setBizName] = useState(company.name);
  const [bizGstin, setBizGstin] = useState(company.gstin);
  const [bizAddress, setBizAddress] = useState(company.address);
  const [bizPhone, setBizPhone] = useState(company.phone);
  const [bizEmail, setBizEmail] = useState(company.email);
  const [bankName, setBankName] = useState(company.bankName);
  const [accountNumber, setAccountNumber] = useState(company.accountNumber);
  const [ifsc, setIfsc] = useState(company.ifsc);

  // ── 2. Invoice Numbering ──
  const [prefix, setPrefix] = useState("INV-2026-");
  const [nextNumber, setNextNumber] = useState(53);

  // ── 3. Default Terms & Conditions ──
  const [terms, setTerms] = useState(
    "Payment is due within 10 days of invoice date. Goods once sold will not be taken back. Subject to Karnataka jurisdiction.",
  );

  // ── 4. Tax Defaults ──
  const [defaultGst, setDefaultGst] = useState("18");
  const [placeOfSupply, setPlaceOfSupply] = useState("Karnataka");

  // ── 5. Payment Reminders ──
  const [reminder3Days, setReminder3Days] = useState(true);
  const [reminderOnDue, setReminderOnDue] = useState(true);
  const [reminderOverdue, setReminderOverdue] = useState(false);

  // ── Save state ──
  const [saved, setSaved] = useState(false);
  const [timerId, setTimerId] = useState<ReturnType<typeof setTimeout> | null>(null);

  function handleSave() {
    if (timerId) clearTimeout(timerId);
    setSaved(true);
    const id = setTimeout(() => setSaved(false), 2500);
    setTimerId(id);
  }

  function handleResetNumbering() {
    setNextNumber(1);
  }

  useEffect(() => {
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [timerId]);

  const stateOptions = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
  ].map((s) => ({ value: s, label: s }));

  const gstOptions = [
    { value: "0", label: "0% — Nil Rated" },
    { value: "5", label: "5% — GST" },
    { value: "12", label: "12% — GST" },
    { value: "18", label: "18% — GST" },
    { value: "28", label: "28% — GST" },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Business Information */}
      <SectionCard
        title="Business Information"
        subtitle="Your company details printed on every invoice"
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
            <Building2 className="h-4 w-4 text-blue-600" />
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Business Name">
            <TextInput value={bizName} onChange={setBizName} placeholder="Your company name" />
          </Field>
          <Field label="GSTIN">
            <TextInput value={bizGstin} onChange={setBizGstin} placeholder="e.g. 27AAFCN4455K1Z9" />
          </Field>
          <Field label="Phone">
            <TextInput value={bizPhone} onChange={setBizPhone} placeholder="+91 …" />
          </Field>
          <Field label="Email">
            <TextInput value={bizEmail} onChange={setBizEmail} placeholder="billing@example.com" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Registered Address">
              <textarea
                value={bizAddress}
                onChange={(e) => setBizAddress(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
            </Field>
          </div>
          <Field label="Bank Name">
            <TextInput value={bankName} onChange={setBankName} placeholder="e.g. HDFC Bank" />
          </Field>
          <Field label="IFSC Code">
            <TextInput value={ifsc} onChange={setIfsc} placeholder="e.g. HDFC0001234" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Account Number">
              <TextInput
                value={accountNumber}
                onChange={setAccountNumber}
                placeholder="e.g. 50200098765432"
              />
            </Field>
          </div>
        </div>
      </SectionCard>

      {/* 2. Invoice Numbering */}
      <SectionCard
        title="Invoice Numbering"
        subtitle="Configure the auto-generated invoice number format"
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
            <Hash className="h-4 w-4 text-violet-600" />
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Field label="Prefix" description="Added before the invoice sequence number.">
            <TextInput value={prefix} onChange={setPrefix} placeholder="INV-2026-" />
          </Field>
          <Field label="Next Number" description="The next invoice will use this sequence number.">
            <input
              type="number"
              min={1}
              value={nextNumber}
              onChange={(e) => setNextNumber(parseInt(e.target.value) || 1)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
          </Field>
          <Field label="Preview" description="What your next invoice number will look like.">
            <div className="flex h-9 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-foreground">
              {prefix}
              {String(nextNumber).padStart(4, "0")}
            </div>
          </Field>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleResetNumbering}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
          >
            Reset Numbering to 1
          </button>
          <p className="text-xs text-muted-foreground">
            This resets the next number to 1. Use with caution — invoice numbers must be unique.
          </p>
        </div>
      </SectionCard>

      {/* 3. Default Terms & Conditions */}
      <SectionCard
        title="Default Terms & Conditions"
        subtitle="Pre-filled on every new invoice (can be overridden per invoice)"
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
            <FileText className="h-4 w-4 text-amber-600" />
          </div>
        }
      >
        <textarea
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          rows={4}
          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          placeholder="Enter your default terms and conditions…"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          {terms.length} characters · appears in the footer of every new invoice.
        </p>
      </SectionCard>

      {/* 4. Tax Defaults */}
      <SectionCard
        title="Tax Defaults"
        subtitle="Default GST rate and place of supply for new invoices"
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
            <Calculator className="h-4 w-4 text-emerald-600" />
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field
            label="Default GST Rate"
            description="Applied to new invoice line items unless overridden."
          >
            <Select
              value={defaultGst}
              onChange={setDefaultGst}
              options={gstOptions}
              className="w-full mt-1"
            />
          </Field>
          <Field
            label="Default Place of Supply"
            description="State used when creating a new invoice — determines CGST/SGST vs IGST."
          >
            <Select
              value={placeOfSupply}
              onChange={setPlaceOfSupply}
              options={stateOptions}
              className="w-full mt-1"
            />
          </Field>
        </div>
      </SectionCard>

      {/* 5. Payment Reminders */}
      <SectionCard
        title="Payment Reminders"
        subtitle="Automated reminder schedule for outstanding invoices"
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
            <Bell className="h-4 w-4 text-orange-600" />
          </div>
        }
      >
        <div className="space-y-5">
          <Toggle
            checked={reminder3Days}
            onChange={setReminder3Days}
            label="Send reminder 3 days before due date"
            description="A payment reminder is sent to the customer 3 days before the invoice due date."
          />
          <div className="border-t border-slate-100" />
          <Toggle
            checked={reminderOnDue}
            onChange={setReminderOnDue}
            label="Send reminder on due date"
            description="A reminder is sent on the day the invoice is due if payment has not been received."
          />
          <div className="border-t border-slate-100" />
          <Toggle
            checked={reminderOverdue}
            onChange={setReminderOverdue}
            label="Send weekly overdue reminder"
            description="For unpaid invoices past the due date, send a weekly follow-up reminder."
          />
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
