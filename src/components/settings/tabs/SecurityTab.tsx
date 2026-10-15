import { useState } from "react";
import { Shield, Smartphone, MonitorSmartphone } from "lucide-react";
import { SectionCard, Select, Toggle, SecondaryButton, SaveBar } from "@/components/settings/shared";
import { loginActivity } from "@/lib/settings-data";

export function SecurityTab() {
  const [minLength, setMinLength] = useState("8");
  const [requireSpecialChar, setRequireSpecialChar] = useState(true);
  const [requireNumber, setRequireNumber] = useState(true);
  const [expireDays, setExpireDays] = useState("90");
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Password Policy"
        subtitle="Requirements enforced when team members set or change their password"
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
            <Shield className="h-4 w-4 text-emerald-600" />
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Minimum Length</label>
            <Select
              value={minLength}
              onChange={setMinLength}
              options={[
                { value: "6", label: "6 characters" },
                { value: "8", label: "8 characters" },
                { value: "10", label: "10 characters" },
                { value: "12", label: "12 characters" },
              ]}
              className="w-full"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Password Expiry</label>
            <Select
              value={expireDays}
              onChange={setExpireDays}
              options={[
                { value: "never", label: "Never" },
                { value: "60", label: "Every 60 days" },
                { value: "90", label: "Every 90 days" },
                { value: "180", label: "Every 180 days" },
              ]}
              className="w-full"
            />
          </div>
          <div className="sm:col-span-2 space-y-4">
            <Toggle
              checked={requireSpecialChar}
              onChange={setRequireSpecialChar}
              label="Require a special character"
              description="Passwords must include at least one symbol (e.g. !, @, #)."
            />
            <div className="border-t border-slate-100" />
            <Toggle
              checked={requireNumber}
              onChange={setRequireNumber}
              label="Require a number"
              description="Passwords must include at least one digit."
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Two-Factor Authentication"
        subtitle="Add an extra verification step when signing in"
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
            <Smartphone className="h-4 w-4 text-blue-600" />
          </div>
        }
      >
        <Toggle
          checked={twoFactor}
          onChange={setTwoFactor}
          label="Require 2FA for all Admin and Owner accounts"
          description="Team members will be prompted to set up an authenticator app on next login. (Placeholder — no verification is performed yet.)"
        />
      </SectionCard>

      <SectionCard title="Session Timeout" subtitle="Automatically sign out inactive sessions">
        <div className="max-w-xs space-y-1.5">
          <label className="text-sm font-medium text-foreground">Timeout after inactivity</label>
          <Select
            value={sessionTimeout}
            onChange={setSessionTimeout}
            options={[
              { value: "15", label: "15 minutes" },
              { value: "30", label: "30 minutes" },
              { value: "60", label: "1 hour" },
              { value: "480", label: "8 hours" },
            ]}
            className="w-full"
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Login Activity"
        subtitle="Recent sign-ins across your team"
        noPadding
        action={
          <div className="mr-2 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
            <MonitorSmartphone className="h-4 w-4 text-violet-600" />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-6 py-3">User</th>
                <th className="px-4 py-3">Device</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-6 py-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody>
              {loginActivity.map((l) => (
                <tr key={l.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-6 py-3 font-medium text-foreground">
                    {l.user} {l.current && <span className="ml-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">This device</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{l.device}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.location}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{l.ip}</td>
                  <td className="px-6 py-3 text-right text-muted-foreground">
                    {new Date(l.time).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end border-t border-slate-100 px-6 py-3">
          <SecondaryButton>Sign out all other sessions</SecondaryButton>
        </div>
      </SectionCard>

      <SaveBar saved={saved} onSave={handleSave} />
    </div>
  );
}
