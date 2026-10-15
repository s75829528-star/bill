// ── Billing Overview Tab ──────────────────────────────────────────
import { motion } from "framer-motion";
import {
  IndianRupee,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  FilePlus,
  FileSignature,
  CreditCard,
  LayoutTemplate,
  Zap,
  TrendingUp,
  BarChart2,
  Users,
  Calendar,
  Activity,
  Percent,
  Clock4,
  ArrowUpRight,
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
} from "recharts";
import { fmtINR } from "@/lib/billing-data";
import { SectionCard, StatTile, BillingStatusPill, fmtDate } from "@/components/billing/shared";
import { useBillingOverview } from "@/hooks/useBillingOverview";
import { useBusiness } from "@/contexts/BusinessContext";

// ── Status / payment colour maps ──────────────────────────────────
const statusColors: Record<string, string> = {
  draft: "#94a3b8",
  sent: "#3b82f6",
  paid: "#10b981",
  partial: "#f59e0b",
  overdue: "#ef4444",
  cancelled: "#cbd5e1",
};
const paymentModeColors: Record<string, string> = {
  cash: "#10b981",
  upi: "#3b82f6",
  card: "#8b5cf6",
  "bank-transfer": "#f59e0b",
  neft: "#06b6d4",
  rtgs: "#f97316",
  credit: "#ef4444",
  wallet: "#ec4899",
  cheque: "#64748b",
};

// ── Quick Actions (static — no live data needed) ──────────────────
const quickActions = [
  {
    label: "New Invoice",
    icon: FilePlus,
    color: "bg-blue-600 hover:bg-blue-700",
    desc: "Create a new tax invoice",
    tabId: "invoices",
  },
  {
    label: "New Quotation",
    icon: FileSignature,
    color: "bg-violet-600 hover:bg-violet-700",
    desc: "Send a quote to a customer",
    tabId: "quotations",
  },
  {
    label: "Record Payment",
    icon: CreditCard,
    color: "bg-emerald-600 hover:bg-emerald-700",
    desc: "Log an incoming payment",
    tabId: "payments",
  },
  {
    label: "Manage Templates",
    icon: LayoutTemplate,
    color: "bg-[image:var(--gradient-brand)]",
    desc: "Customise invoice design",
    tabId: "templates",
  },
];

// ── Activity icon helper ───────────────────────────────────────────
function activityIcon(type: string) {
  switch (type) {
    case "invoice-paid":
      return { icon: CheckCircle2, bg: "bg-emerald-50", color: "text-emerald-600" };
    case "payment-received":
      return { icon: IndianRupee, bg: "bg-blue-50", color: "text-blue-600" };
    case "invoice-created":
      return { icon: FilePlus, bg: "bg-indigo-50", color: "text-indigo-600" };
    case "invoice-edited":
      return { icon: FileSignature, bg: "bg-amber-50", color: "text-amber-600" };
    case "invoice-printed":
      return { icon: Receipt, bg: "bg-slate-100", color: "text-slate-600" };
    case "draft-saved":
      return { icon: FileText, bg: "bg-slate-100", color: "text-slate-600" };
    case "quotation-sent":
      return { icon: ArrowUpRight, bg: "bg-violet-50", color: "text-violet-600" };
    case "credit-note-issued":
      return { icon: AlertTriangle, bg: "bg-red-50", color: "text-red-600" };
    default:
      return { icon: Activity, bg: "bg-slate-100", color: "text-slate-600" };
  }
}

function fmtTimestamp(ts: string) {
  const d = new Date(ts);
  return (
    d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
  );
}

// ── Custom Tooltips ────────────────────────────────────────────────
function ChartTip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
      <p className="mb-1.5 text-xs font-semibold text-slate-500">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-bold text-foreground">
          {fmtINR(p.value)}{" "}
          <span className="text-xs font-normal text-muted-foreground">{p.name}</span>
        </p>
      ))}
    </div>
  );
}

function PieTip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
      <p className="text-xs font-semibold text-foreground">{p.name}</p>
      <p className="mt-0.5 text-sm font-bold text-foreground">{p.value} invoices</p>
    </div>
  );
}

function PaymentPieTip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
      <p className="text-xs font-semibold text-foreground">{p.name}</p>
      <p className="mt-0.5 text-sm font-bold text-foreground">{fmtINR(p.value)}</p>
    </div>
  );
}

// ── Skeleton helpers ───────────────────────────────────────────────
function SkeletonTile() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm animate-pulse">
      <div className="h-11 w-11 rounded-xl bg-slate-100" />
      <div className="mt-4 h-7 w-24 rounded bg-slate-100" />
      <div className="mt-1 h-4 w-28 rounded bg-slate-100" />
      <div className="mt-1 h-3 w-20 rounded bg-slate-100" />
    </div>
  );
}

function SkeletonCard({ height = 220 }: { height?: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm animate-pulse">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div className="space-y-1.5">
          <div className="h-4 w-32 rounded bg-slate-100" />
          <div className="h-3 w-48 rounded bg-slate-100" />
        </div>
      </div>
      <div className="p-6">
        <div className="rounded-xl bg-slate-100" style={{ height }} />
      </div>
    </div>
  );
}

function SkeletonRows({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="h-8 w-8 rounded-xl bg-slate-100 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-32 rounded bg-slate-100" />
            <div className="h-3 w-24 rounded bg-slate-100" />
          </div>
          <div className="h-5 w-16 rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export function OverviewTab({ onNavigate }: { onNavigate?: (tabId: string) => void }) {
  const { business } = useBusiness();
  const { data, isLoading, isError, error } = useBillingOverview(business?.id ?? null);

  // ── Error state ──────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center">
        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-red-400" />
        <p className="text-sm font-semibold text-red-700">Failed to load billing overview</p>
        <p className="mt-1 text-xs text-red-500">
          {(error as Error)?.message ?? "Unknown error"}
        </p>
      </div>
    );
  }

  // ── Derived display data ──────────────────────────────────────────
  const {
    todaySales,
    invoicesCreated,
    pendingCount,
    pendingAmount,
    overdueCount,
    overdueAmount,
    collectedAmount,
    gstPayable,
    paidCount,
    totalInvoices,
    collectionRate,
    avgInvoiceValue,
    barChartData,
    statusCounts,
    monthlyRevenueData,
    paymentModeMap,
    recentInvoices,
    upcomingPayments,
    topCustomers,
    maxOutstanding,
    activityFeed,
    dueThisWeekCount,
    filingMonth,
    filingDue,
    customerNameMap,
  } = data;

  const statTiles = [
    {
      label: "Today's Sales",
      value: fmtINR(todaySales),
      sub: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      icon: TrendingUp,
      bg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Invoices Created",
      value: String(invoicesCreated),
      sub: "All time",
      icon: FileText,
      bg: "bg-indigo-50",
      iconColor: "text-indigo-600",
    },
    {
      label: "Pending Payments",
      value: String(pendingCount),
      sub: fmtINR(pendingAmount) + " outstanding",
      icon: Clock,
      bg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      label: "Overdue Invoices",
      value: String(overdueCount),
      sub: fmtINR(overdueAmount) + " overdue",
      icon: AlertTriangle,
      bg: "bg-red-50",
      iconColor: "text-red-600",
    },
    {
      label: "Collected Amount",
      value: fmtINR(collectedAmount),
      sub: "Total received",
      icon: CheckCircle2,
      bg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "GST Payable",
      value: fmtINR(gstPayable),
      sub: "Across all invoices",
      icon: IndianRupee,
      bg: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      label: "Collection Rate",
      value: collectionRate + "%",
      sub: `${paidCount} of ${totalInvoices} paid`,
      icon: Percent,
      bg: "bg-violet-50",
      iconColor: "text-violet-600",
    },
    {
      label: "Avg Invoice Value",
      value: fmtINR(avgInvoiceValue),
      sub: "Per invoice",
      icon: BarChart2,
      bg: "bg-sky-50",
      iconColor: "text-sky-600",
    },
  ];

  const pieData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    color: statusColors[status] ?? "#94a3b8",
  }));

  const paymentDistData = Object.entries(paymentModeMap).map(([mode, amount]) => ({
    name:
      mode === "bank-transfer"
        ? "Bank Transfer"
        : mode.charAt(0).toUpperCase() + mode.slice(1),
    value: amount,
    color: paymentModeColors[mode] ?? "#94a3b8",
  }));

  return (
    <div className="space-y-6">
      {/* Stat Tiles — 8 tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonTile key={i} />)
          : statTiles.map((tile, i) => (
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Invoice Amounts Bar Chart */}
        {isLoading ? (
          <SkeletonCard height={220} />
        ) : (
          <SectionCard
            title="Invoice Amounts"
            subtitle="Grand total per day · last 7 active dates"
            action={
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  INR
                </span>
              </div>
            }
          >
            {barChartData.length === 0 ? (
              <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                No invoice data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barChartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
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
                    tickFormatter={(v: number) => "₹" + (v / 1000).toFixed(0) + "k"}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(241,245,249,0.6)", radius: 6 }}
                    content={<ChartTip />}
                  />
                  <Bar
                    dataKey="Amount"
                    name="Amount"
                    fill="#3b82f6"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={36}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </SectionCard>
        )}

        {/* Invoice Status Pie Chart */}
        {isLoading ? (
          <SkeletonCard height={200} />
        ) : (
          <SectionCard title="Invoice Status Distribution" subtitle="Count by current status">
            {pieData.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                No invoices yet.
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 flex-1">
                  {pieData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="flex-1 truncate text-xs text-foreground">{d.name}</span>
                      <span className="shrink-0 text-xs font-semibold text-foreground">
                        {d.value} invoice{d.value !== 1 ? "s" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>
        )}
      </div>

      {/* Recent Invoices + Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Invoices */}
        {isLoading ? (
          <SkeletonCard height={240} />
        ) : (
          <SectionCard
            title="Recent Invoices"
            subtitle="Latest 8 invoices"
            action={
              <button
                onClick={() => onNavigate?.("invoices")}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                View all
              </button>
            }
          >
            {recentInvoices.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No invoices yet.</p>
            ) : (
              <div className="space-y-3">
                {recentInvoices.map((inv, i) => {
                  const customerName = customerNameMap.get(inv.customerId) ?? inv.customerId;
                  const total = inv.items.reduce((s, item) => {
                    const gross = item.quantity * item.unitPrice;
                    const disc = gross * (item.discountPercent / 100);
                    const taxable = gross - disc;
                    return s + taxable + taxable * (item.gstPercent / 100);
                  }, 0);
                  return (
                    <motion.div
                      key={inv.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.04 * i, duration: 0.3 }}
                      className="flex items-center gap-3"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                        <Receipt className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {customerName || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {inv.invoiceNumber} · {fmtDate(inv.createdDate)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-xs font-bold text-foreground">
                          {fmtINR(Math.round(total))}
                        </span>
                        <BillingStatusPill status={inv.status} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        )}

        {/* Quick Actions — always rendered (no live data) */}
        <SectionCard
          title="Quick Actions"
          subtitle="Jump to common billing tasks"
          action={<Zap className="h-4 w-4 text-[color:var(--brand-electric)]" />}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() =>
                    onNavigate ? onNavigate(action.tabId) : console.log("navigate:", action.tabId)
                  }
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

      {/* ── ENTERPRISE ANALYTICS ─────────────────────────────────── */}

      {/* Monthly Revenue + Top Customers */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Monthly Revenue Line Chart */}
        {isLoading ? (
          <SkeletonCard height={220} />
        ) : (
          <SectionCard
            title="Monthly Revenue"
            subtitle="Invoice totals by month"
            action={
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                INR
              </div>
            }
          >
            {monthlyRevenueData.length === 0 ? (
              <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                No monthly data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart
                  data={monthlyRevenueData}
                  margin={{ top: 4, right: 8, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => "₹" + (v / 100000).toFixed(1) + "L"}
                  />
                  <Tooltip content={<ChartTip />} />
                  <Line
                    type="monotone"
                    dataKey="Revenue"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: "#3b82f6", strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </SectionCard>
        )}

        {/* Top Customers by Outstanding Balance */}
        {isLoading ? (
          <SkeletonCard height={200} />
        ) : (
          <SectionCard
            title="Top Customers"
            subtitle="By outstanding balance"
            action={<Users className="h-4 w-4 text-muted-foreground" />}
          >
            {topCustomers.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No outstanding balances.
              </p>
            ) : (
              <div className="space-y-4">
                {topCustomers.map((c, i) => {
                  const pct = Math.round((c.balance / maxOutstanding) * 100);
                  return (
                    <div key={c.id} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-foreground">
                              {c.name}
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 text-xs font-bold text-foreground">
                          {fmtINR(c.balance)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100">
                        <div
                          className="h-1.5 rounded-full bg-blue-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        )}
      </div>

      {/* Business Insights + Payment Distribution */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Business Insights 2×2 grid */}
        {isLoading ? (
          <SkeletonCard height={200} />
        ) : (
          <SectionCard
            title="Business Insights"
            subtitle="Key performance indicators"
            action={<Activity className="h-4 w-4 text-muted-foreground" />}
          >
            <div className="grid grid-cols-2 gap-3">
              {/* Collection Rate */}
              <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-violet-100">
                    <Percent className="h-3.5 w-3.5 text-violet-600" />
                  </div>
                  <span className="text-[11px] font-semibold text-violet-700">Collection Rate</span>
                </div>
                <p className="text-2xl font-bold text-violet-700">{collectionRate}%</p>
                <p className="mt-0.5 text-[10px] text-violet-500">
                  {paidCount} of {totalInvoices} invoices paid
                </p>
                <div className="mt-2 flex items-center gap-1 text-[10px] text-violet-600 font-medium">
                  <TrendingUp className="h-3 w-3" />
                  <span>Positive trend</span>
                </div>
              </div>

              {/* Avg Days to Pay (static KPI — no payment date in schema) */}
              <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-sky-100">
                    <Clock4 className="h-3.5 w-3.5 text-sky-600" />
                  </div>
                  <span className="text-[11px] font-semibold text-sky-700">Avg Invoice Value</span>
                </div>
                <p className="text-2xl font-bold text-sky-700">{fmtINR(avgInvoiceValue)}</p>
                <p className="mt-0.5 text-[10px] text-sky-500">per invoice average</p>
                <div className="mt-2 flex items-center gap-1 text-[10px] text-sky-600 font-medium">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>All time</span>
                </div>
              </div>

              {/* Invoices Due This Week */}
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-100">
                    <Calendar className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <span className="text-[11px] font-semibold text-amber-700">Due This Week</span>
                </div>
                <p className="text-2xl font-bold text-amber-700">{dueThisWeekCount}</p>
                <p className="mt-0.5 text-[10px] text-amber-500">invoices due within 7 days</p>
                <div className="mt-2 flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                  <Clock className="h-3 w-3" />
                  <span>Action required</span>
                </div>
              </div>

              {/* GST Filing Month */}
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100">
                    <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700">GST Filing</span>
                </div>
                <p className="text-2xl font-bold text-emerald-700">{filingMonth}</p>
                <p className="mt-0.5 text-[10px] text-emerald-500">Current filing month</p>
                <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                  <Calendar className="h-3 w-3" />
                  <span>Due {filingDue}</span>
                </div>
              </div>
            </div>
          </SectionCard>
        )}

        {/* Payment Distribution Pie */}
        {isLoading ? (
          <SkeletonCard height={200} />
        ) : (
          <SectionCard title="Payment Distribution" subtitle="Breakdown by payment mode">
            {paymentDistData.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                No payment data yet.
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={paymentDistData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {paymentDistData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<PaymentPieTip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 flex-1">
                  {paymentDistData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="flex-1 truncate text-xs text-foreground">{d.name}</span>
                      <span className="shrink-0 text-xs font-semibold text-foreground">
                        {fmtINR(d.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>
        )}
      </div>

      {/* Upcoming Payments */}
      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm animate-pulse">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div className="space-y-1.5">
              <div className="h-4 w-40 rounded bg-slate-100" />
              <div className="h-3 w-56 rounded bg-slate-100" />
            </div>
          </div>
          <div className="p-6">
            <SkeletonRows count={4} />
          </div>
        </div>
      ) : (
        <SectionCard
          title="Upcoming Payments"
          subtitle="Sent & partial invoices · sorted by due date"
          action={
            <button
              onClick={() => onNavigate?.("invoices")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              View all
            </button>
          }
        >
          {upcomingPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No upcoming payments.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-2 text-left font-semibold text-muted-foreground">Invoice</th>
                    <th className="pb-2 text-left font-semibold text-muted-foreground">Customer</th>
                    <th className="pb-2 text-left font-semibold text-muted-foreground">Due Date</th>
                    <th className="pb-2 text-right font-semibold text-muted-foreground">Balance Due</th>
                    <th className="pb-2 text-right font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {upcomingPayments.map((inv, i) => {
                    const cname = customerNameMap.get(inv.customerId) ?? inv.customerId;
                    const total = inv.items.reduce((s, item) => {
                      const gross = item.quantity * item.unitPrice;
                      const disc = gross * (item.discountPercent / 100);
                      const taxable = gross - disc;
                      return s + taxable + taxable * (item.gstPercent / 100);
                    }, 0);
                    const balance = Math.round(total) - inv.amountPaid;
                    return (
                      <motion.tr
                        key={inv.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.04 * i, duration: 0.25 }}
                        className="group"
                      >
                        <td className="py-2.5 pr-4 font-medium text-foreground">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-2.5 pr-4 text-foreground">{cname || "—"}</td>
                        <td className="py-2.5 pr-4 text-muted-foreground">
                          {inv.dueDate ? fmtDate(inv.dueDate) : "—"}
                        </td>
                        <td className="py-2.5 pr-4 text-right font-bold text-foreground">
                          {fmtINR(balance)}
                        </td>
                        <td className="py-2.5 text-right">
                          <BillingStatusPill status={inv.status} />
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      {/* Activity Timeline */}
      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm animate-pulse">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div className="space-y-1.5">
              <div className="h-4 w-28 rounded bg-slate-100" />
              <div className="h-3 w-44 rounded bg-slate-100" />
            </div>
          </div>
          <div className="p-6">
            <SkeletonRows count={5} />
          </div>
        </div>
      ) : (
        <SectionCard
          title="Activity Feed"
          subtitle="Recent billing activity"
          action={<Activity className="h-4 w-4 text-muted-foreground" />}
        >
          {activityFeed.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No activity yet.
            </p>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-slate-100" />
              <div className="space-y-4">
                {activityFeed.map((event, i) => {
                  const { icon: EventIcon, bg, color } = activityIcon(event.type);
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.04 * i, duration: 0.25 }}
                      className="flex items-start gap-3 pl-1"
                    >
                      {/* Dot */}
                      <div
                        className={`relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full ${bg}`}
                      >
                        <EventIcon className={`h-3.5 w-3.5 ${color}`} />
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground">{event.title}</p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {event.subtitle}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            {event.amount !== undefined && (
                              <p className="text-xs font-bold text-foreground">
                                {fmtINR(event.amount)}
                              </p>
                            )}
                            <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {fmtTimestamp(event.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}
