import { Info, FileText, Lock, LifeBuoy } from "lucide-react";
import { SectionCard } from "@/components/settings/shared";

const links = [
  { icon: FileText, label: "Terms of Service", href: "#" },
  { icon: Lock, label: "Privacy Policy", href: "#" },
  { icon: LifeBuoy, label: "Contact Support", href: "#" },
];

export function AboutTab() {
  return (
    <div className="space-y-6">
      <SectionCard
        title="About Nexora"
        subtitle="Version, license, and legal information"
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
          </div>
        }
      >
        <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[image:var(--gradient-brand)] text-xl font-bold text-white shadow">
            N
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Nexora Billing</p>
            <p className="text-xs text-muted-foreground">The AI Business Operating System</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Version</p>
            <p className="mt-1 text-sm font-semibold text-foreground">v1.4.2 (MVP)</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">License</p>
            <p className="mt-1 text-sm font-semibold text-foreground">Commercial — Standard Plan</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Build</p>
            <p className="mt-1 text-sm font-semibold text-foreground">2026.07.14</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Legal & Support">
        <div className="space-y-1">
          {links.map((l) => {
            const Icon = l.icon;
            return (
              <a
                key={l.label}
                href={l.href}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-foreground hover:bg-slate-50"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                {l.label}
              </a>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
