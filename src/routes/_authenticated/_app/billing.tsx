import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useState, useEffect } from "react";
import {
  LayoutGrid,
  FileText,
  FileSpreadsheet,
  Undo2,
  Repeat,
  Wallet,
  Palette,
  Settings,
  BarChart2,
  FolderOpen,
  Keyboard,
} from "lucide-react";

import { ModuleTabFallback } from "../../../components/ModuleTabFallback";

const OverviewTab = lazy(() =>
  import("../../../components/billing/tabs/OverviewTab").then((module) => ({
    default: module.OverviewTab,
  })),
);
const InvoicesTab = lazy(() =>
  import("../../../components/billing/tabs/InvoicesTab").then((module) => ({
    default: module.InvoicesTab,
  })),
);
const QuotationsTab = lazy(() =>
  import("../../../components/billing/tabs/QuotationsTab").then((module) => ({
    default: module.QuotationsTab,
  })),
);
const CreditNotesTab = lazy(() =>
  import("../../../components/billing/tabs/CreditNotesTab").then((module) => ({
    default: module.CreditNotesTab,
  })),
);
const RecurringTab = lazy(() =>
  import("../../../components/billing/tabs/RecurringTab").then((module) => ({
    default: module.RecurringTab,
  })),
);
const PaymentsTab = lazy(() =>
  import("../../../components/billing/tabs/PaymentsTab").then((module) => ({
    default: module.PaymentsTab,
  })),
);
const TemplatesTab = lazy(() =>
  import("../../../components/billing/tabs/TemplatesTab").then((module) => ({
    default: module.TemplatesTab,
  })),
);
const SettingsTab = lazy(() =>
  import("../../../components/billing/tabs/SettingsTab").then((module) => ({
    default: module.SettingsTab,
  })),
);
const ReportsTab = lazy(() =>
  import("../../../components/billing/tabs/ReportsTab").then((module) => ({
    default: module.ReportsTab,
  })),
);
const DocumentsTab = lazy(() =>
  import("../../../components/billing/tabs/DocumentsTab").then((module) => ({
    default: module.DocumentsTab,
  })),
);

export const Route = createFileRoute("/_authenticated/_app/billing")({
  component: BillingPage,
});

// ── Sub-navigation ────────────────────────────────────────────────

type TabId =
  | "overview"
  | "invoices"
  | "quotations"
  | "credit-notes"
  | "recurring"
  | "payments"
  | "reports"
  | "documents"
  | "templates"
  | "settings";

interface BillingNavItem {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

const navItems: BillingNavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "invoices", label: "Invoices", icon: FileText },
  { id: "quotations", label: "Quotations", icon: FileSpreadsheet },
  { id: "credit-notes", label: "Credit Notes", icon: Undo2 },
  { id: "recurring", label: "Recurring", icon: Repeat },
  { id: "payments", label: "Payments", icon: Wallet },
  { id: "reports", label: "Reports", icon: BarChart2 },
  { id: "documents", label: "Documents", icon: FolderOpen },
  { id: "templates", label: "Templates", icon: Palette },
  { id: "settings", label: "Settings", icon: Settings },
];

function BillingPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [ctrlHeld, setCtrlHeld] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Control" || e.key === "Meta") {
        setCtrlHeld(true);
      }
      // Ctrl+N → new invoice
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        setActiveTab("invoices");
      }
      // Ctrl+S → save draft (navigate to invoices)
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        setActiveTab("invoices");
      }
      // Ctrl+P → print (navigate to templates)
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        setActiveTab("templates");
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Control" || e.key === "Meta") {
        setCtrlHeld(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px] space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">GST Billing</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Invoices, quotations, credit notes, and payments — GST-ready and built for Indian
              businesses.
            </p>
          </div>
          {/* Keyboard shortcuts indicator */}
          <div
            className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 transition-all duration-200 ${
              ctrlHeld ? "opacity-100 scale-100 shadow-sm border-blue-200 bg-blue-50 text-blue-600" : "opacity-40"
            }`}
          >
            <Keyboard className="h-3.5 w-3.5" />
            <span>Ctrl+N New Invoice · Ctrl+S Draft · Ctrl+P Print</span>
          </div>
        </div>

        {/* Sub-navigation */}
        <div className="rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
          <div className="flex gap-1 overflow-x-auto scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-150 ${
                    active
                      ? "bg-[image:var(--gradient-brand)] text-white shadow-[0_4px_16px_-4px_oklch(0.62_0.22_258/0.45)]"
                      : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : ""}`} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active tab content */}
        <Suspense fallback={<ModuleTabFallback />}>
          <div>
            {activeTab === "overview" && (
              <OverviewTab onNavigate={(id) => setActiveTab(id as TabId)} />
            )}
            {activeTab === "invoices" && <InvoicesTab />}
            {activeTab === "quotations" && <QuotationsTab />}
            {activeTab === "credit-notes" && <CreditNotesTab />}
            {activeTab === "recurring" && <RecurringTab />}
            {activeTab === "payments" && <PaymentsTab />}
            {activeTab === "reports" && <ReportsTab />}
            {activeTab === "documents" && (
              <DocumentsTab onNavigate={(id) => setActiveTab(id as TabId)} />
            )}
            {activeTab === "templates" && <TemplatesTab />}
            {activeTab === "settings" && <SettingsTab />}
          </div>
        </Suspense>
      </div>
    </div>
  );
}
