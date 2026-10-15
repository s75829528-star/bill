import { useState } from "react";
import { Bell } from "lucide-react";
import { SectionCard, Toggle, SaveBar } from "@/components/settings/shared";

interface NotificationRow {
  key: string;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
}

const initialRows: NotificationRow[] = [
  { key: "low-stock", label: "Low Stock", description: "When a product falls below its reorder threshold.", email: true, push: true },
  { key: "invoice-due", label: "Invoice Due", description: "When an invoice is approaching or past its due date.", email: true, push: true },
  { key: "payment-received", label: "Payment Received", description: "When a customer payment is recorded.", email: true, push: false },
  { key: "new-customer", label: "New Customer", description: "When a new customer is added to the CRM.", email: false, push: true },
  { key: "system-alerts", label: "System Alerts", description: "Security, billing, and maintenance notices.", email: true, push: true },
];

export function NotificationsTab() {
  const [rows, setRows] = useState(initialRows);
  const [saved, setSaved] = useState(false);

  function toggle(key: string, channel: "email" | "push") {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [channel]: !r[channel] } : r)));
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Notifications"
        subtitle="Choose which events send you an email or push notification"
        noPadding
        action={
          <div className="mr-2 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
            <Bell className="h-4 w-4 text-amber-600" />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-6 py-3">Event</th>
                <th className="px-4 py-3 text-center">Email</th>
                <th className="px-4 py-3 text-center">Push</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-b border-slate-50 last:border-0">
                  <td className="px-6 py-3.5">
                    <p className="font-medium text-foreground">{r.label}</p>
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex justify-center">
                      <Toggle checked={r.email} onChange={() => toggle(r.key, "email")} label="" />
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex justify-center">
                      <Toggle checked={r.push} onChange={() => toggle(r.key, "push")} label="" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SaveBar saved={saved} onSave={handleSave} />
    </div>
  );
}
