import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import {
  LayoutGrid,
  Users,
  UserCircle,
  Layers,
  Target,
  Clock,
  Activity,
  BarChart2,
  Settings,
} from "lucide-react";

import { ModuleTabFallback } from "../../../components/ModuleTabFallback";

const OverviewTab = lazy(() =>
  import("../../../components/crm/tabs/OverviewTab").then((module) => ({
    default: module.OverviewTab,
  })),
);
const CustomersTab = lazy(() =>
  import("../../../components/crm/tabs/CustomersTab").then((module) => ({
    default: module.CustomersTab,
  })),
);
const CustomerProfile = lazy(() =>
  import("../../../components/crm/tabs/CustomerProfile").then((module) => ({
    default: module.CustomerProfile,
  })),
);
const CustomerGroupsTab = lazy(() =>
  import("../../../components/crm/tabs/CustomerGroupsTab").then((module) => ({
    default: module.CustomerGroupsTab,
  })),
);
const LeadsTab = lazy(() =>
  import("../../../components/crm/tabs/LeadsTab").then((module) => ({
    default: module.LeadsTab,
  })),
);
const FollowUpsTab = lazy(() =>
  import("../../../components/crm/tabs/FollowUpsTab").then((module) => ({
    default: module.FollowUpsTab,
  })),
);
const ActivitiesTab = lazy(() =>
  import("../../../components/crm/tabs/ActivitiesTab").then((module) => ({
    default: module.ActivitiesTab,
  })),
);
const CustomerReportsTab = lazy(() =>
  import("../../../components/crm/tabs/CustomerReportsTab").then((module) => ({
    default: module.CustomerReportsTab,
  })),
);
const CrmSettingsTab = lazy(() =>
  import("../../../components/crm/tabs/CrmSettingsTab").then((module) => ({
    default: module.CrmSettingsTab,
  })),
);

export const Route = createFileRoute("/_authenticated/_app/crm")({
  component: CrmPage,
});

// ── Tab definitions ───────────────────────────────────────────────

type TabId =
  | "overview"
  | "customers"
  | "customer-profile"
  | "groups"
  | "leads"
  | "follow-ups"
  | "activities"
  | "reports"
  | "settings";

interface CrmNavItem {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

// customer-profile is not shown in the nav — it's triggered programmatically
const navItems: CrmNavItem[] = [
  { id: "overview",    label: "Overview",    icon: LayoutGrid },
  { id: "customers",   label: "Customers",   icon: Users },
  { id: "groups",      label: "Groups",      icon: Layers },
  { id: "leads",       label: "Leads",       icon: Target },
  { id: "follow-ups",  label: "Follow-ups",  icon: Clock },
  { id: "activities",  label: "Activities",  icon: Activity },
  { id: "reports",     label: "Reports",     icon: BarChart2 },
  { id: "settings",    label: "Settings",    icon: Settings },
];

// ── CrmPage ───────────────────────────────────────────────────────

function CrmPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  function handleViewCustomer(id: string) {
    setSelectedCustomerId(id);
    setActiveTab("customer-profile");
  }

  function handleBackFromProfile() {
    setActiveTab("customers");
    setSelectedCustomerId(null);
  }

  function handleNavigate(id: string) {
    setActiveTab(id as TabId);
  }

  // The active nav highlight — profile lives under "customers"
  const activeNavId: TabId =
    activeTab === "customer-profile" ? "customers" : activeTab;

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px] space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">CRM</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Customer accounts, invoices, notes, and customer-linked activity for your business.
            </p>
          </div>
          {activeTab === "customer-profile" && selectedCustomerId && (
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">
              <UserCircle className="h-3.5 w-3.5" />
              Viewing customer profile
            </span>
          )}
        </div>

        {/* Sub-navigation */}
        <div className="rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
          <div className="flex gap-1 overflow-x-auto scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeNavId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.id !== "customers") setSelectedCustomerId(null);
                  }}
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
            {activeTab === "overview" && <OverviewTab onNavigate={handleNavigate} />}
            {activeTab === "customers" && <CustomersTab onViewCustomer={handleViewCustomer} />}
            {activeTab === "customer-profile" && selectedCustomerId && (
              <CustomerProfile
                customerId={selectedCustomerId}
                onBack={handleBackFromProfile}
              />
            )}
            {activeTab === "groups" && <CustomerGroupsTab />}
            {activeTab === "leads" && <LeadsTab />}
            {activeTab === "follow-ups" && <FollowUpsTab />}
            {activeTab === "activities" && <ActivitiesTab />}
            {activeTab === "reports" && <CustomerReportsTab />}
            {activeTab === "settings" && <CrmSettingsTab />}
          </div>
        </Suspense>
      </div>
    </div>
  );
}
