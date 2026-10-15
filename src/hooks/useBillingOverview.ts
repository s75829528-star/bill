/**
 * useBillingOverview — derives all Billing Overview KPIs and chart data
 * from live Supabase invoice data. Uses the same React Query cache as
 * useInvoices so mutations (create/update/delete) auto-refresh the page.
 */

import { useMemo } from "react";
import { useInvoices } from "./useInvoicesQuery";
import { useCustomers } from "./useCustomersQuery";
import { computeDocumentTotals } from "../lib/billing-data";
import type { Invoice } from "../lib/billing-data";

// ── Local helpers ─────────────────────────────────────────────────

function grandTotal(inv: Invoice): number {
  return computeDocumentTotals(inv.items, inv.isInterState).grandTotal;
}

function gstTotal(inv: Invoice): number {
  const t = computeDocumentTotals(inv.items, inv.isInterState);
  return t.cgst + t.sgst + t.igst;
}

// ── Return shape ──────────────────────────────────────────────────

export interface BillingOverviewData {
  // KPI tiles
  todaySales: number;
  invoicesCreated: number;
  pendingCount: number;
  pendingAmount: number;
  overdueCount: number;
  overdueAmount: number;
  collectedAmount: number;
  gstPayable: number;
  paidCount: number;
  totalInvoices: number;
  collectionRate: string;
  avgInvoiceValue: number;

  // Charts
  barChartData: { date: string; Amount: number }[];
  statusCounts: Record<string, number>;
  monthlyRevenueData: { month: string; Revenue: number }[];
  paymentModeMap: Record<string, number>;

  // Lists
  recentInvoices: Invoice[];
  upcomingPayments: Invoice[];
  topCustomers: { id: string; name: string; balance: number }[];
  maxOutstanding: number;

  // Activity feed (generated from invoice events)
  activityFeed: {
    id: string;
    type: string;
    title: string;
    subtitle: string;
    timestamp: string;
    amount?: number;
  }[];

  // Business insights
  dueThisWeekCount: number;
  filingMonth: string;
  filingDue: string;

  // Lookup
  customerNameMap: Map<string, string>;
}

// ── Hook ──────────────────────────────────────────────────────────

export function useBillingOverview(businessId: string | null) {
  const invoicesQuery = useInvoices(businessId);
  const customersQuery = useCustomers(businessId);

  const isLoading = invoicesQuery.isLoading || customersQuery.isLoading;
  const isError = invoicesQuery.isError || customersQuery.isError;
  const error = invoicesQuery.error ?? customersQuery.error;

  const data = useMemo<BillingOverviewData>(() => {
    const invoices = invoicesQuery.data ?? [];
    const customers = customersQuery.data ?? [];

    const customerNameMap = new Map<string, string>(
      customers.map((c) => [c.id, c.name])
    );

    // ── Today's Sales ────────────────────────────────────────────
    const today = new Date().toISOString().slice(0, 10);
    const todaySales = invoices
      .filter((i) => i.createdDate === today)
      .reduce((s, inv) => s + grandTotal(inv), 0);

    // ── Invoices Created ─────────────────────────────────────────
    const invoicesCreated = invoices.length;

    // ── Pending Payments ─────────────────────────────────────────
    const pendingInvoices = invoices.filter(
      (i) => i.paymentStatus === "pending" || i.paymentStatus === "partial"
    );
    const pendingCount = pendingInvoices.length;
    const pendingAmount = pendingInvoices.reduce(
      (s, inv) => s + (grandTotal(inv) - inv.amountPaid),
      0
    );

    // ── Overdue Invoices ─────────────────────────────────────────
    const overdueInvoices = invoices.filter((i) => i.status === "overdue");
    const overdueCount = overdueInvoices.length;
    const overdueAmount = overdueInvoices.reduce(
      (s, inv) => s + (grandTotal(inv) - inv.amountPaid),
      0
    );

    // ── Collected Amount ─────────────────────────────────────────
    const collectedAmount = invoices.reduce((s, inv) => s + inv.amountPaid, 0);

    // ── GST Payable ──────────────────────────────────────────────
    const gstPayable = invoices.reduce((s, inv) => s + gstTotal(inv), 0);

    // ── Collection Rate ──────────────────────────────────────────
    const paidCount = invoices.filter((i) => i.status === "paid").length;
    const totalInvoices = invoices.length;
    const collectionRate =
      totalInvoices > 0
        ? ((paidCount / totalInvoices) * 100).toFixed(1)
        : "0.0";

    // ── Avg Invoice Value ────────────────────────────────────────
    const totalAmount = invoices.reduce((s, inv) => s + grandTotal(inv), 0);
    const avgInvoiceValue = totalInvoices > 0 ? totalAmount / totalInvoices : 0;

    // ── Bar Chart: last 7 distinct invoice dates ─────────────────
    const allDates = [...new Set(invoices.map((i) => i.createdDate))].sort();
    const last7Dates = allDates.slice(-7);
    const barChartData = last7Dates.map((date) => {
      const total = invoices
        .filter((i) => i.createdDate === date)
        .reduce((s, inv) => s + grandTotal(inv), 0);
      const label = new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      });
      return { date: label, Amount: total };
    });

    // ── Pie: Status Distribution ─────────────────────────────────
    const statusCounts: Record<string, number> = {};
    invoices.forEach((inv) => {
      statusCounts[inv.status] = (statusCounts[inv.status] ?? 0) + 1;
    });

    // ── Monthly Revenue: group by YYYY-MM, last 7 months ─────────
    const monthlyMap: Record<string, { label: string; total: number }> = {};
    invoices.forEach((inv) => {
      const d = new Date(inv.createdDate + "T00:00:00");
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      if (!monthlyMap[key]) monthlyMap[key] = { label, total: 0 };
      monthlyMap[key].total += grandTotal(inv);
    });
    const monthlyRevenueData = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([, { label, total }]) => ({ month: label, Revenue: total }));

    // ── Recent Invoices (latest 8) ───────────────────────────────
    const recentInvoices = [...invoices]
      .sort(
        (a, b) =>
          new Date(b.createdDate + "T00:00:00").getTime() -
          new Date(a.createdDate + "T00:00:00").getTime()
      )
      .slice(0, 8);

    // ── Upcoming Payments ────────────────────────────────────────
    const upcomingPayments = [...invoices]
      .filter((i) => i.status === "sent" || i.status === "partial")
      .sort(
        (a, b) =>
          new Date((a.dueDate || "9999-99-99") + "T00:00:00").getTime() -
          new Date((b.dueDate || "9999-99-99") + "T00:00:00").getTime()
      )
      .slice(0, 5);

    // ── Top Customers by Outstanding Balance ─────────────────────
    const balanceMap: Record<string, { name: string; balance: number }> = {};
    invoices
      .filter(
        (i) =>
          i.status !== "paid" &&
          i.status !== "cancelled" &&
          i.customerId
      )
      .forEach((inv) => {
        const cid = inv.customerId;
        const bal = grandTotal(inv) - inv.amountPaid;
        if (bal <= 0) return;
        if (!balanceMap[cid])
          balanceMap[cid] = { name: customerNameMap.get(cid) ?? "Unknown", balance: 0 };
        balanceMap[cid].balance += bal;
      });
    const topCustomers = Object.entries(balanceMap)
      .map(([id, { name, balance }]) => ({ id, name, balance }))
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5);
    const maxOutstanding = topCustomers[0]?.balance ?? 1;

    // ── Payment Distribution by Mode ─────────────────────────────
    const paymentModeMap: Record<string, number> = {};
    invoices
      .filter((i) => i.amountPaid > 0)
      .forEach((inv) => {
        paymentModeMap[inv.paymentMode] =
          (paymentModeMap[inv.paymentMode] ?? 0) + inv.amountPaid;
      });

    // ── Activity Feed (generated from invoices) ───────────────────
    const activityFeed = [...invoices]
      .sort(
        (a, b) =>
          new Date(b.createdDate + "T00:00:00").getTime() -
          new Date(a.createdDate + "T00:00:00").getTime()
      )
      .slice(0, 8)
      .map((inv) => {
        const cname = customerNameMap.get(inv.customerId) ?? "Customer";
        const total = grandTotal(inv);
        const ts = inv.createdDate + "T00:00:00";
        if (inv.status === "paid") {
          return {
            id: inv.id,
            type: "invoice-paid",
            title: `Invoice paid · ${inv.invoiceNumber}`,
            subtitle: cname,
            timestamp: ts,
            amount: total,
          };
        }
        return {
          id: inv.id,
          type: "invoice-created",
          title: `Invoice created · ${inv.invoiceNumber}`,
          subtitle: cname,
          timestamp: ts,
          amount: total,
        };
      });

    // ── Business Insights ─────────────────────────────────────────
    const nowMs = Date.now();
    const dueThisWeekCount = invoices.filter((i) => {
      if (!i.dueDate) return false;
      const due = new Date(i.dueDate + "T00:00:00").getTime();
      const diff = due - nowMs;
      return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
    }).length;

    const now = new Date();
    const filingMonth = now.toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
    const nextMonthDue = new Date(now.getFullYear(), now.getMonth() + 1, 20);
    const filingDue = nextMonthDue.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    return {
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
    };
  }, [invoicesQuery.data, customersQuery.data]);

  return { data, isLoading, isError, error };
}
