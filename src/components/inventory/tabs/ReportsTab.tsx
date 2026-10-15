// ── ReportsTab ────────────────────────────────────────────────────
import { useState } from "react";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  products,
  suppliers,
  categories,
  stockMovements,
  getCategory,
  stockValue,
  fmtINR,
} from "@/lib/inventory-data";
import {
  purchaseOrders,
  getSupplier,
  getProduct,
} from "@/lib/inventory-data";
import type { Product } from "@/lib/inventory-data";
import { SectionCard, SecondaryButton } from "@/components/inventory/shared";

// ── Types ─────────────────────────────────────────────────────────

type ReportView =
  | "stock-value"
  | "stock-movement"
  | "dead-stock"
  | "fast-moving"
  | "category"
  | "supplier"
  | "purchase"
  | "supplier-report"
  | "category-performance"
  | "inventory-aging";

const REPORT_TABS: { id: ReportView; label: string }[] = [
  { id: "stock-value", label: "Stock Value" },
  { id: "stock-movement", label: "Stock Movement" },
  { id: "dead-stock", label: "Dead Stock" },
  { id: "fast-moving", label: "Fast Moving" },
  { id: "category", label: "Category Performance" },
  { id: "supplier", label: "Supplier Performance" },
  { id: "purchase", label: "Purchase Report" },
  { id: "supplier-report", label: "Supplier Report" },
  { id: "category-performance", label: "Category Analysis" },
  { id: "inventory-aging", label: "Inventory Aging" },
];

// ── CSV download helper ───────────────────────────────────────────

function downloadCSV(filename: string, rows: string[][], headers: string[]) {
  const lines = [headers, ...rows].map((r) =>
    r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
  );
  const csv = lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Chart tooltip ─────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
      <p className="mb-1.5 text-xs font-semibold text-slate-500">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-bold text-foreground">
          {p.value}{" "}
          <span className="text-xs font-normal text-muted-foreground">{p.name}</span>
        </p>
      ))}
    </div>
  );
}

// ── 1. Stock Value ────────────────────────────────────────────────

function StockValueReport() {
  const sorted = [...products].sort((a, b) => stockValue(b) - stockValue(a));
  const total = sorted.reduce((s, p) => s + stockValue(p), 0);

  function handleExport() {
    downloadCSV(
      "stock-value-report.csv",
      sorted.map((p) => [
        p.name,
        p.sku,
        getCategory(p.categoryId)?.name ?? "",
        String(p.currentStock),
        String(p.purchasePrice),
        String(stockValue(p)),
      ]),
      ["Product", "SKU", "Category", "Current Stock", "Purchase Price", "Stock Value"]
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <SecondaryButton icon={Download} onClick={handleExport}>
          Export CSV
        </SecondaryButton>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left">
              {["Product", "Category", "Stock", "Purchase Price", "Stock Value"].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => (
              <tr
                key={p.id}
                className="border-b border-slate-100 transition-colors hover:bg-slate-50 last:border-0"
              >
                <td className="px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.sku}</p>
                </td>
                <td className="px-4 py-3 text-sm text-foreground">
                  {getCategory(p.categoryId)?.name ?? "—"}
                </td>
                <td className="px-4 py-3 text-sm text-foreground">{p.currentStock}</td>
                <td className="px-4 py-3 text-sm text-foreground">{fmtINR(p.purchasePrice)}</td>
                <td className="px-4 py-3 text-sm font-bold text-foreground">
                  {fmtINR(stockValue(p))}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold">
              <td className="px-4 py-3 text-sm font-bold text-foreground" colSpan={4}>
                Total Stock Value
              </td>
              <td className="px-4 py-3 text-sm font-bold text-foreground">{fmtINR(total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── 2. Stock Movement ─────────────────────────────────────────────

function StockMovementReport() {
  // Group by date
  const byDate = stockMovements.reduce<Record<string, { in: number; out: number; adjustment: number }>>(
    (acc, m) => {
      if (!acc[m.date]) acc[m.date] = { in: 0, out: 0, adjustment: 0 };
      acc[m.date][m.type] += m.quantity;
      return acc;
    },
    {}
  );

  const chartData = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({
      date: date.slice(5), // "MM-DD"
      In: vals.in,
      Out: vals.out,
      Adjustment: vals.adjustment,
    }));

  // Type summary
  const typeSummary = stockMovements.reduce<Record<string, number>>((acc, m) => {
    acc[m.type] = (acc[m.type] ?? 0) + m.quantity;
    return acc;
  }, {});

  function handleExport() {
    downloadCSV(
      "stock-movement-report.csv",
      chartData.map((d) => [d.date, String(d.In), String(d.Out), String(d.Adjustment)]),
      ["Date", "In", "Out", "Adjustment"]
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <SecondaryButton icon={Download} onClick={handleExport}>
          Export CSV
        </SecondaryButton>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="In" name="In" fill="#10b981" radius={[5, 5, 0, 0]} maxBarSize={32} />
          <Bar dataKey="Out" name="Out" fill="#ef4444" radius={[5, 5, 0, 0]} maxBarSize={32} />
          <Bar
            dataKey="Adjustment"
            name="Adj"
            fill="#8b5cf6"
            radius={[5, 5, 0, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-3 gap-3">
        {Object.entries(typeSummary).map(([type, qty]) => (
          <div key={type} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
            <p className="text-lg font-bold text-foreground">{qty}</p>
            <p className="text-xs capitalize text-muted-foreground">{type} units</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 3. Dead Stock ─────────────────────────────────────────────────

function DeadStockReport() {
  const outProductIds = new Set(
    stockMovements.filter((m) => m.type === "out").map((m) => m.productId)
  );
  const dead = products.filter((p) => !outProductIds.has(p.id));

  function handleExport() {
    downloadCSV(
      "dead-stock-report.csv",
      dead.map((p) => [p.name, p.sku, String(p.currentStock), String(stockValue(p))]),
      ["Product", "SKU", "Current Stock", "Stock Value"]
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {dead.length} product{dead.length !== 1 ? "s" : ""} with no recorded outbound movement.
        </p>
        <SecondaryButton icon={Download} onClick={handleExport}>
          Export CSV
        </SecondaryButton>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[480px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left">
              {["Product", "Current Stock", "Stock Value", "Note"].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dead.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                  No dead stock found.
                </td>
              </tr>
            ) : (
              dead.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-slate-100 hover:bg-slate-50 last:border-0"
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.sku}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{p.currentStock}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">
                    {fmtINR(stockValue(p))}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600">
                      No stock-out activity recorded
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── 4. Fast Moving Products ───────────────────────────────────────

function FastMovingReport() {
  const outQty: Record<string, number> = {};
  stockMovements
    .filter((m) => m.type === "out")
    .forEach((m) => {
      outQty[m.productId] = (outQty[m.productId] ?? 0) + m.quantity;
    });

  const ranked = products
    .map((p) => ({ product: p, qty: outQty[p.id] ?? 0 }))
    .filter((x) => x.qty > 0)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 8);

  const max = ranked[0]?.qty ?? 1;
  const colors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#f97316", "#ec4899"];

  function handleExport() {
    downloadCSV(
      "fast-moving-report.csv",
      ranked.map((r, i) => [
        String(i + 1),
        r.product.name,
        r.product.sku,
        String(r.qty),
      ]),
      ["Rank", "Product", "SKU", "Total Out Qty"]
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <SecondaryButton icon={Download} onClick={handleExport}>
          Export CSV
        </SecondaryButton>
      </div>
      {ranked.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No outbound movements recorded.</p>
      ) : (
        <div className="space-y-3">
          {ranked.map((r, i) => (
            <div key={r.product.id} className="flex items-center gap-3">
              <span className="w-5 shrink-0 text-xs font-bold text-muted-foreground">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="mb-1 flex items-center justify-between">
                  <span className="truncate text-xs font-semibold text-foreground">
                    {r.product.name}
                  </span>
                  <span className="ml-2 shrink-0 text-xs font-bold text-foreground">
                    {r.qty} units out
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(r.qty / max) * 100}%` }}
                    transition={{ duration: 0.7, delay: 0.07 * i, ease: "easeOut" }}
                    className="h-2 rounded-full"
                    style={{ backgroundColor: colors[i % colors.length] }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 5. Category Performance ───────────────────────────────────────

function CategoryReport() {
  const data = categories.map((cat) => {
    const catProducts = products.filter((p) => p.categoryId === cat.id);
    const value = catProducts.reduce((s, p) => s + stockValue(p), 0);
    return { name: cat.name.split(" & ")[0], fullName: cat.name, value, count: catProducts.length };
  }).sort((a, b) => b.value - a.value);

  function handleExport() {
    downloadCSV(
      "category-performance-report.csv",
      data.map((d) => [d.fullName, String(d.count), String(d.value)]),
      ["Category", "Product Count", "Total Stock Value"]
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <SecondaryButton icon={Download} onClick={handleExport}>
          Export CSV
        </SecondaryButton>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                  <p className="mb-1 text-xs font-semibold text-slate-500">{label}</p>
                  <p className="text-sm font-bold text-foreground">{fmtINR(payload[0].value as number)}</p>
                </div>
              );
            }}
          />
          <Bar dataKey="value" name="Stock Value" fill="#3b82f6" radius={[5, 5, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[400px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left">
              {["Category", "Products", "Total Stock Value"].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.fullName} className="border-b border-slate-100 hover:bg-slate-50 last:border-0">
                <td className="px-4 py-3 text-sm font-medium text-foreground">{d.fullName}</td>
                <td className="px-4 py-3 text-sm text-foreground">{d.count}</td>
                <td className="px-4 py-3 text-sm font-bold text-foreground">{fmtINR(d.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── 6. Supplier Performance ───────────────────────────────────────

function SupplierReport() {
  const sorted = [...suppliers].sort((a, b) => b.totalPurchases - a.totalPurchases);

  function handleExport() {
    downloadCSV(
      "supplier-performance-report.csv",
      sorted.map((s) => [
        s.name,
        s.city,
        String(s.totalPurchases),
        String(s.outstandingAmount),
        String(s.productsSupplied),
        String(s.rating),
      ]),
      ["Supplier", "City", "Total Purchases", "Outstanding", "Products Supplied", "Rating"]
    );
  }

  function Stars({ rating }: { rating: number }) {
    return (
      <span className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`text-sm ${i < Math.floor(rating) ? "text-amber-400" : "text-slate-200"}`}
          >
            ★
          </span>
        ))}
        <span className="ml-1 text-xs text-muted-foreground">{rating.toFixed(1)}</span>
      </span>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <SecondaryButton icon={Download} onClick={handleExport}>
          Export CSV
        </SecondaryButton>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left">
              {["Supplier", "City", "Total Purchases", "Outstanding", "Products", "Rating"].map(
                (h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 last:border-0">
                <td className="px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.contactPerson}</p>
                </td>
                <td className="px-4 py-3 text-sm text-foreground">{s.city}</td>
                <td className="px-4 py-3 text-sm font-bold text-foreground">
                  {fmtINR(s.totalPurchases)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-sm font-semibold ${
                      s.outstandingAmount > 0 ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    {s.outstandingAmount > 0 ? fmtINR(s.outstandingAmount) : "Cleared"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-foreground">{s.productsSupplied}</td>
                <td className="px-4 py-3">
                  <Stars rating={s.rating} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── 7. Purchase Report ────────────────────────────────────────────

function PurchaseReport() {
  const rows = purchaseOrders.map((po) => {
    const supplier = getSupplier(po.supplierId);
    const total = po.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
    return { po, supplier, total };
  });
  const grandTotal = rows.reduce((s, r) => s + r.total, 0);

  const statusColors: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600 border-slate-200",
    "pending-approval": "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-blue-50 text-blue-700 border-blue-200",
    ordered: "bg-violet-50 text-violet-700 border-violet-200",
    "partially-received": "bg-cyan-50 text-cyan-700 border-cyan-200",
    received: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-red-50 text-red-600 border-red-200",
  };

  function handleExport() {
    downloadCSV(
      "purchase-report.csv",
      rows.map((r) => [
        r.po.poNumber,
        r.supplier?.name ?? "",
        r.po.createdDate,
        String(r.po.items.length),
        r.po.status,
        String(r.total),
      ]),
      ["PO Number", "Supplier", "Date", "Items", "Status", "Total Value"]
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <SecondaryButton icon={Download} onClick={handleExport}>
          Export CSV
        </SecondaryButton>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left">
              {["PO Number", "Supplier", "Date", "Items", "Status", "Total Value"].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ po, supplier, total }) => (
              <tr key={po.id} className="border-b border-slate-100 hover:bg-slate-50 last:border-0">
                <td className="px-4 py-3 font-mono text-sm font-semibold text-foreground">{po.poNumber}</td>
                <td className="px-4 py-3 text-sm text-foreground">{supplier?.name ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-foreground">{po.createdDate}</td>
                <td className="px-4 py-3 text-sm text-foreground">{po.items.length}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${statusColors[po.status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                    {po.status.replace(/-/g, " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-bold text-foreground">{fmtINR(total)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold">
              <td className="px-4 py-3 text-sm font-bold text-foreground" colSpan={5}>Grand Total</td>
              <td className="px-4 py-3 text-sm font-bold text-foreground">{fmtINR(grandTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── 8. Supplier Report ────────────────────────────────────────────

function SupplierDetailReport() {
  const sorted = [...suppliers].sort((a, b) => b.totalPurchases - a.totalPurchases);

  function Stars({ rating }: { rating: number }) {
    return (
      <span className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={`text-sm ${i < Math.floor(rating) ? "text-amber-400" : "text-slate-200"}`}>★</span>
        ))}
        <span className="ml-1 text-xs text-muted-foreground">{rating.toFixed(1)}</span>
      </span>
    );
  }

  function handleExport() {
    downloadCSV(
      "supplier-report.csv",
      sorted.map((s) => [
        s.name,
        String(s.totalPurchases),
        String(s.productsSupplied),
        String(s.rating),
        String(s.outstandingAmount),
        s.paymentTerms,
      ]),
      ["Supplier Name", "Total Purchases", "Products Supplied", "Rating", "Outstanding", "Payment Terms"]
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <SecondaryButton icon={Download} onClick={handleExport}>Export CSV</SecondaryButton>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left">
              {["Supplier Name", "Total Purchases", "Products Supplied", "Rating", "Outstanding", "Payment Terms"].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 last:border-0">
                <td className="px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.contactPerson}</p>
                </td>
                <td className="px-4 py-3 text-sm font-bold text-foreground">{fmtINR(s.totalPurchases)}</td>
                <td className="px-4 py-3 text-sm text-foreground">{s.productsSupplied}</td>
                <td className="px-4 py-3"><Stars rating={s.rating} /></td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-semibold ${s.outstandingAmount > 0 ? "text-red-600" : "text-emerald-600"}`}>
                    {s.outstandingAmount > 0 ? fmtINR(s.outstandingAmount) : "Cleared"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-foreground">{s.paymentTerms}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── 9. Category Performance (extended) ───────────────────────────

function CategoryPerformanceReport() {
  const data = categories.map((cat) => {
    const catProducts = products.filter((p) => p.categoryId === cat.id);
    const totalValue = catProducts.reduce((s, p) => s + stockValue(p), 0);
    const avgSellingPrice = catProducts.length > 0
      ? Math.round(catProducts.reduce((s, p) => s + p.sellingPrice, 0) / catProducts.length)
      : 0;
    return {
      name: cat.name.split(" & ")[0],
      fullName: cat.name,
      value: totalValue,
      count: catProducts.length,
      avgSellingPrice,
    };
  }).sort((a, b) => b.value - a.value);

  function handleExport() {
    downloadCSV(
      "category-performance.csv",
      data.map((d) => [d.fullName, String(d.count), String(d.value), String(d.avgSellingPrice)]),
      ["Category", "Product Count", "Total Stock Value", "Avg Selling Price"]
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <SecondaryButton icon={Download} onClick={handleExport}>Export CSV</SecondaryButton>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                  <p className="mb-1 text-xs font-semibold text-slate-500">{label}</p>
                  <p className="text-sm font-bold text-foreground">{fmtINR(payload[0].value as number)}</p>
                </div>
              );
            }}
          />
          <Bar dataKey="value" name="Stock Value" fill="#8b5cf6" radius={[5, 5, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[480px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left">
              {["Category", "Products", "Total Stock Value", "Avg Selling Price"].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.fullName} className="border-b border-slate-100 hover:bg-slate-50 last:border-0">
                <td className="px-4 py-3 text-sm font-medium text-foreground">{d.fullName}</td>
                <td className="px-4 py-3 text-sm text-foreground">{d.count}</td>
                <td className="px-4 py-3 text-sm font-bold text-foreground">{fmtINR(d.value)}</td>
                <td className="px-4 py-3 text-sm text-foreground">{fmtINR(d.avgSellingPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── 10. Inventory Aging ───────────────────────────────────────────

// Deterministic "days in stock" per product using product id hash
function daysInStock(productId: string): number {
  const base = productId.replace(/\D/g, "");
  const seed = parseInt(base || "1", 10);
  return 30 + ((seed * 37 + 13) % 151); // range 30–180
}

function agingStatus(days: number): { label: string; cls: string } {
  if (days < 60) return { label: "Fresh", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (days <= 120) return { label: "Aging", cls: "bg-amber-50 text-amber-700 border-amber-200" };
  return { label: "Dead Stock", cls: "bg-red-50 text-red-700 border-red-200" };
}

function InventoryAgingReport() {
  const aged = [...products]
    .map((p) => ({ product: p, days: daysInStock(p.id) }))
    .sort((a, b) => b.days - a.days);

  function handleExport() {
    downloadCSV(
      "inventory-aging.csv",
      aged.map(({ product: p, days }) => [
        p.name,
        p.sku,
        String(p.currentStock),
        String(days),
        String(stockValue(p)),
        agingStatus(days).label,
      ]),
      ["Product", "SKU", "Current Stock", "Days in Stock", "Stock Value", "Status"]
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          {[
            { label: "Fresh (<60d)", cls: "text-emerald-600", count: aged.filter((x) => x.days < 60).length },
            { label: "Aging (60–120d)", cls: "text-amber-600", count: aged.filter((x) => x.days >= 60 && x.days <= 120).length },
            { label: "Dead (>120d)", cls: "text-red-600", count: aged.filter((x) => x.days > 120).length },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center">
              <p className={`text-lg font-bold ${s.cls}`}>{s.count}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
        <SecondaryButton icon={Download} onClick={handleExport}>Export CSV</SecondaryButton>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left">
              {["Product", "SKU", "Current Stock", "Days in Stock", "Stock Value", "Status"].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {aged.map(({ product: p, days }) => {
              const status = agingStatus(days);
              return (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 last:border-0">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">{p.name}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.sku}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{p.currentStock}</td>
                  <td className="px-4 py-3 text-sm font-bold text-foreground">{days}d</td>
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">{fmtINR(stockValue(p))}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${status.cls}`}>
                      {status.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Tab ──────────────────────────────────────────────────────

export function ReportsTab() {
  const [active, setActive] = useState<ReportView>("stock-value");

  return (
    <SectionCard
      title="Inventory Reports"
      subtitle="Analyze stock value, movement, and performance"
    >
      {/* Tab strip */}
      <div className="mb-6 flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1">
        {REPORT_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              active === t.id
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Report content */}
      <motion.div
        key={active}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {active === "stock-value" && <StockValueReport />}
        {active === "stock-movement" && <StockMovementReport />}
        {active === "dead-stock" && <DeadStockReport />}
        {active === "fast-moving" && <FastMovingReport />}
        {active === "category" && <CategoryReport />}
        {active === "supplier" && <SupplierReport />}
        {active === "purchase" && <PurchaseReport />}
        {active === "supplier-report" && <SupplierDetailReport />}
        {active === "category-performance" && <CategoryPerformanceReport />}
        {active === "inventory-aging" && <InventoryAgingReport />}
      </motion.div>
    </SectionCard>
  );
}
