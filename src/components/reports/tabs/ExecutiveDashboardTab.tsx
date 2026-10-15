import { useMemo, useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import {
  IndianRupee, TrendingUp, TrendingDown, Boxes, Wallet, Users,
  ShoppingBag, FileText, Receipt, Activity, ArrowUpRight, Percent,
} from "lucide-react";
import {
  baseKpis, revenueTrend, profitTrend, cashFlowTrend, inventoryValueTrend,
  stockMovementTrend, customerGrowthTrend, topCustomers, topProducts,
  topCategories, expenseByCategory, gstCollectionTrend, CHART_COLORS,
  fmtINR, fmtCompactINR, dateRangeOptions, rangeMultiplier, type DateRangeId,
} from "@/lib/reports-data";
import { ChartCard, KpiCard, Select } from "../shared";

function scale(value: number, multiplier: number) {
  return Math.round(value * multiplier);
}

export function ExecutiveDashboardTab() {
  const [range, setRange] = useState<DateRangeId>("this-month");
  const m = rangeMultiplier[range];

  const kpis = useMemo(() => {
    const k = baseKpis;
    return [
      { label: "Revenue", value: fmtINR(scale(k.revenue, m)), icon: IndianRupee, bg: "bg-emerald-50", iconColor: "text-emerald-600", trend: { value: "12.4%", positive: true } },
      { label: "Profit", value: fmtINR(scale(k.profit, m)), icon: TrendingUp, bg: "bg-blue-50", iconColor: "text-blue-600", trend: { value: "9.1%", positive: true } },
      { label: "Expenses", value: fmtINR(scale(k.expenses, m)), icon: TrendingDown, bg: "bg-red-50", iconColor: "text-red-600", trend: { value: "3.2%", positive: false } },
      { label: "Inventory Value", value: fmtINR(scale(k.inventoryValue, m)), icon: Boxes, bg: "bg-violet-50", iconColor: "text-violet-600", trend: { value: "1.7%", positive: true } },
      { label: "Outstanding Payments", value: fmtINR(scale(k.outstandingPayments, m)), icon: Wallet, bg: "bg-amber-50", iconColor: "text-amber-600", trend: { value: "4.5%", positive: false } },
      { label: "Customer Growth", value: scale(k.customerGrowth, m).toLocaleString("en-IN"), icon: Users, bg: "bg-cyan-50", iconColor: "text-cyan-600", trend: { value: "6.8%", positive: true } },
      { label: "Products Sold", value: scale(k.productsSold, m).toLocaleString("en-IN"), icon: ShoppingBag, bg: "bg-indigo-50", iconColor: "text-indigo-600", trend: { value: "14.2%", positive: true } },
      { label: "Invoices Created", value: scale(k.invoicesCreated, m).toLocaleString("en-IN"), icon: FileText, bg: "bg-sky-50", iconColor: "text-sky-600", trend: { value: "5.0%", positive: true } },
      { label: "Average Order Value", value: fmtINR(k.avgOrderValue), icon: Receipt, bg: "bg-fuchsia-50", iconColor: "text-fuchsia-600", trend: { value: "2.1%", positive: true } },
      { label: "Cash Flow", value: fmtINR(scale(k.cashFlow, m)), icon: Activity, bg: "bg-teal-50", iconColor: "text-teal-600", trend: { value: "8.9%", positive: true } },
      { label: "Monthly Growth", value: `${k.monthlyGrowth}%`, icon: ArrowUpRight, bg: "bg-lime-50", iconColor: "text-lime-600", trend: { value: "1.3%", positive: true } },
      { label: "Net Margin", value: `${k.netMargin}%`, icon: Percent, bg: "bg-orange-50", iconColor: "text-orange-600", trend: { value: "0.6%", positive: true } },
    ];
  }, [m]);

  return (
    <div className="space-y-6">
      {/* Header + global date range */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Executive Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">
            The business-intelligence center — revenue, profit, inventory, and customer health at a glance.
          </p>
        </div>
        <Select value={range} onChange={(v) => setRange(v as DateRangeId)} options={dateRangeOptions} className="sm:w-48" />
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => <KpiCard key={k.label} {...k} index={i} />)}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Revenue Trend" subtitle="Last 12 months">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueTrend}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={1} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtCompactINR(v)} width={54} />
              <Tooltip formatter={(v: number) => fmtINR(v)} />
              <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} fill="url(#revGrad)" name="Revenue" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Profit Trend" subtitle="Net profit, last 12 months">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={profitTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={1} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtCompactINR(v)} width={54} />
              <Tooltip formatter={(v: number) => fmtINR(v)} />
              <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} dot={false} name="Profit" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Cash Flow" subtitle="Net monthly cash movement">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={cashFlowTrend}>
              <defs>
                <linearGradient id="cfGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={1} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtCompactINR(v)} width={54} />
              <Tooltip formatter={(v: number) => fmtINR(v)} />
              <Area type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2} fill="url(#cfGrad2)" name="Cash Flow" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Inventory Value" subtitle="Stock valuation, last 12 months">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={inventoryValueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={1} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtCompactINR(v)} width={54} />
              <Tooltip formatter={(v: number) => fmtINR(v)} />
              <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Inventory Value" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Stock Movement" subtitle="Units in vs. out per month">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stockMovementTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={1} />
              <YAxis tick={{ fontSize: 11 }} width={40} />
              <Tooltip />
              <Legend />
              <Bar dataKey="stockIn" fill="#10b981" radius={[4, 4, 0, 0]} name="Stock In" />
              <Bar dataKey="stockOut" fill="#ef4444" radius={[4, 4, 0, 0]} name="Stock Out" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Customer Growth" subtitle="Total active customers">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={customerGrowthTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={1} />
              <YAxis tick={{ fontSize: 11 }} width={40} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2.5} dot={false} name="Customers" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Customers" subtitle="By revenue this year">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topCustomers.slice(0, 6)} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => fmtCompactINR(v)} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={130} />
              <Tooltip formatter={(v: number) => fmtINR(v)} />
              <Bar dataKey="revenue" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Products" subtitle="By units sold">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topProducts.slice(0, 6)} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={150} />
              <Tooltip />
              <Bar dataKey="unitsSold" fill="#6366f1" radius={[0, 4, 4, 0]} name="Units Sold" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Categories" subtitle="Revenue share">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={topCategories} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ share }: any) => `${share}%`}>
                {topCategories.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => fmtINR(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Expense Breakdown" subtitle="By category, YTD">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85}>
                {expenseByCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => fmtINR(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="GST Collection" subtitle="Monthly GST collected">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={gstCollectionTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={1} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtCompactINR(v)} width={54} />
              <Tooltip formatter={(v: number) => fmtINR(v)} />
              <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} name="GST Collected" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
