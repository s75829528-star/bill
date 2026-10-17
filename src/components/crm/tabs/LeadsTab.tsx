import { useEffect, useState } from "react";
import { ArrowUpRight, Plus, Target, X } from "lucide-react";
import { CrmStatusPill, EmptyState, SectionCard } from "@/components/crm/shared";
import { useBusiness } from "@/contexts/BusinessContext";
import { leadsService, type Lead } from "@/services/leads";

const emptyForm = {
  full_name: "",
  company_name: "",
  email: "",
  phone: "",
  source: "website",
  status: "new",
  value: "0",
  notes: "",
};

export function LeadsTab() {
  const { business } = useBusiness();
  const [items, setItems] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const data = await leadsService.getAll();
      setItems(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load leads.";
      setItems([]);
      setError(
        message.includes("does not exist") || message.includes("not found")
          ? "Lead records are not configured yet. Run the tenant-scoped leads migration in Supabase."
          : message,
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!business) return;

    const payload = {
      business_id: business.id,
      customer_id: null,
      full_name: form.full_name.trim(),
      company_name: form.company_name.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || "",
      source: form.source as "website" | "social" | "referral" | "walk_in" | "campaign" | "other",
      status: form.status as "new" | "contacted" | "qualified" | "proposal" | "won" | "lost",
      value: Number(form.value || 0),
      notes: form.notes.trim() || null,
      created_by: null,
      next_followup_at: null,
      converted_at: null,
    };

    try {
      setSaving(true);
      await leadsService.create(payload);
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save lead.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SectionCard title="Leads" subtitle="Loading active opportunities.">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
          Loading leads…
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Leads"
      subtitle="Track active sales prospects across your business."
      action={
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg bg-[image:var(--gradient-brand)] px-3 py-2 text-xs font-semibold text-white shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          Add lead
        </button>
      }
    >
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">New lead</h3>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-md p-1 hover:bg-slate-200">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Full name" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" required />
            <input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} placeholder="Company" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" required />
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" type="email" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="website">Website</option>
              <option value="social">Social</option>
              <option value="referral">Referral</option>
              <option value="walk_in">Walk-in</option>
              <option value="campaign">Campaign</option>
              <option value="other">Other</option>
            </select>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="proposal">Proposal</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
            <input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="Value" type="number" min="0" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
          </div>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" rows={3} className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-[image:var(--gradient-brand)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">
              {saving ? "Saving..." : "Save lead"}
            </button>
          </div>
        </form>
      )}

      {error ? (
        <EmptyState icon={Target} title="No lead data available" subtitle={error} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No leads yet"
          subtitle="Create your first lead to start tracking the sales pipeline."
        />
      ) : (
        <div className="space-y-3">
          {items.map((lead) => (
            <div key={lead.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm transition-colors hover:bg-slate-50">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-foreground">{lead.full_name}</h3>
                    <CrmStatusPill status={lead.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{lead.company_name ?? "Individual lead"}</p>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                  <span className="rounded-full bg-white px-2 py-1">{lead.source}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                    <ArrowUpRight className="h-3 w-3" />
                    {Number(lead.value).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">Phone</p>
                  <p>{lead.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">Email</p>
                  <p>{lead.email || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">Next follow-up</p>
                  <p>{lead.next_followup_at ? new Date(lead.next_followup_at).toLocaleString() : "Not scheduled"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
