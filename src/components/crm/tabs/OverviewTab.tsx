// ── CRM Overview Tab ──────────────────────────────────────────────
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
  ArrowUpRight,
  Clock,
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
import {
  crmCustomers,
  followUps,
  crmActivity,
  crmSummary,
  monthlyAcquisition,
  revenueByCustomer,
  customerDistribution,
  leadConversionFunnel,
  fmtINR,
  fmtDate,
} from "@/lib/crm-data";
import {
  SectionCard,
  StatTile,
  CrmStatusPill,
  Avatar,
} from "@/components/crm/shared";

// ── Derived data (computed once at module level) ───────────────────
const summary = crmSummary();
const acqData = monthlyAcquisition();
const revData = revenueByCustomer(8);
const distData = customerDistribution();
const funnelData = leadConversionFunnel();

const topCustomers = [...crmCustomers]
  .sort((a, b) => b.totalRevenue - a.totalRevenue)
  .slice(0, 6);

const recentCustomers = [...crmCustomers]
  .sort((a, b) => (a.createdDate < b.createdDate ? 1 : -1))
  .slice(0, 6);

const recentActivities = crmActivity.slice(0, 8);

const upcomingFollowUps = [...followUps]
  .filter((f) => f.status === "pending")
  .sort((a, b) => (a.date < b.date ? -1 : 1))
  .slice(0, 6);

const outstandingCustomers = [...crmCustomers]
  .filter((c) => c.outstandingAmount > 0)
  .sort((a, b) => b.outstandingAmount - a.outstandingAmount)
  .slice(0, 6);

// ── Pie colours ───────────────────────────────────────────────────
const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#f97316"];

const FUNNEL_COLORS: Record<string, string> = {
  new: "#94a3b8",
  contacted: "#3b82f6",
  qualified: "#06b6d4",
  proposal: "#8b5cf6",
  negotiation: "#f59e0b",
  won: "#10b981",
};

// ── Tooltip helpers ───────────────────────────────────────────────
function ChartTip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
      <p className="mb-1.5 text-xs font-semibold text-slate-500">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-bold text-foreground">
          {typeof p.value === "number" && p.name.toLowerCase().includes("revenue")
            ? fmtINR(p.value)
            : p.value}{" "}
          <span className="text-xs font-normal text-muted-foreground">{p.name}</span>
        </p>
      ))}
    </div>
  );
}

function RevTip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
      <p className="mb-1 text-xs font-semibold text-slate-500 truncate max-w-[140px]">{label}</p>
      <p className="text-sm font-bold text-foreground">{fmtINR(payload[0].value)}</p>
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
  { label: "Create Lead", desc: "Add a lead to the pipeline", color: "bg-violet-600 hover:bg-violet-700", icon: Target, tabId: "leads" },
  { label: "Schedule Follow-up", desc: "Book a follow-up call or meeting", color: "bg-cyan-600 hover:bg-cyan-700", icon: Calendar, tabId: "follow-ups" },
  { label: "View Reports", desc: "Analyse CRM performance data", color: "bg-[image:var(--gradient-brand)]", icon: BarChart2, tabId: "reports" },
];

// ── Main Component ────────────────────────────────────────────────
export function OverviewTab({ onNavigate }: { onNavigate: (id: string) => void }) {
  const statTiles = [
    { label: "Total Customers", value: String(summary.totalCustomers), sub: "All time", icon: Users, bg: "bg-blue-50", iconColor: "text-blue-600" },
    { label: "Active Customers", value: String(summary.activeCustomers), sub: "Currently active", icon: UserCheck, bg: "bg-emerald-50", iconColor: "text-emerald-600" },
    { label: "New Customers", value: String(summary.newCustomers), sub: "Recently onboarded", icon: UserPlus, bg: "bg-cyan-50", iconColor: "text-cyan-600" },
    { label: "Returning", value: String(summary.returningCustomers), sub: "Multiple purchases", icon: RefreshCw, bg: "bg-violet-50", iconColor: "text-violet-600" },
    { label: "Total Leads", value: String(summary.totalLeads), sub: "In pipeline", icon: Target, bg: "bg-amber-50", iconColor: "text-amber-600" },
    { label: "Converted Leads", value: String(summary.convertedLeads), sub: "Leads won", icon: TrendingUp, bg: "bg-emerald-50", iconColor: "text-emerald-600" },
    { label: "Outstanding", value: fmtINR(summary.outstandingReceivables), sub: "Receivables", icon: IndianRupee, bg: "bg-red-50", iconColor: "text-red-600" },
    { label: "Avg Customer Value", value: fmtINR(summary.avgCustomerValue), sub: "Per customer", icon: BarChart2, bg: "bg-indigo-50", iconColor: "text-indigo-600" },
    { label: "Growth Rate", value: `${summary.growthRate}%`, sub: "Last 90 days", icon: ArrowUpRight, bg: "bg-pink-50", iconColor: "text-pink-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              <Tooltip cursor={{ stroke: "#e2e8f0" }} content={<ChartTip />} />
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
              <Tooltip cursor={{ fill: "rgba(241,245,249,0.6)", radius: 6 }} content={<ChartTip />} />
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
              <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => "₹" + (v / 100000).toFixed(1) + "L"} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} width={90} />
              <Tooltip content={<RevTip />} />
              <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[0, 5, 5, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* Customer Distribution Pie + Lead Funnel */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Pie */}
          <SectionCard title="Distribution" subtitle="By customer group">
            <div className="flex flex-col items-center gap-3">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={distData} dataKey="value" cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={2}>
                    {distData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTip />} />
                </PieChart>
              </ResponsiveContainer>
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

          {/* Lead Funnel */}
          <SectionCard title="Lead Funnel" subtitle="Conversion stages">
            <div className="flex flex-col gap-2">
              {funnelData.map((item) => {
                const maxCount = Math.max(...funnelData.map((f) => f.count), 1);
                const pct = Math.round((item.count / maxCount) * 100);
                const color = FUNNEL_COLORS[item.stage] ?? "#94a3b8";
                return (
                  <div key={item.stage} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-foreground capitalize">{item.stage}</span>
                      <span className="text-[11px] font-bold text-foreground">{item.count}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100">
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
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
          <div className="space-y-3">
            {topCustomers.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i, duration: 0.3 }} className="flex items-center gap-3">
                <Avatar name={c.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{c.company}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-bold text-foreground">{fmtINR(c.totalRevenue)}</p>
                  <div className="flex justify-end mt-0.5">
                    {Array.from({ length: c.rating }).map((_, j) => (
                      <Star key={j} className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </SectionCard>

        {/* Recent Activities */}
        <SectionCard title="Recent Activities" subtitle="Latest 8 CRM events">
          <div className="space-y-3">
            {recentActivities.map((act, i) => {
              const { bg, color, icon: Icon } = activityIcon(act.type);
              return (
                <motion.div key={act.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i, duration: 0.3 }} className="flex items-start gap-3">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                    <Icon className={`h-3.5 w-3.5 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{act.title}</p>
                    <p className="text-[11px] text-muted-foreground">{act.subtitle} · {fmtDate(act.timestamp)}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </SectionCard>

        {/* Upcoming Follow-ups */}
        <SectionCard
          title="Upcoming Follow-ups"
          subtitle="Pending follow-ups by date"
          action={
            <button onClick={() => onNavigate("follow-ups")} className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              View all
            </button>
          }
        >
          {upcomingFollowUps.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">No upcoming follow-ups</p>
          ) : (
            <div className="space-y-3">
              {upcomingFollowUps.map((fu, i) => (
                <motion.div key={fu.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i, duration: 0.3 }} className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{fu.subjectName}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{fu.purpose}</p>
                    <p className="text-[11px] text-slate-500">{fmtDate(fu.date)} · {fu.time}</p>
                  </div>
                  <CrmStatusPill status={fu.priority} label={fu.priority} />
                </motion.div>
              ))}
            </div>
          )}
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
                  <p className="text-[11px] text-muted-foreground">{c.city} · {fmtDate(c.createdDate)}</p>
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
          <div className="space-y-3">
            {outstandingCustomers.map((c, i) => {
              const pct = Math.round((c.outstandingAmount / (outstandingCustomers[0]?.outstandingAmount ?? 1)) * 100);
              return (
                <motion.div key={c.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i, duration: 0.3 }} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate">{c.name}</p>
                      <p className="text-[11px] text-muted-foreground">{c.company}</p>
                    </div>
                    <span className="shrink-0 text-xs font-bold text-red-600">{fmtINR(c.outstandingAmount)}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100">
                    <div className="h-1.5 rounded-full bg-red-400 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
