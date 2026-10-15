import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Boxes, AlertTriangle, Archive, Layers } from "lucide-react";
import {
  inventoryStats, lowStockItems, deadStockItems, fastMovingProducts, slowMovingProducts,
  categoryPerformance, supplierPerformance, fmtINR, fmtCompactINR,
} from "@/lib/reports-data";
import { ChartCard, KpiCard, SectionCard, TableWrapper, Th, Td, StatusPill } from "../shared";

export function InventoryReportsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Inventory Reports</h2>
        <p className="text-sm text-muted-foreground mt-1">Stock valuation, movement velocity, and supplier reliability.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label="Inventory Value" value={fmtINR(inventoryStats.totalValue)} icon={Boxes} bg="bg-violet-50" iconColor="text-violet-600" index={0} />
        <KpiCard label="Low Stock Items" value={inventoryStats.lowStockCount.toString()} icon={AlertTriangle} bg="bg-amber-50" iconColor="text-amber-600" index={1} />
        <KpiCard label="Dead Stock Items" value={inventoryStats.deadStockCount.toString()} icon={Archive} bg="bg-red-50" iconColor="text-red-600" index={2} />
        <KpiCard label="Total SKUs" value={inventoryStats.totalSKUs.toLocaleString("en-IN")} icon={Layers} bg="bg-blue-50" iconColor="text-blue-600" index={3} />
      </div>

      <ChartCard title="Category Performance" subtitle="Revenue and turnover rate by category">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={categoryPerformance}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtCompactINR(v)} width={54} />
            <Tooltip formatter={(v: number) => fmtINR(v)} />
            <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Revenue" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard title="Low Stock" subtitle="Items below reorder level" noPadding>
          <TableWrapper>
            <thead><tr><Th>Product</Th><Th>SKU</Th><Th right>Stock</Th><Th right>Reorder Level</Th></tr></thead>
            <tbody>
              {lowStockItems.map((i) => (
                <tr key={i.sku} className="hover:bg-slate-50">
                  <Td className="font-medium">{i.name}</Td>
                  <Td><span className="font-mono text-xs">{i.sku}</span></Td>
                  <Td right><StatusPill status="low" label={i.stock.toString()} /></Td>
                  <Td right>{i.reorderLevel}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        </SectionCard>

        <SectionCard title="Dead Stock" subtitle="No movement in 90+ days" noPadding>
          <TableWrapper>
            <thead><tr><Th>Product</Th><Th>SKU</Th><Th right>Stock</Th><Th right>Days Idle</Th></tr></thead>
            <tbody>
              {deadStockItems.map((i) => (
                <tr key={i.sku} className="hover:bg-slate-50">
                  <Td className="font-medium">{i.name}</Td>
                  <Td><span className="font-mono text-xs">{i.sku}</span></Td>
                  <Td right>{i.stock}</Td>
                  <Td right><StatusPill status="dead" label={`${i.daysIdle}d`} /></Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        </SectionCard>

        <SectionCard title="Fast Moving Products" subtitle="Highest turnover" noPadding>
          <TableWrapper>
            <thead><tr><Th>Product</Th><Th right>Units Sold</Th><Th right>Revenue</Th></tr></thead>
            <tbody>
              {fastMovingProducts.map((p) => (
                <tr key={p.name} className="hover:bg-slate-50">
                  <Td className="font-medium">{p.name}</Td>
                  <Td right>{p.unitsSold.toLocaleString("en-IN")}</Td>
                  <Td right className="font-semibold text-emerald-600">{fmtINR(p.revenue)}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        </SectionCard>

        <SectionCard title="Slow Moving Products" subtitle="Lowest turnover" noPadding>
          <TableWrapper>
            <thead><tr><Th>Product</Th><Th right>Units Sold</Th><Th right>Revenue</Th></tr></thead>
            <tbody>
              {slowMovingProducts.map((p) => (
                <tr key={p.name} className="hover:bg-slate-50">
                  <Td className="font-medium">{p.name}</Td>
                  <Td right>{p.unitsSold.toLocaleString("en-IN")}</Td>
                  <Td right className="text-amber-600">{fmtINR(p.revenue)}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        </SectionCard>
      </div>

      <SectionCard title="Supplier Performance" subtitle="On-time delivery rate and order value" noPadding>
        <TableWrapper>
          <thead><tr><Th>Supplier</Th><Th right>Orders</Th><Th right>On-Time Rate</Th><Th right>Total Value</Th></tr></thead>
          <tbody>
            {supplierPerformance.map((s) => (
              <tr key={s.name} className="hover:bg-slate-50">
                <Td className="font-medium">{s.name}</Td>
                <Td right>{s.orders}</Td>
                <Td right>
                  <StatusPill status={s.onTimeRate >= 90 ? "positive" : "low"} label={`${s.onTimeRate}%`} />
                </Td>
                <Td right className="font-semibold">{fmtINR(s.totalValue)}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      </SectionCard>
    </div>
  );
}
