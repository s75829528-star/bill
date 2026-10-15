// ── Reports Tab ───────────────────────────────────────────────────
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart2,
  TrendingUp,
  Users,
  Receipt,
  Download,
  FileText,
  Printer,
  Star,
  AlertTriangle,
  CheckCircle2,
  Clock,
  IndianRupee,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  invoiceGrandTotal,
  computeDocumentTotals,
  fmtINR,
  fmtDate,
  computeLineItem,
} from "@/lib/billing-data";
import type { Invoice, PaymentTxn } from "@/lib/billing-data";
import {
  SectionCard,
  StatTile,
  SecondaryButton,
  EmptyState,
} from "@/components/billing/shared";
import { BillingStatusPill } from "@/components/billing/shared";
import { useBusiness } from "@/contexts/BusinessContext";
import { useInvoices } from "@/hooks/useInvoicesQuery";
import { usePayments } from "@/hooks/usePaymentsQuery";
import { useCustomers } from "@/hooks/useCustomersQuery";
import { useProducts } from "@/hooks/useProductsQuery";
import type { Customer } from "@/services/customers";
import type { DbProduct } from "@/services/products";

// ── Types ──────────────────────────────────────────────────────────

type ReportTab =
  | "invoice-analytics"
  | "payment-analytics"
  | "customer-sales"
  | "gst-summary"
  | "top-products"
  | "monthly-revenue"
  | "outstanding"
  | "collection";

const REPORT_TABS: { id: ReportTab; label: string; icon: React.ElementType }[] = [
  { id: "invoice-analytics", label: "Invoice Analytics", icon: BarChart2 },
  { id: "payment-analytics", label: "Payment Analytics", icon: IndianRupee },
  { id: "customer-sales", label: "Customer Sales", icon: Users },
  { id: "gst-summary", label: "GST Summary", icon: Receipt },
  { id: "top-products", label: "Top Products", icon: TrendingUp },
  { id: "monthly-revenue", label: "Monthly Revenue", icon: TrendingUp },
  { id: "outstanding", label: "Outstanding", icon: AlertTriangle },
  { id: "collection", label: "Collection", icon: CheckCircle2 },
];

const CHART_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

// ── Export helpers ─────────────────────────────────────────────────

interface ExportData {
  headers: string[];
  rows: (string | number)[][];
}

function downloadBlob(content: string, mime: string, filename: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Export Bar ─────────────────────────────────────────────────────

function ExportBar({
  reportName,
  exportData,
}: {
  reportName: string;
  exportData?: ExportData;
}) {
  const slug = reportName.toLowerCase().replace(/\s+/g, "-");

  const handleExportCSV = () => {
    if (!exportData) {
      downloadBlob(
        `Report,${reportName}\nGenerated,${new Date().toLocaleDateString("en-IN")}\nData,No data`,
        "text/csv",
        `${slug}-report.csv`
      );
      return;
    }
    const lines = [
      exportData.headers.join(","),
      ...exportData.rows.map((row) =>
        row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
      ),
    ];
    downloadBlob(lines.join("\n"), "text/csv", `${slug}-report.csv`);
  };

  const handleExportJSON = () => {
    const jsonData = exportData
      ? exportData.rows.map((row) =>
          Object.fromEntries(exportData.headers.map((h, i) => [h, row[i]]))
        )
      : [];
    downloadBlob(
      JSON.stringify(
        { report: reportName, generated: new Date().toISOString(), data: jsonData },
        null,
        2
      ),
      "application/json",
      `${slug}-report.json`
    );
  };

  const handleExportExcel = () => {
    // Produce a tab-separated file that Excel opens natively
    if (!exportData) return;
    const lines = [
      exportData.headers.join("\t"),
      ...exportData.rows.map((row) => row.join("\t")),
    ];
    downloadBlob(lines.join("\n"), "text/tab-separated-values", `${slug}-report.xls`);
  };

  const handlePrint = () => window.print();

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="mr-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
        Export:
      </span>
      <button
        onClick={handlePrint}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <FileText className="h-3.5 w-3.5" /> PDF
      </button>
      <button
        onClick={handleExportExcel}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <Download className="h-3.5 w-3.5" /> Excel
      </button>
      <button
        onClick={handleExportCSV}
        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
      >
        <Download className="h-3.5 w-3.5" /> CSV
      </button>
      <button
        onClick={handleExportJSON}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <Download className="h-3.5 w-3.5" /> JSON
      </button>
      <button
        onClick={handlePrint}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <Printer className="h-3.5 w-3.5" /> Print
      </button>
    </div>
  );
}

// ── Table helpers ──────────────────────────────────────────────────

function Th({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: boolean;
}) {
  return (
    <th
      className={`px-4 py-3 text-xs font-semibold text-muted-foreground ${
        right ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}
function Td({
  children,
  right,
  className = "",
}: {
  children: React.ReactNode;
  right?: boolean;
  className?: string;
}) {
  return (
    <td
      className={`px-4 py-3 text-sm ${right ? "text-right font-semibold" : ""} ${className}`}
    >
      {children}
    </td>
  );
}

// ── Loading skeleton ───────────────────────────────────────────────

function ReportSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-12 rounded-xl bg-slate-100" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-slate-100" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-slate-100" />
      <div className="h-48 rounded-2xl bg-slate-100" />
    </div>
  );
}

// ── 1. Invoice Analytics ───────────────────────────────────────────

function InvoiceAnalyticsReport() {
  const { business } = useBusiness();
  const businessId = business?.id ?? null;
  const { data: invoices = [], isLoading } = useInvoices(businessId);
  const { data: dbCustomers = [] } = useCustomers(businessId);

  const customerMap = useMemo(
    () => new Map(dbCustomers.map((c) => [c.id, c])),
    [dbCustomers]
  );

  const totalInvoiced = useMemo(
    () => invoices.reduce((s, inv) => s + invoiceGrandTotal(inv), 0),
    [invoices]
  );
  const totalCollected = useMemo(
    () => invoices.reduce((s, inv) => s + inv.amountPaid, 0),
    [invoices]
  );
  const totalOutstanding = totalInvoiced - totalCollected;
  const avgInvoiceValue =
    invoices.length > 0 ? totalInvoiced / invoices.length : 0;
  const collectionRate =
    totalInvoiced > 0
      ? ((totalCollected / totalInvoiced) * 100).toFixed(1)
      : "0";

  const statusGroups = useMemo(() => {
    const groups: Record<string, number> = {};
    for (const inv of invoices) {
      groups[inv.status] = (groups[inv.status] ?? 0) + invoiceGrandTotal(inv);
    }
    return Object.entries(groups).map(([status, amount]) => ({ status, amount }));
  }, [invoices]);

  const top10 = useMemo(
    () =>
      [...invoices]
        .sort((a, b) => invoiceGrandTotal(b) - invoiceGrandTotal(a))
        .slice(0, 10),
    [invoices]
  );

  const exportData = useMemo<ExportData>(
    () => ({
      headers: ["Invoice #", "Customer", "Date", "Amount", "Status"],
      rows: top10.map((inv) => [
        inv.invoiceNumber,
        customerMap.get(inv.customerId)?.name ?? inv.customerId,
        fmtDate(inv.createdDate),
        invoiceGrandTotal(inv),
        inv.status,
      ]),
    }),
    [top10, customerMap]
  );

  if (isLoading) return <ReportSkeleton />;

  return (
    <div className="space-y-6">
      <ExportBar reportName="Invoice Analytics" exportData={exportData} />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile
          label="Total Invoiced"
          value={fmtINR(totalInvoiced)}
          icon={Receipt}
          bg="bg-blue-50"
          iconColor="text-blue-600"
          index={0}
        />
        <StatTile
          label="Collected"
          value={fmtINR(totalCollected)}
          icon={CheckCircle2}
          bg="bg-emerald-50"
          iconColor="text-emerald-600"
          index={1}
        />
        <StatTile
          label="Outstanding"
          value={fmtINR(totalOutstanding)}
          icon={Clock}
          bg="bg-amber-50"
          iconColor="text-amber-600"
          index={2}
        />
        <StatTile
          label="Collection Rate"
          value={`${collectionRate}%`}
          icon={TrendingUp}
          bg="bg-violet-50"
          iconColor="text-violet-600"
          index={3}
        />
      </div>
      <SectionCard title="Invoice Amounts by Status">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={statusGroups}
            margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="status" tick={{ fontSize: 11 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip formatter={(v: number) => fmtINR(v)} />
            <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>
      <SectionCard title="Top 10 Invoices by Amount" noPadding>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <Th>Invoice #</Th>
                <Th>Customer</Th>
                <Th>Date</Th>
                <Th right>Amount</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {top10.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-sm text-slate-400"
                  >
                    No invoices found.
                  </td>
                </tr>
              ) : (
                top10.map((inv, i) => {
                  const cust = customerMap.get(inv.customerId);
                  return (
                    <motion.tr
                      key={inv.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-slate-100 hover:bg-slate-50/60"
                    >
                      <Td>
                        <span className="font-mono font-medium text-foreground">
                          {inv.invoiceNumber}
                        </span>
                      </Td>
                      <Td>{cust?.name ?? "—"}</Td>
                      <Td>{fmtDate(inv.createdDate)}</Td>
                      <Td right>{fmtINR(invoiceGrandTotal(inv))}</Td>
                      <Td>
                        <BillingStatusPill status={inv.status} />
                      </Td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

// ── 2. Payment Analytics ───────────────────────────────────────────

function PaymentAnalyticsReport() {
  const { business } = useBusiness();
  const businessId = business?.id ?? null;
  const { data: payments = [], isLoading } = usePayments(businessId);
  const { data: invoices = [] } = useInvoices(businessId);

  const totalReceived = useMemo(
    () =>
      payments
        .filter((p) => p.status === "received")
        .reduce((s, p) => s + p.amount, 0),
    [payments]
  );
  const totalPending = useMemo(
    () =>
      payments
        .filter((p) => p.status === "pending")
        .reduce((s, p) => s + p.amount, 0),
    [payments]
  );
  const totalRefunded = useMemo(
    () =>
      payments
        .filter((p) => p.status === "refunded")
        .reduce((s, p) => s + p.amount, 0),
    [payments]
  );

  // Average collection time: days between invoice date and payment date
  const avgPaymentTime = useMemo(() => {
    const received = payments.filter((p) => p.status === "received");
    let totalDays = 0;
    let count = 0;
    for (const p of received) {
      const inv = invoices.find((i) => i.id === p.invoiceId);
      if (!inv) continue;
      const invDate = new Date(inv.createdDate + "T00:00:00");
      const payDate = new Date(p.date + "T00:00:00");
      const days = Math.round(
        (payDate.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (days >= 0) {
        totalDays += days;
        count++;
      }
    }
    return count > 0 ? `${(totalDays / count).toFixed(1)} days` : "—";
  }, [payments, invoices]);

  // Daily payments — last 7 days
  const dailyData = useMemo(() => {
    const result: { day: string; amount: number }[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      });
      const total = payments
        .filter((p) => p.status === "received" && p.date === key)
        .reduce((s, p) => s + p.amount, 0);
      result.push({ day: label, amount: total });
    }
    return result;
  }, [payments]);

  // Mode breakdown
  const modeBreakdown = useMemo(() => {
    const groups: Record<string, number> = {};
    for (const p of payments.filter((p) => p.status === "received")) {
      groups[p.mode] = (groups[p.mode] ?? 0) + p.amount;
    }
    const total = Object.values(groups).reduce((s, v) => s + v, 0);
    return Object.entries(groups)
      .map(([mode, amount]) => ({
        mode,
        amount,
        pct: total > 0 ? ((amount / total) * 100).toFixed(1) : "0",
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [payments]);

  const exportData = useMemo<ExportData>(
    () => ({
      headers: ["Payment #", "Date", "Mode", "Amount", "Status"],
      rows: payments.map((p) => [
        p.paymentNumber,
        p.date,
        p.mode,
        p.amount,
        p.status,
      ]),
    }),
    [payments]
  );

  if (isLoading) return <ReportSkeleton />;

  return (
    <div className="space-y-6">
      <ExportBar reportName="Payment Analytics" exportData={exportData} />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile
          label="Total Received"
          value={fmtINR(totalReceived)}
          icon={CheckCircle2}
          bg="bg-emerald-50"
          iconColor="text-emerald-600"
          index={0}
        />
        <StatTile
          label="Total Pending"
          value={fmtINR(totalPending)}
          icon={Clock}
          bg="bg-amber-50"
          iconColor="text-amber-600"
          index={1}
        />
        <StatTile
          label="Total Refunded"
          value={fmtINR(totalRefunded)}
          icon={IndianRupee}
          bg="bg-cyan-50"
          iconColor="text-cyan-600"
          index={2}
        />
        <StatTile
          label="Avg Payment Time"
          value={avgPaymentTime}
          icon={TrendingUp}
          bg="bg-blue-50"
          iconColor="text-blue-600"
          index={3}
        />
      </div>
      <SectionCard title="Daily Payments — Last 7 Days">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={dailyData}
            margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip formatter={(v: number) => fmtINR(v)} />
            <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>
      <SectionCard title="Payment Mode Breakdown">
        <div className="space-y-3">
          {modeBreakdown.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">
              No payment data yet.
            </p>
          ) : (
            modeBreakdown.map((m, i) => (
              <div key={m.mode} className="flex items-center gap-4">
                <div className="w-28 text-sm font-medium capitalize text-foreground">
                  {m.mode.replace(/-/g, " ")}
                </div>
                <div className="flex-1 rounded-full bg-slate-100 h-2.5">
                  <div
                    className="h-2.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${m.pct}%`,
                      background: CHART_COLORS[i % CHART_COLORS.length],
                    }}
                  />
                </div>
                <div className="w-24 text-right text-sm font-semibold text-foreground">
                  {fmtINR(m.amount)}
                </div>
                <div className="w-12 text-right text-xs text-muted-foreground">
                  {m.pct}%
                </div>
              </div>
            ))
          )}
        </div>
      </SectionCard>
    </div>
  );
}

// ── 3. Customer Sales Report ───────────────────────────────────────

function CustomerSalesReport() {
  const { business } = useBusiness();
  const businessId = business?.id ?? null;
  const { data: dbCustomers = [], isLoading } = useCustomers(businessId);
  const { data: invoices = [] } = useInvoices(businessId);

  const customerStats = useMemo(() => {
    return dbCustomers
      .map((cust) => {
        const custInvoices = invoices.filter(
          (inv) => inv.customerId === cust.id
        );
        const totalAmount = custInvoices.reduce(
          (s, inv) => s + invoiceGrandTotal(inv),
          0
        );
        const paidAmount = custInvoices.reduce(
          (s, inv) => s + inv.amountPaid,
          0
        );
        const lastPurchase = custInvoices.length
          ? [...custInvoices].sort((a, b) =>
              b.createdDate.localeCompare(a.createdDate)
            )[0].createdDate
          : null;
        return {
          ...cust,
          invoiceCount: custInvoices.length,
          totalAmount,
          paidAmount,
          outstanding: totalAmount - paidAmount,
          lastPurchase,
        };
      })
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }, [dbCustomers, invoices]);

  const activeCustomers = customerStats.filter((c) => c.invoiceCount > 0).length;
  const totalRevenue = customerStats.reduce((s, c) => s + c.totalAmount, 0);
  const avgOrderValue =
    customerStats.length > 0 ? totalRevenue / customerStats.length : 0;

  const exportData = useMemo<ExportData>(
    () => ({
      headers: [
        "Customer",
        "City",
        "Invoices",
        "Total Amount",
        "Paid",
        "Outstanding",
      ],
      rows: customerStats.map((c) => [
        c.name,
        c.city ?? "—",
        c.invoiceCount,
        c.totalAmount,
        c.paidAmount,
        c.outstanding,
      ]),
    }),
    [customerStats]
  );

  if (isLoading) return <ReportSkeleton />;

  return (
    <div className="space-y-6">
      <ExportBar reportName="Customer Sales" exportData={exportData} />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatTile
          label="Total Customers"
          value={String(dbCustomers.length)}
          icon={Users}
          bg="bg-blue-50"
          iconColor="text-blue-600"
          index={0}
        />
        <StatTile
          label="Active Customers"
          value={String(activeCustomers)}
          icon={CheckCircle2}
          bg="bg-emerald-50"
          iconColor="text-emerald-600"
          index={1}
        />
        <StatTile
          label="Avg Order Value"
          value={fmtINR(avgOrderValue)}
          icon={IndianRupee}
          bg="bg-violet-50"
          iconColor="text-violet-600"
          index={2}
        />
      </div>
      <SectionCard title="Customer Sales Breakdown" noPadding>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <Th>Customer</Th>
                <Th>City</Th>
                <Th right>Invoices</Th>
                <Th right>Total Amount</Th>
                <Th right>Paid</Th>
                <Th right>Outstanding</Th>
                <Th>Rating</Th>
              </tr>
            </thead>
            <tbody>
              {customerStats.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-sm text-slate-400"
                  >
                    No customers found.
                  </td>
                </tr>
              ) : (
                customerStats.map((c, i) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-slate-100 hover:bg-slate-50/60"
                  >
                    <Td>
                      <p className="font-medium text-foreground whitespace-nowrap">
                        {c.name}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {c.customer_group}
                      </p>
                    </Td>
                    <Td>{c.city ?? "—"}</Td>
                    <Td right>{c.invoiceCount}</Td>
                    <Td right>{fmtINR(c.totalAmount)}</Td>
                    <Td right className="text-emerald-700">
                      {fmtINR(c.paidAmount)}
                    </Td>
                    <Td
                      right
                      className={
                        c.outstanding > 0 ? "text-amber-700" : "text-slate-400"
                      }
                    >
                      {fmtINR(c.outstanding)}
                    </Td>
                    <Td>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, si) => (
                          <Star
                            key={si}
                            className={`h-3.5 w-3.5 ${
                              si < c.rating
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                    </Td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

// ── 4. GST Summary ─────────────────────────────────────────────────

function GSTSummaryReport() {
  const { business } = useBusiness();
  const businessId = business?.id ?? null;
  const { data: invoices = [], isLoading } = useInvoices(businessId);
  const { data: dbCustomers = [] } = useCustomers(businessId);

  const customerMap = useMemo(
    () => new Map(dbCustomers.map((c) => [c.id, c])),
    [dbCustomers]
  );

  const gstData = useMemo(() => {
    return invoices
      .filter((inv) => inv.status !== "cancelled")
      .map((inv) => {
        const totals = computeDocumentTotals(inv.items, inv.isInterState);
        const cust = customerMap.get(inv.customerId);
        return {
          invoiceNumber: inv.invoiceNumber,
          customer: cust?.name ?? "—",
          taxableValue: totals.taxableValue,
          cgst: totals.cgst,
          sgst: totals.sgst,
          igst: totals.igst,
          totalGst: totals.cgst + totals.sgst + totals.igst,
          grandTotal: totals.grandTotal,
          isInterState: inv.isInterState,
        };
      });
  }, [invoices, customerMap]);

  const totalTaxable = gstData.reduce((s, r) => s + r.taxableValue, 0);
  const totalIGST = gstData.reduce((s, r) => s + r.igst, 0);
  const totalCGST = gstData.reduce((s, r) => s + r.cgst, 0);
  const totalSGST = gstData.reduce((s, r) => s + r.sgst, 0);

  const interState = gstData.filter((r) => r.isInterState);
  const intraState = gstData.filter((r) => !r.isInterState);

  const exportData = useMemo<ExportData>(
    () => ({
      headers: [
        "Invoice #",
        "Customer",
        "Taxable",
        "CGST",
        "SGST",
        "IGST",
        "Total GST",
        "Grand Total",
      ],
      rows: gstData.map((r) => [
        r.invoiceNumber,
        r.customer,
        r.taxableValue,
        r.cgst,
        r.sgst,
        r.igst,
        r.totalGst,
        r.grandTotal,
      ]),
    }),
    [gstData]
  );

  const GSTTable = ({
    rows,
    title,
  }: {
    rows: typeof gstData;
    title: string;
  }) => (
    <SectionCard title={title} noPadding>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              <Th>Invoice #</Th>
              <Th>Customer</Th>
              <Th right>Taxable</Th>
              <Th right>CGST</Th>
              <Th right>SGST</Th>
              <Th right>IGST</Th>
              <Th right>Total GST</Th>
              <Th right>Grand Total</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-6 text-center text-sm text-slate-400"
                >
                  No records.
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <motion.tr
                  key={r.invoiceNumber}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-slate-100 hover:bg-slate-50/60"
                >
                  <Td>
                    <span className="font-mono text-xs font-medium">
                      {r.invoiceNumber}
                    </span>
                  </Td>
                  <Td>{r.customer}</Td>
                  <Td right>{fmtINR(r.taxableValue)}</Td>
                  <Td right>{r.cgst > 0 ? fmtINR(r.cgst) : "—"}</Td>
                  <Td right>{r.sgst > 0 ? fmtINR(r.sgst) : "—"}</Td>
                  <Td right>{r.igst > 0 ? fmtINR(r.igst) : "—"}</Td>
                  <Td right className="text-violet-700">
                    {fmtINR(r.totalGst)}
                  </Td>
                  <Td right className="text-foreground font-bold">
                    {fmtINR(r.grandTotal)}
                  </Td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );

  if (isLoading) return <ReportSkeleton />;

  return (
    <div className="space-y-6">
      <ExportBar reportName="GST Summary" exportData={exportData} />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile
          label="Total Taxable"
          value={fmtINR(totalTaxable)}
          icon={Receipt}
          bg="bg-blue-50"
          iconColor="text-blue-600"
          index={0}
        />
        <StatTile
          label="Total IGST"
          value={fmtINR(totalIGST)}
          icon={IndianRupee}
          bg="bg-violet-50"
          iconColor="text-violet-600"
          index={1}
        />
        <StatTile
          label="Total CGST"
          value={fmtINR(totalCGST)}
          icon={IndianRupee}
          bg="bg-emerald-50"
          iconColor="text-emerald-600"
          index={2}
        />
        <StatTile
          label="Total SGST"
          value={fmtINR(totalSGST)}
          icon={IndianRupee}
          bg="bg-amber-50"
          iconColor="text-amber-600"
          index={3}
        />
      </div>
      <GSTTable rows={interState} title="Inter-State Supply (IGST)" />
      <GSTTable rows={intraState} title="Intra-State Supply (CGST + SGST)" />
    </div>
  );
}

// ── 5. Top Products ────────────────────────────────────────────────

function TopProductsReport() {
  const { business } = useBusiness();
  const businessId = business?.id ?? null;
  const { data: invoices = [], isLoading } = useInvoices(businessId);
  const { data: dbProducts = [] } = useProducts(businessId);

  const productMap = useMemo(
    () => new Map(dbProducts.map((p) => [p.id, p])),
    [dbProducts]
  );

  const productStats = useMemo(() => {
    const map: Record<
      string,
      { name: string; hsn: string; qty: number; revenue: number; unitPrices: number[] }
    > = {};
    for (const inv of invoices) {
      if (inv.status === "cancelled") continue;
      for (const item of inv.items) {
        const product = productMap.get(item.productId);
        // Use product name from catalog; fall back to productId if deleted
        const name = product?.name ?? item.productId ?? "Unknown";
        const hsn = product?.hsn_code ?? "N/A";
        const { total } = computeLineItem(item);
        const key = item.productId || name;
        if (!map[key]) {
          map[key] = { name, hsn, qty: 0, revenue: 0, unitPrices: [] };
        }
        map[key].qty += item.quantity;
        map[key].revenue += total;
        map[key].unitPrices.push(item.unitPrice);
      }
    }
    return Object.entries(map)
      .map(([id, v]) => ({
        id,
        ...v,
        avgUnitPrice:
          v.unitPrices.length > 0
            ? v.unitPrices.reduce((s, p) => s + p, 0) / v.unitPrices.length
            : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [invoices, productMap]);

  const exportData = useMemo<ExportData>(
    () => ({
      headers: ["#", "Product", "HSN Code", "Qty Sold", "Total Revenue", "Avg Unit Price"],
      rows: productStats.map((p, i) => [
        i + 1,
        p.name,
        p.hsn,
        p.qty,
        p.revenue,
        p.avgUnitPrice,
      ]),
    }),
    [productStats]
  );

  if (isLoading) return <ReportSkeleton />;

  return (
    <div className="space-y-6">
      <ExportBar reportName="Top Products" exportData={exportData} />
      <SectionCard title="Top 10 Products by Revenue" noPadding>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <Th>#</Th>
                <Th>Product</Th>
                <Th>HSN Code</Th>
                <Th right>Qty Sold</Th>
                <Th right>Total Revenue</Th>
                <Th right>Avg Unit Price</Th>
              </tr>
            </thead>
            <tbody>
              {productStats.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-sm text-slate-400"
                  >
                    No invoice items found.
                  </td>
                </tr>
              ) : (
                productStats.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-slate-100 hover:bg-slate-50/60"
                  >
                    <Td>
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          i < 3
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {i + 1}
                      </span>
                    </Td>
                    <Td>
                      <span className="font-medium text-foreground">
                        {p.name}
                      </span>
                    </Td>
                    <Td>
                      <span className="font-mono text-xs">{p.hsn}</span>
                    </Td>
                    <Td right>{p.qty}</Td>
                    <Td right className="text-emerald-700">
                      {fmtINR(p.revenue)}
                    </Td>
                    <Td right>{fmtINR(p.avgUnitPrice)}</Td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

// ── 6. Monthly Revenue ─────────────────────────────────────────────

function MonthlyRevenueReport() {
  const { business } = useBusiness();
  const businessId = business?.id ?? null;
  const { data: invoices = [], isLoading } = useInvoices(businessId);

  const { monthlyData, yoyPct } = useMemo(() => {
    // Group by YYYY-MM
    const groups: Record<
      string,
      { revenue: number; invoiceCount: number; collected: number }
    > = {};
    for (const inv of invoices) {
      if (inv.status === "cancelled") continue;
      const ym = inv.createdDate.slice(0, 7);
      if (!groups[ym]) groups[ym] = { revenue: 0, invoiceCount: 0, collected: 0 };
      groups[ym].revenue += invoiceGrandTotal(inv);
      groups[ym].invoiceCount += 1;
      groups[ym].collected += inv.amountPaid;
    }

    const sorted = Object.keys(groups).sort();
    const data = sorted.map((ym) => {
      const [year, month] = ym.split("-");
      const label = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString(
        "en-IN",
        { month: "short", year: "2-digit" }
      );
      return { month: label, ym, ...groups[ym] };
    });

    // YoY: compare current year total vs prior year total
    const currentYear = new Date().getFullYear();
    const currentYearTotal = sorted
      .filter((ym) => ym.startsWith(String(currentYear)))
      .reduce((s, ym) => s + groups[ym].revenue, 0);
    const priorYearTotal = sorted
      .filter((ym) => ym.startsWith(String(currentYear - 1)))
      .reduce((s, ym) => s + groups[ym].revenue, 0);
    const yoyPct =
      priorYearTotal > 0
        ? (((currentYearTotal - priorYearTotal) / priorYearTotal) * 100).toFixed(1)
        : null;

    return { monthlyData: data, yoyPct };
  }, [invoices]);

  const totalRevenue = monthlyData.reduce((s, m) => s + m.revenue, 0);
  const totalCollected = monthlyData.reduce((s, m) => s + m.collected, 0);

  const exportData = useMemo<ExportData>(
    () => ({
      headers: ["Month", "Invoices", "Revenue", "Collected", "Outstanding"],
      rows: monthlyData.map((m) => [
        m.month,
        m.invoiceCount,
        m.revenue,
        m.collected,
        m.revenue - m.collected,
      ]),
    }),
    [monthlyData]
  );

  if (isLoading) return <ReportSkeleton />;

  return (
    <div className="space-y-6">
      <ExportBar reportName="Monthly Revenue" exportData={exportData} />
      {yoyPct !== null && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <TrendingUp className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold text-emerald-700">
            {Number(yoyPct) >= 0 ? "+" : ""}
            {yoyPct}% vs same period last year
          </p>
          <span className="text-xs text-emerald-600">YoY Growth</span>
        </div>
      )}
      <SectionCard title="Monthly Revenue Trend">
        {monthlyData.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            No invoice data to display.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={monthlyData}
              margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
              />
              <Tooltip formatter={(v: number) => fmtINR(v)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                name="Revenue"
              />
              <Line
                type="monotone"
                dataKey="collected"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                name="Collected"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </SectionCard>
      <SectionCard title="Month-by-Month Breakdown" noPadding>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <Th>Month</Th>
                <Th right>Invoices</Th>
                <Th right>Revenue</Th>
                <Th right>Collected</Th>
                <Th right>Outstanding</Th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-sm text-slate-400"
                  >
                    No data yet.
                  </td>
                </tr>
              ) : (
                <>
                  {monthlyData.map((m, i) => (
                    <motion.tr
                      key={m.ym}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-slate-100 hover:bg-slate-50/60"
                    >
                      <Td>
                        <span className="font-semibold text-foreground">
                          {m.month}
                        </span>
                      </Td>
                      <Td right>{m.invoiceCount}</Td>
                      <Td right>{fmtINR(m.revenue)}</Td>
                      <Td right className="text-emerald-700">
                        {fmtINR(m.collected)}
                      </Td>
                      <Td right className="text-amber-700">
                        {fmtINR(m.revenue - m.collected)}
                      </Td>
                    </motion.tr>
                  ))}
                  <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold">
                    <Td>
                      <span className="font-bold text-foreground">Total</span>
                    </Td>
                    <Td right className="font-bold">
                      {monthlyData.reduce((s, m) => s + m.invoiceCount, 0)}
                    </Td>
                    <Td right className="font-bold">
                      {fmtINR(totalRevenue)}
                    </Td>
                    <Td right className="font-bold text-emerald-700">
                      {fmtINR(totalCollected)}
                    </Td>
                    <Td right className="font-bold text-amber-700">
                      {fmtINR(totalRevenue - totalCollected)}
                    </Td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

// ── 7. Outstanding Payments ────────────────────────────────────────

function OutstandingReport() {
  const { business } = useBusiness();
  const businessId = business?.id ?? null;
  const { data: invoices = [], isLoading } = useInvoices(businessId);
  const { data: dbCustomers = [] } = useCustomers(businessId);

  const customerMap = useMemo(
    () => new Map(dbCustomers.map((c) => [c.id, c])),
    [dbCustomers]
  );

  const TODAY = useMemo(() => new Date(), []);

  const outstandingInvoices = useMemo(() => {
    return invoices
      .map((inv) => {
        const balance = invoiceGrandTotal(inv) - inv.amountPaid;
        const cust = customerMap.get(inv.customerId);
        const dueDateObj = inv.dueDate
          ? new Date(inv.dueDate + "T00:00:00")
          : null;
        const overdueDays = dueDateObj
          ? Math.max(
              0,
              Math.floor(
                (TODAY.getTime() - dueDateObj.getTime()) / (1000 * 60 * 60 * 24)
              )
            )
          : 0;
        return { ...inv, balance, cust, dueDateObj, overdueDays };
      })
      .filter((inv) => inv.balance > 0.01)
      .sort((a, b) => {
        if (!a.dueDateObj) return 1;
        if (!b.dueDateObj) return -1;
        return a.dueDateObj.getTime() - b.dueDateObj.getTime();
      });
  }, [invoices, customerMap, TODAY]);

  const totalOutstanding = outstandingInvoices.reduce(
    (s, inv) => s + inv.balance,
    0
  );

  const exportData = useMemo<ExportData>(
    () => ({
      headers: [
        "Invoice #",
        "Customer",
        "Due Date",
        "Overdue (days)",
        "Balance Due",
        "Status",
      ],
      rows: outstandingInvoices.map((inv) => [
        inv.invoiceNumber,
        inv.cust?.name ?? "—",
        inv.dueDate ? fmtDate(inv.dueDate) : "—",
        inv.overdueDays,
        inv.balance,
        inv.status,
      ]),
    }),
    [outstandingInvoices]
  );

  if (isLoading) return <ReportSkeleton />;

  return (
    <div className="space-y-6">
      <ExportBar reportName="Outstanding Payments" exportData={exportData} />
      <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Total Outstanding Balance
            </p>
            <p className="text-xs text-amber-600">
              {outstandingInvoices.length} invoice
              {outstandingInvoices.length !== 1 ? "s" : ""} with pending
              payments
            </p>
          </div>
        </div>
        <p className="text-xl font-bold text-amber-800">
          {fmtINR(totalOutstanding)}
        </p>
      </div>
      <SectionCard title="Outstanding Invoices" noPadding>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <Th>Invoice #</Th>
                <Th>Customer</Th>
                <Th>Due Date</Th>
                <Th right>Overdue (days)</Th>
                <Th right>Balance Due</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {outstandingInvoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-sm text-slate-400"
                  >
                    No outstanding invoices. 🎉
                  </td>
                </tr>
              ) : (
                outstandingInvoices.map((inv, i) => {
                  const isOverdue = inv.overdueDays > 0;
                  return (
                    <motion.tr
                      key={inv.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`border-b border-slate-100 ${
                        isOverdue
                          ? "bg-red-50 hover:bg-red-100/60"
                          : "hover:bg-slate-50/60"
                      }`}
                    >
                      <Td>
                        <span className="font-mono text-sm font-medium">
                          {inv.invoiceNumber}
                        </span>
                      </Td>
                      <Td>
                        <p className="font-medium text-foreground whitespace-nowrap">
                          {inv.cust?.name ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {inv.cust?.city}
                        </p>
                      </Td>
                      <Td>{inv.dueDate ? fmtDate(inv.dueDate) : "—"}</Td>
                      <Td right>
                        {isOverdue ? (
                          <span className="font-bold text-red-600">
                            {inv.overdueDays}d
                          </span>
                        ) : (
                          <span className="text-emerald-600">Due soon</span>
                        )}
                      </Td>
                      <Td
                        right
                        className={
                          isOverdue
                            ? "text-red-700 font-bold"
                            : "text-amber-700 font-bold"
                        }
                      >
                        {fmtINR(inv.balance)}
                      </Td>
                      <Td>
                        <BillingStatusPill status={inv.status} />
                      </Td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

// ── 8. Collection Report ───────────────────────────────────────────

function CollectionReport() {
  const { business } = useBusiness();
  const businessId = business?.id ?? null;
  const { data: invoices = [], isLoading } = useInvoices(businessId);
  const { data: payments = [] } = usePayments(businessId);

  const totalInvoiced = useMemo(
    () => invoices.reduce((s, inv) => s + invoiceGrandTotal(inv), 0),
    [invoices]
  );
  const totalCollected = useMemo(
    () => invoices.reduce((s, inv) => s + inv.amountPaid, 0),
    [invoices]
  );
  const collectionEfficiency =
    totalInvoiced > 0
      ? ((totalCollected / totalInvoiced) * 100).toFixed(1)
      : "0";

  const fullyCollected = invoices.filter((inv) => inv.status === "paid").length;
  const partiallyCollected = invoices.filter(
    (inv) => inv.status === "partial"
  ).length;
  const notCollected = invoices.filter((inv) =>
    ["sent", "overdue", "draft"].includes(inv.status)
  ).length;

  const invoiceMap = useMemo(
    () => new Map(invoices.map((i) => [i.id, i])),
    [invoices]
  );

  const receivedPayments = useMemo(() => {
    return payments
      .filter((p) => p.status === "received")
      .map((p) => {
        const inv = invoiceMap.get(p.invoiceId);
        return {
          ...p,
          inv,
          invoiceAmount: inv ? invoiceGrandTotal(inv) : 0,
          // customerName and invoiceNumber come from the DB join in paymentsService
        };
      });
  }, [payments, invoiceMap]);

  const exportData = useMemo<ExportData>(
    () => ({
      headers: [
        "Payment #",
        "Invoice",
        "Customer",
        "Invoice Amount",
        "Collected",
        "Date",
        "Mode",
      ],
      rows: receivedPayments.map((p) => [
        p.paymentNumber,
        p.invoiceNumber ?? p.inv?.invoiceNumber ?? p.invoiceId,
        p.customerName ?? "—",
        p.invoiceAmount,
        p.amount,
        p.date,
        p.mode,
      ]),
    }),
    [receivedPayments]
  );

  if (isLoading) return <ReportSkeleton />;

  return (
    <div className="space-y-6">
      <ExportBar reportName="Collection Report" exportData={exportData} />
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        <p className="text-sm font-semibold text-emerald-700">
          Collection Efficiency: {collectionEfficiency}%
        </p>
        <span className="text-xs text-emerald-600">
          ({fmtINR(totalCollected)} collected of {fmtINR(totalInvoiced)} total)
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile
          label="Invoices Issued"
          value={String(invoices.length)}
          icon={FileText}
          bg="bg-blue-50"
          iconColor="text-blue-600"
          index={0}
        />
        <StatTile
          label="Fully Collected"
          value={String(fullyCollected)}
          icon={CheckCircle2}
          bg="bg-emerald-50"
          iconColor="text-emerald-600"
          index={1}
        />
        <StatTile
          label="Partially Collected"
          value={String(partiallyCollected)}
          icon={Clock}
          bg="bg-amber-50"
          iconColor="text-amber-600"
          index={2}
        />
        <StatTile
          label="Not Collected"
          value={String(notCollected)}
          icon={AlertTriangle}
          bg="bg-red-50"
          iconColor="text-red-600"
          index={3}
        />
      </div>
      <SectionCard title="Payment Collections" noPadding>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <Th>Payment #</Th>
                <Th>Invoice</Th>
                <Th>Customer</Th>
                <Th right>Invoice Amount</Th>
                <Th right>Collected</Th>
                <Th>Date</Th>
                <Th>Mode</Th>
              </tr>
            </thead>
            <tbody>
              {receivedPayments.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-sm text-slate-400"
                  >
                    No collections recorded yet.
                  </td>
                </tr>
              ) : (
                receivedPayments.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-slate-100 hover:bg-slate-50/60"
                  >
                    <Td>
                      <span className="font-mono text-xs font-medium">
                        {p.paymentNumber}
                      </span>
                    </Td>
                    <Td>
                      <span className="font-mono text-xs text-blue-600">
                        {p.invoiceNumber ?? p.inv?.invoiceNumber ?? p.invoiceId}
                      </span>
                    </Td>
                    <Td>
                      <span className="font-medium text-foreground whitespace-nowrap">
                        {p.customerName ?? "—"}
                      </span>
                    </Td>
                    <Td right>{fmtINR(p.invoiceAmount)}</Td>
                    <Td right className="text-emerald-700">
                      {fmtINR(p.amount)}
                    </Td>
                    <Td>{fmtDate(p.date)}</Td>
                    <Td>
                      <span className="capitalize text-xs text-muted-foreground">
                        {p.mode.replace(/-/g, " ")}
                      </span>
                    </Td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────

export function ReportsTab() {
  const [activeReport, setActiveReport] = useState<ReportTab>("invoice-analytics");

  return (
    <div className="space-y-6">
      {/* Sub-tab navigation */}
      <div className="rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        <div className="flex flex-wrap gap-1">
          {REPORT_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeReport === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveReport(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-150 whitespace-nowrap ${
                  active
                    ? "bg-[image:var(--gradient-brand)] text-white shadow-sm"
                    : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Report content */}
      <motion.div
        key={activeReport}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {activeReport === "invoice-analytics" && <InvoiceAnalyticsReport />}
        {activeReport === "payment-analytics" && <PaymentAnalyticsReport />}
        {activeReport === "customer-sales" && <CustomerSalesReport />}
        {activeReport === "gst-summary" && <GSTSummaryReport />}
        {activeReport === "top-products" && <TopProductsReport />}
        {activeReport === "monthly-revenue" && <MonthlyRevenueReport />}
        {activeReport === "outstanding" && <OutstandingReport />}
        {activeReport === "collection" && <CollectionReport />}
      </motion.div>
    </div>
  );
}
