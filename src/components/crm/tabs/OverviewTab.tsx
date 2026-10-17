// ── CRM Overview Tab ──────────────────────────────────────────────
import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users,
  UserCheck,
  UserPlus,
  RefreshCw,
  TrendingUp,
  IndianRupee,
  Target,
  BarChart2,
  Activity,
  Calendar,
  AlertCircle,
  Star,
  Zap,
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
  LineChart,
  Line,
  Legend,
} from "recharts";
import { useBusiness } from "@/contexts/BusinessContext";
import { useCustomerNotesForBusiness, useCustomers } from "@/hooks/useCustomersQuery";
import { useInvoices } from "@/hooks/useInvoicesQuery";
import { usePayments } from "@/hooks/usePaymentsQuery";
import {
  buildCustomerAnalytics,
  customerAcquisitionByMonth,
  formatCompactCrmCurrency,
  formatCrmCurrency,
  formatCrmDate,
} from "@/lib/crm-analytics";
import {
  SectionCard,
  StatTile,
  CrmStatusPill,
  Avatar,
  EmptyState,
} from "@/components/crm/shared";

// ── Pie colours ───────────────────────────────────────────────────
const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#f97316"];
const EMPTY_RECORDS: never[] = [];

// ── Tooltip helpers ───────────────────────────────────────────────
function ChartTip({ active, payload, label, currency = "INR" }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string; currency?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
      <p className="mb-1.5 text-xs font-semibold text-slate-500">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-bold text-foreground">
          {typeof p.value === "number" && p.name.toLowerCase().includes("revenue")
            ? formatCrmCurrency(p.value, currency)
            : p.value}{" "}
          <span className="text-xs font-normal text-muted-foreground">{p.name}</span>
        </p>
      ))}
    </div>
  );
}

function RevTip({ active, payload, label, currency = "INR" }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string; currency?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
      <p className="mb-1 text-xs font-semibold text-slate-500 truncate max-w-[140px]">{label}</p>
      <p className="text-sm font-bold text-foreground">{formatCrmCurrency(payload[0].value, currency)}</p>
    </div>
  );
}

function PieTip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
      <p className="text-xs font-semibold text-foreground">{payload[0].name}</p>
      <p className="mt-0.5 text-sm font-bold text-foreground">{payload[0].value} customers</p>
    </div>
  );
}

// ── Activity icon ─────────────────────────────────────────────────
function activityIcon(type: string) {
  switch (type) {
    case "customer-created": return { bg: "bg-blue-50", color: "text-blue-600", icon: UserPlus };
    case "invoice-generated": return { bg: "bg-indigo-50", color: "text-indigo-600", icon: BarChart2 };
    case "payment-received": return { bg: "bg-emerald-50", color: "text-emerald-600", icon: IndianRupee };
    case "customer-updated": return { bg: "bg-amber-50", color: "text-amber-600", icon: UserCheck };
    case "lead-created": return { bg: "bg-violet-50", color: "text-violet-600", icon: Target };
    case "lead-converted": return { bg: "bg-emerald-50", color: "text-emerald-600", icon: TrendingUp };
    case "note-added": return { bg: "bg-slate-100", color: "text-slate-600", icon: Activity };
    case "follow-up-scheduled": return { bg: "bg-cyan-50", color: "text-cyan-600", icon: Calendar };
    case "follow-up-completed": return { bg: "bg-emerald-50", color: "text-emerald-600", icon: Calendar };
    default: return { bg: "bg-slate-100", color: "text-slate-500", icon: Activity };
  }
}

// ── Quick Actions ─────────────────────────────────────────────────
const quickActions = [
  { label: "Add Customer", desc: "Create a new customer profile", color: "bg-blue-600 hover:bg-blue-700", icon: UserPlus, tabId: "customers" },
  { label: "View Reports", desc: "Analyse CRM performance data", color: "bg-[image:var(--gradient-brand)]", icon: BarChart2, tabId: "reports" },
];

// ── Main Component ────────────────────────────────────────────────
export function OverviewTab({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { business, businessLoading, businessError } = useBusiness();
  const businessId = business?.id ?? null;
  const currency = business?.currency ?? "INR";
  const customerQuery = useCustomers(businessId);
  const notesQuery = useCustomerNotesForBusiness(businessId);
  const invoiceQuery = useInvoices(businessId);
  const paymentQuery = usePayments(businessId);
  const customers = customerQuery.data ?? EMPTY_RECORDS;
  const notes = notesQuery.data ?? EMPTY_RECORDS;
  const invoices = invoiceQuery.data ?? EMPTY_RECORDS;
  const payments = paymentQuery.data ?? EMPTY_RECORDS;
  const customerAnalytics = useMemo(
    () => buildCustomerAnalytics(customers, invoices),
    [customers, invoices],
  );
  const totalRevenue = customerAnalytics.reduce((sum, customer) => sum + customer.totalRevenue, 0);
  const outstandingReceivables = customerAnalytics.reduce(
    (sum, customer) => sum + customer.outstandingAmount,
    0,
  );
  const summary = {
    totalCustomers: customers.length,
    activeCustomers: customers.filter((customer) => customer.status === "active").length,
    newCustomers: customers.filter((customer) => customer.status === "new").length,
    returningCustomers: customerAnalytics.filter((customer) => customer.invoiceCount > 1).length,
    outstandingReceivables,
    avgCustomerValue: customers.length ? Math.round(totalRevenue / customers.length) : 0,
  };
  const acqData = useMemo(() => customerAcquisitionByMonth(customers), [customers]);
  const revData = customerAnalytics
    .filter((customer) => customer.totalRevenue > 0)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 8)
    .map((customer) => ({ name: customer.company_name || customer.name, revenue: customer.totalRevenue }));
  const distData = [...new Set(customers.map((customer) => customer.customer_group).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      name,
      value: customers.filter((customer) => customer.customer_group === name).length,
    }));
  const topCustomers = customerAnalytics
    .filter((customer) => customer.totalRevenue > 0)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 6);
  const recentCustomers = [...customers]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 6);
  const outstandingCustomers = customerAnalytics
    .filter((customer) => customer.outstandingAmount > 0)
    .sort((a, b) => b.outstandingAmount - a.outstandingAmount)
    .slice(0, 6);
  const customerNames = new Map(customers.map((customer) => [customer.id, customer.name]));
  const recentActivities = [
    ...customers.flatMap((customer) => {
      const events = [{
        id: `customer-created-${customer.id}`,
        type: "customer-created",
        title: `Customer added: ${customer.name}`,
        subtitle: "Customer record created",
        timestamp: customer.created_at,
      }];
      if (customer.updated_at > customer.created_at) {
        events.push({
          id: `customer-updated-${customer.id}`,
          type: "customer-updated",
          title: `Customer updated: ${customer.name}`,
          subtitle: "Customer record changed",
          timestamp: customer.updated_at,
        });
      }
      return events;
    }),
    ...notes.map((note) => ({
      id: `note-${note.id}`,
      type: "note-added",
      title: `Note added for ${note.customer_name}`,
      subtitle: `${note.author}: ${note.text}`,
      timestamp: note.created_at,
    })),
    ...invoices.filter((invoice) => invoice.customerId).map((invoice) => ({
      id: `invoice-${invoice.id}`,
      type: "invoice-generated",
      title: `Invoice ${invoice.invoiceNumber}${invoice.customerId ? ` · ${customerNames.get(invoice.customerId) ?? "Customer"}` : ""}`,
      subtitle: `Invoice date · ${invoice.status}`,
      timestamp: invoice.createdDate,
    })),
    ...payments.filter((payment) => payment.customerId).map((payment) => ({
      id: `payment-${payment.id}`,
      type: "payment-received",
      title: `Payment recorded${payment.customerName ? ` from ${payment.customerName}` : ""}`,
      subtitle: `${formatCrmCurrency(payment.amount, currency)} · ${payment.status}`,
      timestamp: payment.date,
    })),
  ]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 8);
  const loading =
    businessLoading || customerQuery.isLoading || notesQuery.isLoading || invoiceQuery.isLoading || paymentQuery.isLoading;
  const loadError = businessError || customerQuery.error || notesQuery.error || invoiceQuery.error || paymentQuery.error;
  const lastUpdated = Math.max(
    customerQuery.dataUpdatedAt,
    notesQuery.dataUpdatedAt,
    invoiceQuery.dataUpdatedAt,
    paymentQuery.dataUpdatedAt,
  );

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white" />
        ))}
      </div>
    );
  }

  if (loadError) {
    return (
      <SectionCard title="CRM data unavailable">
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>{loadError instanceof Error ? loadError.message : "The CRM records could not be loaded."}</p>
          <button
            onClick={() => void Promise.all([customerQuery.refetch(), notesQuery.refetch(), invoiceQuery.refetch(), paymentQuery.refetch()])}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-slate-50"
          >
            Retry
          </button>
        </div>
      </SectionCard>
    );
  }

  if (!businessId || customers.length === 0) {
    return (
      <SectionCard title="Customer overview">
        <div className="space-y-2 text-center">
          <EmptyState
            icon={Users}
            title={businessId ? "No customer records yet" : "Business profile unavailable"}
            subtitle={businessId ? "Create a customer to see CRM metrics and reports." : "Complete business setup to load tenant-scoped CRM records."}
          />
          {businessId && (
            <button
              onClick={() => onNavigate("customers")}
              className="mt-2 rounded-lg bg-[image:var(--gradient-brand)] px-3 py-2 text-xs font-semibold text-white"
            >
              Open Customers
            </button>
          )}
        </div>
      </SectionCard>
    );
  }

  const statTiles = [
    { label: "Total Customers", value: String(summary.totalCustomers), sub: "All time", icon: Users, bg: "bg-blue-50", iconColor: "text-blue-600" },
    { label: "Active Customers", value: String(summary.activeCustomers), sub: "Currently active", icon: UserCheck, bg: "bg-emerald-50", iconColor: "text-emerald-600" },
    { label: "New Customers", value: String(summary.newCustomers), sub: "Recently onboarded", icon: UserPlus, bg: "bg-cyan-50", iconColor: "text-cyan-600" },
    { label: "Returning", value: String(summary.returningCustomers), sub: "Multiple purchases", icon: RefreshCw, bg: "bg-violet-50", iconColor: "text-violet-600" },
    { label: "Revenue", value: formatCrmCurrency(totalRevenue, currency), sub: "Customer-linked invoices", icon: TrendingUp, bg: "bg-emerald-50", iconColor: "text-emerald-600" },
    { label: "Outstanding", value: formatCrmCurrency(summary.outstandingReceivables, currency), sub: "Opening balances + unpaid invoices", icon: IndianRupee, bg: "bg-red-50", iconColor: "text-red-600" },
    { label: "Avg Customer Value", value: formatCrmCurrency(summary.avgCustomerValue, currency), sub: "Invoice revenue per customer", icon: BarChart2, bg: "bg-indigo-50", iconColor: "text-indigo-600" },
  ];

  return (
    <div className="space-y-6">
      {lastUpdated > 0 && (
        <p className="text-right text-[11px] text-muted-foreground">
          Last refreshed {new Date(lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      )}
      {/* Stat Tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {statTiles.map((tile, i) => (
          <StatTile
            key={tile.label}
            label={tile.label}
            value={tile.value}
            sub={tile.sub}
            icon={tile.icon}
            bg={tile.bg}
            iconColor={tile.iconColor}
            index={i}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <SectionCard title="Quick Actions" subtitle="Jump to common CRM tasks" action={<Zap className="h-4 w-4 text-[color:var(--brand-electric)]" />}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => onNavigate(action.tabId)}
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

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Customer Growth Line Chart */}
        <SectionCard title="Customer Growth" subtitle="Monthly acquisitions · last 6 months">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={acqData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip cursor={{ stroke: "#e2e8f0" }} content={<ChartTip currency={currency} />} />
              <Line type="monotone" dataKey="customers" name="Customers" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }} activeDot={{ r: 6, fill: "#3b82f6", strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* Monthly Acquisition Bar Chart */}
        <SectionCard title="Monthly Acquisition" subtitle="New customers per month · bar view">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={acqData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: "rgba(241,245,249,0.6)", radius: 6 }} content={<ChartTip currency={currency} />} />
              <Bar dataKey="customers" name="Customers" fill="#8b5cf6" radius={[5, 5, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Revenue by Customer Bar */}
        <SectionCard title="Revenue by Customer" subtitle="Top 8 customers by total revenue">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={revData} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(value: number) => formatCompactCrmCurrency(value, currency)} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} width={90} />
              <Tooltip content={<RevTip currency={currency} />} />
              <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[0, 5, 5, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* Customer Distribution Pie + Lead Funnel */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Pie */}
          <SectionCard title="Distribution" subtitle="By customer group">
            <div className="flex flex-col items-center gap-3">
              <PieChart width={160} height={160}>
                  <Pie data={distData} dataKey="value" cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={2}>
                    {distData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTip />} />
              </PieChart>
              <div className="flex flex-col gap-1.5 w-full">
                {distData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="flex-1 text-[11px] text-foreground truncate">{d.name}</span>
                    <span className="text-[11px] font-semibold text-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Lead pipeline" subtitle="Not available in the current database">
            <EmptyState
              icon={Target}
              title="Lead records are not configured"
              subtitle="No leads table exists in the current schema, so this overview does not show fabricated pipeline counts."
            />
          </SectionCard>
        </div>
      </div>

      {/* Widgets Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* Top Customers */}
        <SectionCard
          title="Top Customers"
          subtitle="By total revenue"
          action={
            <button onClick={() => onNavigate("customers")} className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              View all
            </button>
          }
        >
          {topCustomers.length ? (
            <div className="space-y-3">
              {topCustomers.map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i, duration: 0.3 }} className="flex items-center gap-3">
                  <Avatar name={c.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{c.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{c.company_name || "—"}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-bold text-foreground">{formatCrmCurrency(c.totalRevenue, currency)}</p>
                    <div className="flex justify-end mt-0.5">
                      {Array.from({ length: c.rating }).map((_, j) => (
                        <Star key={j} className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState icon={BarChart2} title="No customer-linked invoices" subtitle="Revenue rankings appear when invoices are linked to customers." />
          )}
        </SectionCard>

        {/* Recent Activities */}
        <SectionCard title="Recent Activities" subtitle="Latest 8 CRM events">
          {recentActivities.length ? <div className="space-y-3">
            {recentActivities.map((act, i) => {
              const { bg, color, icon: Icon } = activityIcon(act.type);
              return (
                <motion.div key={act.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i, duration: 0.3 }} className="flex items-start gap-3">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                    <Icon className={`h-3.5 w-3.5 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{act.title}</p>
                    <p className="text-[11px] text-muted-foreground">{act.subtitle} · {formatCrmDate(act.timestamp)}</p>
                  </div>
                </motion.div>
              );
            })}
          </div> : <EmptyState icon={Activity} title="No recorded customer activity" subtitle="Customer, invoice, and payment events will appear here when records exist." />}
        </SectionCard>

        <SectionCard title="Follow-ups" subtitle="Not available in the current database">
          <EmptyState
            icon={Calendar}
            title="Follow-up records are not configured"
            subtitle="No follow-up table exists in the current schema. No sample reminders are shown or persisted."
          />
        </SectionCard>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Customers */}
        <SectionCard
          title="Recent Customers"
          subtitle="Newly onboarded customers"
          action={
            <button onClick={() => onNavigate("customers")} className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              View all
            </button>
          }
        >
          <div className="space-y-3">
            {recentCustomers.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i, duration: 0.3 }} className="flex items-center gap-3">
                <Avatar name={c.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground">{c.city || "—"} · {formatCrmDate(c.created_at)}</p>
                </div>
                <CrmStatusPill status={c.status} />
              </motion.div>
            ))}
          </div>
        </SectionCard>

        {/* Outstanding Customers */}
        <SectionCard
          title="Outstanding Customers"
          subtitle="Customers with pending receivables"
          action={<AlertCircle className="h-4 w-4 text-red-500" />}
        >
          {outstandingCustomers.length ? <div className="space-y-3">
            {outstandingCustomers.map((c, i) => {
              const pct = Math.round((c.outstandingAmount / (outstandingCustomers[0]?.outstandingAmount ?? 1)) * 100);
              return (
                <motion.div key={c.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i, duration: 0.3 }} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate">{c.name}</p>
                      <p className="text-[11px] text-muted-foreground">{c.company_name || "—"}</p>
                    </div>
                    <span className="shrink-0 text-xs font-bold text-red-600">{formatCrmCurrency(c.outstandingAmount, currency)}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100">
                    <div className="h-1.5 rounded-full bg-red-400 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </motion.div>
              );
            })}
          </div> : <EmptyState icon={AlertCircle} title="No outstanding balances" subtitle="No opening balances or unpaid customer invoices were found." />}
        </SectionCard>
      </div>
    </div>
  );
}
