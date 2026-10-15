// ── Follow-Ups Tab ────────────────────────────────────────────────
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, CheckCircle2, ChevronUp, ChevronDown, ChevronsUpDown, Search } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  followUps as seedFollowUps,
  crmCustomers,
  leads,
  fmtDate,
  type FollowUp,
  type FollowUpStatus,
  type FollowUpPriority,
} from "@/lib/crm-data";
import {
  SectionCard, SearchInput, Pagination, PrimaryButton, SecondaryButton,
  EmptyState, CrmStatusPill, PriorityBadge, ModalShell,
} from "@/components/crm/shared";

const PAGE_SIZE = 10;
const REFERENCE_DATE = "2026-07-13";

function genId() { return "fu-new-" + Math.random().toString(36).slice(2, 9); }

type ViewFilter = "today" | "upcoming" | "completed" | "overdue" | "all";

const PURPOSES = [
  "Product demo", "Contract renewal discussion", "Quotation follow-up",
  "Payment reminder", "Onboarding call", "Feedback call",
  "Upsell discussion", "Relationship check-in", "Order confirmation", "Complaint resolution",
];

const EMPTY_FORM = {
  subjectName: "",
  subjectId: "",
  subjectType: "customer" as "customer" | "lead",
  purpose: PURPOSES[0],
  date: REFERENCE_DATE,
  time: "10:00",
  priority: "medium" as FollowUpPriority,
  notes: "",
};

function FollowUpForm({
  initial,
  isEdit,
  onSave,
  onCancel,
}: {
  initial: typeof EMPTY_FORM;
  isEdit: boolean;
  onSave: (data: typeof EMPTY_FORM) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof typeof EMPTY_FORM>(k: K, v: (typeof EMPTY_FORM)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k as string]) setErrors((e) => ({ ...e, [k as string]: "" }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.subjectName.trim()) e.subjectName = "Subject is required";
    if (!form.date) e.date = "Date is required";
    return e;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave(form);
  }

  const inputCls = "h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition-colors focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)] placeholder:text-slate-400";
  const selectCls = "h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none transition-colors focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]";
  const labelCls = "mb-1 block text-xs font-medium text-foreground";
  const errCls = "mt-0.5 text-[11px] text-red-500";

  // Combined subject list
  const allSubjects = [
    ...crmCustomers.map((c) => ({ id: c.id, name: c.name, type: "customer" as const })),
    ...leads.map((l) => ({ id: l.id, name: l.name, type: "lead" as const })),
  ].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div className="col-span-2">
          <label className={labelCls}>Customer / Lead *</label>
          <select
            value={form.subjectId}
            onChange={(e) => {
              const found = allSubjects.find((s) => s.id === e.target.value);
              set("subjectId", e.target.value);
              if (found) { set("subjectName", found.name); set("subjectType", found.type); }
            }}
            className={selectCls}
          >
            <option value="">Select a customer or lead…</option>
            <optgroup label="Customers">
              {crmCustomers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.customerCode})</option>)}
            </optgroup>
            <optgroup label="Leads">
              {leads.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.leadCode})</option>)}
            </optgroup>
          </select>
          {errors.subjectName && <p className={errCls}>{errors.subjectName}</p>}
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Purpose</label>
          <select value={form.purpose} onChange={(e) => set("purpose", e.target.value)} className={selectCls}>
            {PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Date *</label>
          <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className={inputCls} />
          {errors.date && <p className={errCls}>{errors.date}</p>}
        </div>
        <div>
          <label className={labelCls}>Time</label>
          <input type="time" value={form.time} onChange={(e) => set("time", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Priority</label>
          <select value={form.priority} onChange={(e) => set("priority", e.target.value as FollowUpPriority)} className={selectCls}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={3}
            placeholder="Any additional notes…"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)] placeholder:text-slate-400 resize-none"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <button type="button" onClick={onCancel} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
          {isEdit ? "Save Changes" : "Schedule Follow-up"}
        </button>
      </div>
    </form>
  );
}

const VIEW_TABS: { id: ViewFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "upcoming", label: "Upcoming" },
  { id: "overdue", label: "Overdue" },
  { id: "completed", label: "Completed" },
];

export function FollowUpsTab() {
  const [localFollowUps, setLocalFollowUps] = useState<FollowUp[]>(() => seedFollowUps.map((f) => ({ ...f })));
  const [view, setView] = useState<ViewFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formInitial, setFormInitial] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let rows = [...localFollowUps];
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((f) => f.subjectName.toLowerCase().includes(q) || f.purpose.toLowerCase().includes(q) || f.notes.toLowerCase().includes(q));
    }
    if (view === "today") rows = rows.filter((f) => f.date === REFERENCE_DATE);
    else if (view === "upcoming") rows = rows.filter((f) => f.date > REFERENCE_DATE && f.status === "pending");
    else if (view === "overdue") rows = rows.filter((f) => f.status === "overdue");
    else if (view === "completed") rows = rows.filter((f) => f.status === "completed");
    rows.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    return rows;
  }, [localFollowUps, search, view]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function counts() {
    return {
      today: localFollowUps.filter((f) => f.date === REFERENCE_DATE).length,
      upcoming: localFollowUps.filter((f) => f.date > REFERENCE_DATE && f.status === "pending").length,
      overdue: localFollowUps.filter((f) => f.status === "overdue").length,
      completed: localFollowUps.filter((f) => f.status === "completed").length,
      all: localFollowUps.length,
    };
  }
  const ct = counts();

  function openCreate() {
    setFormInitial(EMPTY_FORM);
    setFormMode("create");
    setEditingId(null);
    setFormOpen(true);
  }

  function openEdit(fu: FollowUp) {
    setFormInitial({
      subjectName: fu.subjectName,
      subjectId: fu.customerId ?? fu.leadId ?? "",
      subjectType: fu.customerId ? "customer" : "lead",
      purpose: fu.purpose,
      date: fu.date,
      time: fu.time,
      priority: fu.priority,
      notes: fu.notes,
    });
    setFormMode("edit");
    setEditingId(fu.id);
    setFormOpen(true);
  }

  function handleSave(data: typeof EMPTY_FORM) {
    const isPast = data.date < REFERENCE_DATE;
    const status: FollowUpStatus = isPast ? "overdue" : "pending";
    if (formMode === "create") {
      const nfu: FollowUp = {
        id: genId(),
        customerId: data.subjectType === "customer" ? data.subjectId : undefined,
        leadId: data.subjectType === "lead" ? data.subjectId : undefined,
        subjectName: data.subjectName || "Unknown",
        purpose: data.purpose,
        date: data.date,
        time: data.time,
        priority: data.priority,
        status,
        notes: data.notes,
      };
      setLocalFollowUps((prev) => [nfu, ...prev]);
    } else if (editingId) {
      setLocalFollowUps((prev) => prev.map((f) => f.id === editingId ? {
        ...f,
        subjectName: data.subjectName || f.subjectName,
        customerId: data.subjectType === "customer" ? data.subjectId : undefined,
        leadId: data.subjectType === "lead" ? data.subjectId : undefined,
        purpose: data.purpose,
        date: data.date,
        time: data.time,
        priority: data.priority,
        notes: data.notes,
      } : f));
    }
    setFormOpen(false);
  }

  function markCompleted(id: string) {
    setLocalFollowUps((prev) => prev.map((f) => f.id === id ? { ...f, status: "completed" as FollowUpStatus } : f));
  }

  function handleDelete(id: string) {
    setLocalFollowUps((prev) => prev.filter((f) => f.id !== id));
    setDeleteId(null);
  }

  return (
    <div className="space-y-6">
      {/* View filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        {VIEW_TABS.map((tab) => {
          const count = ct[tab.id];
          const isActive = view === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setView(tab.id); setPage(1); }}
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                isActive
                  ? "bg-[image:var(--gradient-brand)] text-white border-transparent shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isActive ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>
                {count}
              </span>
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-2">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search follow-ups…" />
          <PrimaryButton icon={Plus} onClick={openCreate}>Schedule</PrimaryButton>
        </div>
      </div>

      {/* Table */}
      <SectionCard noPadding>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/60">
                <TableHead>Subject</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Date &amp; Time</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState icon={Search} title="No follow-ups found" subtitle="Try a different view or schedule a new follow-up." />
                  </TableCell>
                </TableRow>
              )}
              {pageRows.map((fu, i) => (
                <motion.tr
                  key={fu.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.25 }}
                  className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
                >
                  <TableCell>
                    <p className="text-sm font-semibold text-foreground">{fu.subjectName}</p>
                    <p className="text-[10px] text-muted-foreground">{fu.customerId ? "Customer" : "Lead"}</p>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-foreground">{fu.purpose}</span>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs font-medium text-foreground">{fmtDate(fu.date)}</p>
                    <p className="text-xs text-muted-foreground">{fu.time}</p>
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={fu.priority} />
                  </TableCell>
                  <TableCell>
                    <CrmStatusPill status={fu.status} />
                  </TableCell>
                  <TableCell>
                    <p className="max-w-[180px] truncate text-xs text-muted-foreground" title={fu.notes}>{fu.notes || "—"}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {fu.status !== "completed" && (
                        <button
                          onClick={() => markCompleted(fu.id)}
                          title="Mark as Completed"
                          className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={() => openEdit(fu)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleteId(fu.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="border-t border-slate-100 px-6 py-4">
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      </SectionCard>

      {/* Create/Edit Modal */}
      <ModalShell open={formOpen} onClose={() => setFormOpen(false)} title={formMode === "create" ? "Schedule Follow-up" : "Edit Follow-up"} wide>
        <FollowUpForm initial={formInitial} isEdit={formMode === "edit"} onSave={handleSave} onCancel={() => setFormOpen(false)} />
      </ModalShell>

      {/* Delete Confirm */}
      <ModalShell open={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete Follow-up">
        <p className="text-sm text-foreground mb-6">Are you sure you want to delete this follow-up?</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setDeleteId(null)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => deleteId && handleDelete(deleteId)}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </ModalShell>
    </div>
  );
}
