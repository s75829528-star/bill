// ── Income Tab ────────────────────────────────────────────────────────
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Eye, Trash2, X, Download, Plus } from "lucide-react";
import {
  incomeEntries, incomeCategories, fmtINR, fmtDate,
  IncomeEntry, PaymentMethod,
} from "@/lib/finance-data";
import {
  SectionCard, StatTile, SearchInput, FilterSelect, Pagination,
  PrimaryButton, SecondaryButton, EmptyState, TableWrapper, Th, Td,
} from "@/components/finance/shared";

const PAGE_SIZE = 8;
const PAYMENT_METHODS: PaymentMethod[] = ["Cash", "UPI", "Bank Transfer", "Cheque", "Card"];
const MONTHS = [
  { value: "", label: "All Months" },
  { value: "2025-07", label: "July 2025" },
  { value: "2025-06", label: "June 2025" },
];

function newBlank(): Omit<IncomeEntry, "id"> {
  return { source: "", customer: "", reference: "", amount: 0, date: "", category: incomeCategories[0], paymentMethod: "Bank Transfer", notes: "", gstRate: 18 };
}

export function IncomeTab() {
  const [entries, setEntries] = useState<IncomeEntry[]>(incomeEntries);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [pmFilter, setPmFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(newBlank());
  const [viewEntry, setViewEntry] = useState<IncomeEntry | null>(null);

  // Stats
  const totalIncome = useMemo(() => entries.reduce((s, e) => s + e.amount, 0), [entries]);
  const thisMonth = useMemo(() => entries.filter(e => e.date.startsWith("2025-07")).reduce((s, e) => s + e.amount, 0), [entries]);
  const avgPerEntry = entries.length ? Math.round(totalIncome / entries.length) : 0;

  // Filtered
  const filtered = useMemo(() => {
    return entries
      .filter(e => {
        const q = search.toLowerCase();
        return !q || e.customer.toLowerCase().includes(q) || e.source.toLowerCase().includes(q) || e.reference.toLowerCase().includes(q);
      })
      .filter(e => !catFilter || e.category === catFilter)
      .filter(e => !pmFilter || e.paymentMethod === pmFilter)
      .filter(e => !monthFilter || e.date.startsWith(monthFilter))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, search, catFilter, pmFilter, monthFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleAdd() {
    if (!form.source || !form.customer || !form.amount || !form.date) return;
    const id = `INC${String(entries.length + 1).padStart(3, "0")}`;
    setEntries(prev => [{ id, ...form }, ...prev]);
    setForm(newBlank());
    setDialogOpen(false);
    setPage(1);
  }

  function handleDelete(id: string) {
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  function set(field: keyof typeof form, value: string | number) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  return (
    <div className="space-y-6">
      {/* Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Total Income" value={fmtINR(totalIncome)} icon={TrendingUp} bg="bg-emerald-50" iconColor="text-emerald-600" index={0} />
        <StatTile label="This Month" value={fmtINR(thisMonth)} icon={TrendingUp} bg="bg-indigo-50" iconColor="text-indigo-600" index={1} sub="July 2025" />
        <StatTile label="Avg per Entry" value={fmtINR(avgPerEntry)} icon={TrendingUp} bg="bg-violet-50" iconColor="text-violet-600" index={2} />
        <StatTile label="Total Entries" value={String(entries.length)} icon={TrendingUp} bg="bg-amber-50" iconColor="text-amber-600" index={3} sub="All time" />
      </div>

      {/* Filter + Actions */}
      <SectionCard
        title="Income Records"
        subtitle={`${filtered.length} entries`}
        action={
          <div className="flex items-center gap-2">
            <PrimaryButton icon={Plus} onClick={() => setDialogOpen(true)}>Record Income</PrimaryButton>
            <SecondaryButton icon={Download} onClick={() => alert("Export CSV — coming soon")}>Export CSV</SecondaryButton>
          </div>
        }
        noPadding
      >
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-slate-100">
          <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search customer, source, reference..." className="w-64" />
          <FilterSelect
            value={catFilter}
            onChange={v => { setCatFilter(v); setPage(1); }}
            options={[{ value: "", label: "All Categories" }, ...incomeCategories.map(c => ({ value: c, label: c }))]}
          />
          <FilterSelect
            value={pmFilter}
            onChange={v => { setPmFilter(v); setPage(1); }}
            options={[{ value: "", label: "All Methods" }, ...PAYMENT_METHODS.map(m => ({ value: m, label: m }))]}
          />
          <FilterSelect
            value={monthFilter}
            onChange={v => { setMonthFilter(v); setPage(1); }}
            options={MONTHS}
          />
        </div>

        <TableWrapper>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Source</Th>
              <Th>Customer</Th>
              <Th>Reference</Th>
              <Th>Category</Th>
              <Th>Payment Method</Th>
              <Th right>Amount</Th>
              <Th>GST%</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr><td colSpan={9}><EmptyState icon={TrendingUp} title="No income records" subtitle="Try adjusting your filters." /></td></tr>
            ) : pageData.map((e) => (
              <motion.tr
                key={e.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="hover:bg-slate-50 transition-colors"
              >
                <Td><span className="text-xs text-muted-foreground">{fmtDate(e.date)}</span></Td>
                <Td>{e.source}</Td>
                <Td className="font-medium">{e.customer}</Td>
                <Td><span className="font-mono text-xs text-muted-foreground">{e.reference}</span></Td>
                <Td><span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">{e.category}</span></Td>
                <Td><span className="text-xs text-muted-foreground">{e.paymentMethod}</span></Td>
                <Td right><span className="font-semibold text-emerald-600">{fmtINR(e.amount)}</span></Td>
                <Td><span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">{e.gstRate}%</span></Td>
                <Td>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setViewEntry(e)} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(e.id)} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </Td>
              </motion.tr>
            ))}
          </tbody>
        </TableWrapper>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </SectionCard>

      {/* Add Income Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-2xl bg-white shadow-xl mx-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-sm font-semibold text-foreground">Record Income</h2>
              <button onClick={() => setDialogOpen(false)} className="rounded-lg p-1 hover:bg-slate-100 text-slate-500">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Source *</label>
                  <input value={form.source} onChange={e => set("source", e.target.value)} className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" placeholder="e.g. Product Sales" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Customer *</label>
                  <input value={form.customer} onChange={e => set("customer", e.target.value)} className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" placeholder="Customer name" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Reference</label>
                  <input value={form.reference} onChange={e => set("reference", e.target.value)} className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" placeholder="INV-2025-0xxx" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Amount (₹) *</label>
                  <input type="number" value={form.amount || ""} onChange={e => set("amount", parseFloat(e.target.value) || 0)} className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Date *</label>
                  <input type="date" value={form.date} onChange={e => set("date", e.target.value)} className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Category</label>
                  <select value={form.category} onChange={e => set("category", e.target.value)} className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400">
                    {incomeCategories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Payment Method</label>
                  <select value={form.paymentMethod} onChange={e => set("paymentMethod", e.target.value)} className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400">
                    {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">GST Rate (%)</label>
                  <select value={form.gstRate} onChange={e => set("gstRate", parseFloat(e.target.value))} className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400">
                    {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Notes</label>
                <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-none" placeholder="Optional notes..." />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <button onClick={() => setDialogOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-foreground hover:bg-slate-50">Cancel</button>
              <PrimaryButton onClick={handleAdd}>Save Income</PrimaryButton>
            </div>
          </motion.div>
        </div>
      )}

      {/* View Dialog */}
      {viewEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-2xl bg-white shadow-xl mx-4">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-sm font-semibold text-foreground">Income Details — {viewEntry.id}</h2>
              <button onClick={() => setViewEntry(null)} className="rounded-lg p-1 hover:bg-slate-100 text-slate-500"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 space-y-3">
              {[
                ["Source", viewEntry.source], ["Customer", viewEntry.customer],
                ["Reference", viewEntry.reference], ["Date", fmtDate(viewEntry.date)],
                ["Category", viewEntry.category], ["Payment Method", viewEntry.paymentMethod],
                ["Amount", fmtINR(viewEntry.amount)], ["GST Rate", `${viewEntry.gstRate}%`],
                ["Notes", viewEntry.notes || "—"],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground">{val}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 px-6 py-4 text-right">
              <button onClick={() => setViewEntry(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50">Close</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
