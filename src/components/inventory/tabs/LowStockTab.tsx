// ── LowStockTab ─── wired to Supabase products ─────────────────────
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ShoppingCart,
  Package,
  DollarSign,
  Download,
  XCircle,
  Filter,
} from "lucide-react";
import { useBusiness } from "@/contexts/BusinessContext";
import { useProducts, useCategories, useSuppliers } from "@/hooks/useProductsQuery";
import { dbToProduct } from "@/services/products";
import type { DbProduct } from "@/services/products";
import {
  getStockStatus,
  reorderQty,
  fmtINR,
  estimatedDaysRemaining,
} from "@/lib/inventory-data";
import type { Product } from "@/lib/inventory-data";
import {
  SectionCard,
  StatusPill,
  Select,
  SearchInput,
} from "@/components/inventory/shared";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

type Priority = "all" | "out-of-stock" | "critical" | "low-stock";

// ── Helpers (unchanged from original) ─────────────────────────────

function priorityLabel(p: Product): string {
  const s = getStockStatus(p);
  if (s === "out-of-stock") return "OUT OF STOCK";
  if (s === "critical") return "CRITICAL";
  return "LOW STOCK";
}

function priorityBadgeClass(p: Product): string {
  const s = getStockStatus(p);
  if (s === "out-of-stock") return "bg-red-100 text-red-700 border border-red-200";
  if (s === "critical") return "bg-orange-100 text-orange-700 border border-orange-200";
  return "bg-amber-100 text-amber-700 border border-amber-200";
}

function rowBg(p: Product): string {
  const s = getStockStatus(p);
  if (s === "out-of-stock") return "bg-red-50/40 hover:bg-red-50/70";
  if (s === "critical") return "bg-orange-50/30 hover:bg-orange-50/60";
  return "bg-amber-50/20 hover:bg-amber-50/40";
}

function accentBar(p: Product): string {
  const s = getStockStatus(p);
  if (s === "out-of-stock") return "bg-red-600";
  if (s === "critical") return "bg-orange-500";
  return "bg-amber-400";
}

function stockColor(p: Product): string {
  const s = getStockStatus(p);
  if (s === "out-of-stock") return "text-red-600";
  if (s === "critical") return "text-orange-600";
  return "text-amber-700";
}

function progressBarColor(p: Product): string {
  const s = getStockStatus(p);
  if (s === "out-of-stock" || s === "critical") return "bg-red-500";
  return "bg-amber-400";
}

function stockProgress(p: Product): number {
  if (p.minStock <= 0) return 0;
  return Math.min(100, (p.currentStock / p.minStock) * 100);
}

function DaysRemainingBadge({ product }: { product: Product }) {
  const days = estimatedDaysRemaining(product);
  if (days === null) return <span className="text-xs text-muted-foreground">N/A</span>;
  if (days <= 3) return <span className="text-xs font-semibold text-red-600">{days}d</span>;
  if (days <= 7) return <span className="text-xs font-semibold text-amber-600">{days}d</span>;
  return <span className="text-xs text-foreground">{days}d</span>;
}

// ── Export CSV ────────────────────────────────────────────────────

function exportReorderCSV(productList: Product[]) {
  const header = ["Product", "SKU", "Barcode", "Priority", "Current Stock", "Min Stock", "Reorder Qty", "Unit Price (INR)", "Estimated Cost (INR)"];
  const rows = productList.map((p) => [
    p.name, p.sku, p.barcode, priorityLabel(p),
    p.currentStock, p.minStock, reorderQty(p),
    p.purchasePrice, reorderQty(p) * p.purchasePrice,
  ]);
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "reorder-list.csv"; a.click();
  URL.revokeObjectURL(url);
}

// ── Create PO Dialog ──────────────────────────────────────────────

function CreatePODialog({
  product, open, onClose, onConfirm,
}: {
  product: Product | null; open: boolean; onClose: () => void; onConfirm: () => void;
}) {
  if (!product) return null;
  const qty = reorderQty(product);
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Create Purchase Order Draft</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <p className="font-semibold text-foreground">{product.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">SKU: {product.sku}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div><p className="text-muted-foreground">Current Stock</p><p className="font-semibold text-foreground">{product.currentStock}</p></div>
              <div><p className="text-muted-foreground">Recommended Qty</p><p className="font-semibold text-foreground">{qty}</p></div>
              <div><p className="text-muted-foreground">Unit Price</p><p className="font-semibold text-foreground">{fmtINR(product.purchasePrice)}</p></div>
              <div><p className="text-muted-foreground">Estimated Cost</p><p className="font-semibold text-foreground">{fmtINR(qty * product.purchasePrice)}</p></div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            A draft purchase order will be created for the recommended reorder quantity.
            You can edit it in the Purchase Orders tab before submitting.
          </p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-slate-50">Cancel</button>
          </DialogClose>
          <button
            onClick={onConfirm}
            className="inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <ShoppingCart className="h-4 w-4" /> Create Draft PO
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Product Row ───────────────────────────────────────────────────

function LowStockRow({
  product, index, categoryName, supplierName, onCreatePO,
}: {
  product: Product; index: number; categoryName: string; supplierName: string;
  onCreatePO: (p: Product) => void;
}) {
  const qty = reorderQty(product);
  const progress = stockProgress(product);
  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className={`group relative border-b border-slate-100 transition-colors last:border-0 ${rowBg(product)}`}
    >
      <td className="w-1 p-0">
        <div className={`h-full w-1 rounded-r-full ${accentBar(product)}`} style={{ minHeight: "56px" }} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{product.emoji}</span>
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">{product.name}</p>
            <p className="text-xs text-muted-foreground">{product.sku}</p>
            {product.barcode && <p className="text-[10px] text-muted-foreground font-mono">{product.barcode}</p>}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-foreground">{categoryName || "—"}</td>
      <td className="px-4 py-3">
        <div>
          <span className={`text-sm font-bold ${stockColor(product)}`}>{product.currentStock}</span>
          <div className="mt-1 h-1.5 w-16 rounded-full bg-slate-200">
            <div className={`h-1.5 rounded-full ${progressBarColor(product)}`} style={{ width: `${progress}%` }} />
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-foreground">{product.minStock}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${priorityBadgeClass(product)}`}>
          {priorityLabel(product)}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground leading-none mb-0.5">Est. Days</span>
          <DaysRemainingBadge product={product} />
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Suggest: <span className="font-semibold text-foreground">{qty} units</span></span>
          <span className="text-xs text-muted-foreground">{fmtINR(qty * product.purchasePrice)}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-foreground">{supplierName || "—"}</td>
      <td className="px-4 py-3">
        <button
          onClick={() => onCreatePO(product)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-slate-50 hover:border-slate-300"
        >
          <ShoppingCart className="h-3.5 w-3.5" /> Create PO
        </button>
      </td>
    </motion.tr>
  );
}

// ── Reorder Suggestions Panel ─────────────────────────────────────

function ReorderSuggestionsPanel({ productList }: { productList: Product[] }) {
  const total = productList.reduce((sum, p) => sum + reorderQty(p) * p.purchasePrice, 0);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Reorder Suggestions</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{productList.length} items to reorder</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportReorderCSV(productList)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
          <button
            onClick={() => alert("Create All POs — this would create draft purchase orders for all alert items.")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[image:var(--gradient-brand)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <ShoppingCart className="h-3.5 w-3.5" /> Create All POs
          </button>
        </div>
      </div>
      <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
        {productList.map((p) => {
          const qty = reorderQty(p);
          const cost = qty * p.purchasePrice;
          return (
            <div key={p.id} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-lg shrink-0">{p.emoji}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">{qty} units × {fmtINR(p.purchasePrice)}</p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className="text-xs font-bold text-foreground">{fmtINR(cost)}</p>
                <span className={`inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${priorityBadgeClass(p)}`}>
                  {priorityLabel(p)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-slate-200 px-5 py-3 flex items-center justify-between bg-slate-50 rounded-b-2xl">
        <span className="text-sm font-semibold text-foreground">Total Reorder Cost</span>
        <span className="text-sm font-bold text-foreground">{fmtINR(total)}</span>
      </div>
    </div>
  );
}

// ── Loading skeleton ───────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100">
      {Array.from({ length: 10 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded-lg bg-slate-100 animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

// ── Main Component ────────────────────────────────────────────────

export function LowStockTab({ onCreatePO }: { onCreatePO?: () => void } = {}) {
  const { business } = useBusiness();
  const businessId = business?.id ?? null;

  const { data: dbProducts = [], isLoading: productsLoading } = useProducts(businessId);
  const { data: dbCategories = [] } = useCategories(businessId);
  const { data: dbSuppliers = [] } = useSuppliers(businessId);

  const [priority, setPriority] = useState<Priority>("all");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogProduct, setDialogProduct] = useState<Product | null>(null);
  const [poConfirmed, setPoConfirmed] = useState<string[]>([]);

  // ── Lookup helpers
  function getCategoryName(id: string) {
    return dbCategories.find((c) => c.id === id)?.name ?? "";
  }
  function getSupplierName(id: string) {
    return dbSuppliers.find((s) => s.id === id)?.name ?? "";
  }

  // ── Convert DB products to UI Product type for helper functions
  const allProducts: Product[] = useMemo(
    () => (dbProducts as DbProduct[]).map(dbToProduct),
    [dbProducts]
  );

  // ── Alert products
  const allAlertProducts = useMemo(
    () =>
      allProducts.filter((p) => {
        const s = getStockStatus(p);
        return s === "out-of-stock" || s === "critical" || s === "low-stock";
      }),
    [allProducts]
  );

  const outOfStockProducts = useMemo(
    () => allAlertProducts.filter((p) => getStockStatus(p) === "out-of-stock"),
    [allAlertProducts]
  );
  const criticalProducts = useMemo(
    () => allAlertProducts.filter((p) => getStockStatus(p) === "critical"),
    [allAlertProducts]
  );
  const lowProducts = useMemo(
    () => allAlertProducts.filter((p) => getStockStatus(p) === "low-stock"),
    [allAlertProducts]
  );
  const totalReorderCost = useMemo(
    () => allAlertProducts.reduce((sum, p) => sum + reorderQty(p) * p.purchasePrice, 0),
    [allAlertProducts]
  );

  // ── Category options from real alert products
  const categoryOptions = useMemo(() => [
    { value: "all", label: "All Categories" },
    ...Array.from(
      new Map(
        allAlertProducts
          .map((p) => ({ id: p.categoryId, name: getCategoryName(p.categoryId) }))
          .filter((c) => c.name)
          .map((c) => [c.id, { value: c.id, label: c.name }])
      ).values()
    ),
  ], [allAlertProducts, dbCategories]);

  // ── Filter chain
  const priorityFiltered =
    priority === "out-of-stock" ? outOfStockProducts
    : priority === "critical" ? criticalProducts
    : priority === "low-stock" ? lowProducts
    : allAlertProducts;

  const categoryFiltered =
    categoryFilter === "all"
      ? priorityFiltered
      : priorityFiltered.filter((p) => p.categoryId === categoryFilter);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categoryFiltered;
    return categoryFiltered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
    );
  }, [categoryFiltered, search]);

  function handleCreatePO(p: Product) { setDialogProduct(p); }
  function handleConfirmPO() {
    if (dialogProduct) {
      setPoConfirmed((prev) => [...prev, dialogProduct.id]);
      onCreatePO?.();
    }
    setDialogProduct(null);
  }

  return (
    <div className="space-y-6">
      {/* ── Summary Stats ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
          className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100">
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            {productsLoading ? <div className="h-6 w-8 animate-pulse rounded bg-red-200" /> : <p className="text-xl font-bold text-red-700">{outOfStockProducts.length}</p>}
            <p className="text-xs text-red-600 font-medium">Out of Stock</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
          className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            {productsLoading ? <div className="h-6 w-8 animate-pulse rounded bg-orange-200" /> : <p className="text-xl font-bold text-orange-700">{criticalProducts.length}</p>}
            <p className="text-xs text-orange-600 font-medium">Critical Stock</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
            <Package className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            {productsLoading ? <div className="h-6 w-8 animate-pulse rounded bg-amber-200" /> : <p className="text-xl font-bold text-amber-700">{lowProducts.length}</p>}
            <p className="text-xs text-amber-600 font-medium">Low Stock</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
            <DollarSign className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            {productsLoading ? <div className="h-6 w-16 animate-pulse rounded bg-slate-200" /> : <p className="text-lg font-bold text-foreground leading-tight">{fmtINR(totalReorderCost)}</p>}
            <p className="text-xs text-muted-foreground">Est. Reorder Cost</p>
          </div>
        </motion.div>
      </div>

      {/* ── Warning banners ────────────────────────────────────── */}
      {outOfStockProducts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <XCircle className="h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm font-semibold text-red-700">
            🚨 {outOfStockProducts.length} product{outOfStockProducts.length > 1 ? "s are" : " is"} completely out of stock — immediate reordering required.
          </p>
        </motion.div>
      )}
      {criticalProducts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-orange-600" />
          <p className="text-sm font-semibold text-orange-700">
            ⚠ {criticalProducts.length} product{criticalProducts.length > 1 ? "s are" : " is"} at critical stock levels (≤50% of minimum).
          </p>
        </motion.div>
      )}
      {poConfirmed.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <ShoppingCart className="h-4 w-4 shrink-0 text-emerald-600" />
          <p className="text-sm font-semibold text-emerald-700">
            {poConfirmed.length} draft purchase order{poConfirmed.length > 1 ? "s" : ""} created this session.
          </p>
        </div>
      )}

      {/* ── Main layout ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="flex-1 min-w-0">
          <SectionCard
            title="Low Stock Alerts"
            subtitle={`${allAlertProducts.length} items need attention`}
            action={
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <SearchInput value={search} onChange={setSearch} placeholder="Name, SKU, barcode…" className="w-48" />
                <Select value={categoryFilter} onChange={setCategoryFilter} options={categoryOptions} className="w-40" />
                <Select
                  value={priority}
                  onChange={(v) => setPriority(v as Priority)}
                  options={[
                    { value: "all", label: "All Priorities" },
                    { value: "out-of-stock", label: "Out of Stock" },
                    { value: "critical", label: "Critical Only" },
                    { value: "low-stock", label: "Low Stock Only" },
                  ]}
                  className="w-40"
                />
              </div>
            }
          >
            {(priority !== "all" || categoryFilter !== "all" || search) && (
              <div className="mb-4 flex items-center gap-2 flex-wrap">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Showing {visible.length} of {allAlertProducts.length} items
                </span>
                {priority !== "all" && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Priority: {priority}</span>
                )}
                {categoryFilter !== "all" && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    Category: {categoryOptions.find((c) => c.value === categoryFilter)?.label}
                  </span>
                )}
                {search && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Search: "{search}"</span>
                )}
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[960px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left">
                    <th className="w-1 p-0" />
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Product</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Category</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Stock</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Min Stock</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Priority</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Days Left</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Reorder Suggestion</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Supplier</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productsLoading ? (
                    Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
                  ) : visible.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-sm text-muted-foreground">
                        {allAlertProducts.length === 0
                          ? "All products are well-stocked. 🎉"
                          : "No items match the selected filters."}
                      </td>
                    </tr>
                  ) : (
                    visible.map((p, i) => (
                      <LowStockRow
                        key={p.id}
                        product={p}
                        index={i}
                        categoryName={getCategoryName(p.categoryId)}
                        supplierName={getSupplierName(p.supplierId)}
                        onCreatePO={handleCreatePO}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>

        {/* Reorder Suggestions side panel */}
        <div className="w-full xl:w-80 shrink-0">
          <ReorderSuggestionsPanel productList={allAlertProducts} />
        </div>
      </div>

      <CreatePODialog
        product={dialogProduct}
        open={!!dialogProduct}
        onClose={() => setDialogProduct(null)}
        onConfirm={handleConfirmPO}
      />
    </div>
  );
}
