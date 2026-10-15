// ── Quotations Tab ─────────────────────────────────────────────────
import { useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  X,
  Copy,
  Pencil,
  Trash2,
  ArrowRight,
  FileQuestion,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Printer,
  Mail,
  Share2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  fmtINR,
  fmtDate,
  computeLineItem,
  computeDocumentTotals,
  type Quotation,
  type QuotationStatus,
  type InvoiceItem,
} from "@/lib/billing-data";
import {
  SectionCard,
  SearchInput,
  Select,
  Pagination,
  PrimaryButton,
  SecondaryButton,
  EmptyState,
  BillingStatusPill,
} from "@/components/billing/shared";
import { useBusiness } from "@/contexts/BusinessContext";
import { useCustomers } from "@/hooks/useCustomersQuery";
import { useProducts } from "@/hooks/useProductsQuery";
import {
  useQuotations,
  useCreateQuotation,
  useUpdateQuotation,
  useUpdateQuotationStatus,
  useDeleteQuotation,
  useDuplicateQuotation,
  useConvertToInvoice,
} from "@/hooks/useQuotationsQuery";
import type { DbProduct } from "@/services/products";

// ── Constants ──────────────────────────────────────────────────────

const PAGE_SIZE = 8;

// ── Helpers ────────────────────────────────────────────────────────

function emptyLine(dbProducts: DbProduct[]): InvoiceItem {
  const first = dbProducts[0];
  return {
    productId: first?.id ?? "",
    quantity: 1,
    unitPrice: first?.selling_price ?? 0,
    discountPercent: 0,
    gstPercent: first?.tax_rate ?? 18,
  };
}

// ── Items Table ────────────────────────────────────────────────────

function ItemsTable({
  lines,
  onChange,
  dbProducts,
}: {
  lines: InvoiceItem[];
  onChange: (lines: InvoiceItem[]) => void;
  dbProducts: DbProduct[];
}) {
  const [productSearch, setProductSearch] = useState<string[]>(
    lines.map(() => "")
  );

  function addLine() {
    onChange([...lines, emptyLine(dbProducts)]);
    setProductSearch((ps) => [...ps, ""]);
  }

  function removeLine(idx: number) {
    if (lines.length === 1) return;
    onChange(lines.filter((_, i) => i !== idx));
    setProductSearch((ps) => ps.filter((_, i) => i !== idx));
  }

  function updateLine(idx: number, field: keyof InvoiceItem, val: string | number) {
    const next = lines.map((row, i) => (i !== idx ? row : { ...row, [field]: val }));
    onChange(next);
  }

  function selectProduct(idx: number, productId: string) {
    const p = dbProducts.find((p) => p.id === productId);
    if (!p) return;
    const next = lines.map((row, i) =>
      i !== idx
        ? row
        : {
            ...row,
            productId: p.id,
            unitPrice: p.selling_price,
            gstPercent: p.tax_rate,
          }
    );
    onChange(next);
    setProductSearch((ps) => ps.map((s, i) => (i === idx ? "" : s)));
  }

  const totals = computeDocumentTotals(lines, false);
  const inputCls =
    "h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-600">Line Items</p>
        <button
          type="button"
          onClick={addLine}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <Plus className="h-3 w-3" /> Add Item
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-3 py-2 text-left font-semibold text-slate-500 min-w-[200px]">
                Product
              </th>
              <th className="px-3 py-2 text-right font-semibold text-slate-500 w-16">Qty</th>
              <th className="px-3 py-2 text-right font-semibold text-slate-500 w-24">Unit Price</th>
              <th className="px-3 py-2 text-right font-semibold text-slate-500 w-16">Disc %</th>
              <th className="px-3 py-2 text-right font-semibold text-slate-500 w-16">GST %</th>
              <th className="px-3 py-2 text-right font-semibold text-slate-500 w-24">Line Total</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {lines.map((row, idx) => {
              const { total } = computeLineItem(row);
              const selectedProduct = dbProducts.find((p) => p.id === row.productId);
              const search = productSearch[idx] ?? "";
              const filteredProducts = search
                ? dbProducts.filter(
                    (p) =>
                      p.name.toLowerCase().includes(search.toLowerCase()) ||
                      p.sku.toLowerCase().includes(search.toLowerCase()) ||
                      (p.barcode ?? "").toLowerCase().includes(search.toLowerCase())
                  )
                : dbProducts;

              return (
                <tr key={idx} className="border-b border-slate-50">
                  {/* Product search */}
                  <td className="px-3 py-2">
                    <div className="relative">
                      <input
                        type="text"
                        value={search || selectedProduct?.name || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProductSearch((ps) => ps.map((s, i) => (i === idx ? val : s)));
                          if (!val) updateLine(idx, "productId", "");
                        }}
                        placeholder="Search by name, SKU, barcode…"
                        className={`${inputCls} w-full`}
                      />
                      {search && filteredProducts.length > 0 && (
                        <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-40 overflow-y-auto">
                          {filteredProducts.slice(0, 8).map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => selectProduct(idx, p.id)}
                              className="w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50 flex items-center justify-between"
                            >
                              <span className="font-medium">{p.name}</span>
                              <span className="text-slate-400">{p.sku}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0.001"
                      step="0.001"
                      value={row.quantity}
                      onChange={(e) => updateLine(idx, "quantity", parseFloat(e.target.value) || 0)}
                      className={`${inputCls} w-full text-right`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.unitPrice}
                      onChange={(e) => updateLine(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                      className={`${inputCls} w-full text-right`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={row.discountPercent}
                      onChange={(e) =>
                        updateLine(idx, "discountPercent", parseFloat(e.target.value) || 0)
                      }
                      className={`${inputCls} w-full text-right`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={row.gstPercent}
                      onChange={(e) =>
                        updateLine(idx, "gstPercent", parseFloat(e.target.value) || 0)
                      }
                      className={`${inputCls} w-full text-right`}
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-800">
                    {fmtINR(total)}
                  </td>
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      disabled={lines.length === 1}
                      className="rounded-lg p-1 text-red-400 hover:bg-red-50 disabled:opacity-30 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Running Totals */}
      <div className="mt-3 flex justify-end">
        <div className="w-56 space-y-1 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span>{fmtINR(totals.subtotal)}</span>
          </div>
          {totals.totalDiscount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount</span>
              <span>-{fmtINR(totals.totalDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <span>GST</span>
            <span>{fmtINR(totals.cgst + totals.sgst + totals.igst)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-slate-900">
            <span>Grand Total</span>
            <span className="text-blue-700">{fmtINR(totals.grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Quotation Form ─────────────────────────────────────────────────

interface QTFormState {
  customerId: string;
  expiryDate: string;
  billingAddress: string;
  notes: string;
  internalNotes: string;
  terms: string;
  lines: InvoiceItem[];
}

function QuotationForm({
  mode,
  initial,
  onSave,
  onCancel,
  dbCustomers,
  dbProducts,
  isSaving,
}: {
  mode: "create" | "edit";
  initial: QTFormState;
  onSave: (data: QTFormState, asDraft: boolean) => void;
  onCancel: () => void;
  dbCustomers: { id: string; name: string; city: string | null }[];
  dbProducts: DbProduct[];
  isSaving: boolean;
}) {
  const [form, setForm] = useState<QTFormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const saveAsDraftRef = useRef(false);

  function setField<K extends keyof QTFormState>(k: K, v: QTFormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!form.customerId) e.customerId = "Please select a customer.";
    if (form.lines.length === 0) e.lines = "Add at least one line item.";
    if (form.lines.some((l) => !l.productId)) e.lines = "All line items must have a product selected.";
    if (form.lines.some((l) => l.quantity <= 0)) e.lines = "All quantities must be positive.";
    if (form.lines.some((l) => l.unitPrice < 0)) e.lines = "Unit prices cannot be negative.";
    if (form.expiryDate && form.expiryDate < new Date().toISOString().slice(0, 10)) {
      e.expiryDate = "Expiry date cannot be in the past.";
    }
    return e;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    onSave(form, saveAsDraftRef.current);
  }

  const labelCls = "mb-1 block text-xs font-semibold text-slate-600";
  const inputCls =
    "h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition-colors focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)] placeholder:text-slate-400";
  const selectCls =
    "h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none transition-colors focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]";

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Customer */}
        <div>
          <label className={labelCls}>Customer *</label>
          <select
            value={form.customerId}
            onChange={(e) => setField("customerId", e.target.value)}
            className={selectCls}
          >
            <option value="">Select customer…</option>
            {dbCustomers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.city ? ` — ${c.city}` : ""}
              </option>
            ))}
          </select>
          {errors.customerId && (
            <p className="mt-0.5 text-[11px] text-red-500">{errors.customerId}</p>
          )}
        </div>

        {/* Expiry Date */}
        <div>
          <label className={labelCls}>Expiry Date</label>
          <input
            type="date"
            value={form.expiryDate}
            onChange={(e) => setField("expiryDate", e.target.value)}
            className={inputCls}
          />
          {errors.expiryDate && (
            <p className="mt-0.5 text-[11px] text-red-500">{errors.expiryDate}</p>
          )}
        </div>
      </div>

      {/* Billing Address */}
      <div>
        <label className={labelCls}>Billing Address</label>
        <textarea
          value={form.billingAddress}
          onChange={(e) => setField("billingAddress", e.target.value)}
          rows={2}
          placeholder="Customer billing address…"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)] placeholder:text-slate-400 resize-none"
        />
      </div>

      {/* Items Table */}
      <div>
        <ItemsTable
          lines={form.lines}
          onChange={(l) => setField("lines", l)}
          dbProducts={dbProducts}
        />
        {errors.lines && <p className="mt-1 text-[11px] text-red-500">{errors.lines}</p>}
      </div>

      {/* Notes row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Notes (Customer-Visible)</label>
          <textarea
            value={form.notes}
            onChange={(e) => setField("notes", e.target.value)}
            rows={2}
            placeholder="Add any notes for the customer…"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)] placeholder:text-slate-400 resize-none"
          />
        </div>
        <div>
          <label className={labelCls}>Internal Notes</label>
          <textarea
            value={form.internalNotes}
            onChange={(e) => setField("internalNotes", e.target.value)}
            rows={2}
            placeholder="Internal notes (not shown to customer)…"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)] placeholder:text-slate-400 resize-none"
          />
        </div>
      </div>

      {/* Terms */}
      <div>
        <label className={labelCls}>Terms &amp; Conditions</label>
        <textarea
          value={form.terms}
          onChange={(e) => setField("terms", e.target.value)}
          rows={2}
          placeholder="Quotation terms and conditions…"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)] placeholder:text-slate-400 resize-none"
        />
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
        {/* Save Draft — sets flag then submits the form */}
        <button
          type="submit"
          disabled={isSaving}
          onClick={() => { saveAsDraftRef.current = true; }}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Save Draft
        </button>
        {/* Create / Save — sends as "sent" status */}
        <button
          type="submit"
          disabled={isSaving}
          onClick={() => { saveAsDraftRef.current = false; }}
          className="inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-sm disabled:hover:translate-y-0"
        >
          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {mode === "create" ? "Create Quotation" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

// ── Print helper ───────────────────────────────────────────────────

function printQuotation(
  qt: Quotation,
  customerName: string,
  items: Array<{ name: string; qty: number; price: number; disc: number; gst: number; total: number }>
) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>${qt.quoteNumber}</title>
<style>
  body{font-family:sans-serif;padding:32px;color:#1e293b;font-size:13px}
  h1{font-size:22px;font-weight:700;margin:0 0 4px}
  .meta{color:#64748b;margin-bottom:24px}
  table{width:100%;border-collapse:collapse;margin:16px 0}
  th{background:#f8fafc;padding:8px 12px;text-align:left;font-size:11px;color:#64748b;border-bottom:1px solid #e2e8f0}
  td{padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:12px}
  .right{text-align:right}
  .totals{float:right;width:240px;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-top:8px}
  .totals .row{display:flex;justify-content:space-between;padding:3px 0;font-size:12px}
  .totals .grand{font-weight:700;border-top:1px solid #e2e8f0;margin-top:6px;padding-top:6px;font-size:14px;color:#1d4ed8}
</style></head><body>
<h1>${qt.quoteNumber}</h1>
<div class="meta">
  <div><strong>Customer:</strong> ${customerName}</div>
  <div><strong>Date:</strong> ${fmtDate(qt.createdDate)}</div>
  ${qt.expiryDate ? `<div><strong>Expiry:</strong> ${fmtDate(qt.expiryDate)}</div>` : ""}
  ${qt.billingAddress ? `<div><strong>Billing Address:</strong> ${qt.billingAddress}</div>` : ""}
</div>
<table>
  <thead><tr><th>Product</th><th class="right">Qty</th><th class="right">Unit Price</th><th class="right">Disc %</th><th class="right">GST %</th><th class="right">Total</th></tr></thead>
  <tbody>${items.map((i) => `<tr><td>${i.name}</td><td class="right">${i.qty}</td><td class="right">${fmtINR(i.price)}</td><td class="right">${i.disc}%</td><td class="right">${i.gst}%</td><td class="right">${fmtINR(i.total)}</td></tr>`).join("")}</tbody>
</table>
<div style="overflow:hidden">
  <div class="totals">
    <div class="row"><span>Subtotal</span><span>${fmtINR(qt.subtotal)}</span></div>
    ${qt.discountTotal > 0 ? `<div class="row" style="color:#059669"><span>Discount</span><span>-${fmtINR(qt.discountTotal)}</span></div>` : ""}
    <div class="row"><span>GST</span><span>${fmtINR(qt.taxTotal)}</span></div>
    <div class="row grand"><span>Grand Total</span><span>${fmtINR(qt.grandTotal)}</span></div>
  </div>
</div>
${qt.terms ? `<p style="margin-top:80px;font-size:11px;color:#64748b"><strong>Terms &amp; Conditions:</strong> ${qt.terms}</p>` : ""}
${qt.notes ? `<p style="font-size:11px;color:#64748b"><strong>Notes:</strong> ${qt.notes}</p>` : ""}
</body></html>`);
  win.document.close();
  win.print();
}

// ── Status filter config ───────────────────────────────────────────

const STATUS_FILTERS: { label: string; value: QuotationStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Expired", value: "expired" },
  { label: "Converted", value: "converted" },
];

const SORT_OPTIONS = [
  { value: "date-desc", label: "Newest First" },
  { value: "date-asc", label: "Oldest First" },
  { value: "amount-desc", label: "Amount High–Low" },
  { value: "amount-asc", label: "Amount Low–High" },
  { value: "expiry-asc", label: "Expiry Soon" },
];

// ── Skeleton row ───────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-50">
      {[160, 120, 80, 80, 80, 80, 100].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-slate-100 animate-pulse" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

// ── Main Component ─────────────────────────────────────────────────

type ViewMode = "list" | "create" | "edit";

export function QuotationsTab() {
  const { business } = useBusiness();
  const businessId = business?.id ?? null;

  // Data
  const { data: quotations = [], isLoading } = useQuotations(businessId);
  const { data: dbCustomers = [] } = useCustomers(businessId);
  const { data: dbProducts = [] } = useProducts(businessId);

  // Mutations
  const createMutation = useCreateQuotation(businessId);
  const updateMutation = useUpdateQuotation(businessId);
  const statusMutation = useUpdateQuotationStatus(businessId);
  const deleteMutation = useDeleteQuotation(businessId);
  const duplicateMutation = useDuplicateQuotation(businessId);
  const convertMutation = useConvertToInvoice(businessId);

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuotationStatus | "all">("all");
  const [sortKey, setSortKey] = useState("date-desc");
  const [page, setPage] = useState(1);
  const [convertedAlert, setConvertedAlert] = useState<string | null>(null);

  // Customer map
  const customerMap = useMemo(
    () => new Map(dbCustomers.map((c) => [c.id, c])),
    [dbCustomers]
  );

  // Filtered + sorted list
  const filtered = useMemo(() => {
    let rows = quotations;
    const q = search.toLowerCase();
    if (q) {
      rows = rows.filter((qt) => {
        const customer = customerMap.get(qt.customerId);
        return (
          qt.quoteNumber.toLowerCase().includes(q) ||
          (customer?.name ?? "").toLowerCase().includes(q) ||
          qt.items.some((item) => {
            const p = dbProducts.find((p) => p.id === item.productId);
            return p?.name.toLowerCase().includes(q) || p?.sku.toLowerCase().includes(q);
          })
        );
      });
    }
    if (statusFilter !== "all") {
      rows = rows.filter((qt) => qt.status === statusFilter);
    }
    rows = [...rows].sort((a, b) => {
      if (sortKey === "date-desc") return b.createdDate.localeCompare(a.createdDate);
      if (sortKey === "date-asc") return a.createdDate.localeCompare(b.createdDate);
      if (sortKey === "amount-desc") return b.grandTotal - a.grandTotal;
      if (sortKey === "amount-asc") return a.grandTotal - b.grandTotal;
      if (sortKey === "expiry-asc") return a.expiryDate.localeCompare(b.expiryDate);
      return 0;
    });
    return rows;
  }, [quotations, search, statusFilter, sortKey, customerMap, dbProducts]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // ── Handlers ──────────────────────────────────────────────────────

  function handleStatusChange(qt: Quotation, newStatus: QuotationStatus) {
    statusMutation.mutate(
      { id: qt.id, status: newStatus },
      {
        onSuccess: () =>
          toast.success(
            `${qt.quoteNumber} marked as ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}.`
          ),
        onError: (err: unknown) =>
          toast.error(`Failed to update status: ${err instanceof Error ? err.message : String(err)}`),
      }
    );
  }

  function handleDelete(qt: Quotation) {
    if (!window.confirm(`Delete ${qt.quoteNumber}? This cannot be undone.`)) return;
    deleteMutation.mutate(qt.id, {
      onSuccess: () => toast.success(`${qt.quoteNumber} deleted.`),
      onError: (err: unknown) =>
        toast.error(`Delete failed: ${err instanceof Error ? err.message : String(err)}`),
    });
  }

  function handleDuplicate(qt: Quotation) {
    duplicateMutation.mutate(
      { source: qt, dbProducts },
      {
        onSuccess: (copy) => toast.success(`Duplicated as ${copy.quoteNumber}.`),
        onError: (err: unknown) =>
          toast.error(`Duplicate failed: ${err instanceof Error ? err.message : String(err)}`),
      }
    );
  }

  function handleConvert(qt: Quotation) {
    if (
      !window.confirm(
        `Convert ${qt.quoteNumber} to an invoice? The quotation will be marked "Converted".`
      )
    )
      return;
    convertMutation.mutate(
      { quotation: qt, dbProducts },
      {
        onSuccess: ({ invoice, quoteNumber }) => {
          setConvertedAlert(
            `${quoteNumber} converted to invoice ${invoice.invoiceNumber}.`
          );
          setTimeout(() => setConvertedAlert(null), 6000);
        },
        onError: (err: unknown) =>
          toast.error(
            `Conversion failed: ${err instanceof Error ? err.message : String(err)}`
          ),
      }
    );
  }

  function handlePrint(qt: Quotation) {
    const customer = customerMap.get(qt.customerId);
    const items = qt.items.map((item) => {
      const p = dbProducts.find((p) => p.id === item.productId);
      const base = item.quantity * item.unitPrice * (1 - item.discountPercent / 100);
      const total = base + base * (item.gstPercent / 100);
      return {
        name: p?.name ?? item.productId,
        qty: item.quantity,
        price: item.unitPrice,
        disc: item.discountPercent,
        gst: item.gstPercent,
        total,
      };
    });
    printQuotation(qt, customer?.name ?? "Customer", items);
  }

  function handleEmail(qt: Quotation) {
    const customer = customerMap.get(qt.customerId);
    const subject = encodeURIComponent(`Quotation ${qt.quoteNumber} from us`);
    const body = encodeURIComponent(
      `Dear ${customer?.name ?? "Customer"},\n\nPlease find attached quotation ${qt.quoteNumber} for ₹${qt.grandTotal.toLocaleString("en-IN")}.\n\nValid until: ${qt.expiryDate || "N/A"}\n\nRegards`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  function handleShare(qt: Quotation) {
    const text = `Quotation ${qt.quoteNumber} — ₹${qt.grandTotal.toLocaleString("en-IN")} — Valid until ${qt.expiryDate || "N/A"}`;
    if (navigator.share) {
      navigator.share({ title: qt.quoteNumber, text }).catch(() => {});
    } else {
      navigator.clipboard
        .writeText(text)
        .then(() => toast.success("Quotation details copied to clipboard."))
        .catch(() => toast.error("Could not copy to clipboard."));
    }
  }

  // Form save
  const isSaving = createMutation.isPending || updateMutation.isPending;

  function handleFormSave(data: QTFormState, asDraft: boolean) {
    const status: QuotationStatus = asDraft ? "draft" : "sent";

    if (viewMode === "create") {
      createMutation.mutate(
        {
          customerId: data.customerId,
          expiryDate: data.expiryDate,
          billingAddress: data.billingAddress,
          notes: data.notes,
          internalNotes: data.internalNotes,
          terms: data.terms,
          items: data.lines,
          status,
          dbProducts,
        },
        {
          onSuccess: (qt) => {
            toast.success(`${qt.quoteNumber} created.`);
            setViewMode("list");
          },
          onError: (err: unknown) =>
            toast.error(`Create failed: ${err instanceof Error ? err.message : String(err)}`),
        }
      );
    } else if (viewMode === "edit" && editingId) {
      const editingQt = quotations.find((q) => q.id === editingId);
      updateMutation.mutate(
        {
          id: editingId,
          customerId: data.customerId,
          expiryDate: data.expiryDate,
          billingAddress: data.billingAddress,
          notes: data.notes,
          internalNotes: data.internalNotes,
          terms: data.terms,
          items: data.lines,
          status: editingQt?.status ?? status,
          dbProducts,
        },
        {
          onSuccess: () => {
            toast.success("Quotation updated.");
            setViewMode("list");
            setEditingId(null);
          },
          onError: (err: unknown) =>
            toast.error(`Update failed: ${err instanceof Error ? err.message : String(err)}`),
        }
      );
    }
  }

  function openEdit(qt: Quotation) {
    setEditingId(qt.id);
    setViewMode("edit");
  }

  function openCreate() {
    setEditingId(null);
    setViewMode("create");
  }

  function buildFormInitial(qt: Quotation): QTFormState {
    return {
      customerId: qt.customerId,
      expiryDate: qt.expiryDate,
      billingAddress: qt.billingAddress,
      notes: qt.notes,
      internalNotes: qt.internalNotes,
      terms: qt.terms,
      lines:
        qt.items.length > 0
          ? qt.items
          : [emptyLine(dbProducts)],
    };
  }

  const defaultFormInitial: QTFormState = {
    customerId: "",
    expiryDate: "",
    billingAddress: "",
    notes: "",
    internalNotes: "",
    terms: "",
    lines: [emptyLine(dbProducts)],
  };

  // ── Create / Edit View ───────────────────────────────────────────

  if (viewMode === "create" || viewMode === "edit") {
    const editingQt = editingId ? quotations.find((q) => q.id === editingId) : null;
    const formInitial = editingQt ? buildFormInitial(editingQt) : defaultFormInitial;

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <SectionCard
          title={
            viewMode === "create"
              ? "New Quotation"
              : `Edit ${editingQt?.quoteNumber ?? "Quotation"}`
          }
          subtitle={
            viewMode === "create"
              ? "Fill in the details to create a new quotation for a customer."
              : "Update the quotation details below."
          }
          action={
            <SecondaryButton
              onClick={() => {
                setViewMode("list");
                setEditingId(null);
              }}
            >
              Back to List
            </SecondaryButton>
          }
        >
          <QuotationForm
            key={editingId ?? "create"}
            mode={viewMode === "create" ? "create" : "edit"}
            initial={formInitial}
            onSave={handleFormSave}
            onCancel={() => {
              setViewMode("list");
              setEditingId(null);
            }}
            dbCustomers={dbCustomers.map((c) => ({
              id: c.id,
              name: c.name,
              city: c.city,
            }))}
            dbProducts={dbProducts}
            isSaving={isSaving}
          />
        </SectionCard>
      </motion.div>
    );
  }

  // ── List View ────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Conversion alert */}
      {convertedAlert && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-800"
        >
          <span>{convertedAlert}</span>
          <button
            onClick={() => setConvertedAlert(null)}
            className="rounded-lg p-1 hover:bg-emerald-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      <SectionCard
        title="Quotations"
        subtitle={`${quotations.length} quotation${quotations.length !== 1 ? "s" : ""} total`}
        action={
          <PrimaryButton icon={Plus} onClick={openCreate}>
            New Quotation
          </PrimaryButton>
        }
        noPadding
      >
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-6 py-3">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search by number, customer, product…"
            className="w-64"
          />
          <Select
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v as QuotationStatus | "all"); setPage(1); }}
            options={STATUS_FILTERS.map((f) => ({ value: f.value, label: f.label }))}
            className="w-36"
          />
          <Select
            value={sortKey}
            onChange={setSortKey}
            options={SORT_OPTIONS}
            className="w-40"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex flex-wrap gap-2 border-b border-slate-100 px-6 py-3">
          {STATUS_FILTERS.map((f) => {
            const count =
              f.value === "all"
                ? quotations.length
                : quotations.filter((q) => q.status === f.value).length;
            return (
              <button
                key={f.value}
                onClick={() => { setStatusFilter(f.value); setPage(1); }}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  statusFilter === f.value
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {f.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    statusFilter === f.value
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {["Quote Number", "Customer", "Status", "Amount", "Created Date", "Expiry Date", "Actions"].map(
                    (h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </tbody>
            </table>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FileQuestion}
            title="No quotations found"
            subtitle="Try adjusting your filters or create a new quotation."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    {[
                      "Quote Number",
                      "Customer",
                      "Status",
                      "Amount",
                      "Created Date",
                      "Expiry Date",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-slate-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((qt, i) => {
                    const customer = customerMap.get(qt.customerId);
                    const isExpired = qt.status === "expired";
                    const canEdit = qt.status === "draft" || qt.status === "sent";
                    const canSend = qt.status === "draft";
                    const canApprove = qt.status === "sent";
                    const canReject = qt.status === "draft" || qt.status === "sent";
                    const canExpire = qt.status === "sent" || qt.status === "approved";
                    const canConvert =
                      (qt.status === "approved" || qt.status === "sent") &&
                      !qt.convertedInvoiceId;
                    const canDelete = qt.status === "draft";
                    const isMutating =
                      statusMutation.isPending ||
                      deleteMutation.isPending ||
                      duplicateMutation.isPending ||
                      convertMutation.isPending;

                    return (
                      <motion.tr
                        key={qt.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.03 }}
                        className="border-b border-slate-50 transition-colors hover:bg-slate-50/70"
                      >
                        {/* Quote Number */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-blue-700">
                              {qt.quoteNumber}
                            </span>
                            {qt.convertedInvoiceId && (
                              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                                Converted
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{customer?.name ?? "—"}</p>
                          <p className="text-[11px] text-slate-400">{customer?.city}</p>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <BillingStatusPill status={qt.status} />
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {fmtINR(qt.grandTotal)}
                        </td>

                        {/* Created Date */}
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {fmtDate(qt.createdDate)}
                        </td>

                        {/* Expiry Date */}
                        <td className="px-4 py-3 text-xs">
                          <span
                            className={isExpired ? "font-semibold text-red-600" : "text-slate-500"}
                          >
                            {qt.expiryDate ? fmtDate(qt.expiryDate) : "—"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {/* Convert to Invoice */}
                            {canConvert && (
                              <button
                                onClick={() => handleConvert(qt)}
                                disabled={isMutating}
                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                                title="Convert to Invoice"
                              >
                                <ArrowRight className="h-3 w-3" /> Convert
                              </button>
                            )}

                            {/* Send */}
                            {canSend && (
                              <button
                                onClick={() => handleStatusChange(qt, "sent")}
                                disabled={isMutating}
                                className="rounded-lg border border-blue-100 p-1.5 text-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50"
                                title="Mark as Sent"
                              >
                                <Send className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {/* Approve */}
                            {canApprove && (
                              <button
                                onClick={() => handleStatusChange(qt, "approved")}
                                disabled={isMutating}
                                className="rounded-lg border border-emerald-100 p-1.5 text-emerald-500 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                                title="Approve"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {/* Reject */}
                            {canReject && (
                              <button
                                onClick={() => handleStatusChange(qt, "rejected")}
                                disabled={isMutating}
                                className="rounded-lg border border-red-100 p-1.5 text-red-400 hover:bg-red-50 transition-colors disabled:opacity-50"
                                title="Reject"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {/* Mark Expired */}
                            {canExpire && (
                              <button
                                onClick={() => handleStatusChange(qt, "expired")}
                                disabled={isMutating}
                                className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-100 transition-colors disabled:opacity-50"
                                title="Mark Expired"
                              >
                                <Clock className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {/* Edit */}
                            {canEdit && (
                              <button
                                onClick={() => openEdit(qt)}
                                className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                title="Edit"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {/* Duplicate */}
                            <button
                              onClick={() => handleDuplicate(qt)}
                              disabled={isMutating}
                              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors disabled:opacity-50"
                              title="Duplicate"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>

                            {/* Print */}
                            <button
                              onClick={() => handlePrint(qt)}
                              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                              title="Print / Download PDF"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>

                            {/* Email */}
                            <button
                              onClick={() => handleEmail(qt)}
                              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                              title="Email Quotation"
                            >
                              <Mail className="h-3.5 w-3.5" />
                            </button>

                            {/* Share */}
                            <button
                              onClick={() => handleShare(qt)}
                              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                              title="Share Quotation"
                            >
                              <Share2 className="h-3.5 w-3.5" />
                            </button>

                            {/* Delete */}
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(qt)}
                                disabled={isMutating}
                                className="rounded-lg border border-red-100 p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="border-t border-slate-100 px-6 py-3">
                <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
              </div>
            )}
          </>
        )}
      </SectionCard>
    </div>
  );
}
