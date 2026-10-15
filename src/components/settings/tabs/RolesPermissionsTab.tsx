import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { SectionCard, SaveBar, PermissionPill } from "@/components/settings/shared";
import {
  roleNames,
  permissionModules,
  defaultPermissionMatrix,
  type UserRole,
  type PermissionModule,
  type PermissionLevel,
} from "@/lib/settings-data";

const levels: PermissionLevel[] = ["none", "view", "edit", "full"];

export function RolesPermissionsTab() {
  const [matrix, setMatrix] = useState(defaultPermissionMatrix);
  const [saved, setSaved] = useState(false);

  function cycle(role: UserRole, mod: PermissionModule) {
    setMatrix((prev) => {
      const current = prev[role][mod];
      const idx = levels.indexOf(current);
      const next = levels[(idx + 1) % levels.length];
      return { ...prev, [role]: { ...prev[role], [mod]: next } };
    });
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Roles"
        subtitle="Predefined roles available to assign to team members"
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
        }
      >
        <div className="flex flex-wrap gap-2">
          {roleNames.map((r) => (
            <span
              key={r}
              className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-sm font-medium text-foreground"
            >
              {r}
            </span>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Permission Matrix"
        subtitle="Click a cell to cycle its access level: None → View → Edit → Full"
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-6 py-3">Role</th>
                {permissionModules.map((m) => (
                  <th key={m} className="px-4 py-3 text-center">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roleNames.map((role) => (
                <tr key={role} className="border-b border-slate-50 last:border-0">
                  <td className="px-6 py-3 font-medium text-foreground">{role}</td>
                  {permissionModules.map((mod) => (
                    <td key={mod} className="px-4 py-3 text-center">
                      <button onClick={() => cycle(role, mod)} className="transition-transform hover:scale-105">
                        <PermissionPill level={matrix[role][mod]} />
                      </button>
                    </td>
                  ))}
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
