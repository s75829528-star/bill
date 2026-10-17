// ── Customer Reports Tab ──────────────────────────────────────────
import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, Users, AlertTriangle, Download, FileText, Printer, Search, Target,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, LineChart, Line, Legend,
} from "recharts";
import { useBusiness } from "@/contexts/BusinessContext";
import { useCustomers } from "@/hooks/useCustomersQuery";
import { useInvoices } from "@/hooks/useInvoicesQuery";
import {
  buildCustomerAnalytics,
  customerAcquisitionByMonth,
  formatCompactCrmCurrency,
  formatCrmCurrency,
  formatCrmDate,
} from "@/lib/crm-analytics";
import {
  SectionCard, StatTile, EmptyState,
} from "@/components/crm/shared";

// ── Export helpers ─────────────────────────────────────────────────
function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function toCSV(headers: string[], rows: (string | number)[][]): string {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
}

// ── Export Bar ─────────────────────────────────────────────────────
function ExportBar({ onCSV }: { onCSV: () => void }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="mr-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Export:</span>
      <button
        onClick={() => alert("PDF export — UI placeholder only.")}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <FileText className="h-3.5 w-3.5" /> PDF
      </button>
      <button
        onClick={() => alert("Excel export — UI placeholder only.")}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <Download className="h-3.5 w-3.5" /> Excel
      </button>
      <button
        onClick={onCSV}
        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
      >
        <Download className="h-3.5 w-3.5" /> CSV
      </button>
      <button
        onClick={() => alert("Print — UI placeholder only.")}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <Printer className="h-3.5 w-3.5" /> Print
      </button>
    </div>
  );
}

// ── Table helpers ──────────────────────────────────────────────────
function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th className={`px-4 py-3 text-xs font-semibold text-muted-foreground ${right ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );
}
function Td({ children, right, className = "" }: { children: React.ReactNode; right?: boolean; className?: string }) {
  return (
    <td className={`px-4 py-3 text-sm ${right ? "text-right font-semibold" : ""} ${className}`}>
      {children}
    </td>
  );
}

// ── Custom chart tooltips ──────────────────────────────────────────
function ChartTip({ active, payload, label, currency = "INR" }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string; currency?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
      <p className="mb-1 text-xs font-semibold text-slate-500">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-bold text-foreground">
          {typeof p.value === "number" && p.name.toLowerCase().includes("rev") ? formatCrmCurrency(p.value, currency) : p.value}
          {" "}<span className="text-xs font-normal text-muted-foreground">{p.name}</span>
        </p>
      ))}
    </div>
  );
}

const EMPTY_RECORDS: never[] = [];

// ── Main Component ─────────────────────────────────────────────────
export function CustomerReportsTab() {
  const { business, businessLoading, businessError } = useBusiness();
  const businessId = business?.id ?? null;
  const currency = business?.currency ?? "INR";
  const customerQuery = useCustomers(businessId);
  const invoiceQuery = useInvoices(businessId);
  const customers = customerQuery.data ?? EMPTY_RECORDS;
  const invoices = invoiceQuery.data ?? EMPTY_RECORDS;
  const customerAnalytics = useMemo(
    () => buildCustomerAnalytics(customers, invoices),
    [customers, invoices],
  );
  const totalRevenue = customerAnalytics.reduce((sum, customer) => sum + customer.totalRevenue, 0);
  const totalOutstanding = customerAnalytics.reduce((sum, customer) => sum + customer.outstandingAmount, 0);
  const activeCount = customers.filter((customer) => customer.status === "active").length;
  const billedCount = customerAnalytics.filter((customer) => customer.invoiceCount > 0).length;
  const topCustomers = [...customerAnalytics]
    .filter((customer) => customer.totalRevenue > 0)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10);
  const outstandingCustomers = [...customerAnalytics]
    .filter((customer) => customer.outstandingAmount > 0)
    .sort((a, b) => b.outstandingAmount - a.outstandingAmount)
    .slice(0, 10);
  const inactiveCustomers = [...customerAnalytics]
    .filter((customer) => customer.status === "inactive" || customer.status === "at-risk")
    .sort((a, b) => (a.lastPurchaseDate ?? "").localeCompare(b.lastPurchaseDate ?? ""))
    .slice(0, 10);
  const revenueChartData = customerAnalytics
    .filter((customer) => customer.totalRevenue > 0)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 15)
    .map((customer) => ({
      name: (customer.company_name || customer.name).slice(0, 16),
      Revenue: customer.totalRevenue,
    }));
  const growthData = useMemo(() => customerAcquisitionByMonth(customers), [customers]);
  const isLoading = businessLoading || customerQuery.isLoading || invoiceQuery.isLoading;
  const loadError = businessError || customerQuery.error || invoiceQuery.error;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white" />
        ))}
      </div>
    );
  }

  if (loadError) {
    return (
      <SectionCard title="Customer reports unavailable">
        <p className="mb-3 text-sm text-muted-foreground">
          {loadError instanceof Error ? loadError.message : loadError || "Customer report data could not be loaded."}
        </p>
        <button
          onClick={() => void Promise.all([customerQuery.refetch(), invoiceQuery.refetch()])}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
        >
          Retry
        </button>
      </SectionCard>
    );
  }

  if (!businessId || customers.length === 0) {
    return (
      <SectionCard title="Customer reports">
        <EmptyState
          icon={Users}
          title={businessId ? "No customer records yet" : "Business profile unavailable"}
          subtitle={businessId ? "Reports will populate from customer-linked invoices as records are added." : "Complete business setup to load tenant-scoped records."}
        />
      </SectionCard>
    );
  }

  function exportTopCustomersCSV() {
    const csv = toCSV(
      ["Rank", "Customer", "Company", "City", "Group", "Status", "Total Revenue", "Outstanding"],
      topCustomers.map((c, i) => [i + 1, c.name, c.company_name ?? "", c.city ?? "", c.customer_group, c.status, c.totalRevenue, c.outstandingAmount])
    );
    downloadFile(csv, "top-customers.csv", "text/csv");
  }

  function exportOutstandingCSV() {
    const csv = toCSV(
      ["Customer", "Company", "City", "Status", "Outstanding Amount", "Credit Limit", "Last Purchase"],
      outstandingCustomers.map((c) => [c.name, c.company_name ?? "", c.city ?? "", c.status, c.outstandingAmount, c.credit_limit, c.lastPurchaseDate ?? ""])
    );
    downloadFile(csv, "outstanding-customers.csv", "text/csv");
  }

  function exportInactiveCSV() {
    const csv = toCSV(
      ["Customer", "Company", "City", "Status", "Last Purchase", "Total Revenue"],
      inactiveCustomers.map((c) => [c.name, c.company_name ?? "", c.city ?? "", c.status, c.lastPurchaseDate ?? "", c.totalRevenue]),
    );
    downloadFile(csv, "inactive-customers.csv", "text/csv");
  }

  return (
    <div className="space-y-6">
      {/* Summary stat tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Total Revenue" value={formatCrmCurrency(totalRevenue, currency)} icon={TrendingUp} bg="bg-blue-50" iconColor="text-blue-600" index={0} />
        <StatTile label="Active Customers" value={String(activeCount)} icon={Users} bg="bg-emerald-50" iconColor="text-emerald-600" index={1} />
        <StatTile label="Outstanding" value={formatCrmCurrency(totalOutstanding, currency)} icon={AlertTriangle} bg="bg-amber-50" iconColor="text-amber-600" index={2} />
        <StatTile label="Customers with invoices" value={String(billedCount)} icon={TrendingUp} bg="bg-cyan-50" iconColor="text-cyan-600" index={3} />
      </div>

      {/* Revenue by Customer Bar Chart */}
      <SectionCard
        title="Revenue by Customer"
        subtitle="Top 15 customers by total revenue"
        action={
          <button
            onClick={() => downloadFile(toCSV(["Customer", "Revenue"], revenueChartData.map((row) => [row.name, row.Revenue])), "revenue-by-customer.csv", "text/csv")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
        }
      >
        {revenueChartData.length ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueChartData} margin={{ top: 4, right: 4, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatCompactCrmCurrency(v, currency)} />
              <Tooltip content={<ChartTip currency={currency} />} cursor={{ fill: "rgba(241,245,249,0.6)", radius: 6 }} />
              <Bar dataKey="Revenue" fill="#6366f1" radius={[5, 5, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState icon={TrendingUp} title="No customer-linked invoices" subtitle="Revenue charts populate from invoices assigned to customers." />
        )}
      </SectionCard>

      {/* Top Customers Table */}
      <SectionCard title="Top Customers by Revenue" subtitle="Ranked by lifetime revenue" noPadding
        action={
          <button onClick={exportTopCustomersCSV} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors">
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <Th>#</Th>
                <Th>Customer</Th>
                <Th>Company</Th>
                <Th>Group</Th>
                <Th>Status</Th>
                <Th right>Total Revenue</Th>
                <Th right>Outstanding</Th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.length === 0 && (
                <tr><td colSpan={7}><EmptyState icon={Search} title="No invoiced customers" subtitle="Customer revenue rankings require linked invoices." /></td></tr>
              )}
              {topCustomers.map((c, i) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-slate-100 hover:bg-slate-50/60"
                >
                  <Td>
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${i < 3 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                      {i + 1}
                    </span>
                  </Td>
                  <Td><span className="font-medium text-foreground whitespace-nowrap">{c.name}</span></Td>
                  <Td><span className="text-xs text-muted-foreground">{c.company_name || "—"}</span></Td>
                  <Td><span className="text-xs">{c.customer_group}</span></Td>
                  <Td>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${c.status === "active" ? "bg-emerald-50 text-emerald-700" : c.status === "at-risk" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}>
                      {c.status}
                    </span>
                  </Td>
                  <Td right className="text-emerald-700">{formatCrmCurrency(c.totalRevenue, currency)}</Td>
                  <Td right className={c.outstandingAmount > 0 ? "text-amber-700" : "text-slate-400"}>{formatCrmCurrency(c.outstandingAmount, currency)}</Td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Outstanding + Inactive side by side */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Outstanding Customers */}
        <SectionCard title="Outstanding Customers" subtitle="Customers with unpaid balances" noPadding
          action={
            <button onClick={exportOutstandingCSV} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors">
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <Th>Customer</Th>
                  <Th>City</Th>
                  <Th right>Outstanding</Th>
                  <Th right>Credit Limit</Th>
                </tr>
              </thead>
              <tbody>
                {outstandingCustomers.length === 0 && (
                  <tr><td colSpan={4}><EmptyState icon={Search} title="No outstanding balances" subtitle="All customers are cleared." /></td></tr>
                )}
                {outstandingCustomers.map((c, i) => (
                  <motion.tr key={c.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="border-b border-slate-100 hover:bg-slate-50/60">
                    <Td>
                      <p className="font-medium text-foreground text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.company_name || "—"}</p>
                    </Td>
                    <Td><span className="text-xs text-muted-foreground">{c.city}</span></Td>
                    <Td right className="text-amber-700">{formatCrmCurrency(c.outstandingAmount, currency)}</Td>
                    <Td right className="text-slate-500">{formatCrmCurrency(c.credit_limit, currency)}</Td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Inactive / At-Risk Customers */}
        <SectionCard title="Inactive / At-Risk Customers" subtitle="Customers needing re-engagement" noPadding
          action={
            <button onClick={exportInactiveCSV} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors">
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <Th>Customer</Th>
                  <Th>Status</Th>
                  <Th>Last Purchase</Th>
                  <Th right>Revenue</Th>
                </tr>
              </thead>
              <tbody>
                {inactiveCustomers.length === 0 && (
                  <tr><td colSpan={4}><EmptyState icon={Search} title="No inactive customers" subtitle="All customers are active." /></td></tr>
                )}
                {inactiveCustomers.map((c, i) => (
                  <motion.tr key={c.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="border-b border-slate-100 hover:bg-slate-50/60">
                    <Td>
                      <p className="font-medium text-foreground text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.company_name || "—"}</p>
                    </Td>
                    <Td>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${c.status === "at-risk" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}>
                        {c.status}
                      </span>
                    </Td>
                    <Td><span className="text-xs text-muted-foreground">{formatCrmDate(c.lastPurchaseDate)}</span></Td>
                    <Td right className="text-foreground">{formatCrmCurrency(c.totalRevenue, currency)}</Td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      {/* Customer Growth + Lead Funnel */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Customer Growth Line Chart */}
        <SectionCard
          title="Customer Growth"
          subtitle="New customers acquired per month (last 6 months)"
          action={
            <button
              onClick={() => downloadFile(toCSV(["Month", "New Customers"], growthData.map((d) => [d.month, d.customers])), "customer-growth.csv", "text/csv")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
          }
        >
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={growthData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTip currency={currency} />} />
              <Line type="monotone" dataKey="customers" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }} activeDot={{ r: 6, fill: "#6366f1", strokeWidth: 0 }} name="Customers" />
            </LineChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Lead conversion" subtitle="Not available in the current database">
          <EmptyState
            icon={Target}
            title="Lead records are not configured"
            subtitle="No leads table exists in the current schema, so conversion totals are not shown."
          />
        </SectionCard>
      </div>
    </div>
  );
}
