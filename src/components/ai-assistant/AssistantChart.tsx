import { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { BarChart3, Table } from "lucide-react";
import type { AssistantChartConfig } from "../../services/ai-assistant";

interface AssistantChartProps {
  chart: AssistantChartConfig;
}

export function AssistantChart({ chart }: AssistantChartProps) {
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");

  if (!chart || !chart.data || chart.data.length === 0) return null;

  const unit = chart.unit || "";
  const hasSecondary = chart.data.some((d) => d.secondary !== undefined);

  // Format currency or general numbers
  const formatValue = (val: number) => {
    if (unit === "₹") {
      if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
      if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
      if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
      return `₹${val.toLocaleString("en-IN")}`;
    }
    return val.toLocaleString("en-IN") + (unit ? ` ${unit}` : "");
  };

  // Custom Tooltip component (Deep Obsidian Luminescent)
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number; name: string; color: string }>;
    label?: string;
  }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="rounded-lg border border-[#272B38] bg-[#0B0D14] p-2.5 text-xs text-[#F3F4F6] shadow-xl">
        <p className="font-semibold text-zinc-300 mb-1">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}:
              </span>
              <span className="font-mono font-bold text-white text-xs">
                {formatValue(Number(entry.value))}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[#272B38] bg-[#191C27] p-4 text-[#F3F4F6] transition-colors">
      {/* Chart Top Header & View Toggle */}
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
            <BarChart3 className="h-3.5 w-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-200 tracking-tight">
              {chart.title}
            </h4>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-950/80 p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => setViewMode("chart")}
            className={`flex items-center gap-1 rounded-md px-2 py-0.5 font-medium transition-all ${
              viewMode === "chart"
                ? "bg-zinc-800 text-white shadow-2xs font-semibold"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <BarChart3 className="h-3 w-3" />
            <span className="hidden sm:inline">Visual</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1 rounded-md px-2 py-0.5 font-medium transition-all ${
              viewMode === "table"
                ? "bg-zinc-800 text-white shadow-2xs font-semibold"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Table className="h-3 w-3" />
            <span className="hidden sm:inline">Table</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      {viewMode === "chart" ? (
        <div className="h-52 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chart.type === "area" ? (
              <AreaChart
                data={chart.data}
                margin={{ top: 8, right: 12, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="primaryAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#27272a"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#71717a" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#71717a" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatValue}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  name={chart.primaryKeyLabel || "Value"}
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#primaryAreaGrad)"
                  activeDot={{ r: 4, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }}
                />
              </AreaChart>
            ) : (
              <BarChart
                data={chart.data}
                margin={{ top: 8, right: 12, left: -10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#27272a"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#71717a" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#71717a" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatValue}
                />
                <Tooltip content={<CustomTooltip />} />
                {hasSecondary && (
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "11px", paddingBottom: "6px", color: "#a1a1aa" }}
                  />
                )}
                <Bar
                  dataKey="value"
                  name={chart.primaryKeyLabel || "Primary"}
                  fill="#6366f1"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={44}
                />
                {hasSecondary && (
                  <Bar
                    dataKey="secondary"
                    name={chart.secondaryKeyLabel || "Secondary"}
                    fill="#3f3f46"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={44}
                  />
                )}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      ) : (
        /* Tabular Fallback View */
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/70">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
              <tr>
                <th className="px-3.5 py-2">Metric / Dimension</th>
                <th className="px-3.5 py-2 text-right">
                  {chart.primaryKeyLabel || "Value"}
                </th>
                {hasSecondary && (
                  <th className="px-3.5 py-2 text-right">
                    {chart.secondaryKeyLabel || "Comparison"}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 bg-zinc-900/40">
              {chart.data.map((item, idx) => (
                <tr key={idx} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-3.5 py-2 font-medium text-zinc-200">
                    {item.label}
                  </td>
                  <td className="px-3.5 py-2 font-mono font-bold text-white text-right">
                    {formatValue(item.value)}
                  </td>
                  {hasSecondary && (
                    <td className="px-3.5 py-2 font-mono text-zinc-400 text-right">
                      {item.secondary !== undefined
                        ? formatValue(item.secondary)
                        : "—"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
