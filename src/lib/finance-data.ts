// ── Finance Mock Data — Nexora Finance Module ────────────────────────
// Realistic Indian business data (INR, GST, Indian names & banks)
// No backend · No Supabase · Mock only

// ── Helpers ──────────────────────────────────────────────────────────

export function fmtINR(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function fmtDate(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Types ─────────────────────────────────────────────────────────────

export type PaymentMethod = "Cash" | "UPI" | "Bank Transfer" | "Cheque" | "Card";
export type TransactionType = "Income" | "Expense" | "Transfer";
export type TransactionStatus = "Completed" | "Pending" | "Failed" | "Reconciled";
export type ReceivableStatus = "Pending" | "Overdue" | "Partial" | "Paid";
export type PayableStatus = "Upcoming" | "Overdue" | "Partial" | "Paid";

export interface IncomeEntry {
  id: string;
  source: string;
  customer: string;
  reference: string;
  amount: number;
  date: string;
  category: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  gstRate: number; // %
}

export interface ExpenseEntry {
  id: string;
  vendor: string;
  reference: string;
  amount: number;
  date: string;
  category: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  hasReceipt: boolean;
  gstRate: number;
}

export interface CashbookEntry {
  id: string;
  date: string;
  description: string;
  type: "in" | "out";
  amount: number;
  balance: number;
  reference?: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string; // masked
  ifsc: string;
  accountType: "Current" | "Savings" | "OD";
  balance: number;
  recentTransactions: {
    date: string;
    description: string;
    amount: number;
    type: "credit" | "debit";
  }[];
}

export interface Transaction {
  id: string;
  date: string;
  reference: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  category: string;
  paymentMethod: PaymentMethod;
  description: string;
  account: string;
}

export interface GSTEntry {
  month: string;
  cgst: number;
  sgst: number;
  igst: number;
  collectedGST: number;
  payableGST: number;
  itcClaimed: number;
}

export interface PLEntry {
  month: string;
  revenue: number;
  expenses: number;
  grossProfit: number;
  netProfit: number;
}

export interface Receivable {
  id: string;
  customer: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: ReceivableStatus;
  contactPhone: string;
  email: string;
  daysPastDue?: number;
}

export interface Payable {
  id: string;
  supplier: string;
  billNo: string;
  billDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: PayableStatus;
  contactPhone: string;
  daysUntilDue?: number;
  daysPastDue?: number;
}

// ── Income Data ───────────────────────────────────────────────────────

export const incomeCategories = [
  "Product Sales",
  "Service Revenue",
  "Consulting",
  "Commission",
  "Rental Income",
  "Interest Income",
  "Miscellaneous",
];

export const incomeEntries: IncomeEntry[] = [
  { id: "INC001", source: "Product Sales", customer: "Reliance Retail Ltd", reference: "INV-2025-0412", amount: 125000, date: "2025-07-14", category: "Product Sales", paymentMethod: "Bank Transfer", notes: "Bulk order — electronics", gstRate: 18 },
  { id: "INC002", source: "Service Revenue", customer: "TCS Pvt Ltd", reference: "INV-2025-0411", amount: 48500, date: "2025-07-13", category: "Service Revenue", paymentMethod: "UPI", gstRate: 18 },
  { id: "INC003", source: "Consulting", customer: "Infosys Ltd", reference: "INV-2025-0410", amount: 75000, date: "2025-07-12", category: "Consulting", paymentMethod: "Bank Transfer", notes: "Q2 advisory retainer", gstRate: 18 },
  { id: "INC004", source: "Product Sales", customer: "Big Bazaar", reference: "INV-2025-0409", amount: 92000, date: "2025-07-11", category: "Product Sales", paymentMethod: "Cheque", gstRate: 12 },
  { id: "INC005", source: "Commission", customer: "HDFC AMC", reference: "INV-2025-0408", amount: 18500, date: "2025-07-10", category: "Commission", paymentMethod: "Bank Transfer", gstRate: 18 },
  { id: "INC006", source: "Product Sales", customer: "Croma Electronics", reference: "INV-2025-0407", amount: 215000, date: "2025-07-09", category: "Product Sales", paymentMethod: "Bank Transfer", notes: "Seasonal sale order", gstRate: 18 },
  { id: "INC007", source: "Service Revenue", customer: "Wipro Ltd", reference: "INV-2025-0406", amount: 55000, date: "2025-07-08", category: "Service Revenue", paymentMethod: "UPI", gstRate: 18 },
  { id: "INC008", source: "Rental Income", customer: "M/s Sharma Properties", reference: "INV-2025-0405", amount: 35000, date: "2025-07-07", category: "Rental Income", paymentMethod: "Bank Transfer", notes: "Office space rental July", gstRate: 18 },
  { id: "INC009", source: "Product Sales", customer: "Amazon Seller Services", reference: "INV-2025-0404", amount: 168000, date: "2025-07-05", category: "Product Sales", paymentMethod: "Bank Transfer", gstRate: 18 },
  { id: "INC010", source: "Consulting", customer: "Mahindra & Mahindra", reference: "INV-2025-0403", amount: 90000, date: "2025-07-03", category: "Consulting", paymentMethod: "Cheque", notes: "Digital transformation project", gstRate: 18 },
  { id: "INC011", source: "Service Revenue", customer: "Bajaj Finserv", reference: "INV-2025-0402", amount: 32500, date: "2025-07-02", category: "Service Revenue", paymentMethod: "UPI", gstRate: 18 },
  { id: "INC012", source: "Product Sales", customer: "Flipkart Internet Pvt Ltd", reference: "INV-2025-0401", amount: 310000, date: "2025-07-01", category: "Product Sales", paymentMethod: "Bank Transfer", notes: "Monthly supply agreement", gstRate: 12 },
  { id: "INC013", source: "Commission", customer: "ICICI Prudential", reference: "INV-2025-0356", amount: 22000, date: "2025-06-28", category: "Commission", paymentMethod: "Bank Transfer", gstRate: 18 },
  { id: "INC014", source: "Product Sales", customer: "Spencer's Retail", reference: "INV-2025-0355", amount: 78000, date: "2025-06-26", category: "Product Sales", paymentMethod: "Bank Transfer", gstRate: 5 },
  { id: "INC015", source: "Interest Income", customer: "HDFC Bank", reference: "INT-JUN-2025", amount: 4800, date: "2025-06-30", category: "Interest Income", paymentMethod: "Bank Transfer", gstRate: 0 },
  { id: "INC016", source: "Service Revenue", customer: "HCL Technologies", reference: "INV-2025-0354", amount: 61000, date: "2025-06-24", category: "Service Revenue", paymentMethod: "Cheque", gstRate: 18 },
  { id: "INC017", source: "Miscellaneous", customer: "Various", reference: "MISC-JUN-25", amount: 12500, date: "2025-06-22", category: "Miscellaneous", paymentMethod: "Cash", gstRate: 0 },
  { id: "INC018", source: "Product Sales", customer: "D-Mart Retail", reference: "INV-2025-0350", amount: 145000, date: "2025-06-20", category: "Product Sales", paymentMethod: "Bank Transfer", gstRate: 12 },
];

// ── Expense Data ──────────────────────────────────────────────────────

export const expenseCategories = [
  "Rent",
  "Electricity",
  "Salary",
  "Fuel",
  "Office Supplies",
  "Marketing",
  "Internet",
  "Software",
  "Travel",
  "Maintenance",
  "Professional Fees",
  "Insurance",
];

export const expenseEntries: ExpenseEntry[] = [
  { id: "EXP001", vendor: "DLF Cyber City", reference: "RENT-JUL-25", amount: 85000, date: "2025-07-01", category: "Rent", paymentMethod: "Bank Transfer", notes: "Office premises July", hasReceipt: true, gstRate: 18 },
  { id: "EXP002", vendor: "BSES Yamuna Power Ltd", reference: "ELEC-JUL-25", amount: 12400, date: "2025-07-03", category: "Electricity", paymentMethod: "UPI", hasReceipt: true, gstRate: 0 },
  { id: "EXP003", vendor: "Staff Salary — July", reference: "SAL-JUL-25", amount: 320000, date: "2025-07-05", category: "Salary", paymentMethod: "Bank Transfer", notes: "12 employees", hasReceipt: false, gstRate: 0 },
  { id: "EXP004", vendor: "HP Petrol Pump", reference: "FUEL-001", amount: 8500, date: "2025-07-07", category: "Fuel", paymentMethod: "Card", hasReceipt: true, gstRate: 0 },
  { id: "EXP005", vendor: "Staples India", reference: "OFFSUP-001", amount: 6800, date: "2025-07-08", category: "Office Supplies", paymentMethod: "Cash", notes: "Stationery and printer cartridges", hasReceipt: true, gstRate: 12 },
  { id: "EXP006", vendor: "Meta Ads (Facebook)", reference: "MKT-JUL-01", amount: 25000, date: "2025-07-09", category: "Marketing", paymentMethod: "Card", notes: "July digital ad spend", hasReceipt: true, gstRate: 18 },
  { id: "EXP007", vendor: "Jio Business Fiber", reference: "NET-JUL-25", amount: 4999, date: "2025-07-01", category: "Internet", paymentMethod: "UPI", hasReceipt: true, gstRate: 18 },
  { id: "EXP008", vendor: "Microsoft 365", reference: "SW-MS-JUL", amount: 18500, date: "2025-07-02", category: "Software", paymentMethod: "Card", notes: "Annual subscription prorated", hasReceipt: true, gstRate: 18 },
  { id: "EXP009", vendor: "MakeMyTrip", reference: "TRVL-001", amount: 32000, date: "2025-07-10", category: "Travel", paymentMethod: "Card", notes: "Client visit — Bengaluru", hasReceipt: true, gstRate: 5 },
  { id: "EXP010", vendor: "Eureka Forbes AMC", reference: "MAINT-001", amount: 5500, date: "2025-07-11", category: "Maintenance", paymentMethod: "Cash", notes: "AC servicing", hasReceipt: true, gstRate: 18 },
  { id: "EXP011", vendor: "CA Rohit Mehta & Co", reference: "PROF-JUL", amount: 15000, date: "2025-07-12", category: "Professional Fees", paymentMethod: "Bank Transfer", notes: "Monthly accounting & compliance", hasReceipt: true, gstRate: 18 },
  { id: "EXP012", vendor: "New India Assurance", reference: "INS-JUL-25", amount: 9800, date: "2025-07-01", category: "Insurance", paymentMethod: "Bank Transfer", notes: "Business liability premium", hasReceipt: true, gstRate: 18 },
  { id: "EXP013", vendor: "Google Workspace", reference: "SW-GW-JUL", amount: 8400, date: "2025-07-02", category: "Software", paymentMethod: "Card", hasReceipt: true, gstRate: 18 },
  { id: "EXP014", vendor: "BPCL", reference: "FUEL-002", amount: 6200, date: "2025-07-13", category: "Fuel", paymentMethod: "Card", hasReceipt: true, gstRate: 0 },
  { id: "EXP015", vendor: "Google Ads", reference: "MKT-JUL-02", amount: 18000, date: "2025-07-10", category: "Marketing", paymentMethod: "Card", notes: "Search & Display campaigns", hasReceipt: true, gstRate: 18 },
  { id: "EXP016", vendor: "DLF Cyber City", reference: "RENT-JUN-25", amount: 85000, date: "2025-06-01", category: "Rent", paymentMethod: "Bank Transfer", hasReceipt: true, gstRate: 18 },
  { id: "EXP017", vendor: "Staff Salary — June", reference: "SAL-JUN-25", amount: 315000, date: "2025-06-05", category: "Salary", paymentMethod: "Bank Transfer", notes: "12 employees", hasReceipt: false, gstRate: 0 },
  { id: "EXP018", vendor: "Zoho Corp", reference: "SW-ZOHO-JUN", amount: 12000, date: "2025-06-02", category: "Software", paymentMethod: "Card", hasReceipt: true, gstRate: 18 },
  { id: "EXP019", vendor: "OLA Cabs", reference: "TRVL-002", amount: 7800, date: "2025-06-18", category: "Travel", paymentMethod: "UPI", notes: "Staff travel June", hasReceipt: false, gstRate: 5 },
  { id: "EXP020", vendor: "Meta Ads", reference: "MKT-JUN-01", amount: 22000, date: "2025-06-15", category: "Marketing", paymentMethod: "Card", hasReceipt: true, gstRate: 18 },
];

// ── Cashbook Data ─────────────────────────────────────────────────────

let runningBalance = 125000; // opening balance
const rawCashbook = [
  { date: "2025-07-01", description: "Opening Cash Balance", type: "in" as const, amount: 0 },
  { date: "2025-07-01", description: "Cash Sales — Daily Collection", type: "in" as const, amount: 18500 },
  { date: "2025-07-01", description: "Office Supplies Purchase", type: "out" as const, amount: 6800 },
  { date: "2025-07-02", description: "Cash Sales — Walk-in Customer", type: "in" as const, amount: 12000 },
  { date: "2025-07-02", description: "Petty Cash — Tea & Snacks", type: "out" as const, amount: 850 },
  { date: "2025-07-03", description: "Cash Received from Ramesh Traders", type: "in" as const, amount: 25000 },
  { date: "2025-07-03", description: "Electricity Bill — Cash", type: "out" as const, amount: 0 },
  { date: "2025-07-04", description: "Miscellaneous Income", type: "in" as const, amount: 3200 },
  { date: "2025-07-04", description: "Courier & Packaging", type: "out" as const, amount: 2400 },
  { date: "2025-07-05", description: "Cash Sales — July 5", type: "in" as const, amount: 21500 },
  { date: "2025-07-05", description: "Fuel Reimbursement — Driver", type: "out" as const, amount: 3500 },
  { date: "2025-07-07", description: "Cash Sales — July 7", type: "in" as const, amount: 14800 },
  { date: "2025-07-07", description: "Maintenance — AC Service", type: "out" as const, amount: 5500 },
  { date: "2025-07-08", description: "Cash received from Priya Enterprises", type: "in" as const, amount: 45000 },
  { date: "2025-07-09", description: "Deposited to Bank", type: "out" as const, amount: 50000 },
  { date: "2025-07-10", description: "Cash Sales — July 10", type: "in" as const, amount: 19200 },
  { date: "2025-07-10", description: "Petty Cash Expenses", type: "out" as const, amount: 1800 },
  { date: "2025-07-11", description: "Cash from refund — vendor return", type: "in" as const, amount: 8000 },
  { date: "2025-07-11", description: "Stationery purchase", type: "out" as const, amount: 1200 },
  { date: "2025-07-12", description: "Cash Sales — July 12", type: "in" as const, amount: 22500 },
  { date: "2025-07-13", description: "Staff advance given", type: "out" as const, amount: 10000 },
  { date: "2025-07-14", description: "Cash Sales — Today", type: "in" as const, amount: 15600 },
];

export const cashbookEntries: CashbookEntry[] = rawCashbook.map((e, i) => {
  if (e.type === "in") runningBalance += e.amount;
  else runningBalance -= e.amount;
  return { id: `CB${String(i + 1).padStart(3, "0")}`, ...e, balance: runningBalance, reference: `REF-${i + 1}` };
});

export const openingCashBalance = 125000;
export const cashIn = cashbookEntries.filter(e => e.type === "in").reduce((s, e) => s + e.amount, 0);
export const cashOut = cashbookEntries.filter(e => e.type === "out").reduce((s, e) => s + e.amount, 0);
export const closingCashBalance = openingCashBalance + cashIn - cashOut;

// ── Bank Accounts ─────────────────────────────────────────────────────

export const bankAccounts: BankAccount[] = [
  {
    id: "BANK001",
    bankName: "HDFC Bank",
    accountHolder: "Nexora Business Solutions Pvt Ltd",
    accountNumber: "XXXX XXXX 4821",
    ifsc: "HDFC0001234",
    accountType: "Current",
    balance: 1248500,
    recentTransactions: [
      { date: "2025-07-14", description: "NEFT from Reliance Retail", amount: 125000, type: "credit" },
      { date: "2025-07-13", description: "Salary July Batch 1", amount: 185000, type: "debit" },
      { date: "2025-07-12", description: "RTGS from Flipkart", amount: 310000, type: "credit" },
      { date: "2025-07-11", description: "GST Payment Jul Q2", amount: 48200, type: "debit" },
      { date: "2025-07-10", description: "Google Ads INR charge", amount: 18000, type: "debit" },
    ],
  },
  {
    id: "BANK002",
    bankName: "ICICI Bank",
    accountHolder: "Nexora Business Solutions Pvt Ltd",
    accountNumber: "XXXX XXXX 7703",
    ifsc: "ICIC0004567",
    accountType: "Current",
    balance: 586200,
    recentTransactions: [
      { date: "2025-07-13", description: "UPI from TCS Pvt Ltd", amount: 48500, type: "credit" },
      { date: "2025-07-11", description: "Rent — DLF Cyber City", amount: 85000, type: "debit" },
      { date: "2025-07-09", description: "Cash Deposit", amount: 50000, type: "credit" },
      { date: "2025-07-07", description: "Meta Ads charge", amount: 25000, type: "debit" },
      { date: "2025-07-05", description: "IMPS from Infosys Ltd", amount: 75000, type: "credit" },
    ],
  },
  {
    id: "BANK003",
    bankName: "SBI Bank",
    accountHolder: "Nexora Business Solutions Pvt Ltd",
    accountNumber: "XXXX XXXX 2290",
    ifsc: "SBIN0007892",
    accountType: "Savings",
    balance: 215800,
    recentTransactions: [
      { date: "2025-06-30", description: "Interest Credit", amount: 4800, type: "credit" },
      { date: "2025-06-28", description: "NEFT to vendor", amount: 22000, type: "debit" },
      { date: "2025-06-25", description: "TDS Refund", amount: 15200, type: "credit" },
      { date: "2025-06-20", description: "Professional Fee — CA", amount: 15000, type: "debit" },
      { date: "2025-06-15", description: "Rental income credit", amount: 35000, type: "credit" },
    ],
  },
];

export const totalBankBalance = bankAccounts.reduce((s, a) => s + a.balance, 0);

// ── Transactions ──────────────────────────────────────────────────────

export const transactions: Transaction[] = [
  { id: "TXN001", date: "2025-07-14", reference: "INV-2025-0412", type: "Income", amount: 125000, status: "Completed", category: "Product Sales", paymentMethod: "Bank Transfer", description: "Reliance Retail — Bulk order", account: "HDFC Bank" },
  { id: "TXN002", date: "2025-07-13", reference: "INV-2025-0411", type: "Income", amount: 48500, status: "Completed", category: "Service Revenue", paymentMethod: "UPI", description: "TCS Pvt Ltd — Services", account: "ICICI Bank" },
  { id: "TXN003", date: "2025-07-13", reference: "SAL-JUL-25-1", type: "Expense", amount: 185000, status: "Completed", category: "Salary", paymentMethod: "Bank Transfer", description: "Staff Salary — Batch 1", account: "HDFC Bank" },
  { id: "TXN004", date: "2025-07-12", reference: "INV-2025-0410", type: "Income", amount: 75000, status: "Completed", category: "Consulting", paymentMethod: "Bank Transfer", description: "Infosys Ltd — Advisory Q2", account: "ICICI Bank" },
  { id: "TXN005", date: "2025-07-12", reference: "INV-2025-0401", type: "Income", amount: 310000, status: "Completed", category: "Product Sales", paymentMethod: "Bank Transfer", description: "Flipkart — Monthly supply", account: "HDFC Bank" },
  { id: "TXN006", date: "2025-07-11", reference: "RENT-JUL-25", type: "Expense", amount: 85000, status: "Completed", category: "Rent", paymentMethod: "Bank Transfer", description: "DLF Cyber City — Office rent", account: "ICICI Bank" },
  { id: "TXN007", date: "2025-07-11", reference: "GST-JUL-Q2", type: "Expense", amount: 48200, status: "Completed", category: "GST Payment", paymentMethod: "Bank Transfer", description: "GST liability payment July", account: "HDFC Bank" },
  { id: "TXN008", date: "2025-07-10", reference: "MKT-JUL-01", type: "Expense", amount: 25000, status: "Completed", category: "Marketing", paymentMethod: "Card", description: "Meta Ads — Digital campaigns", account: "ICICI Bank" },
  { id: "TXN009", date: "2025-07-10", reference: "INV-2025-0407", type: "Income", amount: 215000, status: "Completed", category: "Product Sales", paymentMethod: "Bank Transfer", description: "Croma Electronics — Seasonal", account: "HDFC Bank" },
  { id: "TXN010", date: "2025-07-09", reference: "TRVL-001", type: "Expense", amount: 32000, status: "Completed", category: "Travel", paymentMethod: "Card", description: "Client visit Bengaluru", account: "HDFC Bank" },
  { id: "TXN011", date: "2025-07-09", reference: "TRF-001", type: "Transfer", amount: 50000, status: "Completed", category: "Internal Transfer", paymentMethod: "Bank Transfer", description: "HDFC → ICICI internal", account: "HDFC Bank" },
  { id: "TXN012", date: "2025-07-08", reference: "SW-MS-JUL", type: "Expense", amount: 18500, status: "Completed", category: "Software", paymentMethod: "Card", description: "Microsoft 365 annual", account: "ICICI Bank" },
  { id: "TXN013", date: "2025-07-07", reference: "INV-2025-0406", type: "Income", amount: 92000, status: "Pending", category: "Product Sales", paymentMethod: "Cheque", description: "Big Bazaar — Q3 reorder", account: "HDFC Bank" },
  { id: "TXN014", date: "2025-07-05", reference: "SAL-JUL-25-2", type: "Expense", amount: 135000, status: "Completed", category: "Salary", paymentMethod: "Bank Transfer", description: "Staff Salary — Batch 2", account: "HDFC Bank" },
  { id: "TXN015", date: "2025-07-03", reference: "INV-2025-0408", type: "Income", amount: 18500, status: "Completed", category: "Commission", paymentMethod: "Bank Transfer", description: "HDFC AMC Commission", account: "SBI Bank" },
  { id: "TXN016", date: "2025-07-02", reference: "NET-JUL-25", type: "Expense", amount: 4999, status: "Completed", category: "Internet", paymentMethod: "UPI", description: "Jio Business Fiber", account: "ICICI Bank" },
  { id: "TXN017", date: "2025-07-01", reference: "INS-JUL-25", type: "Expense", amount: 9800, status: "Completed", category: "Insurance", paymentMethod: "Bank Transfer", description: "New India Assurance premium", account: "SBI Bank" },
  { id: "TXN018", date: "2025-06-30", reference: "INT-JUN-2025", type: "Income", amount: 4800, status: "Completed", category: "Interest Income", paymentMethod: "Bank Transfer", description: "SBI Savings Interest", account: "SBI Bank" },
  { id: "TXN019", date: "2025-06-28", reference: "INV-2025-0356", type: "Income", amount: 22000, status: "Completed", category: "Commission", paymentMethod: "Bank Transfer", description: "ICICI Prudential Commission", account: "HDFC Bank" },
  { id: "TXN020", date: "2025-06-26", reference: "INV-2025-0354", type: "Income", amount: 61000, status: "Pending", category: "Service Revenue", paymentMethod: "Cheque", description: "HCL Technologies — Services", account: "ICICI Bank" },
];

// ── GST Summary ───────────────────────────────────────────────────────

export const gstSummary: GSTEntry[] = [
  { month: "Jan 2025", cgst: 42000, sgst: 42000, igst: 18500, collectedGST: 102500, payableGST: 68200, itcClaimed: 34300 },
  { month: "Feb 2025", cgst: 38500, sgst: 38500, igst: 15200, collectedGST: 92200, payableGST: 61000, itcClaimed: 31200 },
  { month: "Mar 2025", cgst: 55000, sgst: 55000, igst: 22000, collectedGST: 132000, payableGST: 88500, itcClaimed: 43500 },
  { month: "Apr 2025", cgst: 48200, sgst: 48200, igst: 19800, collectedGST: 116200, payableGST: 76400, itcClaimed: 39800 },
  { month: "May 2025", cgst: 51500, sgst: 51500, igst: 21000, collectedGST: 124000, payableGST: 82000, itcClaimed: 42000 },
  { month: "Jun 2025", cgst: 58000, sgst: 58000, igst: 24500, collectedGST: 140500, payableGST: 93500, itcClaimed: 47000 },
  { month: "Jul 2025", cgst: 62500, sgst: 62500, igst: 27000, collectedGST: 152000, payableGST: 101200, itcClaimed: 50800 },
];

export const currentMonthGST = gstSummary[gstSummary.length - 1];

// ── P&L Data ──────────────────────────────────────────────────────────

export const plData: PLEntry[] = [
  { month: "Jan", revenue: 825000, expenses: 618000, grossProfit: 207000, netProfit: 165000 },
  { month: "Feb", revenue: 748000, expenses: 572000, grossProfit: 176000, netProfit: 142000 },
  { month: "Mar", revenue: 1120000, expenses: 698000, grossProfit: 422000, netProfit: 356000 },
  { month: "Apr", revenue: 892000, expenses: 634000, grossProfit: 258000, netProfit: 208000 },
  { month: "May", revenue: 960000, expenses: 651000, grossProfit: 309000, netProfit: 253000 },
  { month: "Jun", revenue: 1085000, expenses: 712000, grossProfit: 373000, netProfit: 302000 },
  { month: "Jul", revenue: 1249800, expenses: 678499, grossProfit: 571301, netProfit: 471301 },
];

export const currentPL = plData[plData.length - 1];
export const ytdRevenue = plData.reduce((s, p) => s + p.revenue, 0);
export const ytdExpenses = plData.reduce((s, p) => s + p.expenses, 0);
export const ytdNetProfit = plData.reduce((s, p) => s + p.netProfit, 0);

// ── Receivables ───────────────────────────────────────────────────────

export const receivables: Receivable[] = [
  { id: "RCV001", customer: "Croma Electronics", invoiceNo: "INV-2025-0407", invoiceDate: "2025-07-09", dueDate: "2025-07-23", totalAmount: 215000, paidAmount: 0, outstandingAmount: 215000, status: "Pending", contactPhone: "+91 98765 43210", email: "accounts@croma.com" },
  { id: "RCV002", customer: "Big Bazaar", invoiceNo: "INV-2025-0409", invoiceDate: "2025-07-11", dueDate: "2025-07-18", totalAmount: 92000, paidAmount: 0, outstandingAmount: 92000, status: "Pending", contactPhone: "+91 98200 12345", email: "payables@bigbazaar.in" },
  { id: "RCV003", customer: "HCL Technologies", invoiceNo: "INV-2025-0354", invoiceDate: "2025-06-24", dueDate: "2025-07-08", totalAmount: 61000, paidAmount: 0, outstandingAmount: 61000, status: "Overdue", contactPhone: "+91 91234 56789", email: "accounts@hcl.com", daysPastDue: 6 },
  { id: "RCV004", customer: "Spencer's Retail", invoiceNo: "INV-2025-0355", invoiceDate: "2025-06-26", dueDate: "2025-07-10", totalAmount: 78000, paidAmount: 40000, outstandingAmount: 38000, status: "Partial", contactPhone: "+91 99887 65432", email: "finance@spencers.in", daysPastDue: 4 },
  { id: "RCV005", customer: "Mahindra & Mahindra", invoiceNo: "INV-2025-0403", invoiceDate: "2025-07-03", dueDate: "2025-08-02", totalAmount: 90000, paidAmount: 0, outstandingAmount: 90000, status: "Pending", contactPhone: "+91 92345 67890", email: "finance@mahindra.com" },
  { id: "RCV006", customer: "Amazon Seller Services", invoiceNo: "INV-2025-0404", invoiceDate: "2025-07-05", dueDate: "2025-07-19", totalAmount: 168000, paidAmount: 0, outstandingAmount: 168000, status: "Pending", contactPhone: "+91 18001 23456", email: "vendor-payments@amazon.in" },
  { id: "RCV007", customer: "Bajaj Finserv", invoiceNo: "INV-2025-0402", invoiceDate: "2025-07-02", dueDate: "2025-07-16", totalAmount: 32500, paidAmount: 32500, outstandingAmount: 0, status: "Paid", contactPhone: "+91 91122 33445", email: "ap@bajajfinserv.in" },
];

export const totalReceivables = receivables.filter(r => r.status !== "Paid").reduce((s, r) => s + r.outstandingAmount, 0);
export const overdueReceivables = receivables.filter(r => r.status === "Overdue").reduce((s, r) => s + r.outstandingAmount, 0);

// ── Payables ──────────────────────────────────────────────────────────

export const payables: Payable[] = [
  { id: "PAY001", supplier: "DLF Cyber City Properties", billNo: "RENT-AUG-25", billDate: "2025-07-14", dueDate: "2025-08-01", totalAmount: 85000, paidAmount: 0, outstandingAmount: 85000, status: "Upcoming", contactPhone: "+91 98001 23456", daysUntilDue: 18 },
  { id: "PAY002", supplier: "Ramesh Electronics Wholesale", billNo: "PO-2025-0088", billDate: "2025-07-01", dueDate: "2025-07-15", totalAmount: 342000, paidAmount: 150000, outstandingAmount: 192000, status: "Partial", contactPhone: "+91 99111 22333", daysUntilDue: 1 },
  { id: "PAY003", supplier: "Sharma Distributors", billNo: "PO-2025-0081", billDate: "2025-06-20", dueDate: "2025-07-10", totalAmount: 128000, paidAmount: 0, outstandingAmount: 128000, status: "Overdue", contactPhone: "+91 98765 11122", daysPastDue: 4 },
  { id: "PAY004", supplier: "Vijay Sales Distributors", billNo: "PO-2025-0075", billDate: "2025-06-15", dueDate: "2025-07-05", totalAmount: 95000, paidAmount: 95000, outstandingAmount: 0, status: "Paid", contactPhone: "+91 91234 44455", daysUntilDue: 0 },
  { id: "PAY005", supplier: "Quick Logistics Pvt Ltd", billNo: "LOG-JUL-0022", billDate: "2025-07-07", dueDate: "2025-07-21", totalAmount: 28500, paidAmount: 0, outstandingAmount: 28500, status: "Upcoming", contactPhone: "+91 90000 11122", daysUntilDue: 7 },
  { id: "PAY006", supplier: "Jio Business Solutions", billNo: "JIO-JUL-2025", billDate: "2025-07-01", dueDate: "2025-07-31", totalAmount: 4999, paidAmount: 4999, outstandingAmount: 0, status: "Paid", contactPhone: "+91 18001 00000", daysUntilDue: 17 },
  { id: "PAY007", supplier: "New India Assurance", billNo: "NIA-2025-FY26", billDate: "2025-07-01", dueDate: "2025-08-15", totalAmount: 9800, paidAmount: 9800, outstandingAmount: 0, status: "Paid", contactPhone: "+91 18001 42232", daysUntilDue: 32 },
  { id: "PAY008", supplier: "Apex Paper Products", billNo: "PO-2025-0090", billDate: "2025-07-10", dueDate: "2025-07-25", totalAmount: 42000, paidAmount: 0, outstandingAmount: 42000, status: "Upcoming", contactPhone: "+91 97654 32109", daysUntilDue: 11 },
];

export const totalPayables = payables.filter(p => p.status !== "Paid").reduce((s, p) => s + p.outstandingAmount, 0);
export const overduePayables = payables.filter(p => p.status === "Overdue").reduce((s, p) => s + p.outstandingAmount, 0);

// ── Finance Settings Defaults ─────────────────────────────────────────

export const defaultFinanceSettings = {
  currency: "INR",
  currencySymbol: "₹",
  financialYearStart: "April",
  taxRegistrationType: "Regular",
  gstNumber: "07AABCS1429B1ZB",
  panNumber: "AABCS1429B",
  invoicePrefix: "INV",
  invoiceStartNumber: 401,
  tdsApplicable: true,
  defaultPaymentTerms: "Net 30",
};

// ── Dashboard KPIs ────────────────────────────────────────────────────

export const todayIncome = incomeEntries
  .filter(e => e.date === "2025-07-14")
  .reduce((s, e) => s + e.amount, 0);

export const todayExpenses = expenseEntries
  .filter(e => e.date === "2025-07-14")
  .reduce((s, e) => s + e.amount, 0);

export const todayNetProfit = todayIncome - todayExpenses;

export const cashBalance = closingCashBalance;
export const bankBalance = totalBankBalance;

// Expense breakdown for chart
export const expenseByCategory = expenseCategories.map(cat => ({
  name: cat,
  value: expenseEntries.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
})).filter(e => e.value > 0);

// Revenue trend (last 7 months)
export const revenueTrend = plData.map(p => ({ month: p.month, revenue: p.revenue, expenses: p.expenses }));

// Cash flow (monthly net)
export const cashFlowData = plData.map(p => ({ month: p.month, cashFlow: p.revenue - p.expenses }));
