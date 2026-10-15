import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
  Trash2,
  RotateCcw,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ListChecks,
} from "lucide-react";
import { useBusiness } from "@/contexts/BusinessContext";
import { useProducts } from "@/hooks/useProductsQuery";
import {
  useInventoryMovements,
  useCreateStockAdjustment,
  filterMovements,
  fmtMovementDate,
  fmtMovementTime,
} from "@/hooks/useInventoryMovementsQuery";
import type { DbInventoryMovement } from "@/services/inventoryMovements";
import {
  ADJUSTMENT_REASONS,
} from "@/lib/inventory-data";
import type { AdjustmentType, AdjustmentReason } from "@/services/inventoryMovements";
import {
  SectionCard,
  StatusPill,
  PrimaryButton,
  EmptyState,
  StatTile,
} from "@/components/inventory/shared";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

// ── Local pending-adjustment type ──────────────────────────────────
// Pending adjustments live in React state only; they're inserted to DB
// (and stock updated) only when the user clicks "Approve".

interface PendingAdjustment {
  id: string;
  referenceNumber: string;
  productId: string;
  quantity: number;
  adjustmentType: AdjustmentType;
  adjustmentReason: AdjustmentReason;
  reason: string;
  performedBy: string;
  createdAt: string; // ISO
}

// ── Reason badge color map ─────────────────────────────────────────
const reasonColors: Record<string, string> = {
  damaged: "bg-red-50 text-red-700 border-red-200",
  expired: "bg-orange-50 text-orange-700 border-orange-200",
  lost: "bg-red-50 text-red-700 border-red-200",
  "quality-rejection": "bg-red-50 text-red-700 border-red-200",
  returned: "bg-blue-50 text-blue-700 border-blue-200",
  found: "bg-blue-50 text-blue-700 border-blue-200",
  "cycle-count": "bg-slate-100 text-slate-700 border-slate-200",
  manual: "bg-slate-100 text-slate-700 border-slate-200",
};

function getReasonLabel(value: AdjustmentReason | string | undefined): string {
  if (!value) return "—";
  return ADJUSTMENT_REASONS.find((r) => r.value === value)?.label ?? value;
}

const QUICK_ACTIONS = [
  { label: "Damaged Goods", reason: "damaged" as AdjustmentReason, adjustmentType: "decrease" as AdjustmentType, icon: Trash2, colorClass: "border-red-200 bg-red-50 text-red-600 hover:bg-red-100" },
  { label: "Customer Return", reason: "returned" as AdjustmentReason, adjustmentType: "decrease" as AdjustmentType, icon: RotateCcw, colorClass: "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100" },
  { label: "Expired / Obsolete", reason: "expired" as AdjustmentReason, adjustmentType: "decrease" as AdjustmentType, icon: Clock, colorClass: "border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100" },
  { label: "Manual Adjustment", reason: "manual" as AdjustmentReason, adjustmentType: "increase" as AdjustmentType, icon: SlidersHorizontal, colorClass: "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100" },
];

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

export function StockAdjustmentsTab() {
  const { business } = useBusiness();
  const businessId = business?.id ?? null;

  // ── Server state
  const { data: allMovements = [], isLoading: movementsLoading } =
    useInventoryMovements(businessId);
  const { data: dbProducts = [], isLoading: productsLoading } =
    useProducts(businessId);
  const createMutation = useCreateStockAdjustment(businessId);

  const dbAdjustments = filterMovements(allMovements, "adjustment");
  const isLoading = movementsLoading || productsLoading;

  // ── Local state (pending adjustments not yet committed to DB)
  const [pending, setPending] = useState<PendingAdjustment[]>([]);
  const [approveError, setApproveError] = useState<string | null>(null);

  // ── Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>("increase");
  const [saveError, setSaveError] = useState<string | null>(null);

  // Filter state
  const [filterType, setFilterType] = useState<"all" | AdjustmentType>("all");
  const [filterReason, setFilterReason] = useState<"all" | string>("all");

  // Form state
  const [formRef, setFormRef] = useState("");
  const [formProductId, setFormProductId] = useState("");
  const [formQty, setFormQty] = useState("1");
  const [formAdjReason, setFormAdjReason] = useState<AdjustmentReason>("manual");
  const [formPerformedBy, setFormPerformedBy] = useState("Warehouse Staff");
  const [formNotes, setFormNotes] = useState("");

  function findProduct(id: string) {
    return dbProducts.find((p) => p.id === id);
  }

  const activeProducts = dbProducts.filter((p) => p.status === "active");

  function openCreate(type: AdjustmentType, preReason?: AdjustmentReason) {
    const total = pending.length + dbAdjustments.length;
    setAdjustmentType(type);
    setFormAdjReason(preReason ?? "manual");
    setFormRef(`ADJ-${new Date().getFullYear()}-${String(total + 1).padStart(4, "0")}`);
    setFormProductId(activeProducts[0]?.id ?? "");
    setFormQty("1");
    setFormPerformedBy("Warehouse Staff");
    setFormNotes("");
    setSaveError(null);
    setCreateOpen(true);
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formProductId) return;
    const now = new Date().toISOString();
    setPending((prev) => [
      {
        id: `local_${Date.now()}`,
        referenceNumber: formRef,
        productId: formProductId,
        quantity: parseInt(formQty) || 1,
        adjustmentType,
        adjustmentReason: formAdjReason,
        reason: formNotes,
        performedBy: formPerformedBy,
        createdAt: now,
      },
      ...prev,
    ]);
    setCreateOpen(false);
  }

  async function handleApprove(adj: PendingAdjustment) {
    setApproveError(null);
    if (!businessId) return;
    try {
      await createMutation.mutateAsync({
        business_id: businessId,
        product_id: adj.productId,
        movement_type: "adjustment",
        adjustment_type: adj.adjustmentType,
        adjustment_reason: adj.adjustmentReason as AdjustmentReason,
        quantity: adj.quantity,
        reference: adj.referenceNumber || null,
        supplier_id: null,
        reason: adj.reason || null,
        notes: adj.reason || null,
        created_by: adj.performedBy || business?.owner_name || null,
      });
      setPending((prev) => prev.filter((p) => p.id !== adj.id));
    } catch (err) {
      setApproveError(
        err instanceof Error ? err.message : "Failed to approve adjustment."
      );
    }
  }

  function handleReject(id: string) {
    setPending((prev) => prev.filter((p) => p.id !== id));
  }

  // ── Stats (pending + DB combined)
  const totalAdjustments = pending.length + dbAdjustments.length;
  const pendingCount = pending.length;

  const totalIncreases = dbAdjustments
    .filter((m) => m.adjustment_type === "increase")
    .reduce((s, m) => s + m.quantity, 0);
  const totalDecreases = dbAdjustments
    .filter((m) => m.adjustment_type === "decrease")
    .reduce((s, m) => s + m.quantity, 0);

  // ── Filtered DB adjustments
  const filteredDb = useMemo(() => {
    return dbAdjustments.filter((m) => {
      if (filterType !== "all" && m.adjustment_type !== filterType) return false;
      if (filterReason !== "all" && m.adjustment_reason !== filterReason) return false;
      return true;
    });
  }, [dbAdjustments, filterType, filterReason]);

  // ── Filtered pending
  const filteredPending = useMemo(() => {
    return pending.filter((p) => {
      if (filterType !== "all" && p.adjustmentType !== filterType) return false;
      if (filterReason !== "all" && p.adjustmentReason !== filterReason) return false;
      return true;
    });
  }, [pending, filterType, filterReason]);

  const allFiltered = filteredPending.length + filteredDb.length;

  return (
    <>
      {/* Summary Stats */}
      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Total Adjustments" value={String(totalAdjustments)} icon={ListChecks} bg="bg-violet-50" iconColor="text-violet-600" index={0} />
        <StatTile label="Pending Approval" value={String(pendingCount)} icon={AlertTriangle} bg="bg-amber-50" iconColor="text-amber-600" index={1} />
        <StatTile label="Total Losses (Decrease)" value={`-${totalDecreases} units`} icon={TrendingDown} bg="bg-red-50" iconColor="text-red-600" index={2} />
        <StatTile label="Total Gains (Increase)" value={`+${totalIncreases} units`} icon={TrendingUp} bg="bg-emerald-50" iconColor="text-emerald-600" index={3} />
      </div>

      {/* Approval Required Banner */}
      {pendingCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3"
        >
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-600" />
          <p className="text-sm font-semibold text-amber-800">
            Approval Required —{" "}
            <span className="font-bold">{pendingCount}</span>{" "}
            {pendingCount === 1 ? "adjustment is" : "adjustments are"} awaiting approval.
            Approving will apply the stock change immediately.
          </p>
        </motion.div>
      )}

      {approveError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-3"
        >
          <XCircle className="h-4 w-4 flex-shrink-0 text-red-600" />
          <p className="text-sm font-semibold text-red-700">{approveError}</p>
        </motion.div>
      )}

      {/* Quick Action Buttons */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {QUICK_ACTIONS.map((qa) => {
          const Icon = qa.icon;
          return (
            <button
              key={qa.reason}
              onClick={() => openCreate(qa.adjustmentType, qa.reason)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${qa.colorClass}`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span>{qa.label}</span>
            </button>
          );
        })}
      </div>

      <SectionCard
        title="Stock Adjustments"
        subtitle={`${allFiltered} of ${totalAdjustments} adjustments`}
        action={
          <div className="flex items-center gap-2">
            <PrimaryButton icon={Plus} onClick={() => openCreate("increase")}>
              Increase Stock
            </PrimaryButton>
            <button
              onClick={() => openCreate("decrease")}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors"
            >
              <Plus className="h-4 w-4" /> Decrease Stock
            </button>
          </div>
        }
        noPadding
      >
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-6 py-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mr-1">Filter:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as "all" | AdjustmentType)}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-400"
          >
            <option value="all">All Types</option>
            <option value="increase">Increase</option>
            <option value="decrease">Decrease</option>
          </select>
          <select
            value={filterReason}
            onChange={(e) => setFilterReason(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-400"
          >
            <option value="all">All Reasons</option>
            {ADJUSTMENT_REASONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <div className="ml-auto flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700">+{totalIncreases} increased</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5">
              <XCircle className="h-3.5 w-3.5 text-red-500" />
              <span className="text-xs font-bold text-red-600">-{totalDecreases} decreased</span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : allFiltered === 0 ? (
          <EmptyState icon={SlidersHorizontal} title="No adjustments found" subtitle="Try changing your filters or create a new stock adjustment." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {["Reference", "Product", "Type", "Qty", "Reason", "Performed By", "Approval", "Date", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Pending rows first */}
                {filteredPending.map((adj, i) => {
                  const product = findProduct(adj.productId);
                  const reasonCls = reasonColors[adj.adjustmentReason] ?? "bg-slate-100 text-slate-600 border-slate-200";
                  return (
                    <motion.tr
                      key={adj.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                      className="border-b border-slate-50 bg-amber-50/30 hover:bg-amber-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-violet-700">{adj.referenceNumber}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{product?.name ?? adj.productId}</td>
                      <td className="px-4 py-3"><StatusPill status={adj.adjustmentType} /></td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${adj.adjustmentType === "increase" ? "text-emerald-700" : "text-red-600"}`}>
                          {adj.adjustmentType === "increase" ? "+" : "-"}{adj.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${reasonCls}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                          {getReasonLabel(adj.adjustmentReason)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{adj.performedBy || "—"}</td>
                      <td className="px-4 py-3"><StatusPill status="pending" /></td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{fmtMovementDate(adj.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleApprove(adj)}
                            disabled={createMutation.isPending}
                            className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-3 w-3" /> Approve
                          </button>
                          <button
                            onClick={() => handleReject(adj.id)}
                            className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
                          >
                            <XCircle className="h-3 w-3" /> Reject
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}

                {/* Committed DB rows */}
                {filteredDb.map((m: DbInventoryMovement, i) => {
                  const product = findProduct(m.product_id);
                  const reasonCls = m.adjustment_reason
                    ? reasonColors[m.adjustment_reason] ?? "bg-slate-100 text-slate-600 border-slate-200"
                    : "bg-slate-100 text-slate-600 border-slate-200";
                  return (
                    <motion.tr
                      key={m.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: (filteredPending.length + i) * 0.03 }}
                      className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-violet-700">{m.reference ?? "—"}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{product?.name ?? m.product_id}</td>
                      <td className="px-4 py-3">{m.adjustment_type && <StatusPill status={m.adjustment_type} />}</td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${m.adjustment_type === "increase" ? "text-emerald-700" : "text-red-600"}`}>
                          {m.adjustment_type === "increase" ? "+" : "-"}{m.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {m.adjustment_reason ? (
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${reasonCls}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                            {getReasonLabel(m.adjustment_reason)}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">{m.reason ?? "—"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{m.created_by ?? "—"}</td>
                      <td className="px-4 py-3"><StatusPill status="approved" /></td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{fmtMovementDate(m.created_at)}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">—</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Create Adjustment Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {adjustmentType === "increase" ? "Increase Stock" : "Decrease Stock"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div
              className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold"
              style={{
                borderColor: adjustmentType === "increase" ? "#a7f3d0" : "#fecaca",
                backgroundColor: adjustmentType === "increase" ? "#f0fdf4" : "#fff1f2",
                color: adjustmentType === "increase" ? "#065f46" : "#991b1b",
              }}
            >
              {adjustmentType === "increase" ? "📈 Stock Increase Adjustment" : "📉 Stock Decrease Adjustment"}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Reference Number</label>
              <input type="text" value={formRef} onChange={(e) => setFormRef(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Product *</label>
              <select value={formProductId} onChange={(e) => setFormProductId(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400" required>
                <option value="">Select product…</option>
                {activeProducts.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (Stock: {p.current_stock})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Quantity *</label>
              <input type="number" min="1" value={formQty} onChange={(e) => setFormQty(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Adjustment Reason *</label>
              <select value={formAdjReason} onChange={(e) => setFormAdjReason(e.target.value as AdjustmentReason)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400" required>
                {ADJUSTMENT_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Performed By</label>
              <input type="text" value={formPerformedBy} onChange={(e) => setFormPerformedBy(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400" placeholder="Warehouse Staff" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Notes / Reason</label>
              <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                placeholder="Additional notes for this adjustment…" required />
            </div>
            <p className="text-xs text-slate-400">
              This adjustment will be created with{" "}
              <span className="font-semibold text-amber-600">Pending</span> approval status.
              Stock is updated only after approval.
            </p>
            {saveError && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{saveError}</p>
            )}
            <DialogFooter>
              <DialogClose asChild>
                <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
              </DialogClose>
              <PrimaryButton type="submit">Submit Adjustment</PrimaryButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
