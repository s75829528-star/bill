// ── Invoice Detail / Preview View ─────────────────────────────────
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Pencil, FileText, Printer, ChevronDown } from "lucide-react";
import {
  SectionCard,
  PrimaryButton,
  SecondaryButton,
  BillingStatusPill,
} from "@/components/billing/shared";
import {
  getCustomer,
  getInvoiceProduct,
  fmtINR,
  fmtDate,
  computeDocumentTotals,
  computeLineItem,
  company,
  type Invoice,
} from "@/lib/billing-data";
import { units } from "@/lib/inventory-data";

type PreviewMode = "a4" | "pdf" | "thermal";
type ThermalWidth = "58mm" | "80mm";

// ── Helpers ────────────────────────────────────────────────────────

function getUnit(unitId: string) {
  return units.find((u) => u.id === unitId);
}

function numberToWords(n: number): string {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  if (n === 0) return "Zero";
  function helper(num: number): string {
    if (num === 0) return "";
    if (num < 20) return ones[num] + " ";
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "") + " ";
    if (num < 1000) return ones[Math.floor(num / 100)] + " Hundred " + helper(num % 100);
    if (num < 100000) return helper(Math.floor(num / 1000)) + "Thousand " + helper(num % 1000);
    if (num < 10000000) return helper(Math.floor(num / 100000)) + "Lakh " + helper(num % 100000);
    return helper(Math.floor(num / 10000000)) + "Crore " + helper(num % 10000000);
  }
  return helper(Math.round(n)).trim() + " Rupees Only";
}

// ── A4 Invoice Layout ──────────────────────────────────────────────

function A4InvoiceContent({ invoice }: { invoice: Invoice }) {
  const customer = getCustomer(invoice.customerId);
  const totals = computeDocumentTotals(invoice.items, invoice.isInterState);
  const initial = company.name.charAt(0);

  return (
    <div className="mx-auto w-full max-w-[800px] rounded-2xl border border-slate-200 bg-white shadow-sm print:shadow-none print:border-0">
      {/* Letterhead */}
      <div className="flex items-start justify-between border-b border-slate-200 bg-slate-50 px-8 py-6 print:bg-white">
        <div className="flex items-center gap-4">
          {/* Circular logo placeholder */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[image:var(--gradient-brand)] text-xl font-bold text-white shadow-sm">
            {initial}
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">{company.name}</h1>
            <p className="mt-0.5 text-xs text-slate-500 max-w-xs leading-relaxed">
              {company.address}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {company.phone} · {company.email}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-slate-600">GSTIN: {company.gstin}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black tracking-tight text-slate-900">TAX INVOICE</p>
          <p className="mt-1 font-mono text-base font-semibold text-blue-700">
            {invoice.invoiceNumber}
          </p>
          <div className="mt-2 space-y-0.5 text-xs text-slate-500">
            <p>
              Date:{" "}
              <span className="font-semibold text-slate-700">{fmtDate(invoice.createdDate)}</span>
            </p>
            <p>
              Due: <span className="font-semibold text-slate-700">{fmtDate(invoice.dueDate)}</span>
            </p>
            <p>
              Place of Supply:{" "}
              <span className="font-semibold text-slate-700">{invoice.placeOfSupply}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Bill To + QR */}
      <div className="flex items-start justify-between gap-6 px-8 py-5">
        <div className="flex-1">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Bill To
          </p>
          {customer ? (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-900">{customer.name}</p>
              <p className="text-xs text-slate-600">{customer.contactPerson}</p>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">{customer.address}</p>
              <p className="text-xs text-slate-500">
                {customer.phone} · {customer.email}
              </p>
              {customer.gstin && (
                <p className="mt-1 text-xs font-semibold text-slate-600">GSTIN: {customer.gstin}</p>
              )}
              <p className="text-xs text-slate-500">{customer.state}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Customer not found</p>
          )}
        </div>

        {/* QR code placeholder */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="h-24 w-24 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-1.5">
            {/* Decorative grid pattern simulating a QR code */}
            <div className="grid h-full w-full grid-cols-5 grid-rows-5 gap-0.5">
              {Array.from({ length: 25 }).map((_, i) => {
                const corners = [0, 1, 5, 6, 4, 9, 20, 21, 24, 23, 19, 18];
                const isFilled = corners.includes(i) || [12, 7, 17, 11, 13].includes(i);
                return (
                  <div
                    key={i}
                    className={`rounded-[1px] ${isFilled ? "bg-slate-800" : "bg-slate-100"}`}
                  />
                );
              })}
            </div>
          </div>
          <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
            Scan to Pay
          </p>
        </div>
      </div>

      {/* Items Table */}
      <div className="px-8">
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-800 text-white">
                <th className="px-3 py-2.5 text-left font-semibold">#</th>
                <th className="px-3 py-2.5 text-left font-semibold">Description / HSN</th>
                <th className="px-3 py-2.5 text-center font-semibold">Qty</th>
                <th className="px-3 py-2.5 text-right font-semibold">Unit Price</th>
                <th className="px-3 py-2.5 text-right font-semibold">Disc %</th>
                <th className="px-3 py-2.5 text-right font-semibold">Taxable</th>
                <th className="px-3 py-2.5 text-right font-semibold">GST %</th>
                <th className="px-3 py-2.5 text-right font-semibold">GST Amt</th>
                <th className="px-3 py-2.5 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => {
                const product = getInvoiceProduct(item.productId);
                const { taxable, discountAmount, gstAmount, total } = computeLineItem(item);
                const unit = product ? getUnit(product.unitId) : null;
                return (
                  <tr
                    key={idx}
                    className={`border-b border-slate-100 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}`}
                  >
                    <td className="px-3 py-2.5 text-slate-500">{idx + 1}</td>
                    <td className="px-3 py-2.5">
                      <p className="font-semibold text-slate-800">
                        {product?.name ?? item.productId}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        HSN: {product?.hsnCode ?? "—"} {unit ? `· ${unit.shortCode}` : ""}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 text-center text-slate-700">{item.quantity}</td>
                    <td className="px-3 py-2.5 text-right text-slate-700">
                      {fmtINR(item.unitPrice)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-500">
                      {item.discountPercent > 0 ? `${item.discountPercent}%` : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-700">{fmtINR(taxable)}</td>
                    <td className="px-3 py-2.5 text-right text-slate-700">{item.gstPercent}%</td>
                    <td className="px-3 py-2.5 text-right text-slate-700">{fmtINR(gstAmount)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-slate-900">
                      {fmtINR(total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals + GST Summary */}
      <div className="flex gap-6 px-8 py-5">
        {/* GST Breakdown */}
        <div className="flex-1">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Tax Summary
          </p>
          <div className="rounded-xl border border-slate-100 bg-slate-50 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100">
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Tax Type</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600">
                    Taxable Value
                  </th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600">Rate</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.isInterState ? (
                  <tr className="border-b border-slate-100">
                    <td className="px-3 py-2 text-slate-700 font-medium">IGST</td>
                    <td className="px-3 py-2 text-right text-slate-600">
                      {fmtINR(totals.taxableValue)}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-600">
                      {invoice.items[0]?.gstPercent ?? 18}%
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-800">
                      {fmtINR(totals.igst)}
                    </td>
                  </tr>
                ) : (
                  <>
                    <tr className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-700 font-medium">CGST</td>
                      <td className="px-3 py-2 text-right text-slate-600">
                        {fmtINR(totals.taxableValue)}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-600">
                        {(invoice.items[0]?.gstPercent ?? 18) / 2}%
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-800">
                        {fmtINR(totals.cgst)}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-700 font-medium">SGST</td>
                      <td className="px-3 py-2 text-right text-slate-600">
                        {fmtINR(totals.taxableValue)}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-600">
                        {(invoice.items[0]?.gstPercent ?? 18) / 2}%
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-800">
                        {fmtINR(totals.sgst)}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Bank Details */}
          <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Bank Details
            </p>
            <p className="text-xs text-slate-700">
              <span className="text-slate-500">Bank:</span> {company.bankName}
            </p>
            <p className="text-xs text-slate-700">
              <span className="text-slate-500">A/C No:</span> {company.accountNumber}
            </p>
            <p className="text-xs text-slate-700">
              <span className="text-slate-500">IFSC:</span> {company.ifsc}
            </p>
          </div>
        </div>

        {/* Grand Total Block */}
        <div className="w-60 shrink-0 space-y-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-medium">{fmtINR(totals.subtotal)}</span>
            </div>
            {totals.totalDiscount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span className="font-medium">-{fmtINR(totals.totalDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Taxable Value</span>
              <span className="font-medium">{fmtINR(totals.taxableValue)}</span>
            </div>
            {invoice.isInterState ? (
              <div className="flex justify-between text-slate-600">
                <span>IGST</span>
                <span className="font-medium">{fmtINR(totals.igst)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>CGST</span>
                  <span className="font-medium">{fmtINR(totals.cgst)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>SGST</span>
                  <span className="font-medium">{fmtINR(totals.sgst)}</span>
                </div>
              </>
            )}
            {totals.roundOff !== 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Round Off</span>
                <span className="font-medium">
                  {totals.roundOff > 0 ? "+" : ""}
                  {fmtINR(totals.roundOff)}
                </span>
              </div>
            )}
            <div className="border-t border-slate-200 pt-1.5 flex justify-between text-base font-bold text-slate-900">
              <span>Grand Total</span>
              <span className="text-blue-700">{fmtINR(totals.grandTotal)}</span>
            </div>
            {invoice.amountPaid > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Amount Paid</span>
                <span className="font-medium">-{fmtINR(invoice.amountPaid)}</span>
              </div>
            )}
            {invoice.amountPaid > 0 && (
              <div className="flex justify-between font-bold text-red-600">
                <span>Balance Due</span>
                <span>{fmtINR(Math.max(0, totals.grandTotal - invoice.amountPaid))}</span>
              </div>
            )}
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-2">
            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">
              Amount in Words
            </p>
            <p className="mt-0.5 text-[11px] font-medium text-blue-800 leading-snug">
              {numberToWords(totals.grandTotal)}
            </p>
          </div>
        </div>
      </div>

      {/* Notes + Terms */}
      {(invoice.notes || invoice.terms) && (
        <div className="grid grid-cols-2 gap-4 px-8 pb-4">
          {invoice.notes && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Notes
              </p>
              <p className="text-xs text-slate-600">{invoice.notes}</p>
            </div>
          )}
          {invoice.terms && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Terms &amp; Conditions
              </p>
              <p className="text-xs text-slate-600">{invoice.terms}</p>
            </div>
          )}
        </div>
      )}

      {/* Signature */}
      <div className="flex justify-end border-t border-slate-100 px-8 py-6">
        <div className="text-center">
          <div className="mb-1 h-10 w-40 border-b border-slate-300" />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Authorized Signatory
          </p>
          <p className="text-xs text-slate-600">{company.name}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="rounded-b-2xl border-t border-slate-200 bg-slate-800 px-8 py-3 text-center">
        <p className="text-[11px] text-slate-300">
          This is a computer-generated invoice and does not require a physical signature.
        </p>
      </div>
    </div>
  );
}

// ── PDF Preview Mode ───────────────────────────────────────────────

function PDFPreviewChrome({ invoice }: { invoice: Invoice }) {
  const filename = `${invoice.invoiceNumber}.pdf`;
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-300 shadow-inner">
      {/* Mock PDF toolbar */}
      <div className="flex items-center justify-between rounded-t-2xl border-b border-slate-400 bg-slate-700 px-4 py-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-300" />
          <span className="text-xs font-semibold text-slate-200">{filename}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-300">
          <span className="flex items-center gap-1 rounded border border-slate-600 bg-slate-600 px-2 py-0.5">
            <span>−</span>
          </span>
          <span className="w-12 rounded border border-slate-600 bg-slate-600 px-2 py-0.5 text-center">
            100%
          </span>
          <span className="flex items-center gap-1 rounded border border-slate-600 bg-slate-600 px-2 py-0.5">
            <span>+</span>
          </span>
          <span className="ml-2 text-slate-400">1 / 1</span>
        </div>
      </div>
      {/* Page with drop shadow */}
      <div className="p-6">
        <div className="shadow-2xl">
          <A4InvoiceContent invoice={invoice} />
        </div>
      </div>
    </div>
  );
}

// ── Thermal Receipt Mode ───────────────────────────────────────────

function ThermalReceipt({ invoice, width }: { invoice: Invoice; width: ThermalWidth }) {
  const customer = getCustomer(invoice.customerId);
  const totals = computeDocumentTotals(invoice.items, invoice.isInterState);
  const maxW = width === "58mm" ? "max-w-[220px]" : "max-w-[300px]";

  const divider = "- - - - - - - - - - - - - - - - - - - -";

  return (
    <div className="flex justify-center py-4">
      <div
        className={`${maxW} w-full rounded-lg border border-dashed border-slate-400 bg-white px-4 py-5 font-mono text-[11px] leading-relaxed text-slate-800 shadow-lg`}
      >
        {/* Header */}
        <div className="mb-2 text-center">
          <p className="text-sm font-black tracking-tight">
            {company.name.split(" ").slice(0, 2).join(" ")}
          </p>
          <p className="text-[10px] text-slate-500">GSTIN: {company.gstin}</p>
          <p className="text-[10px] text-slate-500">{company.phone}</p>
        </div>
        <p className="text-center text-[10px] text-slate-400">{divider}</p>

        {/* Invoice info */}
        <div className="my-1.5 space-y-0.5">
          <div className="flex justify-between">
            <span className="text-slate-500">Invoice</span>
            <span className="font-semibold">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Date</span>
            <span>{fmtDate(invoice.createdDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Customer</span>
            <span className="max-w-[110px] truncate">{customer?.name ?? "—"}</span>
          </div>
        </div>
        <p className="text-center text-[10px] text-slate-400">{divider}</p>

        {/* Line items */}
        <div className="my-1.5 space-y-1.5">
          {invoice.items.map((item, idx) => {
            const product = getInvoiceProduct(item.productId);
            const { total } = computeLineItem(item);
            const name = product?.name ?? item.productId;
            const shortName = name.length > 18 ? name.slice(0, 16) + ".." : name;
            return (
              <div key={idx}>
                <p className="font-semibold text-slate-800">{shortName}</p>
                <div className="flex justify-between text-slate-600">
                  <span>
                    {item.quantity} x {fmtINR(item.unitPrice)}
                  </span>
                  <span className="font-semibold">{fmtINR(total)}</span>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-center text-[10px] text-slate-400">{divider}</p>

        {/* Totals */}
        <div className="my-1.5 space-y-0.5">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span>{fmtINR(totals.taxableValue)}</span>
          </div>
          {invoice.isInterState ? (
            <div className="flex justify-between text-slate-600">
              <span>IGST</span>
              <span>{fmtINR(totals.igst)}</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between text-slate-600">
                <span>CGST</span>
                <span>{fmtINR(totals.cgst)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>SGST</span>
                <span>{fmtINR(totals.sgst)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between text-sm font-black">
            <span>TOTAL</span>
            <span>{fmtINR(totals.grandTotal)}</span>
          </div>
          {invoice.amountPaid > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Paid</span>
              <span>{fmtINR(invoice.amountPaid)}</span>
            </div>
          )}
          {invoice.amountPaid > 0 && totals.grandTotal > invoice.amountPaid && (
            <div className="flex justify-between font-bold text-red-600">
              <span>Balance</span>
              <span>{fmtINR(totals.grandTotal - invoice.amountPaid)}</span>
            </div>
          )}
        </div>
        <p className="text-center text-[10px] text-slate-400">{divider}</p>

        {/* Footer */}
        <div className="mt-2 text-center space-y-0.5">
          <p className="font-semibold">** Thank You **</p>
          <p className="text-[10px] text-slate-500">Visit Again!</p>
          <p className="text-[10px] text-slate-400">{company.email}</p>
        </div>
      </div>
    </div>
  );
}

// ── InvoiceDetailView ──────────────────────────────────────────────

export function InvoiceDetailView({
  invoice,
  onEdit,
  onBack,
}: {
  invoice: Invoice;
  onEdit: () => void;
  onBack: () => void;
}) {
  const [previewMode, setPreviewMode] = useState<PreviewMode>("a4");
  const [thermalWidth, setThermalWidth] = useState<ThermalWidth>("80mm");

  const customer = getCustomer(invoice.customerId);
  const modeOptions: { value: PreviewMode; label: string }[] = [
    { value: "a4", label: "A4 Invoice" },
    { value: "pdf", label: "PDF Preview" },
    { value: "thermal", label: "Thermal Receipt" },
  ];

  function handleGeneratePDF() {
    alert(`PDF generation for ${invoice.invoiceNumber} would be triggered here. (UI only)`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="space-y-4"
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
        <SecondaryButton icon={ArrowLeft} onClick={onBack}>
          Back
        </SecondaryButton>

        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-blue-700">{invoice.invoiceNumber}</span>
          <BillingStatusPill status={invoice.status} />
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {/* Preview mode selector */}
          <div className="relative">
            <select
              value={previewMode}
              onChange={(e) => setPreviewMode(e.target.value as PreviewMode)}
              className="h-9 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-sm text-foreground outline-none transition-colors focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
            >
              {modeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>

          {previewMode === "thermal" && (
            <div className="relative">
              <select
                value={thermalWidth}
                onChange={(e) => setThermalWidth(e.target.value as ThermalWidth)}
                className="h-9 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-sm text-foreground outline-none transition-colors focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
              >
                <option value="58mm">58mm</option>
                <option value="80mm">80mm</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
          )}

          <SecondaryButton onClick={handleGeneratePDF} icon={FileText}>
            Generate PDF
          </SecondaryButton>
          <SecondaryButton onClick={() => window.print()} icon={Printer}>
            Print
          </SecondaryButton>
          <PrimaryButton icon={Pencil} onClick={onEdit}>
            Edit Invoice
          </PrimaryButton>
        </div>
      </div>

      {/* Customer summary strip */}
      {customer && (
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm text-sm">
          <div>
            <span className="text-xs text-slate-400 mr-1.5">Customer</span>
            <span className="font-semibold text-slate-800">{customer.name}</span>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div>
            <span className="text-xs text-slate-400 mr-1.5">State</span>
            <span className="text-slate-700">{customer.state}</span>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div>
            <span className="text-xs text-slate-400 mr-1.5">Supply Type</span>
            <span
              className={`font-medium ${invoice.isInterState ? "text-violet-700" : "text-blue-700"}`}
            >
              {invoice.isInterState ? "Inter-State (IGST)" : "Intra-State (CGST+SGST)"}
            </span>
          </div>
        </div>
      )}

      {/* Preview Content */}
      <div>
        {previewMode === "a4" && <A4InvoiceContent invoice={invoice} />}
        {previewMode === "pdf" && <PDFPreviewChrome invoice={invoice} />}
        {previewMode === "thermal" && <ThermalReceipt invoice={invoice} width={thermalWidth} />}
      </div>
    </motion.div>
  );
}
