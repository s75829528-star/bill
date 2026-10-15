// ── Recurring Invoices Tab ────────────────────────────────────────
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  RefreshCw,
  Pause,
  Play,
  Pencil,
  Trash2,
  Calendar,
  Users,
  IndianRupee,
  Activity,
  Copy,
  XCircle,
  Eye,
  Loader2,
  X,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import {
  fmtINR,
  fmtDate,
  type RecurringInvoice,
  type RecurringFrequency,
  type RecurringStatus,
  type RecurringInvoiceItem,
} from "@/lib/billing-data";
import {
  SectionCard,
  StatTile,
  SearchInput,
  Select,
  Pagination,
  PrimaryButton,
  SecondaryButton,
  EmptyState,
  BillingStatusPill,
  ModalShell,
} from "@/components/billing/shared";
import { useBusiness } from "@/contexts/BusinessContext";
import { useCustomers } from "@/hooks/useCustomersQuery";
import { useProducts } from "@/hooks/useProductsQuery";
import {
  useRecurringInvoices,
  useCreateRecurring,
  useUpdateRecurring,
  useDeleteRecurring,
  useUpdateRecurringStatus,
  useDuplicateRecurring,
} from "@/hooks/useRecurringQuery";
import type { Customer } from "@/services/customers";
import type { DbProduct } from "@/services/products";
import { computeRecurringTotal, calculateNextBillingDate, computeFirstBillingDate } from "@/services/recurring";

const PAGE_SIZE = 8;

// ── Frequency config ──────────────────────────────────────────────

const frequencyLabels: Record<RecurringFrequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  "half-yearly": "Half-Yearly",
  yearly: "Yearly",
  custom: "Custom",
};

const frequencyColors: Record<RecurringFrequency, string> = {
  daily: "bg-pink-50 text-pink-700 border-pink-200",
  weekly: "bg-blue-50 text-blue-700 border-blue-200",
  monthly: "bg-emerald-50 text-emerald-700 border-emerald-200",
  quarterly: "bg-violet-50 text-violet-700 border-violet-200",
  "half-yearly": "bg-indigo-50 text-indigo-700 border-indigo-200",
  yearly: "bg-amber-50 text-amber-700 border-amber-200",
  custom: "bg-slate-50 text-slate-700 border-slate-200",
};

function FrequencyBadge({ frequency }: { frequency: RecurringFrequency }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${frequencyColors[frequency]}`}
    >
      {frequencyLabels[frequency]}
    </span>
  );
}

// ── Form types ────────────────────────────────────────────────────

interface RIFormItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  gstPercent: number;
}

interface RIForm {
  templateName: string;
  customerId: string;
  frequency: RecurringFrequency;
  customIntervalDays: number;
  startDate: string;
  endDate: string;
  nextBillingDate: string;
  currency: string;
  notes: string;
  terms: string;
  items: RIFormItem[];
}

const emptyItem = (): RIFormItem => ({
  productId: "",
  productName: "",
  quantity: 1,
  unitPrice: 0,
  discountPercent: 0,
  gstPercent: 18,
});

const emptyForm = (): RIForm => {
  const today = new Date().toISOString().slice(0, 10);
  return {
    templateName: "",
    customerId: "",
    frequency: "monthly",
    customIntervalDays: 30,
    startDate: today,
    endDate: "",
    nextBillingDate: computeFirstBillingDate(today, "monthly"),
    currency: "INR",
    notes: "",
    terms: "",
    items: [emptyItem()],
  };
};

// ── Validation ────────────────────────────────────────────────────

function validateForm(form: RIForm): string | null {
  if (!form.customerId) return "Please select a customer.";
  if (form.items.length === 0) return "Add at least one line item.";
  for (const item of form.items) {
    if (!item.productId && !item.productName.trim()) return "Each line item must have a product.";
    if (item.quantity <= 0) return "Quantity must be greater than zero.";
    if (item.unitPrice < 0) return "Unit price cannot be negative.";
  }
  if (!form.frequency) return "Please select a billing frequency.";
  if (!form.startDate) return "Please set a start date.";
  if (form.endDate && form.endDate < form.startDate) return "End date must be after start date.";
  return null;
}

// ── Line Item Row ─────────────────────────────────────────────────

function LineItemRow({
  item,
  index,
  dbProducts,
  onChange,
  onRemove,
  canRemove,
}: {
  item: RIFormItem;
  index: number;
  dbProducts: DbProduct[];
  onChange: (idx: number, field: keyof RIFormItem, value: string | number) => void;
  onRemove: (idx: number) => void;
  canRemove: boolean;
}) {
  const inputCls =
    "h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]";

  const handleProductChange = (productId: string) => {
    const p = dbProducts.find((x) => x.id === productId);
    if (p) {
      onChange(index, "productId", p.id);
      onChange(index, "productName", p.name);
      onChange(index, "unitPrice", p.selling_price ?? 0);
      onChange(index, "gstPercent", p.tax_rate ?? 18);
    } else {
      onChange(index, "productId", productId);
    }
  };

  return (
    <tr className="border-b border-slate-100">
      {/* Product */}
      <td className="pr-2 py-1.5" style={{ width: "35%" }}>
        <select
          value={item.productId}
          onChange={(e) => handleProductChange(e.target.value)}
          className={inputCls}
        >
          <option value="">Select product…</option>
          {dbProducts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {p.sku ? `(${p.sku})` : ""}
            </option>
          ))}
        </select>
      </td>
      {/* Qty */}
      <td className="px-1 py-1.5" style={{ width: "10%" }}>
        <input
          type="number"
          min="0.001"
          step="0.001"
          value={item.quantity}
          onChange={(e) => onChange(index, "quantity", parseFloat(e.target.value) || 0)}
          className={inputCls}
        />
      </td>
      {/* Unit Price */}
      <td className="px-1 py-1.5" style={{ width: "18%" }}>
        <input
          type="number"
          min="0"
          step="0.01"
          value={item.unitPrice}
          onChange={(e) => onChange(index, "unitPrice", parseFloat(e.target.value) || 0)}
          className={inputCls}
        />
      </td>
      {/* Discount % */}
      <td className="px-1 py-1.5" style={{ width: "12%" }}>
        <input
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={item.discountPercent}
          onChange={(e) => onChange(index, "discountPercent", parseFloat(e.target.value) || 0)}
          className={inputCls}
        />
      </td>
      {/* GST % */}
      <td className="px-1 py-1.5" style={{ width: "12%" }}>
        <input
          type="number"
          min="0"
          step="0.01"
          value={item.gstPercent}
          onChange={(e) => onChange(index, "gstPercent", parseFloat(e.target.value) || 0)}
          className={inputCls}
        />
      </td>
      {/* Total */}
      <td className="px-1 py-1.5 text-right text-sm font-medium text-foreground" style={{ width: "15%" }}>
        {fmtINR(
          Math.round(
            item.quantity *
              item.unitPrice *
              (1 - item.discountPercent / 100) *
              (1 + item.gstPercent / 100)
          )
        )}
      </td>
      {/* Remove */}
      <td className="pl-1 py-1.5 text-right" style={{ width: "6%" }}>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </td>
    </tr>
  );
}

// ── Form Modal ────────────────────────────────────────────────────

function RIFormModal({
  open,
  onClose,
  initial,
  title,
  onSave,
  dbCustomers,
  dbProducts,
  isSaving,
}: {
  open: boolean;
  onClose: () => void;
  initial?: RIForm;
  title: string;
  onSave: (f: RIForm) => void;
  dbCustomers: Customer[];
  dbProducts: DbProduct[];
  isSaving: boolean;
}) {
  const [form, setForm] = useState<RIForm>(initial ?? emptyForm());
  const set = <K extends keyof RIForm>(k: K, v: RIForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  // Recompute next billing date when start date or frequency changes
  const handleFrequencyChange = (freq: RecurringFrequency) => {
    const next = computeFirstBillingDate(form.startDate, freq, form.customIntervalDays);
    setForm((p) => ({ ...p, frequency: freq, nextBillingDate: next }));
  };

  const handleStartDateChange = (date: string) => {
    const next = computeFirstBillingDate(date, form.frequency, form.customIntervalDays);
    setForm((p) => ({ ...p, startDate: date, nextBillingDate: next }));
  };

  const handleItemChange = (
    idx: number,
    field: keyof RIFormItem,
    value: string | number
  ) => {
    setForm((p) => {
      const items = [...p.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...p, items };
    });
  };

  const addItem = () => setForm((p) => ({ ...p, items: [...p.items, emptyItem()] }));

  const removeItem = (idx: number) =>
    setForm((p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));

  const grandTotal = form.items.reduce(
    (s, item) =>
      s +
      item.quantity *
        item.unitPrice *
        (1 - item.discountPercent / 100) *
        (1 + item.gstPercent / 100),
    0
  );

  const handleSave = () => {
    const err = validateForm(form);
    if (err) {
      toast.error(err);
      return;
    }
    onSave(form);
  };

  return (
    <ModalShell open={open} onClose={onClose} title={title} wide>
      <div className="space-y-4">
        {/* Row 1: Template name + customer */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Template Name</label>
            <input
              value={form.templateName}
              onChange={(e) => set("templateName", e.target.value)}
              placeholder="e.g. Monthly AMC — Halcyon Group"
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Customer <span className="text-red-500">*</span>
            </label>
            <select
              value={form.customerId}
              onChange={(e) => set("customerId", e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
            >
              <option value="">Select customer…</option>
              {dbCustomers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.company_name ? `— ${c.company_name}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Frequency + custom interval */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Frequency <span className="text-red-500">*</span>
            </label>
            <select
              value={form.frequency}
              onChange={(e) => handleFrequencyChange(e.target.value as RecurringFrequency)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="half-yearly">Half-Yearly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          {form.frequency === "custom" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Every N Days</label>
              <input
                type="number"
                min="1"
                value={form.customIntervalDays}
                onChange={(e) => {
                  const days = parseInt(e.target.value) || 1;
                  const next = computeFirstBillingDate(form.startDate, "custom", days);
                  setForm((p) => ({
                    ...p,
                    customIntervalDays: days,
                    nextBillingDate: next,
                  }));
                }}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Currency</label>
            <select
              value={form.currency}
              onChange={(e) => set("currency", e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
            >
              <option value="INR">INR — ₹ Indian Rupee</option>
              <option value="USD">USD — $ US Dollar</option>
              <option value="EUR">EUR — € Euro</option>
              <option value="GBP">GBP — £ British Pound</option>
              <option value="AED">AED — د.إ UAE Dirham</option>
              <option value="SGD">SGD — S$ Singapore Dollar</option>
            </select>
          </div>
        </div>

        {/* Row 3: Dates */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">End Date</label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => set("endDate", e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Next Billing Date</label>
            <input
              type="date"
              value={form.nextBillingDate}
              onChange={(e) => set("nextBillingDate", e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              Products <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-[color:var(--brand-electric)] hover:bg-blue-50 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Item
            </button>
          </div>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-2 py-2 text-left text-xs font-semibold text-muted-foreground">Product</th>
                  <th className="px-1 py-2 text-left text-xs font-semibold text-muted-foreground">Qty</th>
                  <th className="px-1 py-2 text-left text-xs font-semibold text-muted-foreground">Unit Price</th>
                  <th className="px-1 py-2 text-left text-xs font-semibold text-muted-foreground">Disc %</th>
                  <th className="px-1 py-2 text-left text-xs font-semibold text-muted-foreground">GST %</th>
                  <th className="px-1 py-2 text-right text-xs font-semibold text-muted-foreground">Total</th>
                  <th className="pl-1 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white px-2">
                {form.items.map((item, idx) => (
                  <LineItemRow
                    key={idx}
                    item={item}
                    index={idx}
                    dbProducts={dbProducts}
                    onChange={handleItemChange}
                    onRemove={removeItem}
                    canRemove={form.items.length > 1}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end pr-2">
            <span className="text-sm text-muted-foreground">
              Grand Total:{" "}
              <span className="font-semibold text-foreground">{fmtINR(Math.round(grandTotal))}</span>
            </span>
          </div>
        </div>

        {/* Notes + Terms */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Customer-facing notes…"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)] resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Terms & Conditions</label>
            <textarea
              rows={2}
              value={form.terms}
              onChange={(e) => set("terms", e.target.value)}
              placeholder="Payment terms, late fees, etc."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)] resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <SecondaryButton onClick={isSaving ? undefined : onClose}>
            Cancel
          </SecondaryButton>
          <PrimaryButton onClick={isSaving ? undefined : handleSave} disabled={isSaving}>
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </span>
            ) : (
              "Save Recurring Invoice"
            )}
          </PrimaryButton>
        </div>
      </div>
    </ModalShell>
  );
}

// ── Preview Modal ─────────────────────────────────────────────────

function PreviewModal({
  open,
  onClose,
  ri,
  customerName,
}: {
  open: boolean;
  onClose: () => void;
  ri: RecurringInvoice;
  customerName: string;
}) {
  const totalItems = (ri.items ?? []).length;
  return (
    <ModalShell open={open} onClose={onClose} title="Recurring Invoice Preview" wide>
      <div className="space-y-4 text-sm">
        {/* Header info */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 rounded-xl bg-slate-50 p-4">
          <div>
            <p className="text-xs text-muted-foreground">Series Number</p>
            <p className="font-semibold text-foreground">{ri.seriesNumber ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Template Name</p>
            <p className="font-semibold text-foreground">{ri.templateName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Customer</p>
            <p className="font-semibold text-foreground">{customerName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Frequency</p>
            <p className="font-semibold text-foreground">{frequencyLabels[ri.frequency]}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Start Date</p>
            <p className="font-semibold text-foreground">{fmtDate(ri.startDate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">End Date</p>
            <p className="font-semibold text-foreground">{ri.endDate ? fmtDate(ri.endDate) : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Next Billing Date</p>
            <p className="font-semibold text-foreground">{fmtDate(ri.nextBillingDate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last Generated</p>
            <p className="font-semibold text-foreground">
              {ri.lastGeneratedDate ? fmtDate(ri.lastGeneratedDate) : "Not yet generated"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Currency</p>
            <p className="font-semibold text-foreground">{ri.currency ?? "INR"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Invoices Generated</p>
            <p className="font-semibold text-foreground">{ri.invoicesGenerated}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <BillingStatusPill status={ri.status} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Grand Total (per cycle)</p>
            <p className="font-semibold text-foreground">{fmtINR(Math.round(ri.amount))}</p>
          </div>
        </div>

        {/* Line items */}
        {totalItems > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Line Items ({totalItems})
            </p>
            <table className="w-full rounded-xl border border-slate-200 overflow-hidden text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Product</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Qty</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Unit Price</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Disc%</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">GST%</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(ri.items ?? []).map((item, i) => {
                  const lineTotal =
                    item.quantity *
                    item.unitPrice *
                    (1 - item.discountPercent / 100) *
                    (1 + item.gstPercent / 100);
                  return (
                    <tr key={i} className="bg-white">
                      <td className="px-3 py-2 text-foreground">{item.productId || "—"}</td>
                      <td className="px-3 py-2 text-right">{item.quantity}</td>
                      <td className="px-3 py-2 text-right">{fmtINR(item.unitPrice)}</td>
                      <td className="px-3 py-2 text-right">{item.discountPercent}%</td>
                      <td className="px-3 py-2 text-right">{item.gstPercent}%</td>
                      <td className="px-3 py-2 text-right font-medium">{fmtINR(Math.round(lineTotal))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {ri.notes && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Notes</p>
            <p className="text-foreground">{ri.notes}</p>
          </div>
        )}
        {ri.terms && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              Terms & Conditions
            </p>
            <p className="text-foreground">{ri.terms}</p>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <SecondaryButton onClick={onClose}>Close</SecondaryButton>
        </div>
      </div>
    </ModalShell>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-3 p-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-12 w-full animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────

export function RecurringTab() {
  const { business } = useBusiness();
  const businessId = business?.id ?? null;

  const recurringQuery = useRecurringInvoices(businessId);
  const { data: dbCustomers = [] } = useCustomers(businessId);
  const { data: dbProducts = [] } = useProducts(businessId);

  const createMutation = useCreateRecurring(businessId);
  const updateMutation = useUpdateRecurring(businessId);
  const deleteMutation = useDeleteRecurring(businessId);
  const statusMutation = useUpdateRecurringStatus(businessId);
  const duplicateMutation = useDuplicateRecurring(businessId);

  const recurring = recurringQuery.data ?? [];

  // ── UI state ───────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [freqFilter, setFreqFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RecurringInvoice | null>(null);
  const [previewTarget, setPreviewTarget] = useState<RecurringInvoice | null>(null);

  // Customer lookup map
  const customerMap = useMemo(
    () => new Map(dbCustomers.map((c) => [c.id, c])),
    [dbCustomers]
  );

  // ── Stats ──────────────────────────────────────────────────────
  const activeCount = recurring.filter((r) => r.status === "active").length;
  const pausedCount = recurring.filter((r) => r.status === "paused").length;
  const totalMonthly = recurring
    .filter((r) => r.status === "active")
    .reduce((s, r) => {
      if (r.frequency === "daily") return s + r.amount * 30;
      if (r.frequency === "weekly") return s + r.amount * 4.33;
      if (r.frequency === "monthly") return s + r.amount;
      if (r.frequency === "quarterly") return s + r.amount / 3;
      if (r.frequency === "half-yearly") return s + r.amount / 6;
      if (r.frequency === "yearly") return s + r.amount / 12;
      return s + r.amount; // custom: treat as monthly estimate
    }, 0);
  const totalGenerated = recurring.reduce((s, r) => s + r.invoicesGenerated, 0);

  // ── Filter / paginate ──────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return recurring.filter((r) => {
      const cust = customerMap.get(r.customerId);
      const matchSearch =
        (r.seriesNumber ?? "").toLowerCase().includes(q) ||
        r.templateName.toLowerCase().includes(q) ||
        (cust?.name ?? r.customerId).toLowerCase().includes(q) ||
        r.itemsSummary.toLowerCase().includes(q);
      const matchFreq = freqFilter === "all" || r.frequency === freqFilter;
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      return matchSearch && matchFreq && matchStatus;
    });
  }, [recurring, search, freqFilter, statusFilter, customerMap]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Handlers ───────────────────────────────────────────────────

  const handleCreate = (f: RIForm) => {
    const items: RecurringInvoiceItem[] = f.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      discountPercent: i.discountPercent,
      gstPercent: i.gstPercent,
    }));
    createMutation.mutate(
      {
        input: {
          templateName: f.templateName,
          customerId: f.customerId,
          frequency: f.frequency,
          customIntervalDays: f.frequency === "custom" ? f.customIntervalDays : undefined,
          startDate: f.startDate,
          endDate: f.endDate || undefined,
          currency: f.currency,
          notes: f.notes,
          terms: f.terms,
          items,
        },
        dbProducts,
      },
      {
        onSuccess: () => {
          toast.success("Recurring invoice created.");
          setCreateOpen(false);
          setPage(1);
        },
        onError: (e: unknown) => toast.error((e as Error).message ?? "Failed to create."),
      }
    );
  };

  const handleEdit = (f: RIForm) => {
    if (!editTarget) return;
    const items: RecurringInvoiceItem[] = f.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      discountPercent: i.discountPercent,
      gstPercent: i.gstPercent,
    }));
    updateMutation.mutate(
      {
        id: editTarget.id,
        input: {
          templateName: f.templateName,
          customerId: f.customerId,
          frequency: f.frequency,
          customIntervalDays: f.frequency === "custom" ? f.customIntervalDays : undefined,
          startDate: f.startDate,
          endDate: f.endDate || undefined,
          nextBillingDate: f.nextBillingDate,
          currency: f.currency,
          notes: f.notes,
          terms: f.terms,
          items,
        },
        dbProducts,
      },
      {
        onSuccess: () => {
          toast.success("Recurring invoice updated.");
          setEditTarget(null);
        },
        onError: (e: unknown) => toast.error((e as Error).message ?? "Failed to update."),
      }
    );
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this recurring invoice? This cannot be undone.")) return;
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Recurring invoice deleted."),
      onError: (e: unknown) => toast.error((e as Error).message ?? "Failed to delete."),
    });
  };

  const handleToggleStatus = (ri: RecurringInvoice) => {
    const newStatus: RecurringStatus = ri.status === "active" ? "paused" : "active";
    statusMutation.mutate(
      { id: ri.id, status: newStatus },
      {
        onSuccess: () =>
          toast.success(`Schedule ${newStatus === "active" ? "resumed" : "paused"}.`),
        onError: (e: unknown) => toast.error((e as Error).message ?? "Failed to update status."),
      }
    );
  };

  const handleCancel = (ri: RecurringInvoice) => {
    if (!window.confirm("Cancel this recurring schedule? You can reactivate it later.")) return;
    statusMutation.mutate(
      { id: ri.id, status: "cancelled" },
      {
        onSuccess: () => toast.success("Schedule cancelled."),
        onError: (e: unknown) => toast.error((e as Error).message ?? "Failed to cancel."),
      }
    );
  };

  const handleActivate = (ri: RecurringInvoice) => {
    statusMutation.mutate(
      { id: ri.id, status: "active" },
      {
        onSuccess: () => toast.success("Schedule activated."),
        onError: (e: unknown) => toast.error((e as Error).message ?? "Failed to activate."),
      }
    );
  };

  const handleDuplicate = (ri: RecurringInvoice) => {
    duplicateMutation.mutate(
      { id: ri.id, dbProducts },
      {
        onSuccess: () => {
          toast.success("Schedule duplicated.");
          setPage(1);
        },
        onError: (e: unknown) => toast.error((e as Error).message ?? "Failed to duplicate."),
      }
    );
  };

  // Build initial form state from an existing RecurringInvoice for editing
  const buildEditForm = (ri: RecurringInvoice): RIForm => ({
    templateName: ri.templateName,
    customerId: ri.customerId,
    frequency: ri.frequency,
    customIntervalDays: ri.customIntervalDays ?? 30,
    startDate: ri.startDate,
    endDate: ri.endDate ?? "",
    nextBillingDate: ri.nextBillingDate,
    currency: ri.currency ?? "INR",
    notes: ri.notes ?? "",
    terms: ri.terms ?? "",
    items: (ri.items ?? []).map((item) => {
      const p = dbProducts.find((x) => x.id === item.productId);
      return {
        productId: item.productId,
        productName: p?.name ?? item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
        gstPercent: item.gstPercent,
      };
    }),
  });

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    statusMutation.isPending ||
    duplicateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Stat Strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile
          label="Active Schedules"
          value={String(activeCount)}
          icon={Activity}
          bg="bg-emerald-50"
          iconColor="text-emerald-600"
          index={0}
        />
        <StatTile
          label="Paused"
          value={String(pausedCount)}
          icon={Pause}
          bg="bg-slate-100"
          iconColor="text-slate-500"
          index={1}
        />
        <StatTile
          label="Est. Monthly Revenue"
          value={fmtINR(Math.round(totalMonthly))}
          icon={IndianRupee}
          bg="bg-blue-50"
          iconColor="text-blue-600"
          index={2}
        />
        <StatTile
          label="Invoices Generated"
          value={String(totalGenerated)}
          icon={RefreshCw}
          bg="bg-violet-50"
          iconColor="text-violet-600"
          index={3}
        />
      </div>

      {/* Table Card */}
      <SectionCard
        title="Recurring Invoices"
        subtitle={`${filtered.length} schedule${filtered.length !== 1 ? "s" : ""}`}
        noPadding
        action={
          <div className="flex items-center gap-2">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Search series, customer…"
              className="w-48"
            />
            <Select
              value={freqFilter}
              onChange={(v) => {
                setFreqFilter(v);
                setPage(1);
              }}
              options={[
                { value: "all", label: "All Frequencies" },
                { value: "daily", label: "Daily" },
                { value: "weekly", label: "Weekly" },
                { value: "monthly", label: "Monthly" },
                { value: "quarterly", label: "Quarterly" },
                { value: "half-yearly", label: "Half-Yearly" },
                { value: "yearly", label: "Yearly" },
                { value: "custom", label: "Custom" },
              ]}
            />
            <Select
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
              options={[
                { value: "all", label: "All Statuses" },
                { value: "active", label: "Active" },
                { value: "paused", label: "Paused" },
                { value: "completed", label: "Completed" },
                { value: "cancelled", label: "Cancelled" },
                { value: "expired", label: "Expired" },
              ]}
            />
            <PrimaryButton icon={Plus} onClick={() => setCreateOpen(true)}>
              New Recurring Invoice
            </PrimaryButton>
          </div>
        }
      >
        {recurringQuery.isLoading ? (
          <TableSkeleton />
        ) : paginated.length === 0 ? (
          <EmptyState
            icon={RefreshCw}
            title="No recurring invoices found"
            subtitle="Try adjusting your search or create a new recurring schedule."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Series / Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Frequency
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Next Billing
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Last Generated
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((ri, i) => {
                    const cust = customerMap.get(ri.customerId);
                    const isActive = ri.status === "active";
                    const isPaused = ri.status === "paused";
                    const isCancelled = ri.status === "cancelled";
                    const canToggle = isActive || isPaused;
                    return (
                      <motion.tr
                        key={ri.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.25 }}
                        className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
                      >
                        {/* Series / Name */}
                        <td className="px-6 py-3">
                          <p className="text-sm font-medium text-foreground">
                            {ri.seriesNumber ?? "—"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {ri.templateName}
                          </p>
                        </td>
                        {/* Customer */}
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-foreground whitespace-nowrap">
                            {cust?.name ?? ri.customerId}
                          </p>
                          {cust?.city && (
                            <p className="text-xs text-muted-foreground">{cust.city}</p>
                          )}
                        </td>
                        {/* Frequency */}
                        <td className="px-4 py-3">
                          <FrequencyBadge frequency={ri.frequency} />
                        </td>
                        {/* Next Billing */}
                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                          {fmtDate(ri.nextBillingDate)}
                        </td>
                        {/* Last Generated */}
                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                          {ri.lastGeneratedDate ? fmtDate(ri.lastGeneratedDate) : "—"}
                        </td>
                        {/* Amount */}
                        <td className="px-4 py-3 text-right text-sm font-semibold text-foreground whitespace-nowrap">
                          {fmtINR(Math.round(ri.amount))}
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3">
                          <BillingStatusPill status={ri.status} />
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {/* Pause / Resume */}
                            {canToggle && (
                              <button
                                onClick={() => handleToggleStatus(ri)}
                                disabled={isMutating}
                                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                                  isActive
                                    ? "text-amber-500 hover:bg-amber-50"
                                    : "text-emerald-600 hover:bg-emerald-50"
                                } disabled:opacity-40`}
                                title={isActive ? "Pause" : "Resume"}
                              >
                                {isActive ? (
                                  <Pause className="h-3.5 w-3.5" />
                                ) : (
                                  <Play className="h-3.5 w-3.5" />
                                )}
                              </button>
                            )}
                            {/* Activate (for cancelled/expired) */}
                            {(isCancelled || ri.status === "expired") && (
                              <button
                                onClick={() => handleActivate(ri)}
                                disabled={isMutating}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-40"
                                title="Activate"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {/* Preview */}
                            <button
                              onClick={() => setPreviewTarget(ri)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                              title="Preview"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            {/* Edit */}
                            <button
                              onClick={() => setEditTarget(ri)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            {/* Duplicate */}
                            <button
                              onClick={() => handleDuplicate(ri)}
                              disabled={isMutating}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors disabled:opacity-40"
                              title="Duplicate"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            {/* Cancel (only for active/paused) */}
                            {canToggle && (
                              <button
                                onClick={() => handleCancel(ri)}
                                disabled={isMutating}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-orange-50 hover:text-orange-500 transition-colors disabled:opacity-40"
                                title="Cancel schedule"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(ri.id)}
                              disabled={isMutating}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </SectionCard>

      {/* Create Modal */}
      <RIFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New Recurring Invoice"
        onSave={handleCreate}
        dbCustomers={dbCustomers}
        dbProducts={dbProducts}
        isSaving={createMutation.isPending}
      />

      {/* Edit Modal */}
      {editTarget && (
        <RIFormModal
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          title="Edit Recurring Invoice"
          initial={buildEditForm(editTarget)}
          onSave={handleEdit}
          dbCustomers={dbCustomers}
          dbProducts={dbProducts}
          isSaving={updateMutation.isPending}
        />
      )}

      {/* Preview Modal */}
      {previewTarget && (
        <PreviewModal
          open={!!previewTarget}
          onClose={() => setPreviewTarget(null)}
          ri={previewTarget}
          customerName={
            customerMap.get(previewTarget.customerId)?.name ?? previewTarget.customerId
          }
        />
      )}
    </div>
  );
}
