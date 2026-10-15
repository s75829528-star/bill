import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  Building2,
  LogOut,
  User,
  Settings,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useBusiness } from "../contexts/BusinessContext";

interface AppTopBarProps {
  onMobileMenuOpen: () => void;
}

export function AppTopBar({ onMobileMenuOpen }: AppTopBarProps) {
  const { user, signOut } = useAuth();
  const { business } = useBusiness();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "U";

  const displayName = business?.owner_name || user?.email?.split("@")[0] || "User";
  const businessName = business?.business_name || "Your Business";

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center border-b border-slate-200 bg-white/95 px-4 backdrop-blur-sm sm:px-6">
      {/* Mobile menu button */}
      <button
        onClick={onMobileMenuOpen}
        className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-slate-100 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Business name (desktop) */}
      <div className="hidden items-center gap-2.5 lg:flex">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[image:var(--gradient-brand)]">
          <Building2 className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-none">{businessName}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground leading-none">
            {business?.business_type || "Business"} · {business?.currency || "INR"}
          </p>
        </div>
      </div>

      {/* Business Switcher (future) */}
      <button className="ml-2 hidden items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-slate-100 lg:flex">
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Global Search */}
      <div className={`relative mx-4 hidden transition-all duration-200 md:block ${searchFocused ? "w-72" : "w-56"}`}>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search anything…"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:border-[color:var(--brand-electric)]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-electric)]/20 transition-all"
        />
        {searchFocused && (
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(v => !v); setProfileOpen(false); }}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-muted-foreground hover:bg-slate-50 hover:text-foreground transition-colors"
          >
            <Bell className="h-4.5 w-4.5 h-[18px] w-[18px]" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-full z-40 mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                  <button onClick={() => setNotifOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="divide-y divide-slate-100">
                  {[
                    { icon: "💳", title: "Payment received", sub: "₹12,500 from Gupta & Sons", time: "2m ago", dot: "bg-green-500" },
                    { icon: "📦", title: "Low stock alert", sub: "Tata Salt 1kg — 4 units left", time: "18m ago", dot: "bg-red-500" },
                    { icon: "🧾", title: "Invoice overdue", sub: "INV-2025-0034 — ₹8,900", time: "1h ago", dot: "bg-amber-500" },
                    { icon: "👤", title: "New customer", sub: "Priya Traders signed up", time: "3h ago", dot: "bg-blue-500" },
                  ].map((n, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer">
                      <div className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-base">{n.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{n.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{n.sub}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{n.time}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-100 px-4 py-3">
                  <button className="text-xs font-medium text-[color:var(--brand-electric)] hover:underline">View all notifications</button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setProfileOpen(v => !v); setNotifOpen(false); }}
            className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 hover:bg-slate-50 transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[image:var(--gradient-brand)] text-xs font-bold text-white">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-foreground leading-none">{displayName}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground leading-none truncate max-w-[100px]">{user?.email}</p>
            </div>
            <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 top-full z-40 mt-2 w-56 rounded-2xl border border-slate-200 bg-white shadow-xl">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <div className="p-2">
                  <Link
                    to="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-foreground hover:bg-slate-100 transition-colors"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    My Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-foreground hover:bg-slate-100 transition-colors"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Settings
                  </Link>
                </div>
                <div className="border-t border-slate-100 p-2">
                  <button
                    onClick={() => { signOut(); setProfileOpen(false); }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
