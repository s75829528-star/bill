import { useEffect, useState } from "react";
import { CalendarClock, Plus, X } from "lucide-react";
import { CrmStatusPill, EmptyState, SectionCard } from "@/components/crm/shared";
import { useBusiness } from "@/contexts/BusinessContext";
import { followUpsService, leadsService, type FollowUp, type Lead } from "@/services/leads";

const emptyForm = {
  lead_id: "",
  scheduled_for: "",
  channel: "call",
  status: "scheduled",
  notes: "",
};

export function FollowUpsTab() {
  const { business } = useBusiness();
  const [items, setItems] = useState<FollowUp[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    try {
      setLoading(true);
      const [leadList, followList] = await Promise.all([leadsService.getAll(), followUpsService.getAll()]);
      setLeads(leadList);
      setItems(followList);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load follow-ups.";
      setItems([]);
      setLeads([]);
      setError(
        message.includes("does not exist") || message.includes("not found")
          ? "Follow-up records are not configured yet. Run the tenant-scoped follow-up migration in Supabase."
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
    if (!business || !form.lead_id) return;

    try {
      setSaving(true);
      await followUpsService.create({
        business_id: business.id,
        lead_id: form.lead_id,
        scheduled_for: new Date(form.scheduled_for).toISOString(),
        channel: form.channel as "call" | "whatsapp" | "email" | "visit" | "other",
        status: form.status as "scheduled" | "completed" | "missed" | "cancelled",
        notes: form.notes.trim() || null,
        created_by: null,
        completed_at: null,
      });
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save follow-up.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SectionCard title="Follow-ups" subtitle="Loading upcoming reminders.">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
          Loading follow-ups…
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Follow-ups"
      subtitle="Follow-up scheduling for the current business."
      action={
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg bg-[image:var(--gradient-brand)] px-3 py-2 text-xs font-semibold text-white shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          Add follow-up
        </button>
      }
    >
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">New follow-up</h3>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-md p-1 hover:bg-slate-200">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <select value={form.lead_id} onChange={(e) => setForm({ ...form, lead_id: e.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" required>
              <option value="">Select lead</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>{lead.full_name}</option>
              ))}
            </select>
            <input value={form.scheduled_for} onChange={(e) => setForm({ ...form, scheduled_for: e.target.value })} type="datetime-local" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" required />
            <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="call">Call</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="visit">Visit</option>
              <option value="other">Other</option>
            </select>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="missed">Missed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Follow-up notes" rows={3} className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-[image:var(--gradient-brand)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">
              {saving ? "Saving..." : "Save follow-up"}
            </button>
          </div>
        </form>
      )}

      {error ? (
        <EmptyState icon={CalendarClock} title="No follow-up data available" subtitle={error} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No follow-ups scheduled"
          subtitle="Schedule your next customer check-in to keep the pipeline moving."
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm transition-colors hover:bg-slate-50">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{new Date(item.scheduled_for).toLocaleString()}</p>
                    <CrmStatusPill status={item.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Channel: {item.channel}</p>
                </div>

                <div className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  {item.channel}
                </div>
              </div>

              <p className="mt-3 text-sm text-slate-600">{item.notes || "No notes captured for this follow-up."}</p>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
