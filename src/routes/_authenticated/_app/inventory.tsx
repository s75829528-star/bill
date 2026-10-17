import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useState, useRef, useEffect, useMemo } from "react";
import {
  LayoutGrid,
  Package,
  Tag,
  Award,
  Ruler,
  Truck,
  ClipboardList,
  Receipt,
  ArrowDownToLine,
  ArrowUpFromLine,
  SlidersHorizontal,
  AlertTriangle,
  Barcode,
  BarChart3,
  Settings,
  Search,
  X,
} from "lucide-react";
import { useBusiness } from "@/contexts/BusinessContext";
import {
  useProducts,
  useCategories,
  useSuppliers,
} from "@/hooks/useProductsQuery";
import type { DbProduct, DbCategory, DbSupplier } from "@/services/products";

import { ModuleTabFallback } from "../../../components/ModuleTabFallback";

const OverviewTab = lazy(() =>
  import("../../../components/inventory/tabs/OverviewTab").then((module) => ({
    default: module.OverviewTab,
  })),
);
const ProductsTab = lazy(() =>
  import("../../../components/inventory/tabs/ProductsTab").then((module) => ({
    default: module.ProductsTab,
  })),
);
const CategoriesTab = lazy(() =>
  import("../../../components/inventory/tabs/CategoriesTab").then((module) => ({
    default: module.CategoriesTab,
  })),
);
const BrandsTab = lazy(() =>
  import("../../../components/inventory/tabs/BrandsTab").then((module) => ({
    default: module.BrandsTab,
  })),
);
const UnitsTab = lazy(() =>
  import("../../../components/inventory/tabs/UnitsTab").then((module) => ({
    default: module.UnitsTab,
  })),
);
const SuppliersTab = lazy(() =>
  import("../../../components/inventory/tabs/SuppliersTab").then((module) => ({
    default: module.SuppliersTab,
  })),
);
const PurchaseOrdersTab = lazy(() =>
  import("../../../components/inventory/tabs/PurchaseOrdersTab").then((module) => ({
    default: module.PurchaseOrdersTab,
  })),
);
const PurchaseBillsTab = lazy(() =>
  import("../../../components/inventory/tabs/PurchaseBillsTab").then((module) => ({
    default: module.PurchaseBillsTab,
  })),
);
const StockInTab = lazy(() =>
  import("../../../components/inventory/tabs/StockInTab").then((module) => ({
    default: module.StockInTab,
  })),
);
const StockOutTab = lazy(() =>
  import("../../../components/inventory/tabs/StockOutTab").then((module) => ({
    default: module.StockOutTab,
  })),
);
const StockAdjustmentsTab = lazy(() =>
  import("../../../components/inventory/tabs/StockAdjustmentsTab").then((module) => ({
    default: module.StockAdjustmentsTab,
  })),
);
const LowStockTab = lazy(() =>
  import("../../../components/inventory/tabs/LowStockTab").then((module) => ({
    default: module.LowStockTab,
  })),
);
const BarcodeTab = lazy(() =>
  import("../../../components/inventory/tabs/BarcodeTab").then((module) => ({
    default: module.BarcodeTab,
  })),
);
const ReportsTab = lazy(() =>
  import("../../../components/inventory/tabs/ReportsTab").then((module) => ({
    default: module.ReportsTab,
  })),
);
const SettingsTab = lazy(() =>
  import("../../../components/inventory/tabs/SettingsTab").then((module) => ({
    default: module.SettingsTab,
  })),
);

export const Route = createFileRoute("/_authenticated/_app/inventory")({
  component: InventoryPage,
});

// ── Sub-navigation ────────────────────────────────────────────────

type TabId =
  | "overview"
  | "products"
  | "categories"
  | "brands"
  | "units"
  | "suppliers"
  | "purchase-orders"
  | "purchase-bills"
  | "stock-in"
  | "stock-out"
  | "stock-adjustments"
  | "low-stock"
  | "barcode"
  | "reports"
  | "settings";

interface InventoryNavItem {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

const navItems: InventoryNavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "products", label: "Products", icon: Package },
  { id: "categories", label: "Categories", icon: Tag },
  { id: "brands", label: "Brands", icon: Award },
  { id: "units", label: "Units", icon: Ruler },
  { id: "suppliers", label: "Suppliers", icon: Truck },
  { id: "purchase-orders", label: "Purchase Orders", icon: ClipboardList },
  { id: "purchase-bills", label: "Purchase Bills", icon: Receipt },
  { id: "stock-in", label: "Stock In", icon: ArrowDownToLine },
  { id: "stock-out", label: "Stock Out", icon: ArrowUpFromLine },
  { id: "stock-adjustments", label: "Stock Adjustments", icon: SlidersHorizontal },
  { id: "low-stock", label: "Low Stock", icon: AlertTriangle },
  { id: "barcode", label: "Barcode Management", icon: Barcode },
  { id: "reports", label: "Inventory Reports", icon: BarChart3 },
  { id: "settings", label: "Inventory Settings", icon: Settings },
];

// ── Search result types ───────────────────────────────────────────

interface SearchResult {
  id: string;
  label: string;
  sublabel: string;
  tab: TabId;
  type: "product" | "supplier" | "category";
}

const typeIcon: Record<string, React.ElementType> = {
  product: Package,
  supplier: Truck,
  category: Tag,
};

// ── Global Search Component — live Supabase data ──────────────────

function GlobalSearch({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const { business } = useBusiness();
  const businessId = business?.id ?? null;

  const { data: dbProducts = [] } = useProducts(businessId);
  const { data: dbCategories = [] } = useCategories(businessId);
  const { data: dbSuppliers = [] } = useSuppliers(businessId);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build search results from live DB data
  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const out: SearchResult[] = [];

    dbProducts.forEach((p) => {
      if (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode ?? "").includes(q)
      ) {
        out.push({
          id: p.id,
          label: p.name,
          sublabel: `SKU: ${p.sku}${p.barcode ? " · " + p.barcode : ""}`,
          tab: "products",
          type: "product",
        });
      }
    });

    dbSuppliers.forEach((s) => {
      if (
        s.name.toLowerCase().includes(q) ||
        (s.contact_person ?? "").toLowerCase().includes(q)
      ) {
        out.push({
          id: s.id,
          label: s.name,
          sublabel: `Supplier · ${s.city ?? ""}`,
          tab: "suppliers",
          type: "supplier",
        });
      }
    });

    dbCategories.forEach((c) => {
      if (c.name.toLowerCase().includes(q)) {
        const count = dbProducts.filter((p) => p.category_id === c.id).length;
        out.push({
          id: c.id,
          label: c.name,
          sublabel: `Category · ${count} product${count !== 1 ? "s" : ""}`,
          tab: "categories",
          type: "category",
        });
      }
    });

    return out.slice(0, 8);
  }, [query, dbProducts, dbSuppliers, dbCategories]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(result: SearchResult) {
    onNavigate(result.tab);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search products, suppliers, categories…"
          className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setOpen(false); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">No results found.</p>
          ) : (
            <ul>
              {results.map((r) => {
                const Icon = typeIcon[r.type] ?? Package;
                return (
                  <li key={r.id}>
                    <button
                      onClick={() => handleSelect(r)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                        <Icon className="h-3.5 w-3.5 text-slate-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{r.label}</p>
                        <p className="truncate text-xs text-muted-foreground">{r.sublabel}</p>
                      </div>
                      <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500 capitalize">
                        {r.type}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────

function InventoryPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px] space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inventory Management</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Products, stock, purchasing, and warehouse operations — all in one place.
            </p>
          </div>
          <GlobalSearch onNavigate={(tab) => setActiveTab(tab)} />
        </div>

        {/* Sub-navigation */}
        <div className="rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
          <div className="flex gap-1 overflow-x-auto scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-150 ${
                    active
                      ? "bg-[image:var(--gradient-brand)] text-white shadow-[0_4px_16px_-4px_oklch(0.62_0.22_258/0.45)]"
                      : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : ""}`} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active tab content */}
        <Suspense fallback={<ModuleTabFallback />}>
          <div>
            {activeTab === "overview" && (
              <OverviewTab onNavigate={(id) => setActiveTab(id as TabId)} />
            )}
            {activeTab === "products" && <ProductsTab />}
            {activeTab === "categories" && <CategoriesTab />}
            {activeTab === "brands" && <BrandsTab />}
            {activeTab === "units" && <UnitsTab />}
            {activeTab === "suppliers" && <SuppliersTab />}
            {activeTab === "purchase-orders" && <PurchaseOrdersTab />}
            {activeTab === "purchase-bills" && <PurchaseBillsTab />}
            {activeTab === "stock-in" && <StockInTab />}
            {activeTab === "stock-out" && <StockOutTab />}
            {activeTab === "stock-adjustments" && <StockAdjustmentsTab />}
            {activeTab === "low-stock" && (
              <LowStockTab onCreatePO={() => setActiveTab("purchase-orders")} />
            )}
            {activeTab === "barcode" && <BarcodeTab />}
            {activeTab === "reports" && <ReportsTab />}
            {activeTab === "settings" && <SettingsTab />}
          </div>
        </Suspense>
      </div>
    </div>
  );
}
