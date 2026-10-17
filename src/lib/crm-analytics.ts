import { invoiceBalance, invoiceGrandTotal, type InvoiceMathInput } from "./invoice-math";
import type { Customer } from "../services/customers";

export type CustomerStatus = string;
export type CustomerGroupName = string;

export interface CustomerAnalytics extends Customer {
  totalRevenue: number;
  outstandingAmount: number;
  invoiceCount: number;
  lastPurchaseDate: string | null;
}

export function buildCustomerAnalytics(
  customers: Customer[],
  invoices: (InvoiceMathInput & { customerId: string; status: string; createdDate: string })[],
): CustomerAnalytics[] {
  const metrics = new Map<
    string,
    { revenue: number; outstanding: number; invoiceCount: number; lastPurchaseDate: string | null }
  >();

  for (const invoice of invoices) {
    if (!invoice.customerId || invoice.status === "draft" || invoice.status === "cancelled") {
      continue;
    }

    const current = metrics.get(invoice.customerId) ?? {
      revenue: 0,
      outstanding: 0,
      invoiceCount: 0,
      lastPurchaseDate: null,
    };
    current.revenue += invoiceGrandTotal(invoice);
    current.outstanding += Math.max(0, invoiceBalance(invoice));
    current.invoiceCount += 1;
    if (!current.lastPurchaseDate || invoice.createdDate > current.lastPurchaseDate) {
      current.lastPurchaseDate = invoice.createdDate || null;
    }
    metrics.set(invoice.customerId, current);
  }

  return customers.map((customer) => {
    const customerMetrics = metrics.get(customer.id);
    return {
      ...customer,
      totalRevenue: customerMetrics?.revenue ?? 0,
      outstandingAmount: customer.opening_balance + (customerMetrics?.outstanding ?? 0),
      invoiceCount: customerMetrics?.invoiceCount ?? 0,
      lastPurchaseDate: customerMetrics?.lastPurchaseDate ?? null,
    };
  });
}

export function formatCrmCurrency(value: number, currency = "INR"): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString("en-IN")}`;
  }
}

export function formatCompactCrmCurrency(value: number, currency = "INR"): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString("en-IN")}`;
  }
}

export function formatCrmDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function customerAcquisitionByMonth(
  customers: Customer[],
  now = new Date(),
): { month: string; customers: number }[] {
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      month: date.toLocaleDateString("en-IN", { month: "short" }),
    };
  });

  return months.map(({ key, month }) => ({
    month,
    customers: customers.filter((customer) => customer.created_at.startsWith(key)).length,
  }));
}
