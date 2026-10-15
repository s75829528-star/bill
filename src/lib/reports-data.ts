// ── Reports & Analytics Mock Data — Nexora Reports Module ───────────
// Realistic Indian business analytics. No backend · No Supabase · No API.
// Everything here is derived/generated data consumed by the Reports tabs.

// ── Helpers ──────────────────────────────────────────────────────────

export function fmtINR(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function fmtCompactINR(n: number): string {
  if (Math.abs(n) >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)}Cr`;
  if (Math.abs(n) >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`;
  if (Math.abs(n) >= 1_000) return `₹${(n / 1_000).toFixed(0)}k`;
  return `₹${n}`;
}

export function fmtDate(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Small deterministic PRNG so generated data is stable across reloads.
function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
const rng = makeRng(42);
function pick<T>(arr: T[], r: () => number = rng): T {
  return arr[Math.floor(r() * arr.length)];
}
function randInt(min: number, max: number, r: () => number = rng): number {
  return Math.floor(r() * (max - min + 1)) + min;
}

// ── Global date range filter ──────────────────────────────────────────

export type DateRangeId =
  | "today" | "yesterday" | "this-week" | "this-month"
  | "last-month" | "this-quarter" | "this-year" | "custom";

export const dateRangeOptions: { value: DateRangeId; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this-week", label: "This Week" },
  { value: "this-month", label: "This Month" },
  { value: "last-month", label: "Last Month" },
  { value: "this-quarter", label: "This Quarter" },
  { value: "this-year", label: "This Year" },
  { value: "custom", label: "Custom Range" },
];

// Scales KPI numbers so switching ranges visibly changes the dashboard
// (a proportional share of the "this-year" totals — realistic, not random).
export const rangeMultiplier: Record<DateRangeId, number> = {
  today: 0.012,
  yesterday: 0.011,
  "this-week": 0.08,
  "this-month": 0.32,
  "last-month": 0.29,
  "this-quarter": 0.62,
  "this-year": 1,
  custom: 0.45,
};

// ── Months (rolling 12, ending July 2026) ─────────────────────────────

export const months = [
  "Aug 2025", "Sep 2025", "Oct 2025", "Nov 2025", "Dec 2025",
  "Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026", "Jul 2026",
];

// ── Executive Dashboard: monthly trends ────────────────────────────────

export const revenueTrend = [
  915000, 872000, 968000, 1042000, 1284000,
  1156000, 1098000, 1320000, 1210000, 1268000, 1342000, 1284860,
].map((value, i) => ({ month: months[i], value }));

export const profitTrend = [
  248000, 219000, 265000, 298000, 372000,
  318000, 289000, 386000, 341000, 362000, 398000, 412200,
].map((value, i) => ({ month: months[i], value }));

export const expenseTrend = revenueTrend.map((r, i) => ({
  month: r.month,
  value: r.value - profitTrend[i].value,
}));

export const cashFlowTrend = [
  182000, 156000, 198000, 224000, 289000,
  241000, 208000, 276000, 232000, 254000, 281000, 296500,
].map((value, i) => ({ month: months[i], value }));

export const inventoryValueTrend = [
  3120000, 3245000, 3380000, 3510000, 3290000,
  3410000, 3560000, 3680000, 3720000, 3805000, 3860000, 3924000,
].map((value, i) => ({ month: months[i], value }));

export const stockMovementTrend = months.map((month, i) => ({
  month,
  stockIn: 1200 + i * 40 + randInt(-80, 80),
  stockOut: 1050 + i * 36 + randInt(-70, 70),
}));

export const customerGrowthTrend = [
  842, 878, 915, 948, 981, 1012, 1041, 1073, 1109, 1148, 1214, 1284,
].map((value, i) => ({ month: months[i], value }));

export const gstCollectionTrend = [
  102500, 92200, 132000, 116200, 124000,
  140500, 152000, 148500, 139200, 156800, 161400, 168900,
].map((value, i) => ({ month: months[i], value }));

// ── KPI summary (Executive Dashboard) ──────────────────────────────────

export const currentMonth = revenueTrend[revenueTrend.length - 1];
export const previousMonth = revenueTrend[revenueTrend.length - 2];

export const baseKpis = {
  revenue: currentMonth.value,
  profit: profitTrend[profitTrend.length - 1].value,
  expenses: expenseTrend[expenseTrend.length - 1].value,
  inventoryValue: inventoryValueTrend[inventoryValueTrend.length - 1].value,
  outstandingPayments: 486200,
  customerGrowth: 1284,
  productsSold: 4820,
  invoicesCreated: 348,
  avgOrderValue: 24780,
  cashFlow: cashFlowTrend[cashFlowTrend.length - 1].value,
  monthlyGrowth: 8.4,
  netMargin: 32.1,
};

// ── Top lists ───────────────────────────────────────────────────────

export const topCustomers = [
  { name: "Croma Electronics", revenue: 1215000, orders: 24, growth: 18.2 },
  { name: "Reliance Retail Ltd", revenue: 986000, orders: 19, growth: 12.5 },
  { name: "Flipkart Internet Pvt Ltd", revenue: 874000, orders: 15, growth: 22.7 },
  { name: "D-Mart Retail", revenue: 742000, orders: 21, growth: -3.4 },
  { name: "Big Bazaar", revenue: 618000, orders: 17, growth: 6.1 },
  { name: "Amazon Seller Services", revenue: 592000, orders: 12, growth: 9.8 },
  { name: "Spencer's Retail", revenue: 468000, orders: 14, growth: 4.2 },
  { name: "Vijay Sales", revenue: 412000, orders: 11, growth: -1.8 },
];

export const topProducts = [
  { name: "Amul Gold Full Cream Milk 1L", unitsSold: 3840, revenue: 268800, category: "Dairy" },
  { name: "Tata Salt Iodized 1kg", unitsSold: 5210, revenue: 130250, category: "Grocery" },
  { name: "Colgate Strong Teeth 150g", unitsSold: 2960, revenue: 118400, category: "Personal Care" },
  { name: "Surf Excel Matic 2kg", unitsSold: 1840, revenue: 275960, category: "Home Care" },
  { name: "Britannia Good Day Biscuits", unitsSold: 4120, revenue: 82400, category: "Snacks" },
  { name: "Fortune Sunflower Oil 1L", unitsSold: 2280, revenue: 296400, category: "Grocery" },
  { name: "Parle-G Biscuits 800g", unitsSold: 3510, revenue: 105300, category: "Snacks" },
  { name: "Dove Soap 100g (Pack of 3)", unitsSold: 1670, revenue: 100200, category: "Personal Care" },
];

export const leastSellingProducts = [
  { name: "Imported Herbal Tea Box", unitsSold: 24, revenue: 8400, category: "Beverages" },
  { name: "Organic Quinoa 500g", unitsSold: 31, revenue: 12090, category: "Grocery" },
  { name: "Bamboo Toothbrush Set", unitsSold: 42, revenue: 6300, category: "Personal Care" },
  { name: "Artisanal Pasta 250g", unitsSold: 38, revenue: 5700, category: "Grocery" },
  { name: "Scented Soy Candles", unitsSold: 19, revenue: 9500, category: "Home Care" },
];

export const topCategories = [
  { name: "Grocery", revenue: 4820000, share: 34.2 },
  { name: "Dairy", revenue: 2680000, share: 19.0 },
  { name: "Personal Care", revenue: 2140000, share: 15.2 },
  { name: "Home Care", revenue: 1860000, share: 13.2 },
  { name: "Snacks", revenue: 1420000, share: 10.1 },
  { name: "Beverages", revenue: 1160000, share: 8.3 },
];

export const expenseByCategory = [
  { name: "Salary", value: 3720000 },
  { name: "Rent", value: 1020000 },
  { name: "Marketing", value: 486000 },
  { name: "Logistics", value: 412000 },
  { name: "Software", value: 268000 },
  { name: "Utilities", value: 214000 },
  { name: "Professional Fees", value: 186000 },
  { name: "Miscellaneous", value: 142000 },
];

export const CHART_COLORS = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#84cc16"];

// ── Sales Reports ─────────────────────────────────────────────────────

export type SalesPeriod = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

export const salesByPeriod: Record<SalesPeriod, { label: string; revenue: number; orders: number }[]> = {
  daily: Array.from({ length: 30 }, (_, i) => ({
    label: `Jul ${i + 1}`,
    revenue: 32000 + Math.round(Math.sin(i / 3) * 6000) + randInt(-4000, 4000),
    orders: 8 + randInt(0, 6),
  })),
  weekly: Array.from({ length: 12 }, (_, i) => ({
    label: `Wk ${i + 1}`,
    revenue: 210000 + i * 6200 + randInt(-15000, 15000),
    orders: 52 + randInt(-8, 12),
  })),
  monthly: revenueTrend.map((r, i) => ({
    label: r.month.split(" ")[0],
    revenue: r.value,
    orders: 260 + i * 8 + randInt(-10, 10),
  })),
  quarterly: [
    { label: "Q3 FY25", revenue: 2755000, orders: 812 },
    { label: "Q4 FY25", revenue: 3482000, orders: 951 },
    { label: "Q1 FY26", revenue: 3628000, orders: 1024 },
    { label: "Q2 FY26", revenue: 3894860, orders: 1108 },
  ],
  yearly: [
    { label: "FY 2023-24", revenue: 9840000, orders: 3120 },
    { label: "FY 2024-25", revenue: 12680000, orders: 3840 },
    { label: "FY 2025-26", revenue: 13759860, orders: 3895 },
  ],
};

export const revenueByCategory = topCategories;

// ── Billing Reports ────────────────────────────────────────────────────

export const invoiceStats = {
  total: 348,
  paid: { count: 268, amount: 8420000 },
  pending: { count: 54, amount: 1186000 },
  overdue: { count: 26, amount: 612000 },
};
export const collectionRate = Math.round((invoiceStats.paid.amount / (invoiceStats.paid.amount + invoiceStats.pending.amount + invoiceStats.overdue.amount)) * 1000) / 10;
export const avgInvoiceValue = Math.round((invoiceStats.paid.amount + invoiceStats.pending.amount + invoiceStats.overdue.amount) / invoiceStats.total);

export const invoiceStatusTrend = months.map((month, i) => ({
  month,
  paid: 190 + i * 6 + randInt(-8, 8),
  pending: 30 + randInt(-6, 10),
  overdue: 12 + randInt(-4, 8),
}));

// ── Inventory Reports ───────────────────────────────────────────────

export const inventoryStats = {
  totalValue: inventoryValueTrend[inventoryValueTrend.length - 1].value,
  lowStockCount: 18,
  deadStockCount: 7,
  totalSKUs: 642,
};

export const lowStockItems = [
  { name: "Tata Salt Iodized 1kg", sku: "GRO-0042", stock: 24, reorderLevel: 100 },
  { name: "Colgate Strong Teeth 150g", sku: "PC-0118", stock: 31, reorderLevel: 80 },
  { name: "Maggi 2-Min Noodles", sku: "SNK-0221", stock: 18, reorderLevel: 120 },
  { name: "Amul Butter 500g", sku: "DRY-0076", stock: 12, reorderLevel: 60 },
  { name: "Harpic Toilet Cleaner 1L", sku: "HC-0154", stock: 9, reorderLevel: 50 },
];

export const deadStockItems = [
  { name: "Imported Herbal Tea Box", sku: "BEV-0301", stock: 84, daysIdle: 142 },
  { name: "Scented Soy Candles", sku: "HC-0410", stock: 56, daysIdle: 118 },
  { name: "Artisanal Pasta 250g", sku: "GRO-0388", stock: 62, daysIdle: 96 },
];

export const fastMovingProducts = topProducts.slice(0, 5);
export const slowMovingProducts = leastSellingProducts;

export const categoryPerformance = topCategories.map((c) => ({
  ...c,
  turnoverRate: Math.round((2 + rng() * 3) * 10) / 10,
}));

export const supplierPerformance = [
  { name: "Ramesh Electronics Wholesale", onTimeRate: 94.2, orders: 62, totalValue: 2840000 },
  { name: "Sharma Distributors", onTimeRate: 88.6, orders: 48, totalValue: 1960000 },
  { name: "Vijay Sales Distributors", onTimeRate: 91.3, orders: 39, totalValue: 1420000 },
  { name: "Apex Paper Products", onTimeRate: 96.8, orders: 21, totalValue: 486000 },
  { name: "Quick Logistics Pvt Ltd", onTimeRate: 82.4, orders: 34, totalValue: 612000 },
];

// ── CRM Reports ─────────────────────────────────────────────────────

export const leadFunnel = [
  { stage: "New Leads", count: 420 },
  { stage: "Contacted", count: 318 },
  { stage: "Qualified", count: 212 },
  { stage: "Proposal Sent", count: 138 },
  { stage: "Converted", count: 86 },
];
export const leadConversionRate = Math.round((leadFunnel[leadFunnel.length - 1].count / leadFunnel[0].count) * 1000) / 10;

export const inactiveCustomers = [
  { name: "Star Bazaar Retail", lastOrder: "2026-03-02", totalSpend: 186000 },
  { name: "Metro Cash & Carry", lastOrder: "2026-02-18", totalSpend: 248000 },
  { name: "Nature's Basket", lastOrder: "2026-01-27", totalSpend: 94000 },
  { name: "Easyday Club", lastOrder: "2026-01-11", totalSpend: 132000 },
];

export const outstandingCustomers = [
  { name: "HCL Technologies", outstanding: 61000, daysPastDue: 6 },
  { name: "Spencer's Retail", outstanding: 38000, daysPastDue: 4 },
  { name: "Sharma Distributors", outstanding: 128000, daysPastDue: 4 },
  { name: "Big Bazaar", outstanding: 92000, daysPastDue: 0 },
];

// ── Finance Reports ──────────────────────────────────────────────────

export const financeIncome = revenueTrend;
export const financeExpenses = expenseTrend;
export const plMonthly = months.map((month, i) => ({
  month: month.split(" ")[0],
  revenue: revenueTrend[i].value,
  expenses: expenseTrend[i].value,
  netProfit: profitTrend[i].value,
}));

export const financeReceivables = {
  total: 486200,
  overdue: 128000,
  count: 22,
};
export const financePayables = {
  total: 318500,
  overdue: 96000,
  count: 14,
};

// ── GST Reports ───────────────────────────────────────────────────────

export const gstMonthly = months.map((month, i) => {
  const collected = gstCollectionTrend[i].value;
  const cgst = Math.round(collected * 0.32);
  const sgst = Math.round(collected * 0.32);
  const igst = collected - cgst - sgst;
  const itcClaimed = Math.round(collected * 0.41);
  return { month, cgst, sgst, igst, collected, itcClaimed, payable: collected - itcClaimed };
});

export const gstSummary = {
  totalCollected: gstMonthly.reduce((s, g) => s + g.collected, 0),
  totalITC: gstMonthly.reduce((s, g) => s + g.itcClaimed, 0),
  totalPayable: gstMonthly.reduce((s, g) => s + g.payable, 0),
  currentMonth: gstMonthly[gstMonthly.length - 1],
};

// ── Customer Reports ──────────────────────────────────────────────────

export const customerPurchaseHistory = [
  { customer: "Croma Electronics", invoice: "INV-2025-0407", date: "2026-07-09", amount: 215000 },
  { customer: "Reliance Retail Ltd", invoice: "INV-2025-0412", date: "2026-07-14", amount: 125000 },
  { customer: "Flipkart Internet Pvt Ltd", invoice: "INV-2025-0401", date: "2026-07-01", amount: 310000 },
  { customer: "D-Mart Retail", invoice: "INV-2025-0350", date: "2026-06-20", amount: 145000 },
  { customer: "Big Bazaar", invoice: "INV-2025-0409", date: "2026-07-11", amount: 92000 },
  { customer: "Amazon Seller Services", invoice: "INV-2025-0404", date: "2026-07-05", amount: 168000 },
];

export const customerLifetimeValue = topCustomers.map((c) => ({
  name: c.name,
  clv: Math.round(c.revenue * 2.4),
  avgOrderValue: Math.round(c.revenue / c.orders),
  orders: c.orders,
}));

export const avgPurchaseValue = Math.round(
  customerPurchaseHistory.reduce((s, p) => s + p.amount, 0) / customerPurchaseHistory.length
);

export const customerOutstanding = outstandingCustomers;

// ── Product Reports ───────────────────────────────────────────────────

export const bestSellingProducts = topProducts;
export const productStockValue = topCategories.map((c) => ({
  category: c.name,
  stockValue: Math.round(c.revenue * 0.62),
}));
export const productCategoryPerformance = categoryPerformance;

// ── Report Settings defaults ───────────────────────────────────────────

export const defaultReportSettings = {
  defaultDateRange: "this-month" as DateRangeId,
  currency: "INR",
  showTaxInReports: true,
  theme: "light" as "light" | "dark",
};

// ── Export Center ──────────────────────────────────────────────────────

export const exportableReports = [
  "Executive Dashboard", "Sales Report", "Billing Report", "Inventory Report",
  "CRM Report", "Finance Report", "GST Report", "Customer Report", "Product Report",
];
