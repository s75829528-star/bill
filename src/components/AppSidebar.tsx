import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Receipt,
  Package,
  Users,
  TrendingUp,
  BarChart3,
  Sparkles,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useBusiness } from "../contexts/BusinessContext";
import { Logo } from "./Logo";

// ── Types ─────────────────────────────────────────────────────────

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

// ── Data ──────────────────────────────────────────────────────────

const mainNav: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/billing", label: "Billing", icon: Receipt },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/crm", label: "CRM", icon: Users },
  { to: "/finance", label: "Finance", icon: TrendingUp },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/ai-assistant", label: "AI Assistant", icon: Sparkles, badge: "AI" },
];

const bottomNav: NavItem[] = [
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/help", label: "Help", icon: HelpCircle },
];

// ── NavLink ───────────────────────────────────────────────────────

function NavLink({
  item,
  collapsed,
  onClick,
}: {
  item: NavItem;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const { location } = useRouterState();
  const active = location.pathname === item.to || location.pathname.startsWith(item.to + "/");
  const isAssistantActive = active && item.to === "/ai-assistant";
  const Icon = item.icon;

  return (
    <Link
      to={item.to}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150
        ${
          isAssistantActive
            ? "bg-[#F0ECFF] text-[#6D5EF7] shadow-none"
            : active
              ? "bg-[image:var(--gradient-brand)] text-white shadow-[0_4px_16px_-4px_oklch(0.62_0.22_258/0.45)]"
              : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
        }
        ${collapsed ? "justify-center px-2.5" : ""}
      `}
    >
      <Icon
        className={`h-5 w-5 shrink-0 ${
          isAssistantActive ? "text-[#6D5EF7]" : active ? "text-white" : ""
        }`}
      />

      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}

      {!collapsed && item.badge && (
        <span
          className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none tracking-wide
          ${active && !isAssistantActive ? "bg-white/20 text-white" : "bg-[color:var(--brand-electric)]/10 text-[color:var(--brand-electric)]"}`}
        >
          {item.badge}
        </span>
      )}

      {/* Tooltip for collapsed mode */}
      {collapsed && (
        <span className="pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
          {item.label}
          {item.badge && (
            <span className="ml-1.5 rounded bg-[color:var(--brand-electric)] px-1 py-0.5 text-[9px]">
              {item.badge}
            </span>
          )}
        </span>
      )}
    </Link>
  );
}

// ── Sidebar Content ───────────────────────────────────────────────

function SidebarContent({
  collapsed,
  onToggleCollapse,
  onClose,
  isMobile = false,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onClose?: () => void;
  isMobile?: boolean;
}) {
  const { signOut } = useAuth();
  const { business } = useBusiness();

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div
        className={`flex h-16 shrink-0 items-center border-b border-slate-100 px-4 ${collapsed && !isMobile ? "justify-center" : "justify-between"}`}
      >
        {(!collapsed || isMobile) && <Logo />}
        {collapsed && !isMobile && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[image:var(--gradient-brand)]">
            <span className="text-sm font-bold text-white">N</span>
          </div>
        )}
        {isMobile ? (
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={onToggleCollapse}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-muted-foreground shadow-sm hover:bg-slate-50 hover:text-foreground transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>

      {/* Business badge */}
      {(!collapsed || isMobile) && business?.business_name && (
        <div className="mx-3 mt-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
          <p className="truncate text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Business
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
            {business.business_name}
          </p>
          {business.business_type && (
            <p className="truncate text-[11px] text-muted-foreground">{business.business_type}</p>
          )}
        </div>
      )}

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {mainNav.map((item) => (
            <NavLink
              key={item.to}
              item={item}
              collapsed={collapsed && !isMobile}
              onClick={onClose}
            />
          ))}
        </div>
      </nav>

      {/* Bottom nav */}
      <div className="shrink-0 border-t border-slate-100 px-3 py-3 space-y-1">
        {bottomNav.map((item) => (
          <NavLink key={item.to} item={item} collapsed={collapsed && !isMobile} onClick={onClose} />
        ))}

        {/* Logout */}
        <button
          onClick={() => signOut()}
          title={collapsed && !isMobile ? "Logout" : undefined}
          className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-red-50 hover:text-red-600
            ${collapsed && !isMobile ? "justify-center px-2.5" : ""}
          `}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {(!collapsed || isMobile) && <span>Logout</span>}
          {collapsed && !isMobile && (
            <span className="pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              Logout
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

// ── AppSidebar ────────────────────────────────────────────────────

export function AppSidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
}: AppSidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex h-screen shrink-0 flex-col border-r border-slate-200 transition-all duration-300 ease-in-out ${collapsed ? "w-[72px]" : "w-60"}`}
      >
        <SidebarContent collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
              onClick={onMobileClose}
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-200 shadow-2xl lg:hidden"
            >
              <SidebarContent
                collapsed={false}
                onToggleCollapse={onToggleCollapse}
                onClose={onMobileClose}
                isMobile
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
