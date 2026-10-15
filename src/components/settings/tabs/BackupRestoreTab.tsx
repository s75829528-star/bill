import { useState } from "react";
import { DatabaseBackup, Upload, Download, Check } from "lucide-react";
import { SectionCard, PrimaryButton, SecondaryButton, StatusPill, fmtDate } from "@/components/settings/shared";
import { recentBackups } from "@/lib/settings-data";

export function BackupRestoreTab() {
  const [running, setRunning] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  function runBackup() {
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 3000);
    }, 1600);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        This section is UI only — no data is actually backed up, exported, or restored yet.
      </div>

      <SectionCard
        title="Manual Backup"
        subtitle="Create an on-demand snapshot of your business data"
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
            <DatabaseBackup className="h-4 w-4 text-blue-600" />
          </div>
        }
      >
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-foreground">Run a manual backup now</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Scheduled backups also run automatically every night at 2:00 AM.
            </p>
          </div>
          {justCompleted ? (
            <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              <Check className="h-4 w-4" /> Backup completed
            </span>
          ) : (
            <PrimaryButton icon={DatabaseBackup} onClick={runBackup} className={running ? "opacity-70" : ""}>
              {running ? "Running backup…" : "Run Manual Backup"}
            </PrimaryButton>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Restore"
        subtitle="Restore your business data from a previous backup"
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
            <Upload className="h-4 w-4 text-violet-600" />
          </div>
        }
      >
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-sm text-muted-foreground max-w-md">
            Upload a backup file to restore your data to a previous state. This is a placeholder —
            restore functionality is not yet active.
          </p>
          <SecondaryButton icon={Upload}>Upload Backup File</SecondaryButton>
        </div>
      </SectionCard>

      <SectionCard title="Recent Backups" subtitle="Last 5 backup snapshots" noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-6 py-3">Created</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentBackups.map((b) => (
                <tr key={b.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-6 py-3 font-medium text-foreground">
                    {fmtDate(b.createdAt.slice(0, 10))}{" "}
                    <span className="text-muted-foreground">
                      {new Date(b.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{b.type}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.size}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={b.status === "completed" ? "active" : "cancelled"} label={b.status} />
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      disabled={b.status === "failed"}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                      <Download className="h-3.5 w-3.5" /> Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
