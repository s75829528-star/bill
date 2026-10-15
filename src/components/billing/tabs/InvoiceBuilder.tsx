// ── Invoice Builder ───────────────────────────────────────────────
import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Copy,
  Scan,
  FileText,
  Printer,
  Download,
  Eye,
  EyeOff,
  Building2,
  User,
  ChevronDown,
  X,
  Paperclip,
  PenLine,
  Sparkles,
  Percent,
  Shield,
  Package,
  Mail,
  MessageCircle,
  Clock,
} from "lucide-react";
import {
  company,
  paymentModeLabels,
  computeDocumentTotals,
  computeLineItem,
  nextInvoiceNumber,
  fmtINR,
  fmtDate,
  currencies,
  salespersons,
  paymentTermsPresets,
  type Invoice,
  type InvoiceItem,
  type InvoiceStatus,
  type PaymentMode,
  type PaymentStatus,
} from "@/lib/billing-data";
import { units, type Product } from "@/lib/inventory-data";
import { useProducts } from "@/hooks/useProductsQuery";
import { dbToProduct } from "@/services/products";
import { useCustomers } from "@/hooks/useCustomersQuery";
import type { Customer as DbCustomer } from "@/services/customers";
import { useBusiness } from "@/contexts/BusinessContext";
import { SectionCard, PrimaryButton, SecondaryButton } from "@/components/billing/shared";

// ── Types ──────────────────────────────────────────────────────────

interface BuilderLineItem {
  id: string;
  productId: string;
  productName: string;
  barcode: string;
  hsnCode: string;
  quantity: number;
  unitId: string;
  unitPrice: number;
  discountPercent: number;
  gstPercent: number;
}

interface NewCustomerForm {
  name: string;
  contactPerson: string;
  gstin: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
}

// ── Helpers ────────────────────────────────────────────────────────

const TODAY = "2026-07-13";

function emptyLine(): BuilderLineItem {
  return {
    id: "li-" + Date.now() + Math.random(),
    productId: "",
    productName: "",
    barcode: "",
    hsnCode: "",
    quantity: 1,
    unitId: "",
    unitPrice: 0,
    discountPercent: 0,
    gstPercent: 18,
  };
}

function lineFromProduct(p: Product): BuilderLineItem {
  return {
    id: "li-" + Date.now() + Math.random(),
    productId: p.id,
    productName: p.name,
    barcode: p.barcode,
    hsnCode: p.hsnCode,
    quantity: 1,
    unitId: p.unitId,
    unitPrice: p.sellingPrice,
    discountPercent: 0,
    gstPercent: p.taxPercent,
  };
}

function lineToInvoiceItem(li: BuilderLineItem): InvoiceItem {
  return {
    productId: li.productId,
    quantity: li.quantity,
    unitPrice: li.unitPrice,
    discountPercent: li.discountPercent,
    gstPercent: li.gstPercent,
  };
}

/** Add N days to a YYYY-MM-DD string, return YYYY-MM-DD */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

const inputCls =
  "h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition-colors focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)] placeholder:text-slate-400";
const labelCls = "mb-1 block text-xs font-medium text-slate-600";
const textareaCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)] placeholder:text-slate-400 resize-none";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
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
  "Delhi",
  "Jammu & Kashmir",
  "Ladakh",
  "Puducherry",
];

// ── InvoiceBuilder ─────────────────────────────────────────────────

export function InvoiceBuilder({
  mode,
  invoice,
  onSave,
  onCancel,
}: {
  mode: "create" | "edit";
  invoice?: Invoice;
  onSave: (invoice: Invoice) => void;
  onCancel: () => void;
}) {
  // ── Live data from DB ────────────────────────────────────────────
  const { business } = useBusiness();
  const businessId = business?.id ?? null;

  const { data: dbRawProducts = [] } = useProducts(businessId);
  const products: Product[] = dbRawProducts.map(dbToProduct);

  const { data: dbRawCustomers = [] } = useCustomers(businessId);
  const localCustomers = dbRawCustomers.map((c: DbCustomer) => ({
    id: c.id,
    name: c.name,
    gstin: c.gst_number ?? "",
    contactPerson: c.contact_person ?? c.name,
    phone: c.phone,
    email: c.email ?? "",
    address: c.address ?? "",
    shippingAddress: c.shipping_address ?? "",
    city: c.city ?? "",
    state: c.state ?? "Karnataka",
  }));

  // ── Customer section ─────────────────────────────────────────────
  const [customerMode, setCustomerMode] = useState<"existing" | "new">(
    invoice ? "existing" : "existing",
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    invoice?.customerId ?? "",
  );
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [newCustomer, setNewCustomer] = useState<NewCustomerForm>({
    name: "",
    contactPerson: "",
    gstin: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "Karnataka",
  });

  // ── Invoice details ──────────────────────────────────────────────
  const [invoiceNumber] = useState(
    mode === "edit" && invoice ? invoice.invoiceNumber : nextInvoiceNumber(),
  );
  const [invoicePrefix, setInvoicePrefix] = useState("INV");
  const [createdDate, setCreatedDate] = useState(invoice?.createdDate ?? TODAY);
  const [dueDate, setDueDate] = useState(invoice?.dueDate ?? "2026-07-23");
  const [placeOfSupply, setPlaceOfSupply] = useState(invoice?.placeOfSupply ?? "Karnataka");
  const [isInterState, setIsInterState] = useState(invoice?.isInterState ?? false);

  // ── Enterprise invoice detail fields ────────────────────────────
  const [paymentTerms, setPaymentTerms] = useState("Net 10 days");
  const [selectedCurrency, setSelectedCurrency] = useState(invoice?.currency ?? "INR");
  const [exchangeRate, setExchangeRate] = useState(invoice?.exchangeRate ?? 1);
  const [salesperson, setSalesperson] = useState(invoice?.salesperson ?? "");
  const [referenceNumber, setReferenceNumber] = useState(invoice?.referenceNumber ?? "");
  const [poNumber, setPoNumber] = useState(invoice?.poNumber ?? "");
  const [deliveryDate, setDeliveryDate] = useState(invoice?.deliveryDate ?? "");

  // ── Line items ───────────────────────────────────────────────────
  const [lineItems, setLineItems] = useState<BuilderLineItem[]>(() => {
    if (invoice && invoice.items.length > 0) {
      return invoice.items.map((item) => ({
        id: "li-" + Math.random(),
        productId: item.productId,
        productName: "", // filled by effect once products load
        barcode: "",
        hsnCode: "",
        quantity: item.quantity,
        unitId: "",
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
        gstPercent: item.gstPercent,
      }));
    }
    return [emptyLine()];
  });

  // Fill product display fields once real products arrive (edit mode)
  const [lineItemsFilled, setLineItemsFilled] = useState(!invoice?.items.length);
  useEffect(() => {
    if (!lineItemsFilled && products.length > 0) {
      setLineItems((prev) =>
        prev.map((li) => {
          const p = products.find((pr) => pr.id === li.productId);
          if (!p) return li;
          return {
            ...li,
            productName: p.name,
            barcode: p.barcode,
            hsnCode: p.hsnCode,
            unitId: p.unitId,
          };
        })
      );
      setLineItemsFilled(true);
    }
  }, [products, lineItemsFilled]);
  const [productSearches, setProductSearches] = useState<Record<string, string>>({});
  const [productDropdownOpen, setProductDropdownOpen] = useState<string | null>(null);

  // ── Payment ──────────────────────────────────────────────────────
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(invoice?.paymentMode ?? "upi");
  const [status, setStatus] = useState<InvoiceStatus>(invoice?.status ?? "draft");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    invoice?.paymentStatus ?? "pending",
  );
  const [amountPaid, setAmountPaid] = useState(invoice?.amountPaid ?? 0);

  // ── Notes / Terms ────────────────────────────────────────────────
  const [notes, setNotes] = useState(invoice?.notes ?? "");
  const [terms, setTerms] = useState(
    invoice?.terms ??
      "Payment is due within 10 days from the invoice date. Late payments are subject to a 1.5% monthly interest charge. Goods once sold will not be taken back without prior approval. All disputes are subject to Bengaluru jurisdiction.",
  );
  const [internalNotes, setInternalNotes] = useState(invoice?.internalNotes ?? "");

  // ── Preview / UI state ───────────────────────────────────────────
  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState<"a4" | "email" | "whatsapp">("a4");
  const [barcodeToast, setBarcodeToast] = useState(false);

  // ── Derived ──────────────────────────────────────────────────────
  const selectedCustomer =
    customerMode === "existing" ? localCustomers.find((c) => c.id === selectedCustomerId) : undefined;

  // ── Address state (derived from selectedCustomer, editable) ──────
  const [billingAddress, setBillingAddress] = useState(
    invoice?.billingAddress ?? selectedCustomer?.address ?? "",
  );
  const [shippingAddress, setShippingAddress] = useState(
    selectedCustomer?.shippingAddress ?? "",
  );
  const [deliveryAddress, setDeliveryAddress] = useState(
    invoice?.deliveryAddress ?? selectedCustomer?.shippingAddress ?? "",
  );
  const [sameAsShipping, setSameAsShipping] = useState(true);

  // Keep addresses in sync when customer changes
  useEffect(() => {
    if (selectedCustomer) {
      setBillingAddress(selectedCustomer.address);
      setShippingAddress(selectedCustomer.shippingAddress);
      if (sameAsShipping) {
        setDeliveryAddress(selectedCustomer.shippingAddress);
      }
    }
  }, [selectedCustomerId]);

  // Sync delivery address when sameAsShipping toggled
  useEffect(() => {
    if (sameAsShipping) {
      setDeliveryAddress(shippingAddress);
    }
  }, [sameAsShipping, shippingAddress]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase();
    return localCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.gstin.toLowerCase().includes(q) ||
        c.contactPerson.toLowerCase().includes(q),
    );
  }, [customerSearch, localCustomers]);

  const invoiceItems = lineItems.map(lineToInvoiceItem);
  const totals = computeDocumentTotals(invoiceItems, isInterState);
  const balance = totals.grandTotal - amountPaid;

  // ── Line item helpers ────────────────────────────────────────────
  function updateLine<K extends keyof BuilderLineItem>(
    id: string,
    key: K,
    value: BuilderLineItem[K],
  ) {
    setLineItems((prev) => prev.map((li) => (li.id === id ? { ...li, [key]: value } : li)));
  }

  function selectProductForLine(lineId: string, p: Product) {
    setLineItems((prev) =>
      prev.map((li) =>
        li.id === lineId
          ? {
              ...li,
              productId: p.id,
              productName: p.name,
              barcode: p.barcode,
              hsnCode: p.hsnCode,
              unitId: p.unitId,
              unitPrice: p.sellingPrice,
              gstPercent: p.taxPercent,
            }
          : li,
      ),
    );
    setProductSearches((prev) => ({ ...prev, [lineId]: p.name }));
    setProductDropdownOpen(null);
  }

  function addLine() {
    setLineItems((prev) => [...prev, emptyLine()]);
  }

  function removeLine(id: string) {
    if (lineItems.length === 1) return;
    setLineItems((prev) => prev.filter((li) => li.id !== id));
  }

  function duplicateLine(id: string) {
    const idx = lineItems.findIndex((li) => li.id === id);
    if (idx === -1) return;
    const copy = { ...lineItems[idx], id: "li-" + Date.now() + Math.random() };
    setLineItems((prev) => [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)]);
  }

  function handleScanBarcode() {
    setBarcodeToast(true);
    setTimeout(() => setBarcodeToast(false), 2500);
  }

  // ── Payment Terms auto-due-date ──────────────────────────────────
  function handlePaymentTermsChange(label: string) {
    setPaymentTerms(label);
    const preset = paymentTermsPresets.find((p) => p.label === label);
    if (preset && preset.days >= 0) {
      setDueDate(addDays(createdDate, preset.days));
    }
  }

  // ── Build Invoice ────────────────────────────────────────────────
  function buildInvoice(): Invoice {
    const id = mode === "edit" && invoice ? invoice.id : "inv-" + Date.now();
    const custId = customerMode === "existing" ? selectedCustomerId : "new-" + Date.now();
    return {
      id,
      invoiceNumber,
      customerId: custId,
      status,
      paymentStatus,
      paymentMode,
      items: invoiceItems,
      createdDate,
      dueDate,
      amountPaid,
      notes,
      internalNotes,
      terms,
      placeOfSupply,
      isInterState,
      salesperson,
      referenceNumber,
      poNumber,
      deliveryDate,
      deliveryAddress,
      billingAddress,
      currency: selectedCurrency,
      exchangeRate,
    };
  }

  function handleSaveDraft() {
    onSave({ ...buildInvoice(), status: "draft" });
  }

  function handleSaveAndNew() {
    onSave({ ...buildInvoice(), status: "draft" });
    // Reset to blank form by cancelling (parent should open a fresh create flow)
    onCancel();
  }

  function handleSaveAndContinue() {
    onSave(buildInvoice());
    // stays open — no navigation
  }

  function handleSaveAndSend() {
    onSave({ ...buildInvoice(), status: "sent" });
  }

  function handleSaveInvoice() {
    onSave(buildInvoice());
  }

  function handleGeneratePDF() {
    alert(
      "PDF generation would be triggered here. In production, this would render the invoice to a PDF file using a server-side or client-side PDF library.",
    );
  }

  function handlePrint() {
    window.print();
  }

  // ── Preview render ────────────────────────────────────────────────
  if (showPreview) {
    const custName =
      customerMode === "existing" ? (selectedCustomer?.name ?? "—") : newCustomer.name || "—";
    const custGstin =
      customerMode === "existing" ? (selectedCustomer?.gstin ?? "—") : newCustomer.gstin || "—";
    const custAddress =
      customerMode === "existing" ? (selectedCustomer?.address ?? "—") : newCustomer.address || "—";

    // ── A4 Invoice block (reused across modes) ────────────────────
    const A4Block = (
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-sm print:shadow-none">
        {/* Header band */}
        <div className="rounded-t-2xl bg-[image:var(--gradient-brand)] px-8 py-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{company.name}</h1>
              <p className="mt-1 text-sm opacity-80">{company.address}</p>
              <p className="text-sm opacity-80">
                {company.phone} · {company.email}
              </p>
              <p className="mt-1 text-xs font-semibold opacity-70">GSTIN: {company.gstin}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black tracking-tight">INVOICE</p>
              <p className="mt-1 font-mono text-sm opacity-90">{invoiceNumber}</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Bill To + Dates */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                Bill To
              </p>
              <p className="font-bold text-slate-800">{custName}</p>
              {custGstin !== "—" && <p className="text-xs text-slate-500">GSTIN: {custGstin}</p>}
              <p className="text-sm text-slate-600 mt-1">{custAddress}</p>
            </div>
            <div className="text-right">
              <div className="space-y-1">
                <div>
                  <span className="text-xs text-slate-400">Invoice Date: </span>
                  <span className="text-sm font-semibold text-slate-700">
                    {fmtDate(createdDate)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Due Date: </span>
                  <span className="text-sm font-semibold text-slate-700">{fmtDate(dueDate)}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Place of Supply: </span>
                  <span className="text-sm font-semibold text-slate-700">{placeOfSupply}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Supply Type: </span>
                  <span className="text-sm font-semibold text-slate-700">
                    {isInterState ? "Inter-State" : "Intra-State"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Items table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {["#", "Item & HSN", "Qty", "Unit Price", "Disc%", "GST%", "Total"].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lineItems.map((li, i) => {
                  const computed = computeLineItem(lineToInvoiceItem(li));
                  return (
                    <tr key={li.id} className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-400 text-xs">{i + 1}</td>
                      <td className="px-3 py-2">
                        <p className="font-medium text-slate-800">{li.productName}</p>
                        <p className="text-[11px] text-slate-400">HSN: {li.hsnCode}</p>
                      </td>
                      <td className="px-3 py-2 text-slate-700">{li.quantity}</td>
                      <td className="px-3 py-2 text-slate-700">{fmtINR(li.unitPrice)}</td>
                      <td className="px-3 py-2 text-slate-700">{li.discountPercent}%</td>
                      <td className="px-3 py-2 text-slate-700">{li.gstPercent}%</td>
                      <td className="px-3 py-2 font-semibold text-slate-800">
                        {fmtINR(computed.total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-72 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium text-slate-700">{fmtINR(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Discount</span>
                <span className="font-medium text-red-600">-{fmtINR(totals.totalDiscount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Taxable Value</span>
                <span className="font-medium text-slate-700">{fmtINR(totals.taxableValue)}</span>
              </div>
              {isInterState ? (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">IGST</span>
                  <span className="font-medium text-slate-700">{fmtINR(totals.igst)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">CGST</span>
                    <span className="font-medium text-slate-700">{fmtINR(totals.cgst)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">SGST</span>
                    <span className="font-medium text-slate-700">{fmtINR(totals.sgst)}</span>
                  </div>
                </>
              )}
              {totals.roundOff !== 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Round Off</span>
                  <span className="font-medium text-slate-700">
                    {totals.roundOff > 0 ? "+" : ""}
                    {fmtINR(totals.roundOff)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
                <span className="text-slate-800">Grand Total</span>
                <span className="text-foreground">{fmtINR(totals.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Amount Paid</span>
                <span className="font-medium text-emerald-600">{fmtINR(amountPaid)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-slate-700">Balance Due</span>
                <span className={balance > 0 ? "text-red-600" : "text-emerald-600"}>
                  {fmtINR(balance)}
                </span>
              </div>
            </div>
          </div>

          {/* Bank details */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
              Bank Details
            </p>
            <p className="text-slate-700">
              {company.bankName} · A/C: {company.accountNumber} · IFSC: {company.ifsc}
            </p>
          </div>

          {/* Notes + Terms */}
          {notes && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                Notes
              </p>
              <p className="text-sm text-slate-600">{notes}</p>
            </div>
          )}
          {terms && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                Terms & Conditions
              </p>
              <p className="text-xs text-slate-500">{terms}</p>
            </div>
          )}
        </div>
      </div>
    );

    return (
      <div className="flex flex-col gap-4">
        {/* Preview toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowPreview(false)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-slate-50"
          >
            <EyeOff className="h-4 w-4" /> Hide Preview
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-slate-50"
          >
            <Printer className="h-4 w-4" /> Print
          </button>
          <button
            onClick={handleGeneratePDF}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-slate-50"
          >
            <Download className="h-4 w-4" /> Generate PDF
          </button>
          {/* Preview mode buttons */}
          <div className="ml-auto flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              onClick={() => setPreviewMode("a4")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                previewMode === "a4"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-slate-500 hover:text-foreground"
              }`}
            >
              <FileText className="h-3.5 w-3.5" /> A4
            </button>
            <button
              onClick={() => setPreviewMode("email")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                previewMode === "email"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-slate-500 hover:text-foreground"
              }`}
            >
              <Mail className="h-3.5 w-3.5" /> Email
            </button>
            <button
              onClick={() => setPreviewMode("whatsapp")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                previewMode === "whatsapp"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-slate-500 hover:text-foreground"
              }`}
            >
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </button>
          </div>
        </div>

        {/* Email Preview mode */}
        {previewMode === "email" && (
          <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-slate-100 shadow-sm overflow-hidden">
            {/* Mock email client chrome */}
            <div className="bg-slate-700 px-4 py-2 flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
                <span className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <span className="ml-2 text-xs text-slate-300 font-medium">Email Preview</span>
            </div>
            {/* Email header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <span className="w-16 text-slate-400 font-medium text-right">From:</span>
                <span className="text-slate-700">billing@nexora.app ({company.name})</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="w-16 text-slate-400 font-medium text-right">To:</span>
                <span className="text-slate-700">
                  {customerMode === "existing"
                    ? (selectedCustomer?.email ?? "customer@example.com")
                    : newCustomer.email || "customer@example.com"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="w-16 text-slate-400 font-medium text-right">Subject:</span>
                <span className="font-semibold text-slate-800">
                  Invoice {invoiceNumber} from {company.name} — {fmtINR(totals.grandTotal)}
                </span>
              </div>
            </div>
            {/* Email body */}
            <div className="bg-slate-50 px-6 py-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4 text-sm text-slate-700 space-y-3">
                <p>
                  Dear{" "}
                  {customerMode === "existing"
                    ? (selectedCustomer?.contactPerson ?? "Valued Customer")
                    : newCustomer.contactPerson || "Valued Customer"}
                  ,
                </p>
                <p>
                  Please find attached your invoice <strong>{invoiceNumber}</strong> for the amount
                  of <strong>{fmtINR(totals.grandTotal)}</strong>.
                </p>
                <p>
                  Due Date: <strong>{fmtDate(dueDate)}</strong>
                </p>
                {notes && <p className="text-slate-500 text-xs italic">{notes}</p>}
                <p>
                  Thank you for your business.
                  <br />
                  <span className="text-slate-400">{company.name}</span>
                </p>
              </div>
              {/* Embedded A4 inside email */}
              <div className="opacity-90 scale-95 origin-top">{A4Block}</div>
            </div>
          </div>
        )}

        {/* WhatsApp Preview mode */}
        {previewMode === "whatsapp" && (
          <div className="mx-auto w-full max-w-sm">
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
              {/* WhatsApp chrome header */}
              <div className="bg-[#075e54] px-4 py-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">
                    {customerMode === "existing"
                      ? (selectedCustomer?.name ?? "Customer")
                      : newCustomer.name || "Customer"}
                  </p>
                  <p className="text-white/70 text-xs">
                    {customerMode === "existing"
                      ? (selectedCustomer?.phone ?? "")
                      : newCustomer.phone || ""}
                  </p>
                </div>
              </div>
              {/* Chat body */}
              <div className="bg-[#ece5dd] px-4 py-4 min-h-[280px] space-y-3">
                {/* Outgoing bubble */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] bg-[#dcf8c6] rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
                    <p className="text-[13px] text-slate-800 font-semibold mb-1">
                      📄 Invoice {invoiceNumber}
                    </p>
                    <p className="text-xs text-slate-600">
                      From: {company.name}
                      {"\n"}
                    </p>
                    <div className="mt-2 space-y-0.5 text-xs text-slate-700">
                      <p>
                        💰 Amount: <strong>{fmtINR(totals.grandTotal)}</strong>
                      </p>
                      <p>📅 Due: {fmtDate(dueDate)}</p>
                      <p>
                        🏷️ Items: {lineItems.length} item{lineItems.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="mt-3 rounded-xl bg-white/60 px-3 py-2 text-xs text-blue-700 font-medium flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      View &amp; Pay Invoice →
                    </div>
                    {notes && (
                      <p className="mt-2 text-[11px] text-slate-500 italic">{notes}</p>
                    )}
                    <p className="mt-1 text-right text-[10px] text-slate-400">
                      {fmtDate(createdDate)} · ✓✓
                    </p>
                  </div>
                </div>
                {/* Incoming reply placeholder */}
                <div className="flex justify-start">
                  <div className="max-w-[70%] bg-white rounded-2xl rounded-tl-sm px-4 py-2 shadow-sm">
                    <p className="text-xs text-slate-500">Thanks, will check!</p>
                    <p className="mt-0.5 text-right text-[10px] text-slate-400">✓</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* A4 preview */}
        {previewMode === "a4" && A4Block}
      </div>
    );
  }

  // ── Main builder form ─────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Barcode toast */}
      {barcodeToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg text-sm text-slate-700">
          <Scan className="h-4 w-4 text-slate-400" />
          Barcode scanning requires a physical scanner device. Connect a USB barcode scanner to use
          this feature.
        </div>
      )}

      {/* Left: Main form */}
      <div className="flex-1 min-w-0 space-y-5">
        {/* ── Customer Information ── */}
        <SectionCard title="Customer Information">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setCustomerMode("existing")}
              className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                customerMode === "existing"
                  ? "border-[color:var(--brand-electric)] bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <User className="h-3.5 w-3.5 inline mr-1.5" />
              Existing Customer
            </button>
            <button
              onClick={() => setCustomerMode("new")}
              className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                customerMode === "new"
                  ? "border-[color:var(--brand-electric)] bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Plus className="h-3.5 w-3.5 inline mr-1.5" />
              New Customer
            </button>
          </div>

          {customerMode === "existing" ? (
            <div className="space-y-3">
              {/* Customer search */}
              <div className="relative">
                <label className={labelCls}>Select Customer</label>
                <div className="relative">
                  <input
                    value={showCustomerDropdown ? customerSearch : (selectedCustomer?.name ?? "")}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 150)}
                    placeholder="Search customer name or GSTIN..."
                    className={inputCls}
                  />
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
                {showCustomerDropdown && filteredCustomers.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg max-h-52 overflow-y-auto">
                    {filteredCustomers.map((c) => (
                      <button
                        key={c.id}
                        className="w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                        onMouseDown={() => {
                          setSelectedCustomerId(c.id);
                          setCustomerSearch("");
                          setShowCustomerDropdown(false);
                        }}
                      >
                        <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                        <p className="text-xs text-slate-400">
                          {c.gstin} · {c.city}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected customer details */}
              {selectedCustomer && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Contact Person
                    </p>
                    <p className="text-sm text-slate-700">{selectedCustomer.contactPerson}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      GSTIN
                    </p>
                    <p className="text-sm font-mono text-slate-700">{selectedCustomer.gstin}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Phone
                    </p>
                    <p className="text-sm text-slate-700">{selectedCustomer.phone}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Email
                    </p>
                    <p className="text-sm text-slate-700">{selectedCustomer.email}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Billing Address
                    </p>
                    <p className="text-sm text-slate-700">{selectedCustomer.address}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Business Name *</label>
                <input
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Sharma Enterprises"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Contact Person</label>
                <input
                  value={newCustomer.contactPerson}
                  onChange={(e) => setNewCustomer((p) => ({ ...p, contactPerson: e.target.value }))}
                  placeholder="e.g. Rahul Sharma"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>GSTIN</label>
                <input
                  value={newCustomer.gstin}
                  onChange={(e) => setNewCustomer((p) => ({ ...p, gstin: e.target.value }))}
                  placeholder="e.g. 29AABCU9603R1ZM"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+91 98XXXXXXXX"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer((p) => ({ ...p, email: e.target.value }))}
                  placeholder="contact@business.in"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>City</label>
                <input
                  value={newCustomer.city}
                  onChange={(e) => setNewCustomer((p) => ({ ...p, city: e.target.value }))}
                  placeholder="e.g. Bengaluru"
                  className={inputCls}
                />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Address</label>
                <input
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer((p) => ({ ...p, address: e.target.value }))}
                  placeholder="Full billing address"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>State</label>
                <select
                  value={newCustomer.state}
                  onChange={(e) => setNewCustomer((p) => ({ ...p, state: e.target.value }))}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none transition-colors focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </SectionCard>

        {/* ── Business Information ── */}
        <SectionCard title="Business Information (Issuer)">
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="col-span-2 flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-slate-400" />
              <p className="font-semibold text-slate-800">{company.name}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                GSTIN
              </p>
              <p className="text-sm font-mono text-slate-700">{company.gstin}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                State
              </p>
              <p className="text-sm text-slate-700">{company.state}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Address
              </p>
              <p className="text-sm text-slate-700">{company.address}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Phone
              </p>
              <p className="text-sm text-slate-700">{company.phone}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Email
              </p>
              <p className="text-sm text-slate-700">{company.email}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Bank
              </p>
              <p className="text-sm text-slate-700">{company.bankName}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                IFSC
              </p>
              <p className="text-sm font-mono text-slate-700">{company.ifsc}</p>
            </div>
          </div>
        </SectionCard>

        {/* ── Invoice Details ── */}
        <SectionCard title="Invoice Details">
          <div className="grid grid-cols-2 gap-3">
            {/* Existing fields */}
            <div>
              <label className={labelCls}>Invoice Number</label>
              <input
                value={invoiceNumber}
                readOnly
                className={`${inputCls} bg-slate-50 cursor-not-allowed`}
              />
            </div>
            <div>
              <label className={labelCls}>Invoice Date</label>
              <input
                type="date"
                value={createdDate}
                onChange={(e) => setCreatedDate(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Place of Supply</label>
              <select
                value={placeOfSupply}
                onChange={(e) => setPlaceOfSupply(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none transition-colors focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Invoice Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none transition-colors focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex items-center gap-3 pt-5">
              <label className="relative inline-flex cursor-pointer items-center gap-2">
                <div
                  onClick={() => setIsInterState((v) => !v)}
                  className={`relative h-5 w-9 rounded-full transition-colors ${
                    isInterState ? "bg-blue-600" : "bg-slate-200"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      isInterState ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </div>
                <span className="text-sm text-slate-600">
                  {isInterState ? "Inter-State (IGST)" : "Intra-State (CGST+SGST)"}
                </span>
              </label>
            </div>

            {/* ── NEW enterprise fields ── */}
            {/* Invoice Prefix */}
            <div>
              <label className={labelCls}>Invoice Prefix</label>
              <input
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                placeholder="e.g. INV"
                className={inputCls}
              />
              <p className="mt-1 text-[10px] text-slate-400">
                Preview: {invoicePrefix}-2026-XXXX
              </p>
            </div>

            {/* Payment Terms */}
            <div>
              <label className={labelCls}>Payment Terms</label>
              <select
                value={paymentTerms}
                onChange={(e) => handlePaymentTermsChange(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none transition-colors focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
              >
                {paymentTermsPresets.map((p) => (
                  <option key={p.label} value={p.label}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Currency */}
            <div>
              <label className={labelCls}>Currency</label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none transition-colors focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Exchange Rate — shown only when non-INR */}
            {selectedCurrency !== "INR" && (
              <div>
                <label className={labelCls}>
                  Exchange Rate (1 {selectedCurrency} = ? INR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(Number(e.target.value) || 1)}
                  placeholder="e.g. 83.50"
                  className={inputCls}
                />
              </div>
            )}

            {/* Salesperson */}
            <div>
              <label className={labelCls}>Salesperson</label>
              <select
                value={salesperson}
                onChange={(e) => setSalesperson(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none transition-colors focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
              >
                <option value="">— None —</option>
                {salespersons.map((sp) => (
                  <option key={sp.id} value={sp.name}>
                    {sp.name} ({sp.region})
                  </option>
                ))}
              </select>
            </div>

            {/* Reference Number */}
            <div>
              <label className={labelCls}>Reference Number</label>
              <input
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. REF-001"
                className={inputCls}
              />
            </div>

            {/* PO Number */}
            <div>
              <label className={labelCls}>PO Number</label>
              <input
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="e.g. PO-2026-001"
                className={inputCls}
              />
            </div>

            {/* Delivery Date */}
            <div>
              <label className={labelCls}>Delivery Date</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </SectionCard>

        {/* ── Addresses ── */}
        <SectionCard title="Addresses">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Billing Address */}
            <div>
              <label className={labelCls}>Billing Address</label>
              <textarea
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                rows={2}
                placeholder="Billing address"
                className={textareaCls}
              />
            </div>

            {/* Shipping Address */}
            <div>
              <label className={labelCls}>Shipping Address</label>
              <textarea
                value={shippingAddress}
                onChange={(e) => {
                  setShippingAddress(e.target.value);
                  if (sameAsShipping) setDeliveryAddress(e.target.value);
                }}
                rows={2}
                placeholder="Shipping address"
                className={textareaCls}
              />
            </div>

            {/* Delivery Address */}
            <div className="sm:col-span-2">
              <div className="mb-1 flex items-center justify-between">
                <label className={`${labelCls} mb-0`}>Delivery Address</label>
                <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-500">
                  <input
                    type="checkbox"
                    checked={sameAsShipping}
                    onChange={(e) => setSameAsShipping(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-[color:var(--brand-electric)]"
                  />
                  Same as Shipping
                </label>
              </div>
              <textarea
                value={deliveryAddress}
                onChange={(e) => {
                  setDeliveryAddress(e.target.value);
                  if (sameAsShipping) setSameAsShipping(false);
                }}
                rows={2}
                placeholder="Delivery address"
                className={textareaCls}
                disabled={sameAsShipping}
              />
            </div>
          </div>
        </SectionCard>

        {/* ── Invoice Items ── */}
        <SectionCard
          title="Invoice Items"
          action={
            <div className="flex items-center gap-2">
              <button
                onClick={handleScanBarcode}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Scan className="h-3.5 w-3.5" /> Scan Barcode
              </button>
              <button
                onClick={addLine}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[image:var(--gradient-brand)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:shadow-md transition-all"
              >
                <Plus className="h-3.5 w-3.5" /> Add Item
              </button>
            </div>
          }
          noPadding
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {[
                    "Product",
                    "Barcode",
                    "HSN/SAC",
                    "Qty",
                    "Unit",
                    "Price (₹)",
                    "Disc%",
                    "GST%",
                    "Total",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lineItems.map((li) => {
                  const computed = computeLineItem(lineToInvoiceItem(li));
                  const unit = units.find((u) => u.id === li.unitId);
                  const filteredProducts = products.filter((p) => {
                    const q = (productSearches[li.id] ?? "").toLowerCase();
                    return (
                      !q ||
                      p.name.toLowerCase().includes(q) ||
                      p.sku.toLowerCase().includes(q) ||
                      p.barcode.includes(q)
                    );
                  });

                  return (
                    <tr
                      key={li.id}
                      className="border-b border-slate-100 hover:bg-slate-50/40 transition-colors"
                    >
                      {/* Product search */}
                      <td className="px-2 py-1.5 min-w-[180px]">
                        <div className="relative">
                          <input
                            value={
                              productDropdownOpen === li.id
                                ? (productSearches[li.id] ?? "")
                                : li.productName
                            }
                            onChange={(e) => {
                              setProductSearches((prev) => ({ ...prev, [li.id]: e.target.value }));
                              setProductDropdownOpen(li.id);
                            }}
                            onFocus={() => {
                              setProductSearches((prev) => ({ ...prev, [li.id]: "" }));
                              setProductDropdownOpen(li.id);
                            }}
                            onBlur={() => setTimeout(() => setProductDropdownOpen(null), 150)}
                            className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-[color:var(--brand-electric)]"
                          />
                          {productDropdownOpen === li.id && (
                            <div className="absolute z-20 top-9 left-0 w-64 rounded-xl border border-slate-200 bg-white shadow-lg max-h-48 overflow-y-auto">
                              {filteredProducts.length === 0 ? (
                                <p className="px-3 py-2 text-xs text-slate-400">
                                  {products.length === 0 ? "Loading products…" : "No products match"}
                                </p>
                              ) : filteredProducts.map((p) => (
                                <button
                                  key={p.id}
                                  className="w-full px-3 py-2 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                                  onMouseDown={() => selectProductForLine(li.id, p)}
                                >
                                  <p className="text-xs font-semibold text-slate-800">{p.name}</p>
                                  <p className="text-[10px] text-slate-400">
                                    {p.sku} · ₹{p.sellingPrice.toLocaleString("en-IN")} · {p.currentStock} in stock
                                  </p>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Barcode (read-only) */}
                      <td className="px-2 py-1.5">
                        <span className="block rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5 font-mono text-[10px] text-slate-500 min-w-[100px]">
                          {li.barcode || "—"}
                        </span>
                      </td>

                      {/* HSN */}
                      <td className="px-2 py-1.5">
                        <input
                          value={li.hsnCode}
                          onChange={(e) => updateLine(li.id, "hsnCode", e.target.value)}
                          className="h-8 w-20 rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-[color:var(--brand-electric)]"
                        />
                      </td>

                      {/* Quantity */}
                      <td className="px-2 py-1.5">
                        {(() => {
                          const lp = products.find((p) => p.id === li.productId);
                          const stockWarn = lp && li.quantity > lp.currentStock;
                          return (
                            <div>
                              <input
                                type="number"
                                min="1"
                                value={li.quantity}
                                onChange={(e) =>
                                  updateLine(li.id, "quantity", Number(e.target.value) || 1)
                                }
                                className={`h-8 w-16 rounded-lg border px-2 text-xs outline-none focus:border-[color:var(--brand-electric)] ${
                                  stockWarn
                                    ? "border-red-400 bg-red-50"
                                    : "border-slate-200 bg-white"
                                }`}
                              />
                              {lp && (
                                <p
                                  className={`mt-0.5 text-[10px] leading-tight ${
                                    stockWarn ? "font-semibold text-red-600" : "text-slate-400"
                                  }`}
                                >
                                  {stockWarn
                                    ? `⚠ Only ${lp.currentStock} left`
                                    : `${lp.currentStock} in stock`}
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Unit */}
                      <td className="px-2 py-1.5">
                        <select
                          value={li.unitId}
                          onChange={(e) => updateLine(li.id, "unitId", e.target.value)}
                          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-[color:var(--brand-electric)]"
                        >
                          {units.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.shortCode}
                            </option>
                          ))}
                        </select>
                        {unit && (
                          <span className="ml-1 text-[10px] text-slate-400">{unit.name}</span>
                        )}
                      </td>

                      {/* Price */}
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          min="0"
                          value={li.unitPrice}
                          onChange={(e) =>
                            updateLine(li.id, "unitPrice", Number(e.target.value) || 0)
                          }
                          className="h-8 w-24 rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-[color:var(--brand-electric)]"
                        />
                      </td>

                      {/* Discount */}
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={li.discountPercent}
                          onChange={(e) =>
                            updateLine(li.id, "discountPercent", Number(e.target.value) || 0)
                          }
                          className="h-8 w-16 rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-[color:var(--brand-electric)]"
                        />
                      </td>

                      {/* GST */}
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={li.gstPercent}
                          onChange={(e) =>
                            updateLine(li.id, "gstPercent", Number(e.target.value) || 0)
                          }
                          className="h-8 w-16 rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-[color:var(--brand-electric)]"
                        />
                      </td>

                      {/* Line total */}
                      <td className="px-2 py-1.5 font-semibold text-slate-800 text-right whitespace-nowrap">
                        {fmtINR(computed.total)}
                      </td>

                      {/* Actions */}
                      <td className="px-2 py-1.5">
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => duplicateLine(li.id)}
                            title="Duplicate"
                            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => removeLine(li.id)}
                            title="Remove"
                            disabled={lineItems.length === 1}
                            className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2">
            <button
              onClick={addLine}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add another line item
            </button>
          </div>
        </SectionCard>

        {/* ── GST Summary ── */}
        <SectionCard title="GST Summary">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Subtotal
              </p>
              <p className="mt-1 text-sm font-bold text-slate-800">{fmtINR(totals.subtotal)}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Discount
              </p>
              <p className="mt-1 text-sm font-bold text-red-600">-{fmtINR(totals.totalDiscount)}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Taxable Value
              </p>
              <p className="mt-1 text-sm font-bold text-slate-800">{fmtINR(totals.taxableValue)}</p>
            </div>
            {isInterState ? (
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                  IGST
                </p>
                <p className="mt-1 text-sm font-bold text-blue-700">{fmtINR(totals.igst)}</p>
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                    CGST
                  </p>
                  <p className="mt-1 text-sm font-bold text-blue-700">{fmtINR(totals.cgst)}</p>
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                    SGST
                  </p>
                  <p className="mt-1 text-sm font-bold text-blue-700">{fmtINR(totals.sgst)}</p>
                </div>
              </>
            )}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                CESS
              </p>
              <p className="mt-1 text-sm font-bold text-slate-800">{fmtINR(totals.cess)}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Round Off
              </p>
              <p className="mt-1 text-sm font-bold text-slate-800">
                {totals.roundOff > 0 ? "+" : ""}
                {fmtINR(totals.roundOff)}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500">
                Grand Total
              </p>
              <p className="mt-1 text-base font-black text-emerald-700">
                {fmtINR(totals.grandTotal)}
              </p>
            </div>
          </div>
        </SectionCard>

        {/* ── Payment Information ── */}
        <SectionCard title="Payment Information">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none transition-colors focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
              >
                {(Object.entries(paymentModeLabels) as [PaymentMode, string][]).map(
                  ([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div>
              <label className={labelCls}>Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none transition-colors focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
              >
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
        </SectionCard>

        {/* ── Notes & Terms ── */}
        <SectionCard title="Notes & Terms">
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Notes (visible to customer)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="e.g. Thank you for your business. Please retain this invoice for your records."
                className={textareaCls}
              />
            </div>
            <div>
              <label className={labelCls}>Terms & Conditions</label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={4}
                placeholder="Payment terms, return policy, etc."
                className={textareaCls}
              />
            </div>
            {/* NEW: Internal Notes */}
            <div>
              <label className={labelCls}>
                Internal Notes{" "}
                <span className="font-normal text-slate-400">(not printed on invoice)</span>
              </label>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={3}
                placeholder="e.g. Customer prefers RTGS, confirm stock before dispatch"
                className={textareaCls}
              />
            </div>
          </div>
        </SectionCard>

        {/* ── Attachments & Signature ── */}
        <SectionCard title="Attachments & Signature">
          <div className="space-y-4">
            {/* Attachments upload zone */}
            <div>
              <label className={labelCls}>Attachments</label>
              <button
                type="button"
                onClick={() =>
                  alert(
                    "File upload requires backend integration. UI placeholder only.",
                  )
                }
                className="w-full rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center transition-colors hover:border-slate-300 hover:bg-slate-100"
              >
                <Paperclip className="mx-auto mb-2 h-6 w-6 text-slate-400" />
                <p className="text-sm font-medium text-slate-600">
                  Drag &amp; drop files or click to attach
                </p>
                <p className="mt-0.5 text-xs text-slate-400">PDF, JPG, PNG — max 5MB</p>
              </button>
            </div>

            {/* Signature zone */}
            <div>
              <label className={labelCls}>Signature</label>
              <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
                <PenLine className="mx-auto mb-2 h-6 w-6 text-slate-400" />
                <p className="text-sm font-medium text-slate-600">Click to upload signature image</p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      alert(
                        "Signature capture requires backend integration. UI placeholder only.",
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
                  >
                    <PenLine className="h-3.5 w-3.5" /> Draw Signature
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      alert(
                        "Signature capture requires backend integration. UI placeholder only.",
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
                  >
                    <Paperclip className="h-3.5 w-3.5" /> Upload Image
                  </button>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── AI Assistant ── */}
        <SectionCard title="AI Assistant">
          <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100">
                <Sparkles className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-violet-800">Nexora AI</p>
                <p className="text-[11px] text-violet-500">Powered by Nexora AI (coming soon)</p>
              </div>
              <span className="ml-auto rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-600">
                Beta
              </span>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                { icon: FileText, label: "Generate Invoice Description" },
                { icon: Percent, label: "Suggest Discount" },
                { icon: Clock, label: "Predict Payment Delay" },
                { icon: Shield, label: "Smart GST Check" },
                { icon: Package, label: "Suggest Related Products" },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  type="button"
                  disabled
                  className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 text-left text-sm font-medium text-violet-700 opacity-60 cursor-not-allowed"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-xs">{label}</span>
                  <span className="rounded-full bg-violet-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-violet-600">
                    Soon
                  </span>
                </button>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Right: Sticky summary */}
      <div className="w-full lg:w-80 lg:sticky lg:top-6 space-y-4 shrink-0">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-foreground">Invoice Summary</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{invoiceNumber}</p>
          </div>
          <div className="p-5 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-medium text-slate-700">{fmtINR(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Discount</span>
              <span className="font-medium text-red-500">-{fmtINR(totals.totalDiscount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">{isInterState ? "IGST" : "CGST + SGST"}</span>
              <span className="font-medium text-slate-700">
                {isInterState ? fmtINR(totals.igst) : fmtINR(totals.cgst + totals.sgst)}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold">
              <span className="text-slate-800">Grand Total</span>
              <span className="text-foreground">{fmtINR(totals.grandTotal)}</span>
            </div>

            {/* Amount paid input */}
            <div className="pt-1">
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Amount Paid (₹)
              </label>
              <input
                type="number"
                min="0"
                max={totals.grandTotal}
                value={amountPaid}
                onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition-colors focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
              />
            </div>

            <div
              className={`flex justify-between rounded-xl px-3 py-2 text-sm font-semibold ${balance > 0 ? "bg-red-50" : "bg-emerald-50"}`}
            >
              <span className={balance > 0 ? "text-red-600" : "text-emerald-600"}>Balance Due</span>
              <span className={balance > 0 ? "text-red-700" : "text-emerald-700"}>
                {fmtINR(balance)}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="border-t border-slate-100 px-5 py-4 space-y-2">
            <button
              onClick={() => setShowPreview((v) => !v)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-slate-50"
            >
              <Eye className="h-4 w-4" />
              {showPreview ? "Hide Preview" : "Preview Invoice"}
            </button>
            <button
              onClick={handleGeneratePDF}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-slate-50"
            >
              <Download className="h-4 w-4" /> Generate PDF
            </button>
            <button
              onClick={handlePrint}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-slate-50"
            >
              <Printer className="h-4 w-4" /> Print
            </button>

            {/* Save action set */}
            <button
              onClick={handleSaveDraft}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-slate-50"
            >
              <FileText className="h-4 w-4" /> Save Draft
            </button>
            <button
              onClick={handleSaveAndNew}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" /> Save &amp; New
            </button>
            <button
              onClick={handleSaveAndContinue}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-slate-50"
            >
              <Copy className="h-4 w-4" /> Save &amp; Continue
            </button>
            <button
              onClick={handleSaveAndSend}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-slate-50"
            >
              <Mail className="h-4 w-4" /> Save &amp; Send
            </button>
            <button
              onClick={handleSaveInvoice}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              Save Invoice
            </button>
            <button
              onClick={onCancel}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50"
            >
              <X className="h-4 w-4" /> Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
