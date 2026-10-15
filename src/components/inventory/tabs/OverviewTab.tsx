// ── Inventory Overview Tab — wired to Supabase ────────────────────
import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Package,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShoppingCart,
  Users,
  Activity,
  PackagePlus,
  ArrowDownToLine,
  SlidersHorizontal,
  BarChart3,
  ArrowUpFromLine,
  Wrench,
  Zap,
  Layers,
  TrendingUp,
  TrendingDown,
  Archive,
  Clock,
  Flame,
  Snail,
  Target,
  Brain,
  Lock,
  Sparkles,
  Building2,
  Star,
  PackageCheck,
  AlertOctagon,
  BadgeDollarSign,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useBusiness } from "@/contexts/BusinessContext";
import {
  useProducts,
  useCategories,
  useSuppliers,
} from "@/hooks/useProductsQuery";
import {
  useInventoryMovements,
  fmtMovementDate,
  fmtMovementTime,
} from "@/hooks/useInventoryMovementsQuery";
import { dbToProduct } from "@/services/products";
import type { DbCategory } from "@/services/products";
import { getStockStatus, fmtINR, estimatedDaysRemaining } from "@/lib/inventory-data";
import type { Product } from "@/lib/inventory-data";
import {
  SectionCard,
  StatTile,
  fmtDate,
} from "@/components/inventory/shared";

// ── Colour map (Tailwind class → hex) ─────────────────────────────
const tailwindToHex: Record<string, string> = {
  "bg-blue-500": "#3b82f6",
  "bg-violet-500": "#8b5cf6",
  "bg-emerald-500": "#10b981",
  "bg-amber-500": "#f59e0b",
  "bg-red-500": "#ef4444",
  "bg-cyan-500": "#06b6d4",
  "bg-orange-500": "#f97316",
  "bg-pink-500": "#ec4899",
  "bg-blue-100": "#dbeafe",
  "bg-slate-100": "#f1f5f9",
};

// ── Stock value helper ─────────────────────────────────────────────
function stockVal(p: Product) {
  return p.currentStock * p.purchasePrice;
}

// ── Quick Actions (static config) ─────────────────────────────────
const quickActions = [
  { label: "Add Product", icon: PackagePlus, color: "bg-blue-600 hover:bg-blue-700", desc: "Add to inventory", tabId: "products" },
  { label: "Create Purchase Order", icon: ShoppingCart, color: "bg-violet-600 hover:bg-violet-700", desc: "Order from supplier", tabId: "purchase-orders" },
  { label: "Receive Stock", icon: ArrowDownToLine, color: "bg-emerald-600 hover:bg-emerald-700", desc: "Record GRN / stock-in", tabId: "stock-in" },
  { label: "Adjust Stock", icon: SlidersHorizontal, color: "bg-amber-600 hover:bg-amber-700", desc: "Correct stock levels", tabId: "stock-adjustments" },
  { label: "View Reports", icon: BarChart3, color: "bg-[image:var(--gradient-brand)]", desc: "Business insights", tabId: "reports" },
];

// ── Movement → activity config ─────────────────────────────────────
type MovementActivityType = "stock-in" | "stock-out" | "stock-adjusted";

function getMovementConfig(type: MovementActivityType): { icon: React.ElementType; bg: string; iconColor: string } {
  switch (type) {
    case "stock-in": return { icon: ArrowDownToLine, bg: "bg-emerald-50", iconColor: "text-emerald-600" };
    case "stock-out": return { icon: ArrowUpFromLine, bg: "bg-red-50", iconColor: "text-red-600" };
    case "stock-adjusted": return { icon: Wrench, bg: "bg-violet-50", iconColor: "text-violet-600" };
    default: return { icon: Activity, bg: "bg-slate-50", iconColor: "text-slate-600" };
  }
}

// ── Custom Tooltips ─────────────────────────────────────────────────
function ChartTip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
      <p className="mb-1.5 text-xs font-semibold text-slate-500">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-1.5 text-sm font-bold text-foreground">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          {p.value} <span className="text-xs font-normal text-muted-foreground">{p.name}</span>
        </p>
      ))}
    </div>
  );
}

function PieTip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { fullName: string } }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
      <p className="text-xs font-semibold text-foreground">{p.payload.fullName}</p>
      <p className="mt-0.5 text-sm font-bold text-foreground">{fmtINR(p.value)}</p>
    </div>
  );
}

// ── KPI Card Row ─────────────────────────────────────────────────────
interface KpiCard {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  bg: string;
  iconColor: string;
}

function KpiRow({ cards, startIndex = 0 }: { cards: KpiCard[]; startIndex?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((card, i) => (
        <StatTile
          key={card.label}
          label={card.label}
          value={card.value}
          sub={card.sub}
          icon={card.icon}
          bg={card.bg}
          iconColor={card.iconColor}
          index={startIndex + i}
        />
      ))}
    </div>
  );
}

// ── Loading skeleton ───────────────────────────────────────────────
function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((col) => (
            <div key={col} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ))}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-72 rounded-2xl bg-slate-100 animate-pulse" />
        <div className="h-72 rounded-2xl bg-slate-100 animate-pulse" />
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export function OverviewTab({ onNavigate }: { onNavigate?: (tabId: string) => void }) {
  const { business } = useBusiness();
  const businessId = business?.id ?? null;

  // ── Server state ───────────────────────────────────────────────
  const { data: dbProducts = [], isLoading: productsLoading } = useProducts(businessId);
  const { data: dbCategories = [], isLoading: categoriesLoading } = useCategories(businessId);
  const { data: dbSuppliers = [], isLoading: suppliersLoading } = useSuppliers(businessId);
  const { data: movements = [], isLoading: movementsLoading } = useInventoryMovements(businessId);

  const isLoading = productsLoading || categoriesLoading || suppliersLoading || movementsLoading;

  // ── UI-adapted data ────────────────────────────────────────────
  const products = useMemo(() => dbProducts.map(dbToProduct), [dbProducts]);

  // Map product id → UI product for quick lookup
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  // ── KPI Derivations ────────────────────────────────────────────
  const totalProducts = products.length;
  const availableStock = products.filter((p) => p.currentStock > 0).length;
  const outOfStock = products.filter((p) => p.currentStock <= 0).length;
  const lowStockItems = products.filter((p) => getStockStatus(p) === "low-stock").length;
  const criticalStock = products.filter(
    (p) => p.currentStock > 0 && p.currentStock <= Math.floor(p.minStock * 0.5)
  ).length;
  const supplierCount = dbSuppliers.length;
  const categoryCount = dbCategories.length;
  const totalInvValue = products.reduce((s, p) => s + stockVal(p), 0);
  const inStockCount = products.filter((p) => p.currentStock > 0).length;
  const healthScore = totalProducts > 0 ? Math.round((inStockCount / totalProducts) * 100) : 100;

  // Movement-based KPIs
  const allMovementDates = useMemo(() => {
    const dates = [...new Set(movements.map((m) => m.created_at.split("T")[0]))].sort();
    return dates;
  }, [movements]);

  const mostRecentDate = allMovementDates[allMovementDates.length - 1] ?? "";
  const todayMovements = useMemo(() => {
    if (!mostRecentDate) return 0;
    return movements.filter((m) => m.created_at.startsWith(mostRecentDate)).length;
  }, [movements, mostRecentDate]);

  // Out-movement counts by product
  const outByProduct = useMemo(() => {
    const map: Record<string, number> = {};
    movements.filter((m) => m.movement_type === "out").forEach((m) => {
      map[m.product_id] = (map[m.product_id] ?? 0) + m.quantity;
    });
    return map;
  }, [movements]);

  // In-movement counts by product
  const inByProduct = useMemo(() => {
    const map: Record<string, number> = {};
    movements.filter((m) => m.movement_type === "in").forEach((m) => {
      map[m.product_id] = (map[m.product_id] ?? 0) + m.quantity;
    });
    return map;
  }, [movements]);

  const fastMovingCount = Math.min(5, Object.keys(outByProduct).length);

  const deadStockItems = products.filter(
    (p) => p.currentStock > p.maxStock * 0.8 && !outByProduct[p.id]
  ).length;

  const slowMovingItems = products.filter((p) => (outByProduct[p.id] ?? 0) <= 1).length;

  // ── Stock Movement Chart (last 7 distinct dates) ───────────────
  const movementChartData = useMemo(() => {
    const last7 = allMovementDates.slice(-7);
    return last7.map((date) => {
      const day = movements.filter((m) => m.created_at.startsWith(date));
      const inQty = day.filter((m) => m.movement_type === "in").reduce((s, m) => s + m.quantity, 0);
      const outQty = day.filter((m) => m.movement_type === "out").reduce((s, m) => s + m.quantity, 0);
      const adjQty = day.filter((m) => m.movement_type === "adjustment").reduce((s, m) => s + m.quantity, 0);
      const label = new Date(date + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      return { date: label, In: inQty, Out: outQty, Adj: adjQty };
    });
  }, [allMovementDates, movements]);

  // ── Inventory Value by Category (Pie) ──────────────────────────
  const pieData = useMemo(() => {
    const valueMap: Record<string, number> = {};
    products.forEach((p) => {
      valueMap[p.categoryId] = (valueMap[p.categoryId] ?? 0) + stockVal(p);
    });
    return dbCategories
      .filter((c) => (valueMap[c.id] ?? 0) > 0)
      .map((c) => ({
        name: c.name.split(" ")[0],
        fullName: c.name,
        value: valueMap[c.id] ?? 0,
        color: tailwindToHex[c.color] ?? "#94a3b8",
      }));
  }, [products, dbCategories]);

  // ── Top Selling ────────────────────────────────────────────────
  const topSelling = useMemo(() => {
    return Object.entries(outByProduct)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pid, qty]) => ({ product: productMap.get(pid), qty }))
      .filter((x) => x.product != null) as { product: Product; qty: number }[];
  }, [outByProduct, productMap]);

  // ── Most Purchased ─────────────────────────────────────────────
  const mostPurchased = useMemo(() => {
    return Object.entries(inByProduct)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pid, qty]) => ({ product: productMap.get(pid), qty }))
      .filter((x) => x.product != null) as { product: Product; qty: number }[];
  }, [inByProduct, productMap]);

  // ── Category Distribution ──────────────────────────────────────
  const categoryDist = useMemo(() => {
    return dbCategories
      .map((c) => ({
        name: c.name,
        count: products.filter((p) => p.categoryId === c.id).length,
        color: tailwindToHex[c.color] ?? "#94a3b8",
      }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [dbCategories, products]);
  const maxCatCount = categoryDist[0]?.count ?? 1;

  // ── Category map for reorder section ──────────────────────────
  const categoryMap = useMemo(
    () => new Map(dbCategories.map((c) => [c.id, c])),
    [dbCategories]
  );

  // ── Products to Reorder ────────────────────────────────────────
  const toReorder = useMemo(() =>
    products
      .filter((p) => p.currentStock <= p.minStock)
      .sort((a, b) => a.currentStock - b.currentStock)
      .slice(0, 5),
    [products]
  );

  // ── Excess Inventory ───────────────────────────────────────────
  const excessInventory = useMemo(() =>
    products
      .filter((p) => p.maxStock > 0 && p.currentStock > p.maxStock * 0.8)
      .sort((a, b) => stockVal(b) - stockVal(a))
      .slice(0, 3),
    [products]
  );

  // ── Highest Value Product ──────────────────────────────────────
  const highestValueProduct = useMemo(() =>
    [...products].sort((a, b) => stockVal(b) - stockVal(a))[0] ?? null,
    [products]
  );

  // ── Activity timeline from movements ──────────────────────────
  const recentActivities = useMemo(() => {
    return movements.slice(0, 10).map((m) => {
      const product = productMap.get(m.product_id);
      const type: MovementActivityType =
        m.movement_type === "in" ? "stock-in"
          : m.movement_type === "out" ? "stock-out"
          : "stock-adjusted";
      const label = m.movement_type === "in" ? "Stock In"
        : m.movement_type === "out" ? "Stock Out"
        : "Stock Adjusted";
      return {
        id: m.id,
        type,
        title: `${label}: ${product?.name ?? "Unknown Product"}`,
        description: `Qty: ${m.quantity}${m.reference ? ` · Ref: ${m.reference}` : ""}${m.notes ? ` · ${m.notes}` : ""}`,
        user: m.created_by ?? "System",
        time: fmtMovementTime(m.created_at),
        date: m.created_at.split("T")[0],
      };
    });
  }, [movements, productMap]);

  // ── KPI Rows ───────────────────────────────────────────────────
  const row1: KpiCard[] = [
    { label: "Total Inventory Value", value: fmtINR(totalInvValue), icon: IndianRupee, bg: "bg-emerald-50", iconColor: "text-emerald-600" },
    { label: "Available Stock", value: String(availableStock), sub: "products with stock > 0", icon: CheckCircle2, bg: "bg-cyan-50", iconColor: "text-cyan-600" },
    { label: "Total Products", value: String(totalProducts), sub: "across all categories", icon: Package, bg: "bg-blue-50", iconColor: "text-blue-600" },
    { label: "Out of Stock", value: String(outOfStock), sub: `${outOfStock} SKUs`, icon: XCircle, bg: "bg-red-50", iconColor: "text-red-600" },
  ];

  const row2: KpiCard[] = [
    { label: "Low Stock Items", value: String(lowStockItems), sub: "below min threshold", icon: AlertTriangle, bg: "bg-amber-50", iconColor: "text-amber-600" },
    { label: "Critical Stock", value: String(criticalStock), sub: "≤ 50% of min stock", icon: AlertOctagon, bg: "bg-rose-50", iconColor: "text-rose-600" },
    { label: "Categories", value: String(categoryCount), sub: "product families", icon: Layers, bg: "bg-pink-50", iconColor: "text-pink-600" },
    { label: "Suppliers", value: String(supplierCount), sub: "active vendors", icon: Users, bg: "bg-orange-50", iconColor: "text-orange-600" },
  ];

  const row3: KpiCard[] = [
    { label: "Dead Stock", value: String(deadStockItems), sub: "items, no out-movement", icon: Snail, bg: "bg-slate-50", iconColor: "text-slate-500" },
    { label: "Fast Moving", value: `${fastMovingCount} Products`, sub: "top by out-movement", icon: Flame, bg: "bg-red-50", iconColor: "text-red-500" },
    { label: "Slow Moving", value: String(slowMovingItems), sub: "0–1 out-movements", icon: TrendingDown, bg: "bg-amber-50", iconColor: "text-amber-500" },
    { label: "Today's Movements", value: String(todayMovements), sub: mostRecentDate ? fmtDate(mostRecentDate) : "No movements yet", icon: Activity, bg: "bg-teal-50", iconColor: "text-teal-600" },
  ];

  // ── Loading state ──────────────────────────────────────────────
  if (isLoading) return <OverviewSkeleton />;

  return (
    <div className="space-y-6">

      {/* ── KPI Row 1: Valuation & Availability ─────────────────── */}
      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Valuation &amp; Availability</p>
        <KpiRow cards={row1} startIndex={0} />
      </div>

      {/* ── KPI Row 2: Risk & Procurement ───────────────────────── */}
      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Risk &amp; Procurement</p>
        <KpiRow cards={row2} startIndex={4} />
      </div>

      {/* ── KPI Row 3: Stock Quality Indicators ─────────────────── */}
      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Stock Quality Indicators</p>
        <KpiRow cards={row3} startIndex={8} />
      </div>

      {/* ── Charts Row 1 ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Stock Movement Bar Chart */}
        <SectionCard
          title="Stock Movement"
          subtitle="Last 7 active days · quantity"
          action={
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />In</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400" />Out</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-400" />Adj</span>
            </div>
          }
        >
          {movementChartData.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
              <p className="text-xs text-muted-foreground">No stock movements yet. Record Stock In or Stock Out to see the chart.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={movementChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "rgba(241,245,249,0.6)", radius: 6 }} content={<ChartTip />} />
                <Bar dataKey="In" name="In" fill="#10b981" radius={[5, 5, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Out" name="Out" fill="#f87171" radius={[5, 5, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Adj" name="Adj" fill="#c4b5fd" radius={[5, 5, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        {/* Inventory Value by Category Pie */}
        <SectionCard title="Inventory Value by Category" subtitle="By purchase cost · INR">
          {pieData.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
              <p className="text-xs text-muted-foreground">Add products with categories to see the breakdown.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={2}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-1 flex-col gap-2">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="flex-1 truncate text-xs text-foreground">{d.fullName}</span>
                    <span className="shrink-0 text-xs font-semibold text-foreground">{fmtINR(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── Charts Row 2 ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Selling */}
        <SectionCard title="Top Selling Products" subtitle="By stock-out quantity" action={<Flame className="h-4 w-4 text-red-500" />}>
          <div className="space-y-3">
            {topSelling.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">No outbound movements yet</p>
            )}
            {topSelling.map((item, i) => (
              <div key={item.product.id} className="flex items-center gap-3">
                <span className="w-4 shrink-0 text-xs font-bold text-muted-foreground">{i + 1}</span>
                <span className="text-base">{item.product.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="truncate text-xs font-medium text-foreground">{item.product.name}</span>
                    <span className="ml-2 shrink-0 text-xs font-bold text-red-600">{item.qty} out</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.qty / (topSelling[0]?.qty ?? 1)) * 100}%` }}
                      transition={{ duration: 0.7, delay: 0.08 * i, ease: "easeOut" }}
                      className="h-1.5 rounded-full bg-red-400"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Most Purchased */}
        <SectionCard title="Most Purchased Products" subtitle="By stock-in quantity">
          <div className="space-y-3">
            {mostPurchased.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">No inbound movements yet</p>
            )}
            {mostPurchased.map((item, i) => (
              <div key={item.product.id} className="flex items-center gap-3">
                <span className="w-4 shrink-0 text-xs font-bold text-muted-foreground">{i + 1}</span>
                <span className="text-base">{item.product.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="truncate text-xs font-medium text-foreground">{item.product.name}</span>
                    <span className="ml-2 shrink-0 text-xs font-bold text-emerald-600">{item.qty} in</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.qty / (mostPurchased[0]?.qty ?? 1)) * 100}%` }}
                      transition={{ duration: 0.7, delay: 0.08 * i, ease: "easeOut" }}
                      className="h-1.5 rounded-full bg-emerald-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ── Category Distribution ────────────────────────────────── */}
      <SectionCard title="Category Distribution" subtitle="Products per category">
        <div className="space-y-3">
          {categoryDist.length === 0 && (
            <p className="py-4 text-center text-xs text-muted-foreground">No categories with products yet</p>
          )}
          {categoryDist.map((cat, i) => (
            <div key={cat.name} className="flex items-center gap-3">
              <span className="w-4 shrink-0 text-xs font-bold text-muted-foreground">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="mb-1 flex items-center justify-between">
                  <span className="truncate text-xs font-medium text-foreground">{cat.name}</span>
                  <span className="ml-2 shrink-0 text-xs font-bold text-foreground">{cat.count}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(cat.count / maxCatCount) * 100}%` }}
                    transition={{ duration: 0.7, delay: 0.08 * i, ease: "easeOut" }}
                    className="h-1.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Inventory Insights ───────────────────────────────────── */}
      <SectionCard
        title="Inventory Insights"
        subtitle="Actionable signals from your stock data"
        action={<Star className="h-4 w-4 text-amber-500" />}
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-4">
          {/* Products to Reorder */}
          <div className="lg:col-span-2">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-amber-50">
                <AlertTriangle className="h-3 w-3 text-amber-500" />
              </span>
              Products to Reorder
            </p>
            <div className="space-y-2">
              {toReorder.length === 0 && (
                <p className="text-xs text-muted-foreground">All products are sufficiently stocked.</p>
              )}
              {toReorder.map((p) => {
                const cat = categoryMap.get(p.categoryId);
                const reorderCost = p.reorderQty * p.purchasePrice;
                const daysLeft = estimatedDaysRemaining(p);
                return (
                  <div key={p.id} className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-2.5">
                    <span className="text-lg">{p.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">{cat?.name ?? "Uncategorized"} · {p.currentStock} in stock</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-bold text-amber-700">Reorder {p.reorderQty}</p>
                      <p className="text-[10px] text-muted-foreground">{fmtINR(reorderCost)}</p>
                      {daysLeft !== null && (
                        <p className="text-[10px] text-red-500">{daysLeft}d left</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Excess Inventory */}
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-slate-100">
                <Archive className="h-3 w-3 text-slate-500" />
              </span>
              Excess Inventory
            </p>
            <div className="space-y-2">
              {excessInventory.length === 0 && (
                <p className="text-xs text-muted-foreground">No excess inventory detected.</p>
              )}
              {excessInventory.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <span className="text-lg">{p.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">{p.currentStock} / {p.maxStock} max</p>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-slate-600">{fmtINR(stockVal(p))}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Health + Highest Value */}
          <div className="flex flex-col gap-4">
            {/* Inventory Health Score */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <Target className="h-3.5 w-3.5" />
                Inventory Health
              </p>
              <p className={`mt-2 text-4xl font-extrabold ${healthScore >= 80 ? "text-emerald-600" : healthScore >= 60 ? "text-amber-600" : "text-red-600"}`}>
                {healthScore}%
              </p>
              <p className="mt-1 text-[10px] text-emerald-700">{inStockCount} of {totalProducts} products in stock</p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-emerald-200">
                <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${healthScore}%` }} />
              </div>
            </div>

            {/* Highest Value Product */}
            {highestValueProduct && (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700">
                  <BadgeDollarSign className="h-3.5 w-3.5" />
                  Highest Value
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-2xl">{highestValueProduct.emoji}</span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-foreground">{highestValueProduct.name}</p>
                    <p className="text-xs font-semibold text-indigo-600">{fmtINR(stockVal(highestValueProduct))}</p>
                  </div>
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">{highestValueProduct.currentStock} units @ {fmtINR(highestValueProduct.purchasePrice)}</p>
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* ── Activity Timeline + Quick Actions ────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Activity Timeline — from inventory movements */}
        <SectionCard
          title="Activity Timeline"
          subtitle="Recent inventory movements"
          action={<Clock className="h-4 w-4 text-slate-400" />}
        >
          {recentActivities.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Activity className="h-8 w-8 text-slate-300" />
              <p className="text-xs text-muted-foreground">No movements recorded yet.</p>
              <p className="text-[11px] text-slate-400">Stock In, Stock Out, and Adjustments will appear here.</p>
            </div>
          ) : (
            <div className="relative space-y-0">
              {recentActivities.map((log, i) => {
                const cfg = getMovementConfig(log.type);
                const Icon = cfg.icon;
                const isLast = i === recentActivities.length - 1;
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 * i, duration: 0.3 }}
                    className="relative flex gap-3 pb-4"
                  >
                    {!isLast && (
                      <div className="absolute left-4 top-8 h-full w-px bg-slate-100" />
                    )}
                    <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${cfg.bg}`}>
                      <Icon className={`h-4 w-4 ${cfg.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-foreground leading-snug">{log.title}</p>
                        <span className="shrink-0 text-[10px] text-muted-foreground whitespace-nowrap">{log.time}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">{log.description}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[10px] font-medium text-slate-400">{log.user}</span>
                        <span className="text-[10px] text-slate-300">·</span>
                        <span className="text-[10px] text-slate-400">{fmtDate(log.date)}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* Quick Actions */}
        <SectionCard
          title="Quick Actions"
          subtitle="Jump to common tasks"
          action={<Zap className="h-4 w-4 text-[color:var(--brand-electric)]" />}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => onNavigate ? onNavigate(action.tabId) : undefined}
                  className={`group flex items-center gap-3 rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${action.color} text-white`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold leading-snug">{action.label}</p>
                    <p className="text-[10px] text-white/70">{action.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </SectionCard>
      </div>

      {/* ── AI Insights — Coming Soon ────────────────────────────── */}
      <SectionCard
        title="AI Insights"
        subtitle="Powered by Nexora AI — Coming Soon"
        action={
          <div className="flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1">
            <Sparkles className="h-3 w-3 text-violet-500" />
            <span className="text-[10px] font-semibold text-violet-600">Nexora AI</span>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Predict Stock Shortage", desc: "AI forecasts which SKUs will run out in the next 14 days based on usage patterns.", icon: AlertOctagon },
            { label: "Suggest Reorder Quantity", desc: "Get AI-recommended order quantities using demand seasonality and lead time data.", icon: PackagePlus },
            { label: "Demand Forecast", desc: "30-day demand prediction per product using historical movement and trend analysis.", icon: TrendingUp },
            { label: "Supplier Recommendation", desc: "AI ranks your suppliers by reliability, cost, and lead time performance.", icon: Users },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="relative flex flex-col gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 opacity-75"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-200">
                    <Icon className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-violet-200 bg-white px-2 py-0.5">
                    <Lock className="h-2.5 w-2.5 text-violet-400" />
                    <span className="text-[9px] font-semibold text-violet-400">Soon</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">{item.label}</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-slate-400">{item.desc}</p>
                </div>
                <div className="mt-auto flex items-center gap-1.5">
                  <Brain className="h-3 w-3 text-violet-400" />
                  <span className="text-[9px] font-semibold text-violet-400">Powered by Nexora AI</span>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* ── Warehouse Utilization — Coming Soon ─────────────────── */}
      <SectionCard
        title="Warehouse Utilization"
        subtitle="Multi-warehouse management — Coming Soon"
        action={<Building2 className="h-4 w-4 text-slate-400" />}
      >
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
            <Building2 className="h-6 w-6 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Warehouse management coming soon</p>
            <p className="mt-1 text-xs text-slate-400">Track zone capacity, bin locations, and utilization across multiple warehouses.</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
            <Lock className="h-3 w-3 text-slate-400" />
            <span className="text-[10px] font-semibold text-slate-400">Coming Soon</span>
          </div>
        </div>
      </SectionCard>

    </div>
  );
}
