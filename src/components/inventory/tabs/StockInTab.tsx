import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, PackageOpen, List, Clock } from "lucide-react";
import { useBusiness } from "@/contexts/BusinessContext";
import { useProducts } from "@/hooks/useProductsQuery";
import { useSuppliers } from "@/hooks/useProductsQuery";
import {
  useInventoryMovements,
  useCreateStockIn,
  filterMovements,
  fmtMovementDate,
  fmtMovementTime,
} from "@/hooks/useInventoryMovementsQuery";
import type { DbInventoryMovement } from "@/services/inventoryMovements";
import {
  SectionCard,
  PrimaryButton,
  SecondaryButton,
  EmptyState,
} from "@/components/inventory/shared";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

// ── Loading skeleton ───────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="p-6 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-10 rounded-xl bg-slate-100 animate-pulse" />
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────

export function StockInTab() {
  const { business } = useBusiness();
  const businessId = business?.id ?? null;

  // ── Server state
  const { data: allMovements = [], isLoading: movementsLoading } =
    useInventoryMovements(businessId);
  const { data: dbProducts = [], isLoading: productsLoading } =
    useProducts(businessId);
  const { data: dbSuppliers = [] } = useSuppliers(businessId);
  const createMutation = useCreateStockIn(businessId);

  const movements = filterMovements(allMovements, "in");
  const isLoading = movementsLoading || productsLoading;

  // ── UI state
  const [viewMode, setViewMode] = useState<"list" | "timeline">("list");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<DbInventoryMovement | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Form state
  const [formRef, setFormRef] = useState("");
  const [formSupplierId, setFormSupplierId] = useState("");
  const [formProductId, setFormProductId] = useState("");
  const [formQty, setFormQty] = useState("1");
  const [formNotes, setFormNotes] = useState("");

  // ── Helpers
  function findProduct(id: string) {
    return dbProducts.find((p) => p.id === id);
  }
  function findSupplier(id: string) {
    return dbSuppliers.find((s) => s.id === id);
  }

  const activeProducts = dbProducts.filter((p) => p.status === "active");

  function openCreate() {
    const nextNum = String(movements.length + 1).padStart(4, "0");
    setFormRef(`GRN-${new Date().getFullYear()}-${nextNum}`);
    setFormSupplierId(dbSuppliers[0]?.id ?? "");
    setFormProductId(activeProducts[0]?.id ?? "");
    setFormQty("1");
    setFormNotes("");
    setSaveError(null);
    setCreateOpen(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    if (!businessId || !formProductId) return;
    try {
      await createMutation.mutateAsync({
        business_id: businessId,
        product_id: formProductId,
        movement_type: "in",
        adjustment_type: null,
        adjustment_reason: null,
        quantity: Math.max(1, parseInt(formQty) || 1),
        reference: formRef.trim() || null,
        supplier_id: formSupplierId || null,
        reason: null,
        notes: formNotes.trim() || null,
        created_by: business?.owner_name ?? null,
      });
      setCreateOpen(false);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to record stock. Please try again."
      );
    }
  }

  // ── Current stock for selected product (shown in form)
  const selectedProduct = findProduct(formProductId);

  return (
    <>
      <SectionCard
        title="Stock In — Receive Inventory"
        subtitle={`${movements.length} stock-in records`}
        action={
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5">
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "list" ? "bg-slate-100 text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
              >
                <List className="h-3.5 w-3.5" /> List
              </button>
              <button
                onClick={() => setViewMode("timeline")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "timeline" ? "bg-slate-100 text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
              >
                <Clock className="h-3.5 w-3.5" /> Timeline
              </button>
            </div>
            <PrimaryButton icon={Plus} onClick={openCreate}>
              Receive Stock
            </PrimaryButton>
          </div>
        }
        noPadding
      >
        {isLoading ? (
          <TableSkeleton />
        ) : movements.length === 0 ? (
          <EmptyState
            icon={PackageOpen}
            title="No stock-in records"
            subtitle="Receive stock to see records here."
          />
        ) : viewMode === "list" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {["Reference", "Product", "Supplier", "Qty (+)", "Stock After", "Date & Time", "Notes", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-slate-500"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {movements.map((m, i) => {
                  const product = findProduct(m.product_id);
                  const supplier = m.supplier_id
                    ? findSupplier(m.supplier_id)
                    : undefined;
                  return (
                    <motion.tr
                      key={m.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                      className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-emerald-700">
                        {m.reference ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800">
                          {product?.name ?? m.product_id}
                        </span>
                        {product && (
                          <p className="text-[10px] text-slate-400">{product.sku}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {supplier?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                          +{m.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                        {m.new_stock}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {fmtMovementDate(m.created_at)} ·{" "}
                        {fmtMovementTime(m.created_at)}
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-[180px] truncate">
                        {m.notes || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <SecondaryButton onClick={() => setDetailItem(m)}>
                          View
                        </SecondaryButton>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Timeline View */
          <div className="p-6 space-y-0">
            {movements.map((m, i) => {
              const product = findProduct(m.product_id);
              const supplier = m.supplier_id
                ? findSupplier(m.supplier_id)
                : undefined;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}
                  className="flex gap-4"
                >
                  <div className="flex flex-col items-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
                      <PackageOpen className="h-4 w-4 text-emerald-600" />
                    </div>
                    {i < movements.length - 1 && (
                      <div className="w-0.5 flex-1 bg-slate-100 my-1" />
                    )}
                  </div>
                  <div className="pb-4 flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">
                          {product?.name ?? m.product_id}
                        </p>
                        <p className="text-xs text-slate-500">
                          {m.reference ?? "—"} · {supplier?.name ?? "Direct"}
                        </p>
                        {m.notes && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate">
                            {m.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                          +{m.quantity} units
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {fmtMovementDate(m.created_at)} ·{" "}
                          {fmtMovementTime(m.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Receive Stock</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Reference Number
              </label>
              <input
                type="text"
                value={formRef}
                onChange={(e) => setFormRef(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Supplier
              </label>
              <select
                value={formSupplierId}
                onChange={(e) => setFormSupplierId(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
              >
                <option value="">— No supplier —</option>
                {dbSuppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Product *
              </label>
              <select
                value={formProductId}
                onChange={(e) => setFormProductId(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
                required
              >
                <option value="">Select product…</option>
                {activeProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (SKU: {p.sku})
                  </option>
                ))}
              </select>
              {selectedProduct && (
                <p className="mt-1 text-xs text-slate-500">
                  Current stock:{" "}
                  <span className="font-semibold text-slate-700">
                    {selectedProduct.current_stock}
                  </span>
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Quantity *
              </label>
              <input
                type="number"
                min="1"
                value={formQty}
                onChange={(e) => setFormQty(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Notes
              </label>
              <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                placeholder="Optional notes…"
              />
            </div>
            {saveError && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {saveError}
              </p>
            )}
            <DialogFooter>
              <DialogClose asChild>
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </DialogClose>
              <PrimaryButton type="submit">
                {createMutation.isPending ? "Saving…" : "Receive Stock"}
              </PrimaryButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailItem} onOpenChange={(o) => !o && setDetailItem(null)}>
        <DialogContent className="max-w-md">
          {detailItem &&
            (() => {
              const product = findProduct(detailItem.product_id);
              const supplier = detailItem.supplier_id
                ? findSupplier(detailItem.supplier_id)
                : undefined;
              return (
                <>
                  <DialogHeader>
                    <DialogTitle>Stock Receipt Detail</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 pt-2">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Reference</span>
                        <span className="font-mono font-semibold text-emerald-700">
                          {detailItem.reference ?? "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Product</span>
                        <span className="font-semibold text-slate-800">
                          {product?.name ?? detailItem.product_id}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Supplier</span>
                        <span className="text-slate-700">
                          {supplier?.name ?? "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Quantity</span>
                        <span className="font-bold text-emerald-700">
                          +{detailItem.quantity} units
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Stock Before</span>
                        <span className="text-slate-700">
                          {detailItem.previous_stock}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Stock After</span>
                        <span className="font-semibold text-slate-700">
                          {detailItem.new_stock}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Date & Time</span>
                        <span className="text-slate-600">
                          {fmtMovementDate(detailItem.created_at)} ·{" "}
                          {fmtMovementTime(detailItem.created_at)}
                        </span>
                      </div>
                    </div>
                    {detailItem.notes && (
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-xs font-semibold text-slate-500 mb-1">
                          Notes
                        </p>
                        <p className="text-sm text-slate-700">{detailItem.notes}</p>
                      </div>
                    )}
                    <div className="flex justify-end">
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
