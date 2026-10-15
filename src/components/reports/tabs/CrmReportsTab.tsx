import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Users, Target, UserX, Wallet } from "lucide-react";
import { customerGrowthTrend, leadFunnel, leadConversionRate, topCustomers, inactiveCustomers, outstandingCustomers, fmtINR, fmtDate, CHART_COLORS } from "@/lib/reports-data";
import { ChartCard, KpiCard, SectionCard, TableWrapper, Th, Td, StatusPill } from "../shared";

export function CrmReportsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">CRM Reports</h2>
        <p className="text-sm text-muted-foreground mt-1">Customer growth, lead conversion, and relationship health.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label="Active Customers" value={customerGrowthTrend[customerGrowthTrend.length - 1].value.toLocaleString("en-IN")} icon={Users} bg="bg-cyan-50" iconColor="text-cyan-600" index={0} />
        <KpiCard label="Lead Conversion" value={`${leadConversionRate}%`} icon={Target} bg="bg-emerald-50" iconColor="text-emerald-600" index={1} />
        <KpiCard label="Inactive Customers" value={inactiveCustomers.length.toString()} icon={UserX} bg="bg-red-50" iconColor="text-red-600" index={2} />
        <KpiCard label="Outstanding Customers" value={outstandingCustomers.length.toString()} icon={Wallet} bg="bg-amber-50" iconColor="text-amber-600" index={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Customer Growth" subtitle="Active customers, last 12 months">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={customerGrowthTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={1} />
              <YAxis tick={{ fontSize: 11 }} width={40} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2.5} dot={false} name="Customers" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Lead Conversion Funnel" subtitle={`${leadConversionRate}% end-to-end conversion`}>
          <div className="space-y-2.5">
            {leadFunnel.map((stage, i) => {
              const pct = Math.round((stage.count / leadFunnel[0].count) * 100);
              return (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-foreground">{stage.stage}</span>
                    <span className="text-muted-foreground">{stage.count} ({pct}%)</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>

      <SectionCard title="Top Customers" subtitle="By revenue, this year" noPadding>
        <TableWrapper>
          <thead><tr><Th>Customer</Th><Th right>Orders</Th><Th right>Revenue</Th><Th right>Growth</Th></tr></thead>
          <tbody>
            {topCustomers.map((c) => (
              <tr key={c.name} className="hover:bg-slate-50">
                <Td className="font-medium">{c.name}</Td>
                <Td right>{c.orders}</Td>
                <Td right className="font-semibold">{fmtINR(c.revenue)}</Td>
                <Td right><StatusPill status={c.growth >= 0 ? "positive" : "negative"} label={`${c.growth >= 0 ? "+" : ""}${c.growth}%`} /></Td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard title="Inactive Customers" subtitle="No orders in 90+ days" noPadding>
          <TableWrapper>
            <thead><tr><Th>Customer</Th><Th>Last Order</Th><Th right>Lifetime Spend</Th></tr></thead>
            <tbody>
              {inactiveCustomers.map((c) => (
                <tr key={c.name} className="hover:bg-slate-50">
                  <Td className="font-medium">{c.name}</Td>
                  <Td>{fmtDate(c.lastOrder)}</Td>
                  <Td right>{fmtINR(c.totalSpend)}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        </SectionCard>

        <SectionCard title="Outstanding Customers" subtitle="Unpaid balances" noPadding>
          <TableWrapper>
            <thead><tr><Th>Customer</Th><Th right>Outstanding</Th><Th right>Days Past Due</Th></tr></thead>
            <tbody>
              {outstandingCustomers.map((c) => (
                <tr key={c.name} className="hover:bg-slate-50">
                  <Td className="font-medium">{c.name}</Td>
                  <Td right className="font-semibold text-red-600">{fmtINR(c.outstanding)}</Td>
                  <Td right>{c.daysPastDue > 0 ? <StatusPill status="negative" label={`${c.daysPastDue}d`} /> : <StatusPill status="positive" label="Current" />}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        </SectionCard>
      </div>
    </div>
  );
}
