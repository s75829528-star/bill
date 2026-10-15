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

  // Custom Tooltip component
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
      <div className="rounded-xl border border-[#E7E2F3] bg-[#FFFFFF] p-2.5 text-xs text-[#19172A] shadow-xl">
        <p className="font-semibold text-[#19172A] mb-1">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-[#6B6880] text-[11px]">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-mono font-bold text-[#19172A] text-xs">
                {formatValue(Number(entry.value))}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[#E7E2F3] bg-[#FFFFFF] p-4 text-[#19172A] transition-colors">
      {/* Chart Top Header & View Toggle */}
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-[#E7E2F3] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#6D5EF7]/15 text-[#6D5EF7] border border-[#6D5EF7]/25">
            <BarChart3 className="h-3.5 w-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[#19172A] tracking-tight">{chart.title}</h4>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center rounded-lg border border-[#E7E2F3] bg-[#FFFFFF] p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => setViewMode("chart")}
            className={`flex items-center gap-1 rounded-md px-2 py-0.5 font-medium transition-all ${
              viewMode === "chart"
                ? "bg-[#FFFFFF] text-[#19172A] shadow-xs font-semibold border border-[#E7E2F3]"
                : "text-[#6B6880] hover:text-[#19172A]"
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
                ? "bg-[#FFFFFF] text-[#19172A] shadow-xs font-semibold border border-[#E7E2F3]"
                : "text-[#6B6880] hover:text-[#19172A]"
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
              <AreaChart data={chart.data} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="primaryAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6D5EF7" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6D5EF7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E2F3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#6B6880" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#6B6880" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatValue}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  name={chart.primaryKeyLabel || "Value"}
                  stroke="#6D5EF7"
                  strokeWidth={2}
                  fill="url(#primaryAreaGrad)"
                  activeDot={{ r: 4, fill: "#6D5EF7", strokeWidth: 2, stroke: "#fff" }}
                />
              </AreaChart>
            ) : (
              <BarChart data={chart.data} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E2F3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#6B6880" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#6B6880" }}
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
                    wrapperStyle={{ fontSize: "11px", paddingBottom: "6px", color: "#6B6880" }}
                  />
                )}
                <Bar
                  dataKey="value"
                  name={chart.primaryKeyLabel || "Primary"}
                  fill="#6D5EF7"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={44}
                />
                {hasSecondary && (
                  <Bar
                    dataKey="secondary"
                    name={chart.secondaryKeyLabel || "Secondary"}
                    fill="#C9C4D8"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={44}
                  />
                )}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      ) : (
        /* Tabular Fallback View */
        <div className="overflow-hidden rounded-xl border border-[#E7E2F3] bg-[#FFFFFF]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FFFFFF] text-[10px] uppercase font-semibold text-[#6B6880] tracking-wider border-b border-[#E7E2F3]">
              <tr>
                <th className="px-3.5 py-2">Metric / Dimension</th>
                <th className="px-3.5 py-2 text-right">{chart.primaryKeyLabel || "Value"}</th>
                {hasSecondary && (
                  <th className="px-3.5 py-2 text-right">
                    {chart.secondaryKeyLabel || "Comparison"}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E2F3]/60">
              {chart.data.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#FFFFFF]/50 transition-colors">
                  <td className="px-3.5 py-2 font-medium text-[#19172A]">{item.label}</td>
                  <td className="px-3.5 py-2 font-mono font-semibold text-[#19172A] text-right">
                    {formatValue(item.value)}
                  </td>
                  {hasSecondary && (
                    <td className="px-3.5 py-2 font-mono text-[#6B6880] text-right">
                      {item.secondary !== undefined ? formatValue(item.secondary) : "—"}
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
