import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  Receipt,
  Boxes,
  Users,
  Wallet,
  Landmark,
  UserSquare2,
  Package,
  Download,
  Settings,
} from "lucide-react";

import { ExecutiveDashboardTab } from "../../../components/reports/tabs/ExecutiveDashboardTab";
import { SalesReportsTab } from "../../../components/reports/tabs/SalesReportsTab";
import { BillingReportsTab } from "../../../components/reports/tabs/BillingReportsTab";
import { InventoryReportsTab } from "../../../components/reports/tabs/InventoryReportsTab";
import { CrmReportsTab } from "../../../components/reports/tabs/CrmReportsTab";
import { FinanceReportsTab } from "../../../components/reports/tabs/FinanceReportsTab";
import { GstReportsTab } from "../../../components/reports/tabs/GstReportsTab";
import { CustomerReportsTab } from "../../../components/reports/tabs/CustomerReportsTab";
import { ProductReportsTab } from "../../../components/reports/tabs/ProductReportsTab";
import { ExportCenterTab } from "../../../components/reports/tabs/ExportCenterTab";
import { ReportSettingsTab } from "../../../components/reports/tabs/ReportSettingsTab";

export const Route = createFileRoute("/_authenticated/_app/reports")({
  component: ReportsPage,
});

// ── Sub-navigation ────────────────────────────────────────────────

type TabId =
  | "executive"
  | "sales"
  | "billing"
  | "inventory"
  | "crm"
  | "finance"
  | "gst"
  | "customer"
  | "product"
  | "export"
  | "settings";

interface ReportsNavItem {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

const navItems: ReportsNavItem[] = [
  { id: "executive", label: "Executive Dashboard", icon: LayoutDashboard },
  { id: "sales", label: "Sales Reports", icon: TrendingUp },
  { id: "billing", label: "Billing Reports", icon: Receipt },
  { id: "inventory", label: "Inventory Reports", icon: Boxes },
  { id: "crm", label: "CRM Reports", icon: Users },
  { id: "finance", label: "Finance Reports", icon: Wallet },
  { id: "gst", label: "GST Reports", icon: Landmark },
  { id: "customer", label: "Customer Reports", icon: UserSquare2 },
  { id: "product", label: "Product Reports", icon: Package },
  { id: "export", label: "Export Center", icon: Download },
  { id: "settings", label: "Report Settings", icon: Settings },
];

function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("executive");

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px] space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            A unified analytics center across sales, billing, inventory, CRM, finance, and tax — built for
            fast, confident decisions.
          </p>
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
        <div>
          {activeTab === "executive" && <ExecutiveDashboardTab />}
          {activeTab === "sales" && <SalesReportsTab />}
          {activeTab === "billing" && <BillingReportsTab />}
          {activeTab === "inventory" && <InventoryReportsTab />}
          {activeTab === "crm" && <CrmReportsTab />}
          {activeTab === "finance" && <FinanceReportsTab />}
          {activeTab === "gst" && <GstReportsTab />}
          {activeTab === "customer" && <CustomerReportsTab />}
          {activeTab === "product" && <ProductReportsTab />}
          {activeTab === "export" && <ExportCenterTab />}
          {activeTab === "settings" && <ReportSettingsTab />}
        </div>
      </div>
    </div>
  );
}
