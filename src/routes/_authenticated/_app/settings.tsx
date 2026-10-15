import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Building2,
  Palette,
  Users,
  ShieldCheck,
  Calculator,
  FileText,
  Package,
  Users2,
  TrendingUp,
  Bell,
  Shield,
  DatabaseBackup,
  Settings2,
  Info,
} from "lucide-react";

import { BusinessProfileTab } from "../../../components/settings/tabs/BusinessProfileTab";
import { BrandingTab } from "../../../components/settings/tabs/BrandingTab";
import { UsersTab } from "../../../components/settings/tabs/UsersTab";
import { RolesPermissionsTab } from "../../../components/settings/tabs/RolesPermissionsTab";
import { TaxGSTTab } from "../../../components/settings/tabs/TaxGSTTab";
import { InvoiceSettingsTab } from "../../../components/settings/tabs/InvoiceSettingsTab";
import { ProductSettingsTab } from "../../../components/settings/tabs/ProductSettingsTab";
import { CustomerSettingsTab } from "../../../components/settings/tabs/CustomerSettingsTab";
import { FinancialSettingsTab } from "../../../components/settings/tabs/FinancialSettingsTab";
import { NotificationsTab } from "../../../components/settings/tabs/NotificationsTab";
import { SecurityTab } from "../../../components/settings/tabs/SecurityTab";
import { BackupRestoreTab } from "../../../components/settings/tabs/BackupRestoreTab";
import { PreferencesTab } from "../../../components/settings/tabs/PreferencesTab";
import { AboutTab } from "../../../components/settings/tabs/AboutTab";

export const Route = createFileRoute("/_authenticated/_app/settings")({
  component: SettingsPage,
});

// ── Navigation ────────────────────────────────────────────────────

type TabId =
  | "business-profile"
  | "branding"
  | "users"
  | "roles-permissions"
  | "tax-gst"
  | "invoice-settings"
  | "product-settings"
  | "customer-settings"
  | "financial-settings"
  | "notifications"
  | "security"
  | "backup-restore"
  | "preferences"
  | "about";

interface SettingsNavItem {
  id: TabId;
  label: string;
  icon: React.ElementType;
  group: "Business" | "Team" | "Configuration" | "System";
}

const navItems: SettingsNavItem[] = [
  { id: "business-profile", label: "Business Profile", icon: Building2, group: "Business" },
  { id: "branding", label: "Company Branding", icon: Palette, group: "Business" },
  { id: "users", label: "Users", icon: Users, group: "Team" },
  { id: "roles-permissions", label: "Roles & Permissions", icon: ShieldCheck, group: "Team" },
  { id: "tax-gst", label: "Tax & GST", icon: Calculator, group: "Configuration" },
  { id: "invoice-settings", label: "Invoice Settings", icon: FileText, group: "Configuration" },
  { id: "product-settings", label: "Product Settings", icon: Package, group: "Configuration" },
  { id: "customer-settings", label: "Customer Settings", icon: Users2, group: "Configuration" },
  { id: "financial-settings", label: "Financial Settings", icon: TrendingUp, group: "Configuration" },
  { id: "notifications", label: "Notifications", icon: Bell, group: "System" },
  { id: "security", label: "Security", icon: Shield, group: "System" },
  { id: "backup-restore", label: "Backup & Restore", icon: DatabaseBackup, group: "System" },
  { id: "preferences", label: "Preferences", icon: Settings2, group: "System" },
  { id: "about", label: "About", icon: Info, group: "System" },
];

const groups: SettingsNavItem["group"][] = ["Business", "Team", "Configuration", "System"];

function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("business-profile");
  const activeItem = navItems.find((n) => n.id === activeTab)!;

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px] space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings & Administration</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Configure your business, team access, and system preferences.
          </p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Left nav */}
          <aside className="shrink-0 lg:w-64">
            <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm lg:sticky lg:top-6">
              <div className="flex gap-1 overflow-x-auto pb-1 lg:block lg:overflow-visible lg:space-y-4 lg:pb-0">
                {groups.map((group) => (
                  <div key={group} className="shrink-0 lg:shrink lg:space-y-1">
                    <p className="hidden px-3 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 lg:block">
                      {group}
                    </p>
                    <div className="flex gap-1 lg:block lg:space-y-0.5">
                      {navItems
                        .filter((n) => n.group === group)
                        .map((item) => {
                          const Icon = item.icon;
                          const active = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => setActiveTab(item.id)}
                              className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 lg:w-full ${
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
                ))}
              </div>
            </div>
          </aside>

          {/* Active tab content */}
          <div className="min-w-0 flex-1">
            <div className="mb-4 flex items-center gap-2 lg:hidden">
              <activeItem.icon className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">{activeItem.label}</p>
            </div>
            {activeTab === "business-profile" && <BusinessProfileTab />}
            {activeTab === "branding" && <BrandingTab />}
            {activeTab === "users" && <UsersTab />}
            {activeTab === "roles-permissions" && <RolesPermissionsTab />}
            {activeTab === "tax-gst" && <TaxGSTTab />}
            {activeTab === "invoice-settings" && <InvoiceSettingsTab />}
            {activeTab === "product-settings" && <ProductSettingsTab />}
            {activeTab === "customer-settings" && <CustomerSettingsTab />}
            {activeTab === "financial-settings" && <FinancialSettingsTab />}
            {activeTab === "notifications" && <NotificationsTab />}
            {activeTab === "security" && <SecurityTab />}
            {activeTab === "backup-restore" && <BackupRestoreTab />}
            {activeTab === "preferences" && <PreferencesTab />}
            {activeTab === "about" && <AboutTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
