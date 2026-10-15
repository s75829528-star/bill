import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, X, ShoppingCart, ClipboardCheck, Clock, CheckCircle, Truck, PackageCheck, Package, Ban } from "lucide-react";
import {
  fmtINR,
  type PurchaseOrder,
  type PurchaseOrderItem,
  type POStatus,
} from "@/lib/inventory-data";
import { useBusiness } from "@/contexts/BusinessContext";
import { useProducts, useSuppliers } from "@/hooks/useProductsQuery";
import {
  useCreatePurchaseOrder,
  usePurchaseOrders,
  useReceivePurchaseGoods,
  useUpdatePurchaseOrder,
} from "@/hooks/usePurchaseFlowQuery";
import { toast } from "sonner";
import {
  SectionCard,
  StatusPill,
  StatTile,
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

function poTotal(items: PurchaseOrderItem[]) {
  return items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
}

function thisMonthValue(orders: PurchaseOrder[]) {
  return orders
    .filter((o) => o.createdDate.startsWith("2026-07"))
    .reduce((s, o) => s + poTotal(o.items), 0);
}

const STATUS_FILTERS: { label: string; value: POStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Pending Approval", value: "pending-approval" },
  { label: "Approved", value: "approved" },
  { label: "Ordered", value: "ordered" },
  { label: "Partially Received", value: "partially-received" },
  { label: "Received", value: "received" },
  { label: "Cancelled", value: "cancelled" },
];

interface GRNFormState {
  receivedBy: string;
  referenceNumber: string;
  notes: string;
  quantities: Record<string, string>;
}

export function PurchaseOrdersTab() {
  const { business } = useBusiness();
  const businessId = business?.id ?? null;
  const { data: orderData, isLoading } = usePurchaseOrders(businessId);
  const { data: dbSuppliers = [] } = useSuppliers(businessId);
  const { data: dbProducts = [] } = useProducts(businessId);
  const createMutation = useCreatePurchaseOrder(businessId);
  const updateMutation = useUpdatePurchaseOrder(businessId);
  const receiveMutation = useReceivePurchaseGoods(businessId);
  const orders = orderData?.orders ?? [];
  const goodsReceivedNotes = orderData?.grns ?? [];
  const [activeFilter, setActiveFilter] = useState<POStatus | "all">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<PurchaseOrder | null>(null);

  // GRN form state
  const [grnOpen, setGrnOpen] = useState(false);
  const [grnForm, setGrnForm] = useState<GRNFormState>({
    receivedBy: "",
    referenceNumber: "",
    notes: "",
    quantities: {},
  });

  // Ref number dialog for "Mark as Ordered"
  const [orderRefOpen, setOrderRefOpen] = useState(false);
  const [orderRefInput, setOrderRefInput] = useState("");

  // Approve/Reject with approvedBy
  const [approveOpen, setApproveOpen] = useState(false);
  const [approvedByInput, setApprovedByInput] = useState("");

  // Create form state
  const [formSupplier, setFormSupplier] = useState("");
  const [formExpected, setFormExpected] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formSupplierNotes, setFormSupplierNotes] = useState("");
  const [formRefNumber, setFormRefNumber] = useState("");
  const [lineItems, setLineItems] = useState<{ productId: string; quantity: string; unitPrice: string }[]>([
    { productId: "", quantity: "1", unitPrice: "0" },
  ]);

  function findSupplier(id: string) {
    return dbSuppliers.find((supplier) => supplier.id === id);
  }

  function findProduct(id: string) {
    return dbProducts.find((product) => product.id === id);
  }

  const filtered = activeFilter === "all" ? orders : orders.filter((o) => o.status === activeFilter);

  function countFor(s: POStatus | "all") {
    return s === "all" ? orders.length : orders.filter((o) => o.status === s).length;
  }

  // Stat tile computations
  const totalPOs = orders.length;
  const pendingApprovalCount = orders.filter((o) => o.status === "pending-approval").length;
  const activeCount = orders.filter((o) => ["approved", "ordered", "partially-received"].includes(o.status)).length;
  const monthValue = thisMonthValue(orders);

  function addLineItem() {
    const product = dbProducts[0];
    setLineItems((prev) => [
      ...prev,
      { productId: product?.id ?? "", quantity: "1", unitPrice: String(product?.purchase_price ?? 0) },
    ]);
  }

  function removeLineItem(idx: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateLineItem(idx: number, field: "productId" | "quantity" | "unitPrice", val: string) {
    setLineItems((prev) =>
      prev.map((row, i) => {
        if (i !== idx) return row;
        const updated = { ...row, [field]: val };
        if (field === "productId") {
          const p = findProduct(val);
          if (p) updated.unitPrice = String(p.purchase_price);
        }
        return updated;
      })
    );
  }

  function runningTotal() {
    return lineItems.reduce((s, row) => {
      const q = parseFloat(row.quantity) || 0;
      const u = parseFloat(row.unitPrice) || 0;
      return s + q * u;
    }, 0);
  }

  function resetCreateForm() {
    const product = dbProducts[0];
    setFormSupplier(dbSuppliers[0]?.id ?? "");
    setFormExpected("");
    setFormNotes("");
    setFormSupplierNotes("");
    setFormRefNumber("");
    setLineItems([{ productId: product?.id ?? "", quantity: "1", unitPrice: String(product?.purchase_price ?? 0) }]);
  }

  async function handleCreate(e: React.FormEvent, status: POStatus = "pending-approval") {
    e.preventDefault();
    if (!businessId || !formSupplier || lineItems.some((row) => !row.productId)) {
      toast.error("Select a supplier and at least one product");
      return;
    }
    try {
      await createMutation.mutateAsync({
        supplierId: formSupplier,
        status,
        expectedDate: formExpected || TODAY,
        notes: formNotes,
        supplierNotes: formSupplierNotes,
        referenceNumber: formRefNumber,
        items: lineItems.map((row) => ({
          productId: row.productId,
          quantity: Math.max(1, parseInt(row.quantity) || 1),
          unitPrice: Math.max(0, parseFloat(row.unitPrice) || 0),
        })),
      });
      setCreateOpen(false);
      resetCreateForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create purchase order");
    }
  }

  async function transitionStatus(
    id: string,
    next: POStatus,
    extra?: { approvedBy?: string | null; approvedDate?: string | null; referenceNumber?: string | null }
  ) {
    if (!businessId) return;
    try {
      await updateMutation.mutateAsync({ id, patch: { status: next, ...extra } });
      setDetailOrder((prev) =>
        prev && prev.id === id
          ? {
              ...prev,
              status: next,
              approvedBy: extra?.approvedBy ?? prev.approvedBy,
              approvedDate: extra?.approvedDate ?? prev.approvedDate,
              referenceNumber: extra?.referenceNumber ?? prev.referenceNumber,
            }
          : prev
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update purchase order");
    }
  }

  function handleSubmitForApproval() {
    if (!detailOrder) return;
    void transitionStatus(detailOrder.id, "pending-approval");
  }

  function handleApprove() {
    if (!detailOrder) return;
    void transitionStatus(detailOrder.id, "approved", {
      approvedBy: approvedByInput || "Current User",
      approvedDate: TODAY,
    });
    setApproveOpen(false);
    setApprovedByInput("");
  }

  function handleReject() {
    if (!detailOrder) return;
    void transitionStatus(detailOrder.id, "cancelled");
  }

  function handleMarkOrdered() {
    if (!detailOrder) return;
    void transitionStatus(detailOrder.id, "ordered", {
      referenceNumber: orderRefInput || null,
    });
    setOrderRefOpen(false);
    setOrderRefInput("");
  }

  function openGRNForm() {
    if (!detailOrder) return;
    const quantities: Record<string, string> = {};
    detailOrder.items.forEach((item) => {
      const remaining = item.quantity - (item.receivedQty ?? 0);
      quantities[item.productId] = String(Math.max(0, remaining));
    });
    setGrnForm({ receivedBy: "", referenceNumber: "", notes: "", quantities });
    setGrnOpen(true);
  }

  async function handleGRNSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!detailOrder) return;
    const items = detailOrder.items
      .map((item) => ({
        purchaseOrderItemId: detailOrder.itemIds?.[item.productId] ?? "",
        receivedQty: parseInt(grnForm.quantities[item.productId] ?? "0") || 0,
      }))
      .filter((item) => item.purchaseOrderItemId && item.receivedQty > 0);
    if (!items.length) {
      toast.error("Enter at least one received quantity");
      return;
    }
    try {
      await receiveMutation.mutateAsync({
        orderId: detailOrder.id,
        receivedBy: grnForm.receivedBy,
        referenceNumber: grnForm.referenceNumber,
        notes: grnForm.notes,
        items,
      });
      setGrnOpen(false);
      setDetailOrder(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to record goods receipt");
    }
  }

  return (
    <>
      {/* Stat Tiles */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile
          label="Total POs"
          value={String(totalPOs)}
          sub="All purchase orders"
          icon={ShoppingCart}
          bg="bg-blue-50"
          iconColor="text-blue-600"
          index={0}
        />
        <StatTile
          label="Pending Approval"
          value={String(pendingApprovalCount)}
          sub="Awaiting review"
          icon={Clock}
          bg="bg-amber-50"
          iconColor="text-amber-600"
          index={1}
        />
        <StatTile
          label="Active Orders"
          value={String(activeCount)}
          sub="Approved / Ordered / Partial"
          icon={Truck}
          bg="bg-violet-50"
          iconColor="text-violet-600"
          index={2}
        />
        <StatTile
          label="This Month Value"
          value={fmtINR(monthValue)}
          sub="July 2026"
          icon={PackageCheck}
          bg="bg-emerald-50"
          iconColor="text-emerald-600"
          index={3}
        />
      </div>

      <SectionCard
        title="Purchase Orders"
        subtitle={`${orders.length} purchase orders`}
        action={
          <PrimaryButton icon={Plus} onClick={() => setCreateOpen(true)}>
            Create Purchase Order
          </PrimaryButton>
        }
        noPadding
      >
        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 border-b border-slate-100 px-6 py-3">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                activeFilter === f.value
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  activeFilter === f.value ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {countFor(f.value)}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="No purchase orders" subtitle="Create your first purchase order to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {["PO Number", "Supplier", "Status", "Created Date", "Expected Date", "Items", "Total Value", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order, i) => {
                  const supplier = findSupplier(order.supplierId);
                  const total = poTotal(order.items);
                  return (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                      onClick={() => setDetailOrder(order)}
                      className="cursor-pointer border-b border-slate-50 hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-700">{order.poNumber}</td>
                      <td className="px-4 py-3 text-slate-700">{supplier?.name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <StatusPill status={order.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-600">{fmtDate(order.createdDate)}</td>
                      <td className="px-4 py-3 text-slate-600">{fmtDate(order.expectedDate)}</td>
                      <td className="px-4 py-3 text-slate-700">{order.items.length}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{fmtINR(total)}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <SecondaryButton onClick={() => setDetailOrder(order)}>View</SecondaryButton>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ── Create Dialog ─────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => handleCreate(e, "pending-approval")}
            className="space-y-4 pt-2"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Supplier *</label>
                <select
                  value={formSupplier}
                  onChange={(e) => setFormSupplier(e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
                  required
                >
                  {dbSuppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Expected Delivery Date</label>
                <input
                  type="date"
                  value={formExpected}
                  onChange={(e) => setFormExpected(e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Reference Number</label>
                <input
                  type="text"
                  value={formRefNumber}
                  onChange={(e) => setFormRefNumber(e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
                  placeholder="e.g. REF-2026-001"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Internal Notes</label>
              <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                placeholder="Internal order notes..."
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Supplier Notes</label>
              <textarea
                value={formSupplierNotes}
                onChange={(e) => setFormSupplierNotes(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                placeholder="Notes for the supplier..."
              />
            </div>

            {/* Line Items */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600">Line Items</label>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  <Plus className="h-3 w-3" /> Add Item
                </button>
              </div>
              <div className="space-y-2">
                {lineItems.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2">
                    <select
                      value={row.productId}
                      onChange={(e) => updateLineItem(idx, "productId", e.target.value)}
                      className="flex-1 h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none"
                    >
                      {dbProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={row.quantity}
                      onChange={(e) => updateLineItem(idx, "quantity", e.target.value)}
                      className="w-20 h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none"
                      placeholder="Qty"
                    />
                    <input
                      type="number"
                      min="0"
                      value={row.unitPrice}
                      onChange={(e) => updateLineItem(idx, "unitPrice", e.target.value)}
                      className="w-28 h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none"
                      placeholder="Unit Price"
                    />
                    <span className="w-24 text-right text-xs font-semibold text-slate-700">
                      {fmtINR((parseFloat(row.quantity) || 0) * (parseFloat(row.unitPrice) || 0))}
                    </span>
                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLineItem(idx)}
                        className="rounded-lg p-1 text-red-400 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-end">
                <span className="text-sm font-bold text-slate-800">Total: {fmtINR(runningTotal())}</span>
              </div>
            </div>

            <DialogFooter className="flex-wrap gap-2">
              <DialogClose asChild>
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </DialogClose>
              <button
                type="button"
                onClick={(e) => handleCreate(e as unknown as React.FormEvent, "draft")}
                className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Save as Draft
              </button>
              <PrimaryButton type="submit">Create Order</PrimaryButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Approve Dialog ────────────────────────────────────────── */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Approve Purchase Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Approved By *</label>
              <input
                type="text"
                value={approvedByInput}
                onChange={(e) => setApprovedByInput(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
                placeholder="Your name"
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
            </DialogClose>
            <button
              onClick={handleApprove}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Confirm Approve
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Mark as Ordered Dialog ────────────────────────────────── */}
      <Dialog open={orderRefOpen} onOpenChange={setOrderRefOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Mark as Ordered</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Supplier Reference Number</label>
              <input
                type="text"
                value={orderRefInput}
                onChange={(e) => setOrderRefInput(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
                placeholder="e.g. REF-SUP-2026-001"
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
            </DialogClose>
            <button
              onClick={handleMarkOrdered}
              className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
            >
              Confirm Ordered
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── GRN Dialog ────────────────────────────────────────────── */}
      <Dialog open={grnOpen} onOpenChange={setGrnOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Goods Receipt (GRN)</DialogTitle>
          </DialogHeader>
          {detailOrder && (
            <form onSubmit={handleGRNSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Received By *</label>
                  <input
                    type="text"
                    required
                    value={grnForm.receivedBy}
                    onChange={(e) => setGrnForm((f) => ({ ...f, receivedBy: e.target.value }))}
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Reference Number</label>
                  <input
                    type="text"
                    value={grnForm.referenceNumber}
                    onChange={(e) => setGrnForm((f) => ({ ...f, referenceNumber: e.target.value }))}
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
                    placeholder="Delivery reference"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Notes</label>
                <textarea
                  value={grnForm.notes}
                  onChange={(e) => setGrnForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                  placeholder="Delivery notes, quality observations..."
                />
              </div>

              {/* Line items */}
              <div>
                <p className="mb-2 text-xs font-semibold text-slate-600 uppercase tracking-wide">Line Items</p>
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Product</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Ordered</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Prev. Received</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Now Receiving</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailOrder.items.map((item) => {
                        const product = findProduct(item.productId);
                        const prevReceived = item.receivedQty ?? 0;
                        const remaining = item.quantity - prevReceived;
                        return (
                          <tr key={item.productId} className="border-b border-slate-50">
                            <td className="px-4 py-2 text-slate-700">{product?.name ?? item.productId}</td>
                            <td className="px-4 py-2 text-right text-slate-600">{item.quantity}</td>
                            <td className="px-4 py-2 text-right text-slate-600">{prevReceived}</td>
                            <td className="px-4 py-2 text-right">
                              <input
                                type="number"
                                min="0"
                                max={remaining}
                                value={grnForm.quantities[item.productId] ?? "0"}
                                onChange={(e) =>
                                  setGrnForm((f) => ({
                                    ...f,
                                    quantities: { ...f.quantities, [item.productId]: e.target.value },
                                  }))
                                }
                                className="w-20 h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-right outline-none focus:border-blue-400"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </DialogClose>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                >
                  Submit GRN
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Detail Dialog ─────────────────────────────────────────── */}
      <Dialog open={!!detailOrder} onOpenChange={(o) => !o && setDetailOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailOrder &&
            (() => {
              const supplier = findSupplier(detailOrder.supplierId);
              const total = poTotal(detailOrder.items);
              const relatedGRNs = goodsReceivedNotes.filter((g) => g.poId === detailOrder.id);
              return (
                <>
                  <DialogHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <DialogTitle className="font-mono text-blue-700">{detailOrder.poNumber}</DialogTitle>
                        <div className="mt-1 flex items-center gap-2">
                          <StatusPill status={detailOrder.status} />
                          {detailOrder.referenceNumber && (
                            <span className="text-xs text-slate-500 font-mono">Ref: {detailOrder.referenceNumber}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    {/* Dates + Approval info */}
                    <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm">
                      <div>
                        <p className="text-xs text-slate-500">Created Date</p>
                        <p className="font-semibold text-slate-800">{fmtDate(detailOrder.createdDate)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Expected Delivery</p>
                        <p className="font-semibold text-slate-800">{fmtDate(detailOrder.expectedDate)}</p>
                      </div>
                      {detailOrder.approvedBy && (
                        <div>
                          <p className="text-xs text-slate-500">Approved By</p>
                          <p className="font-semibold text-slate-800">{detailOrder.approvedBy}</p>
                        </div>
                      )}
                      {detailOrder.approvedDate && (
                        <div>
                          <p className="text-xs text-slate-500">Approval Date</p>
                          <p className="font-semibold text-slate-800">{fmtDate(detailOrder.approvedDate)}</p>
                        </div>
                      )}
                    </div>

                    {/* Supplier Info */}
                    {supplier && (
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Supplier</p>
                        <p className="font-semibold text-slate-800">{supplier.name}</p>
                        <p className="text-xs text-slate-500">
                           {supplier.contact_person ?? "—"} · {supplier.phone ?? "—"}
                        </p>
                        <p className="text-xs text-slate-500">
                           {supplier.email ?? "—"} · {supplier.city ?? "—"}
                        </p>
                         <p className="mt-1 text-xs text-slate-400">GST: {supplier.gst_number ?? "—"}</p>
                      </div>
                    )}

                    {/* Line Items Table */}
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50">
                            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Product</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Qty</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Received</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Unit Price</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Line Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailOrder.items.map((item, i) => {
                            const product = findProduct(item.productId);
                            const received = item.receivedQty ?? 0;
                            const pct = item.quantity > 0 ? Math.min(100, Math.round((received / item.quantity) * 100)) : 0;
                            return (
                              <tr key={i} className="border-b border-slate-50">
                                <td className="px-4 py-2 text-slate-700">{product?.name ?? item.productId}</td>
                                <td className="px-4 py-2 text-right text-slate-600">{item.quantity}</td>
                                <td className="px-4 py-2 text-right">
                                  {received > 0 ? (
                                    <div className="flex flex-col items-end gap-1">
                                      <span className="text-xs text-slate-600">
                                        {received}/{item.quantity}
                                      </span>
                                      <div className="h-1.5 w-20 rounded-full bg-slate-200 overflow-hidden">
                                        <div
                                          className={`h-full rounded-full ${pct >= 100 ? "bg-emerald-500" : "bg-amber-400"}`}
                                          style={{ width: `${pct}%` }}
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-2 text-right text-slate-600">{fmtINR(item.unitPrice)}</td>
                                <td className="px-4 py-2 text-right font-semibold text-slate-800">
                                  {fmtINR(item.quantity * item.unitPrice)}
                                </td>
                              </tr>
                            );
                          })}
                          <tr className="bg-slate-50">
                            <td colSpan={4} className="px-4 py-2 text-right text-sm font-bold text-slate-700">
                              Grand Total
                            </td>
                            <td className="px-4 py-2 text-right text-sm font-bold text-slate-900">{fmtINR(total)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Notes */}
                    {detailOrder.notes && (
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Internal Notes</p>
                        <p className="text-sm text-slate-700">{detailOrder.notes}</p>
                      </div>
                    )}

                    {/* Supplier Notes */}
                    {detailOrder.supplierNotes && (
                      <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                        <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Supplier Notes</p>
                        <p className="text-sm text-amber-800">{detailOrder.supplierNotes}</p>
                      </div>
                    )}

                    {/* Associated GRNs */}
                    {relatedGRNs.length > 0 && (
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                        <p className="mb-2 text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                          Goods Received Notes
                        </p>
                        <div className="space-y-2">
                          {relatedGRNs.map((grn) => (
                            <div key={grn.id} className="rounded-lg border border-emerald-200 bg-white p-3 text-sm">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-mono text-xs font-semibold text-emerald-700">{grn.grnNumber}</span>
                                <span className="text-xs text-slate-500">{fmtDate(grn.receivedDate)}</span>
                              </div>
                              <p className="text-xs text-slate-600">
                                Received by: <span className="font-medium">{grn.receivedBy}</span>
                              </p>
                              {grn.referenceNumber && (
                                <p className="text-xs text-slate-500">Ref: {grn.referenceNumber}</p>
                              )}
                              {grn.notes && <p className="mt-1 text-xs text-slate-500 italic">{grn.notes}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {/* Draft → Submit for Approval */}
                      {detailOrder.status === "draft" && (
                        <button
                          onClick={handleSubmitForApproval}
                          className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
                        >
                          Submit for Approval
                        </button>
                      )}

                      {/* Pending Approval → Approve / Reject */}
                      {detailOrder.status === "pending-approval" && (
                        <>
                          <button
                            onClick={() => setApproveOpen(true)}
                            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={handleReject}
                            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {/* Approved → Mark as Ordered */}
                      {detailOrder.status === "approved" && (
                        <>
                          <button
                            onClick={() => setOrderRefOpen(true)}
                            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
                          >
                            Mark as Ordered
                          </button>
                          <button
                            onClick={() => transitionStatus(detailOrder.id, "cancelled")}
                            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors"
                          >
                            Cancel Order
                          </button>
                        </>
                      )}

                      {/* Ordered → Receive Goods */}
                      {detailOrder.status === "ordered" && (
                        <button
                          onClick={openGRNForm}
                          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                        >
                          Receive Goods
                        </button>
                      )}

                      {/* Partially Received → Receive More */}
                      {detailOrder.status === "partially-received" && (
                        <button
                          onClick={openGRNForm}
                          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                        >
                          Receive More
                        </button>
                      )}

                      <DialogClose asChild>
                        <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                          Close
                        </button>
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
