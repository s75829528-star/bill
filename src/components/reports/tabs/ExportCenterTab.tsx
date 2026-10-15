import { useState } from "react";
import { FileText, FileSpreadsheet, Printer, Download, CheckCircle2 } from "lucide-react";
import { exportableReports } from "@/lib/reports-data";
import { SectionCard, PrimaryButton, SecondaryButton } from "../shared";

type Format = "pdf" | "excel" | "csv" | "print";

export function ExportCenterTab() {
  const [lastExport, setLastExport] = useState<{ report: string; format: Format } | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(report: string) {
    setSelected((s) => (s.includes(report) ? s.filter((r) => r !== report) : [...s, report]));
  }

  function exportOne(report: string, format: Format) {
    setLastExport({ report, format });
  }

  function exportSelected(format: Format) {
    if (selected.length === 0) return;
    setLastExport({ report: `${selected.length} selected reports`, format });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Export Center</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Export any report as PDF, Excel, or CSV, or send straight to print. Select multiple reports to batch-export.
        </p>
      </div>

      {lastExport && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>
            <span className="font-semibold">{lastExport.report}</span> exported as{" "}
            <span className="font-semibold uppercase">{lastExport.format}</span>. (Demo mode — no file is generated.)
          </span>
        </div>
      )}

      <SectionCard
        title="Batch Export"
        subtitle={`${selected.length} report${selected.length === 1 ? "" : "s"} selected`}
        action={
          <div className="flex gap-2">
            <SecondaryButton icon={Printer} onClick={() => exportSelected("print")}>Print</SecondaryButton>
            <SecondaryButton icon={Download} onClick={() => exportSelected("csv")}>CSV</SecondaryButton>
            <SecondaryButton icon={FileSpreadsheet} onClick={() => exportSelected("excel")}>Excel</SecondaryButton>
            <PrimaryButton icon={FileText} onClick={() => exportSelected("pdf")}>PDF</PrimaryButton>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {exportableReports.map((report) => {
            const active = selected.includes(report);
            return (
              <button
                key={report}
                onClick={() => toggle(report)}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                  active ? "border-[color:var(--brand-electric)] bg-indigo-50/60 text-foreground" : "border-slate-200 bg-white text-foreground hover:bg-slate-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  {report}
                </span>
                <span className={`h-4 w-4 rounded-full border-2 ${active ? "border-[color:var(--brand-electric)] bg-[color:var(--brand-electric)]" : "border-slate-300"}`} />
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Quick Export" subtitle="Export a single report instantly" noPadding>
        <div className="divide-y divide-slate-100">
          {exportableReports.map((report) => (
            <div key={report} className="flex items-center justify-between px-6 py-3">
              <span className="text-sm font-medium text-foreground">{report}</span>
              <div className="flex gap-1.5">
                <button onClick={() => exportOne(report, "print")} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" title="Print">
                  <Printer className="h-4 w-4" />
                </button>
                <button onClick={() => exportOne(report, "csv")} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" title="Export CSV">
                  <Download className="h-4 w-4" />
                </button>
                <button onClick={() => exportOne(report, "excel")} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" title="Export Excel">
                  <FileSpreadsheet className="h-4 w-4" />
                </button>
                <button onClick={() => exportOne(report, "pdf")} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" title="Export PDF">
                  <FileText className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
