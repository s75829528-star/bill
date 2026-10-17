import { motion } from "framer-motion";
import { Activity, Package } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  DashboardRevenuePoint,
  DashboardSalesPoint,
  DashboardTopProduct,
} from "../../hooks/useDashboardData";

function SectionCard({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
      <Activity className="h-8 w-8 text-slate-300" />
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

function ChartSkeleton({ height }: { height: number }) {
  return <div className="animate-pulse rounded-xl bg-slate-100" style={{ height }} />;
}

function ChartTooltip({
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
      {payload.map((item, index) => (
        <p key={index} className="text-sm font-bold text-foreground">
          ₹{item.value.toLocaleString("en-IN")}{" "}
          <span className="text-xs font-normal text-muted-foreground">{item.name}</span>
        </p>
      ))}
    </div>
  );
}

export function RevenueChart({
  data,
  isLoading,
}: {
  data: DashboardRevenuePoint[];
  isLoading: boolean;
}) {
  const hasData = data.some((point) => point.revenue > 0);

  return (
    <SectionCard
      title="Revenue Overview"
      subtitle="Last 13 days · INR"
      className="xl:col-span-2"
      action={
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Revenue
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-300" />
            Target
          </span>
        </div>
      }
    >
      {isLoading ? (
        <ChartSkeleton height={220} />
      ) : !hasData ? (
        <div style={{ height: 220 }}>
          <EmptyChart message="No invoices yet. Create your first invoice to see the revenue chart." />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.08} />
                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="target"
              name="Target"
              stroke="#cbd5e1"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill="url(#colorTarget)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#3b82f6"
              strokeWidth={2.5}
              fill="url(#colorRevenue)"
              dot={false}
              activeDot={{ r: 5, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </SectionCard>
  );
}

export function SalesTrend({
  data,
  isLoading,
}: {
  data: DashboardSalesPoint[];
  isLoading: boolean;
}) {
  const hasData = data.some((point) => point.sales > 0 || point.returns > 0);

  return (
    <SectionCard title="Sales Trend" subtitle="This week · invoices">
      {isLoading ? (
        <ChartSkeleton height={200} />
      ) : !hasData ? (
        <div style={{ height: 200 }}>
          <EmptyChart message="No invoices this week yet." />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(241,245,249,0.6)", radius: 6 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                    <p className="mb-1 text-xs font-semibold text-slate-500">{label}</p>
                    {payload.map((item, index) => (
                      <p key={index} className="text-sm font-bold text-foreground">
                        {item.value}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          {item.name}
                        </span>
                      </p>
                    ))}
                  </div>
                );
              }}
            />
            <Bar
              dataKey="sales"
              name="Sales"
              fill="#3b82f6"
              radius={[5, 5, 0, 0]}
              maxBarSize={36}
            />
            <Bar
              dataKey="returns"
              name="Cancelled"
              fill="#fca5a5"
              radius={[5, 5, 0, 0]}
              maxBarSize={36}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </SectionCard>
  );
}

export function TopProducts({
  products,
  isLoading,
}: {
  products: DashboardTopProduct[];
  isLoading: boolean;
}) {
  return (
    <SectionCard title="Top Products" subtitle="By sales value · INR">
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-8 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Package className="mb-2 h-8 w-8 text-slate-300" />
          <p className="text-xs font-medium text-muted-foreground">No sales data yet</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Create invoices with products to see top sellers here.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {products.map((product, index) => (
              <div key={product.name} className="flex items-center gap-3">
                <span className="w-4 shrink-0 text-xs font-bold text-muted-foreground">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="truncate text-xs font-medium text-foreground">
                      {product.name}
                    </span>
                    <span className="ml-2 shrink-0 text-xs font-bold text-foreground">
                      ₹{product.sales.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(product.sales / products[0].sales) * 100}%` }}
                      transition={{ duration: 0.7, delay: 0.1 * index, ease: "easeOut" }}
                      className="h-1.5 rounded-full"
                      style={{ backgroundColor: product.color }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex justify-center">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie
                  data={products}
                  dataKey="sales"
                  cx="50%"
                  cy="50%"
                  innerRadius={32}
                  outerRadius={52}
                  paddingAngle={2}
                >
                  {products.map((product, index) => (
                    <Cell key={index} fill={product.color} stroke="none" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </SectionCard>
  );
}
