import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, ShoppingCart, Droplets, BarChart2,
  FileText, Users, Truck, X, Printer, Download
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";
import {
  incomeEntries, expenseEntries, cashbookEntries,
  gstSummary, plData, receivables, payables,
  expenseByCategory, cashFlowData,
  openingCashBalance, closingCashBalance,
  fmtINR, fmtDate,
  ytdRevenue, ytdExpenses, ytdNetProfit, currentPL,
  currentMonthGST, totalReceivables, overdueReceivables,
  totalPayables, overduePayables
} from "@/lib/finance-data";
import {
  SectionCard, StatTile, TableWrapper, Th, Td,
  StatusPill, SecondaryButton, EmptyState
} from "@/components/finance/shared";

const BRAND_COLORS = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

// ── Income grouped by category ────────────────────────────────────────
const incomeByCat = (() => {
  const map: Record<string, number> = {};
  incomeEntries.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount; });
  return Object.entries(map).map(([name, value]) => ({ name, value }));
})();

const incomeTotal = incomeEntries.reduce((s, e) => s + e.amount, 0);
const expenseTotal = expenseEntries.reduce((s, e) => s + e.amount, 0);

// Top 5 expenses
const top5Expenses = [...expenseEntries].sort((a, b) => b.amount - a.amount).slice(0, 5);

// P&L margins
const plWithMargin = plData.map(p => ({
  ...p,
  margin: parseFloat(((p.netProfit / p.revenue) * 100).toFixed(1)),
}));

// Cashbook monthly
const cashbookMonthly = [
  { month: "Jul 2025", opening: openingCashBalance, cashIn: cashbookEntries.filter(e => e.type === "in").reduce((s, e) => s + e.amount, 0), cashOut: cashbookEntries.filter(e => e.type === "out").reduce((s, e) => s + e.amount, 0), closing: closingCashBalance }
];

// ── Report Definition ─────────────────────────────────────────────────

type ReportId = "income" | "expense" | "cashflow" | "pl" | "gst" | "receivables" | "payables";

interface ReportDef {
  id: ReportId;
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  bg: string;
}

const REPORTS: ReportDef[] = [
  { id: "income", icon: TrendingUp, title: "Income Report", description: "Revenue breakdown by category, customer, and payment method for the period.", color: "text-emerald-600", bg: "bg-emerald-50" },
  { id: "expense", icon: ShoppingCart, title: "Expense Report", description: "Detailed expense analysis by category with top vendor spends.", color: "text-red-600", bg: "bg-red-50" },
  { id: "cashflow", icon: Droplets, title: "Cash Flow Report", description: "Month-by-month cash movements with opening and closing balances.", color: "text-blue-600", bg: "bg-blue-50" },
  { id: "pl", icon: BarChart2, title: "Profit & Loss", description: "Complete P&L statement with gross profit, net profit, and margins.", color: "text-violet-600", bg: "bg-violet-50" },
  { id: "gst", icon: FileText, title: "GST Report", description: "CGST, SGST, IGST breakdown with ITC claimed and payable summary.", color: "text-amber-600", bg: "bg-amber-50" },
  { id: "receivables", icon: Users, title: "Receivables Report", description: "Outstanding customer invoices sorted by overdue status and aging.", color: "text-indigo-600", bg: "bg-indigo-50" },
  { id: "payables", icon: Truck, title: "Payables Report", description: "Supplier bills sorted by due date with outstanding and overdue totals.", color: "text-rose-600", bg: "bg-rose-50" },
];

// ── Mini preview charts ───────────────────────────────────────────────

function MiniBarChart({ data, dataKey, color }: { data: { name: string; value: number }[]; dataKey: string; color: string }) {
  return (
    <ResponsiveContainer width="100%" height={60}>
      <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <Bar dataKey={dataKey} fill={color} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function MiniLineChart({ data }: { data: { month: string; cashFlow: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={60}>
      <LineChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <Line type="monotone" dataKey="cashFlow" stroke="#6366f1" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Report Modal Contents ─────────────────────────────────────────────

function IncomeReportContent() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs text-muted-foreground">Total Income</p>
          <p className="text-xl font-bold text-foreground mt-1">{fmtINR(incomeTotal)}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs text-muted-foreground">Transactions</p>
          <p className="text-xl font-bold text-foreground mt-1">{incomeEntries.length}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs text-muted-foreground">Avg. Transaction</p>
          <p className="text-xl font-bold text-foreground mt-1">{fmtINR(Math.round(incomeTotal / incomeEntries.length))}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs text-muted-foreground">Categories</p>
          <p className="text-xl font-bold text-foreground mt-1">{incomeByCat.length}</p>
        </div>
      </div>
      <div className="rounded-xl border border-slate-100 p-4">
        <p className="text-sm font-semibold text-foreground mb-4">Income by Category</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={incomeByCat}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => fmtINR(v)} />
            <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <TableWrapper>
        <thead>
          <tr>
            <Th>Reference</Th><Th>Customer</Th><Th>Category</Th><Th>Date</Th><Th>Method</Th><Th right>Amount</Th>
          </tr>
        </thead>
        <tbody>
          {incomeEntries.map(e => (
            <tr key={e.id} className="hover:bg-slate-50">
              <Td><span className="font-mono text-xs">{e.reference}</span></Td>
              <Td>{e.customer}</Td>
              <Td><span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{e.category}</span></Td>
              <Td>{fmtDate(e.date)}</Td>
              <Td>{e.paymentMethod}</Td>
              <Td right><span className="font-semibold text-emerald-600">{fmtINR(e.amount)}</span></Td>
            </tr>
          ))}
        </tbody>
      </TableWrapper>
    </div>
  );
}

function ExpenseReportContent() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs text-muted-foreground">Total Expenses</p>
          <p className="text-xl font-bold text-foreground mt-1">{fmtINR(expenseTotal)}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs text-muted-foreground">Transactions</p>
          <p className="text-xl font-bold text-foreground mt-1">{expenseEntries.length}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs text-muted-foreground">Largest Expense</p>
          <p className="text-xl font-bold text-foreground mt-1">{fmtINR(Math.max(...expenseEntries.map(e => e.amount)))}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs text-muted-foreground">With Receipt</p>
          <p className="text-xl font-bold text-foreground mt-1">{expenseEntries.filter(e => e.hasReceipt).length}/{expenseEntries.length}</p>
        </div>
      </div>
      <div className="rounded-xl border border-slate-100 p-4">
        <p className="text-sm font-semibold text-foreground mb-4">Expense by Category</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={expenseByCategory} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
            <Tooltip formatter={(v: number) => fmtINR(v)} />
            <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} name="Expense" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground mb-3">Top 5 Expenses</p>
        <TableWrapper>
          <thead>
            <tr><Th>Vendor</Th><Th>Category</Th><Th>Date</Th><Th>Method</Th><Th right>Amount</Th></tr>
          </thead>
          <tbody>
            {top5Expenses.map(e => (
              <tr key={e.id} className="hover:bg-slate-50">
                <Td>{e.vendor}</Td>
                <Td><span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full">{e.category}</span></Td>
                <Td>{fmtDate(e.date)}</Td>
                <Td>{e.paymentMethod}</Td>
                <Td right><span className="font-semibold text-red-600">{fmtINR(e.amount)}</span></Td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      </div>
    </div>
  );
}

function CashFlowReportContent() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Opening Balance", value: fmtINR(openingCashBalance) },
          { label: "Total Cash In", value: fmtINR(cashbookEntries.filter(e => e.type === "in").reduce((s, e) => s + e.amount, 0)) },
          { label: "Total Cash Out", value: fmtINR(cashbookEntries.filter(e => e.type === "out").reduce((s, e) => s + e.amount, 0)) },
          { label: "Closing Balance", value: fmtINR(closingCashBalance) },
        ].map(item => (
          <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-xl font-bold text-foreground mt-1">{item.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-slate-100 p-4">
        <p className="text-sm font-semibold text-foreground mb-4">Monthly Cash Flow Trend</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={cashFlowData}>
            <defs>
              <linearGradient id="cfGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => fmtINR(v)} />
            <Area type="monotone" dataKey="cashFlow" stroke="#6366f1" strokeWidth={2} fill="url(#cfGrad)" name="Cash Flow" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground mb-3">Cashbook Transactions</p>
        <TableWrapper>
          <thead>
            <tr><Th>Date</Th><Th>Description</Th><Th>Type</Th><Th right>Amount</Th><Th right>Balance</Th></tr>
          </thead>
          <tbody>
            {cashbookEntries.slice(0, 15).map(e => (
              <tr key={e.id} className="hover:bg-slate-50">
                <Td>{fmtDate(e.date)}</Td>
                <Td>{e.description}</Td>
                <Td><StatusPill status={e.type === "in" ? "credit" : "debit"} label={e.type === "in" ? "In" : "Out"} /></Td>
                <Td right><span className={`font-semibold ${e.type === "in" ? "text-emerald-600" : "text-red-600"}`}>{fmtINR(e.amount)}</span></Td>
                <Td right><span className="font-medium">{fmtINR(e.balance)}</span></Td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      </div>
    </div>
  );
}

function PLReportContent() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "YTD Revenue", value: fmtINR(ytdRevenue), color: "text-emerald-600" },
          { label: "YTD Expenses", value: fmtINR(ytdExpenses), color: "text-red-600" },
          { label: "YTD Net Profit", value: fmtINR(ytdNetProfit), color: "text-indigo-600" },
          { label: "Avg Net Margin", value: `${((ytdNetProfit / ytdRevenue) * 100).toFixed(1)}%`, color: "text-violet-600" },
        ].map(item => (
          <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className={`text-xl font-bold mt-1 ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-slate-100 p-4">
        <p className="text-sm font-semibold text-foreground mb-4">Revenue vs Expenses — Monthly</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={plData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 100000).toFixed(1)}L`} />
            <Tooltip formatter={(v: number) => fmtINR(v)} />
            <Legend />
            <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue" />
            <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <TableWrapper>
        <thead>
          <tr><Th>Month</Th><Th right>Revenue</Th><Th right>Expenses</Th><Th right>Gross Profit</Th><Th right>Net Profit</Th><Th right>Margin</Th></tr>
        </thead>
        <tbody>
          {plWithMargin.map(p => (
            <tr key={p.month} className="hover:bg-slate-50">
              <Td><span className="font-medium">{p.month}</span></Td>
              <Td right><span className="text-emerald-600 font-semibold">{fmtINR(p.revenue)}</span></Td>
              <Td right><span className="text-red-600">{fmtINR(p.expenses)}</span></Td>
              <Td right><span className="font-medium">{fmtINR(p.grossProfit)}</span></Td>
              <Td right><span className="font-bold text-indigo-600">{fmtINR(p.netProfit)}</span></Td>
              <Td right><span className={`text-xs font-semibold ${p.margin >= 30 ? "text-emerald-600" : "text-amber-600"}`}>{p.margin}%</span></Td>
            </tr>
          ))}
        </tbody>
      </TableWrapper>
    </div>
  );
}

function GSTReportContent() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Collected (Jul)", value: fmtINR(currentMonthGST.collectedGST), color: "text-emerald-600" },
          { label: "ITC Claimed (Jul)", value: fmtINR(currentMonthGST.itcClaimed), color: "text-blue-600" },
          { label: "Payable (Jul)", value: fmtINR(currentMonthGST.payableGST), color: "text-red-600" },
          { label: "IGST (Jul)", value: fmtINR(currentMonthGST.igst), color: "text-violet-600" },
        ].map(item => (
          <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className={`text-xl font-bold mt-1 ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-slate-100 p-4">
        <p className="text-sm font-semibold text-foreground mb-4">GST Collected vs Payable — Monthly</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={gstSummary}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => fmtINR(v)} />
            <Legend />
            <Bar dataKey="collectedGST" fill="#10b981" radius={[4, 4, 0, 0]} name="Collected" />
            <Bar dataKey="payableGST" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Payable" />
            <Bar dataKey="itcClaimed" fill="#6366f1" radius={[4, 4, 0, 0]} name="ITC Claimed" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <TableWrapper>
        <thead>
          <tr><Th>Month</Th><Th right>CGST</Th><Th right>SGST</Th><Th right>IGST</Th><Th right>Collected</Th><Th right>ITC Claimed</Th><Th right>Payable</Th></tr>
        </thead>
        <tbody>
          {gstSummary.map(g => (
            <tr key={g.month} className="hover:bg-slate-50">
              <Td><span className="font-medium">{g.month}</span></Td>
              <Td right>{fmtINR(g.cgst)}</Td>
              <Td right>{fmtINR(g.sgst)}</Td>
              <Td right>{fmtINR(g.igst)}</Td>
              <Td right><span className="text-emerald-600 font-semibold">{fmtINR(g.collectedGST)}</span></Td>
              <Td right><span className="text-blue-600">{fmtINR(g.itcClaimed)}</span></Td>
              <Td right><span className="font-bold text-red-600">{fmtINR(g.payableGST)}</span></Td>
            </tr>
          ))}
        </tbody>
      </TableWrapper>
    </div>
  );
}

function ReceivablesReportContent() {
  const sorted = [...receivables].sort((a, b) => {
    const order = { Overdue: 0, Partial: 1, Pending: 2, Paid: 3 };
    return order[a.status] - order[b.status];
  });
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Outstanding", value: fmtINR(totalReceivables) },
          { label: "Overdue", value: fmtINR(overdueReceivables) },
          { label: "Overdue Count", value: receivables.filter(r => r.status === "Overdue").length.toString() },
          { label: "Invoices Total", value: receivables.length.toString() },
        ].map(item => (
          <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-xl font-bold text-foreground mt-1">{item.value}</p>
          </div>
        ))}
      </div>
      <TableWrapper>
        <thead>
          <tr><Th>Invoice #</Th><Th>Customer</Th><Th>Due Date</Th><Th right>Total</Th><Th right>Outstanding</Th><Th>Status</Th></tr>
        </thead>
        <tbody>
          {sorted.map(r => (
            <tr key={r.id} className="hover:bg-slate-50">
              <Td><span className="font-mono text-xs">{r.invoiceNo}</span></Td>
              <Td>{r.customer}</Td>
              <Td>{fmtDate(r.dueDate)}</Td>
              <Td right>{fmtINR(r.totalAmount)}</Td>
              <Td right><span className={`font-bold ${r.status === "Overdue" ? "text-red-600" : ""}`}>{fmtINR(r.outstandingAmount)}</span></Td>
              <Td><StatusPill status={r.status} /></Td>
            </tr>
          ))}
        </tbody>
      </TableWrapper>
    </div>
  );
}

function PayablesReportContent() {
  const sorted = [...payables].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Outstanding", value: fmtINR(totalPayables) },
          { label: "Overdue", value: fmtINR(overduePayables) },
          { label: "Overdue Count", value: payables.filter(p => p.status === "Overdue").length.toString() },
          { label: "Bills Total", value: payables.length.toString() },
        ].map(item => (
          <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-xl font-bold text-foreground mt-1">{item.value}</p>
          </div>
        ))}
      </div>
      <TableWrapper>
        <thead>
          <tr><Th>Bill #</Th><Th>Supplier</Th><Th>Due Date</Th><Th right>Total</Th><Th right>Outstanding</Th><Th>Status</Th></tr>
        </thead>
        <tbody>
          {sorted.map(p => (
            <tr key={p.id} className="hover:bg-slate-50">
              <Td><span className="font-mono text-xs">{p.billNo}</span></Td>
              <Td>{p.supplier}</Td>
              <Td>{fmtDate(p.dueDate)}</Td>
              <Td right>{fmtINR(p.totalAmount)}</Td>
              <Td right><span className={`font-bold ${p.status === "Overdue" ? "text-red-600" : ""}`}>{fmtINR(p.outstandingAmount)}</span></Td>
              <Td><StatusPill status={p.status} /></Td>
            </tr>
          ))}
        </tbody>
      </TableWrapper>
    </div>
  );
}

function reportContent(id: ReportId) {
  switch (id) {
    case "income": return <IncomeReportContent />;
    case "expense": return <ExpenseReportContent />;
    case "cashflow": return <CashFlowReportContent />;
    case "pl": return <PLReportContent />;
    case "gst": return <GSTReportContent />;
    case "receivables": return <ReceivablesReportContent />;
    case "payables": return <PayablesReportContent />;
  }
}

function reportMiniPreview(id: ReportId) {
  switch (id) {
    case "income":
      return <MiniBarChart data={incomeByCat.slice(0, 5)} dataKey="value" color="#10b981" />;
    case "expense":
      return <MiniBarChart data={expenseByCategory.slice(0, 5)} dataKey="value" color="#ef4444" />;
    case "cashflow":
      return <MiniLineChart data={cashFlowData} />;
    case "pl":
      return (
        <div className="flex items-end gap-2 h-[60px]">
          <div className="text-lg font-bold text-violet-600">{fmtINR(currentPL.netProfit)}</div>
          <div className="text-xs text-muted-foreground mb-1">Jul Net Profit</div>
        </div>
      );
    case "gst":
      return (
        <div className="flex items-end gap-2 h-[60px]">
          <div className="text-lg font-bold text-amber-600">{fmtINR(currentMonthGST.payableGST)}</div>
          <div className="text-xs text-muted-foreground mb-1">Payable Jul</div>
        </div>
      );
    case "receivables":
      return (
        <div className="flex items-end gap-2 h-[60px]">
          <div className="text-lg font-bold text-indigo-600">{fmtINR(totalReceivables)}</div>
          <div className="text-xs text-muted-foreground mb-1">Outstanding</div>
        </div>
      );
    case "payables":
      return (
        <div className="flex items-end gap-2 h-[60px]">
          <div className="text-lg font-bold text-rose-600">{fmtINR(totalPayables)}</div>
          <div className="text-xs text-muted-foreground mb-1">Outstanding</div>
        </div>
      );
  }
}

// ── Report Modal ──────────────────────────────────────────────────────

function ReportModal({ report, onClose }: { report: ReportDef; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 backdrop-blur-sm overflow-y-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${report.bg}`}>
              <report.icon className={`h-4.5 w-4.5 ${report.color}`} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">{report.title}</h2>
              <p className="text-xs text-muted-foreground">Period: Jan 2025 – Jul 2025</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => alert(`Printing ${report.title}…`)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </button>
            <button
              onClick={() => alert(`Exporting ${report.title} as CSV…`)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
            <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 text-slate-500">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        {/* Content */}
        <div className="p-6">{reportContent(report.id)}</div>
      </motion.div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────

export function ReportsTab() {
  const [activeReport, setActiveReport] = useState<ReportDef | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Finance Reports</h2>
        <p className="text-sm text-muted-foreground mt-1">Generate and export detailed financial reports for your business.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {REPORTS.map((report, i) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${report.bg}`}>
                  <report.icon className={`h-5 w-5 ${report.color}`} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{report.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 max-w-[220px]">{report.description}</p>
                </div>
              </div>
            </div>

            {/* Mini preview */}
            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
              {reportMiniPreview(report.id)}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setActiveReport(report)}
                className="inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-brand)] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                Generate Report
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {activeReport && (
        <ReportModal report={activeReport} onClose={() => setActiveReport(null)} />
      )}
    </div>
  );
}
