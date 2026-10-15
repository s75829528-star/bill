import { useState } from "react";
import { Users, Plus, Pencil, UserX, KeyRound, X } from "lucide-react";
import {
  SectionCard,
  SearchInput,
  StatusPill,
  PrimaryButton,
  SecondaryButton,
  fmtDate,
} from "@/components/settings/shared";
import { teamUsers as initialUsers, roleNames, type TeamUser } from "@/lib/settings-data";

function timeAgo(iso: string) {
  if (!iso) return "Never";
  const d = new Date(iso);
  return `${fmtDate(iso.slice(0, 10))} · ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
}

export function UsersTab() {
  const [users, setUsers] = useState<TeamUser[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<null | { mode: "add" | "edit"; user?: TeamUser }>(null);
  const [resetFor, setResetFor] = useState<TeamUser | null>(null);

  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  function toggleDeactivate(id: string) {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: u.status === "deactivated" ? "active" : "deactivated" } : u))
    );
  }

  function saveUser(form: { name: string; email: string; role: TeamUser["role"] }) {
    if (modal?.mode === "edit" && modal.user) {
      setUsers((prev) => prev.map((u) => (u.id === modal.user!.id ? { ...u, ...form } : u)));
    } else {
      setUsers((prev) => [
        ...prev,
        {
          id: `u${prev.length + 1}`,
          ...form,
          status: "invited",
          lastLogin: "",
          avatarColor: "bg-slate-400",
        },
      ]);
    }
    setModal(null);
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Users"
        subtitle={`${users.length} team member${users.length === 1 ? "" : "s"} with access to this business`}
        noPadding
        action={
          <PrimaryButton icon={Plus} onClick={() => setModal({ mode: "add" })}>
            Add User
          </PrimaryButton>
        }
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email…" className="max-w-xs" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-6 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Login</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${u.avatarColor}`}>
                        {u.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <span className="font-medium text-foreground">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.role}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={u.status === "invited" ? "pending" : u.status === "active" ? "active" : "inactive"} label={u.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{timeAgo(u.lastLogin)}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setModal({ mode: "edit", user: u })}
                        title="Edit user"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setResetFor(u)}
                        title="Reset password"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-foreground"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleDeactivate(u.id)}
                        title={u.status === "deactivated" ? "Reactivate user" : "Deactivate user"}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <UserX className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">
                    No users match “{search}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {modal && <UserModal modal={modal} onClose={() => setModal(null)} onSave={saveUser} />}
      {resetFor && <ResetPasswordModal user={resetFor} onClose={() => setResetFor(null)} />}
    </div>
  );
}

function UserModal({
  modal,
  onClose,
  onSave,
}: {
  modal: { mode: "add" | "edit"; user?: TeamUser };
  onClose: () => void;
  onSave: (form: { name: string; email: string; role: TeamUser["role"] }) => void;
}) {
  const [name, setName] = useState(modal.user?.name ?? "");
  const [email, setEmail] = useState(modal.user?.email ?? "");
  const [role, setRole] = useState<TeamUser["role"]>(modal.user?.role ?? "Viewer");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-foreground">{modal.mode === "add" ? "Add User" : "Edit User"}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 p-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
              placeholder="e.g. Ananya Gupta"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
              placeholder="name@company.com"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as TeamUser["role"])}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
            >
              {roleNames.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton onClick={() => name && email && onSave({ name, email, role })}>
            {modal.mode === "add" ? "Send Invite" : "Save Changes"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

function ResetPasswordModal({ user, onClose }: { user: TeamUser; onClose: () => void }) {
  const [sent, setSent] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
          <KeyRound className="h-5 w-5 text-blue-600" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Reset Password</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {sent
            ? `A password reset link has been sent to ${user.email}.`
            : `Send a password reset link to ${user.name} (${user.email})?`}
        </p>
        <div className="mt-5 flex justify-center gap-2">
          {!sent ? (
            <>
              <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
              <PrimaryButton onClick={() => setSent(true)}>Send Link</PrimaryButton>
            </>
          ) : (
            <PrimaryButton onClick={onClose}>Done</PrimaryButton>
          )}
        </div>
      </div>
    </div>
  );
}
