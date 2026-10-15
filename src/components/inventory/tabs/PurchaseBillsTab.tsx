import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, FileText } from "lucide-react";
import {
  fmtINR,
  type PurchaseBill,
  type PaymentStatus,
} from "@/lib/inventory-data";
import { useBusiness } from "@/contexts/BusinessContext";
import { useSuppliers } from "@/hooks/useProductsQuery";
import {
  useCreatePurchaseBill,
  usePurchaseBills,
  usePurchaseOrders,
  useRecordPurchaseBillPayment,
} from "@/hooks/usePurchaseFlowQuery";
import { toast } from "sonner";
import {
  SectionCard,
  StatusPill,
  PrimaryButton,
  SecondaryButton,
  EmptyState,
  fmtDate,
} from "@/components/inventory/shared";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

const TODAY = new Date().toISOString().slice(0, 10);

function derivePaymentStatus(amountPaid: number, total: number): PaymentStatus {
  if (amountPaid >= total) return "paid";
  if (amountPaid > 0) return "partial";
  return "unpaid";
}

export function PurchaseBillsTab() {
  const { business } = useBusiness();
  const businessId = business?.id ?? null;
  const { data: bills = [], isLoading } = usePurchaseBills(businessId);
  const { data: dbSuppliers = [] } = useSuppliers(businessId);
  const { data: orderData } = usePurchaseOrders(businessId);
  const createMutation = useCreatePurchaseBill(businessId);
  const paymentMutation = useRecordPurchaseBillPayment(businessId);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailBill, setDetailBill] = useState<PurchaseBill | null>(null);
  const [paymentInput, setPaymentInput] = useState("");

  // Create form
  const [formSupplier, setFormSupplier] = useState("");
  const [formPoNumber, setFormPoNumber] = useState("");
  const [formBillDate, setFormBillDate] = useState(TODAY);
  const [formDueDate, setFormDueDate] = useState("");
  const [formSubtotal, setFormSubtotal] = useState("");
  const [formGst, setFormGst] = useState("");
  const [formTotal, setFormTotal] = useState("");
  const [formAmountPaid, setFormAmountPaid] = useState("");

  function getSupplier(id: string) {
    return dbSuppliers.find((supplier) => supplier.id === id);
  }

  function handleSubtotalChange(val: string) {
    setFormSubtotal(val);
    const sub = parseFloat(val) || 0;
    const gst = Math.round(sub * 0.18);
    setFormGst(String(gst));
    setFormTotal(String(sub + gst));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const total = parseFloat(formTotal) || 0;
    const amountPaid = parseFloat(formAmountPaid) || 0;
    if (!businessId || !formSupplier || total <= 0) {
      toast.error("Select a supplier and enter a bill total");
      return;
    }
    try {
      const linkedOrder = orderData?.orders.find((order) => order.poNumber === formPoNumber);
      await createMutation.mutateAsync({
        purchaseOrderId: linkedOrder?.id,
        poNumber: formPoNumber || "—",
        supplierId: formSupplier,
        billDate: formBillDate || TODAY,
        dueDate: formDueDate || TODAY,
        subtotal: Math.max(0, parseFloat(formSubtotal) || 0),
        gstAmount: Math.max(0, parseFloat(formGst) || 0),
        total,
        amountPaid: Math.max(0, Math.min(amountPaid, total)),
      });
      setCreateOpen(false);
      setFormSupplier(dbSuppliers[0]?.id ?? "");
      setFormPoNumber("");
      setFormBillDate(TODAY);
      setFormDueDate("");
      setFormSubtotal("");
      setFormGst("");
      setFormTotal("");
      setFormAmountPaid("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create purchase bill");
    }
  }

  async function recordPayment() {
    if (!detailBill) return;
    const additional = parseFloat(paymentInput) || 0;
    if (additional <= 0) return;
    try {
      await paymentMutation.mutateAsync({ billId: detailBill.id, amount: Math.min(additional, detailBill.total - detailBill.amountPaid) });
      setDetailBill(null);
      setPaymentInput("");
      toast.success("Payment recorded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to record payment");
    }
  }

  return (
    <>
      <SectionCard
        title="Purchase Bills"
        subtitle={`${bills.length} bills`}
        action={
          <PrimaryButton icon={Plus} onClick={() => setCreateOpen(true)}>
            Create Purchase Bill
          </PrimaryButton>
        }
        noPadding
      >
        {isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : bills.length === 0 ? (
          <EmptyState icon={FileText} title="No purchase bills" subtitle="Create your first purchase bill to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {["Bill Number", "PO Number", "Supplier", "Bill Date", "Due Date", "Total", "Payment Status", "Amount Paid", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bills.map((bill, i) => {
                  const supplier = getSupplier(bill.supplierId);
                  return (
                    <motion.tr
                      key={bill.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                      onClick={() => { setDetailBill(bill); setPaymentInput(""); }}
                      className="cursor-pointer border-b border-slate-50 hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-700">{bill.billNumber}</td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs">{bill.poNumber}</td>
                      <td className="px-4 py-3 text-slate-700">{supplier?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{fmtDate(bill.billDate)}</td>
                      <td className="px-4 py-3 text-slate-600">{fmtDate(bill.dueDate)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{fmtINR(bill.total)}</td>
                      <td className="px-4 py-3"><StatusPill status={bill.paymentStatus} /></td>
                      <td className="px-4 py-3 text-slate-700">{fmtINR(bill.amountPaid)}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <SecondaryButton onClick={() => { setDetailBill(bill); setPaymentInput(""); }}>
                          View
                        </SecondaryButton>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Bill</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Supplier *</label>
              <select
                value={formSupplier}
                onChange={(e) => setFormSupplier(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
                required
              >
                {dbSuppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">PO Number</label>
              <input
                type="text"
                value={formPoNumber}
                onChange={(e) => setFormPoNumber(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
                placeholder="e.g. PO-2026-0041"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Bill Date</label>
                <input
                  type="date"
                  value={formBillDate}
                  onChange={(e) => setFormBillDate(e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Due Date</label>
                <input
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Subtotal (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={formSubtotal}
                  onChange={(e) => handleSubtotalChange(e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">GST 18% (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={formGst}
                  onChange={(e) => setFormGst(e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Total (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={formTotal}
                  onChange={(e) => setFormTotal(e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Amount Paid (₹)</label>
              <input
                type="number"
                min="0"
                value={formAmountPaid}
                onChange={(e) => setFormAmountPaid(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
                placeholder="0"
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
              </DialogClose>
              <PrimaryButton type="submit">Create Bill</PrimaryButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail / Invoice Preview Dialog */}
      <Dialog open={!!detailBill} onOpenChange={(o) => !o && setDetailBill(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {detailBill && (() => {
            const supplier = getSupplier(detailBill.supplierId);
            const balance = detailBill.total - detailBill.amountPaid;
            return (
              <>
                <DialogHeader>
                  <DialogTitle>Bill Preview</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  {/* Vendor Details */}
                  {supplier && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Vendor Details</p>
                      <p className="font-bold text-slate-800">{supplier.name}</p>
                       <p className="text-xs text-slate-500">{supplier.contact_person ?? "—"} · {supplier.phone ?? "—"}</p>
                       <p className="text-xs text-slate-500">{supplier.email ?? "—"}</p>
                       <p className="mt-1 text-xs text-slate-400">GST: {supplier.gst_number ?? "—"}</p>
                    </div>
                  )}

                  {/* Bill & PO Numbers + Dates */}
                  <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Bill Number</p>
                      <p className="font-mono font-semibold text-blue-700">{detailBill.billNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">PO Number</p>
                      <p className="font-mono text-slate-700">{detailBill.poNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Bill Date</p>
                      <p className="font-semibold text-slate-800">{fmtDate(detailBill.billDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Due Date</p>
                      <p className="font-semibold text-slate-800">{fmtDate(detailBill.dueDate)}</p>
                    </div>
                  </div>

                  {/* GST Summary */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">GST Summary</p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Subtotal</span>
                        <span className="font-semibold text-slate-800">{fmtINR(detailBill.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">GST Amount</span>
                        <span className="font-semibold text-slate-800">{fmtINR(detailBill.gstAmount)}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 pt-1.5">
                        <span className="font-bold text-slate-700">Total</span>
                        <span className="font-bold text-slate-900">{fmtINR(detailBill.total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment</p>
                      <StatusPill status={detailBill.paymentStatus} />
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Amount Paid</span>
                        <span className="font-semibold text-emerald-700">{fmtINR(detailBill.amountPaid)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Balance Due</span>
                        <span className={`font-semibold ${balance > 0 ? "text-red-600" : "text-slate-500"}`}>{fmtINR(balance)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Record Payment */}
                  {detailBill.paymentStatus !== "paid" && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-600">Record Payment</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max={balance}
                          value={paymentInput}
                          onChange={(e) => setPaymentInput(e.target.value)}
                          className="h-8 flex-1 rounded-lg border border-blue-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
                          placeholder={`Max: ${fmtINR(balance)}`}
                        />
                        <button
                          type="button"
                          onClick={recordPayment}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                        >
                          Record
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <DialogClose asChild>
                      <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Close</button>
                    </DialogClose>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
}
