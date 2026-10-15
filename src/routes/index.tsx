import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Menu,
  X,
  Sparkles,
  Receipt,
  Boxes,
  Users,
  BarChart3,
  ShieldCheck,
  Clock3,
  Rocket,
  MousePointerClick,
  MessageCircle,
  Smartphone,
  Building2,
  Mail,
  Phone,
  MapPin,
  Wallet,
  TrendingUp,
  ShoppingCart,
  Plus,
  Minus,
  Star,
  Lock,
  Globe,
  Play,
  Brain,
  Database,
  Layers,
  FileText,
  Bell,
  Cloud,
  Key,
  CheckCircle2,
  ArrowUpRight,
  Zap,
  UserCog,
  Puzzle,
  Bot,
  Printer,
  QrCode,
  Scan,
  Warehouse,
  Shield,
  Server,
  LayoutDashboard,
  Package,
  LineChart,
  CreditCard,
  GitBranch,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

/* ─────────────────────────────────────────────────────────────────
   PRIMITIVES
───────────────────────────────────────────────────────────────── */

function Logo({ className = "" }: { className?: string }) {
  return (
    <a href="/" className={"group flex items-center gap-2.5 transition-all duration-200 " + className}>
      <span className="relative grid h-8 w-8 place-items-center rounded-xl bg-[image:var(--gradient-brand)] shadow-[0_4px_16px_oklch(0.58_0.24_260/0.35)] ring-1 ring-white/25 transition-transform duration-200 group-hover:scale-105">
        <span className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/25 to-transparent" />
        <span className="relative font-mono text-[15px] font-black tracking-tight text-white drop-shadow-sm">N</span>
      </span>
      <div className="flex items-center gap-1.5">
        <span className="text-[17px] font-extrabold tracking-tight text-foreground">
          Nexora
        </span>
        <span className="hidden sm:inline-flex items-center rounded-md border border-[color:var(--brand-electric)]/20 bg-[color:var(--brand-electric)]/8 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[color:var(--brand-electric)]">
          AI OS
        </span>
      </div>
    </a>
  );
}

function Btn({
  children,
  href = "#",
  variant = "primary",
  size = "md",
  className = "",
}: {
  children: React.ReactNode;
  href?: string;
  variant?: "primary" | "ghost" | "outline" | "white" | "secondary";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "px-3.5 py-2 text-xs font-semibold",
    md: "px-5 py-2.5 text-sm font-semibold",
    lg: "px-6 py-3 text-sm sm:text-base font-semibold",
  };
  const base = `relative inline-flex items-center justify-center gap-2 rounded-full transition-all duration-200 active:translate-y-0.5 select-none ${sizes[size]}`;

  if (variant === "primary")
    return (
      <a
        href={href}
        className={`${base} bg-[image:var(--gradient-brand)] text-white shadow-[0_8px_24px_-6px_oklch(0.58_0.24_260/0.5)] ring-1 ring-white/20 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-8px_oklch(0.58_0.24_260/0.65)] hover:brightness-105 ${className}`}
      >
        {children}
      </a>
    );
  if (variant === "white")
    return (
      <a
        href={href}
        className={`${base} bg-white text-[color:var(--brand-deep)] shadow-[0_4px_20px_rgba(0,0,0,0.1)] ring-1 ring-black/5 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(0,0,0,0.16)] hover:bg-slate-50 ${className}`}
      >
        {children}
      </a>
    );
  if (variant === "outline")
    return (
      <a
        href={href}
        className={`${base} border border-border/80 bg-background/80 text-foreground shadow-sm backdrop-blur hover:-translate-y-0.5 hover:border-[color:var(--brand-electric)]/50 hover:bg-secondary/70 hover:shadow-md ${className}`}
      >
        {children}
      </a>
    );
  if (variant === "secondary")
    return (
      <a
        href={href}
        className={`${base} bg-secondary/80 text-foreground border border-border/60 hover:bg-secondary hover:text-foreground ${className}`}
      >
        {children}
      </a>
    );
  return (
    <a
      href={href}
      className={`${base} text-muted-foreground hover:text-foreground hover:bg-secondary/60 ${className}`}
    >
      {children}
    </a>
  );
}

function SectionLabel({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${
          dark
            ? "border border-[color:var(--brand-glow)]/25 bg-[color:var(--brand-glow)]/10 text-[color:var(--brand-glow)]"
            : "border border-[color:var(--brand-electric)]/25 bg-[color:var(--brand-electric)]/8 text-[color:var(--brand-electric)]"
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${dark ? "bg-[color:var(--brand-glow)]" : "bg-[color:var(--brand-electric)]"}`} />
        {children}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   NAVIGATION
───────────────────────────────────────────────────────────────── */

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Features", href: "#features" },
    { label: "AI Platform", href: "#ai" },
    { label: "AI Agents", href: "#ai-agents" },
    { label: "Integrations", href: "#integrations" },
    { label: "Pricing", href: "#pricing" },
    { label: "Security", href: "#security" },
    { label: "FAQ", href: "#faq" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-border/80 bg-white/85 backdrop-blur-xl shadow-[0_2px_16px_rgba(15,23,42,0.06)] py-3"
          : "bg-transparent py-4 sm:py-5"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
        <Logo />

        {/* Center Nav Pills */}
        <nav aria-label="Primary navigation" className="hidden min-w-0 max-w-[min(100%,48rem)] items-center gap-1 overflow-x-auto rounded-full border border-border/70 bg-secondary/50 px-3 py-1.5 backdrop-blur-md scrollbar-hide lg:flex">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground hover:bg-background/80"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Action CTAs */}
        <div className="hidden items-center gap-2.5 sm:flex">
          <a
            href="/login"
            className="rounded-full px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/60"
          >
            Sign In
          </a>
          <Btn href="#contact" variant="outline" size="sm">
            Book Demo
          </Btn>
          <Btn href="/signup" size="sm">
            Start Free Trial <ArrowRight className="h-3.5 w-3.5" />
          </Btn>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          className="grid h-10 w-10 place-items-center rounded-xl border border-border/80 bg-background/90 text-foreground shadow-sm transition-colors hover:bg-secondary lg:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="border-b border-border bg-white/95 px-6 py-6 shadow-xl backdrop-blur-2xl lg:hidden">
          <div className="mx-auto flex max-w-lg flex-col gap-1.5">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                <span>{l.label}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50" />
              </a>
            ))}
            <div className="mt-4 flex flex-col gap-2.5 border-t border-border pt-4">
              <a
                href="/login"
                className="flex h-11 items-center justify-center rounded-full border border-border bg-secondary/50 text-sm font-semibold text-foreground hover:bg-secondary"
              >
                Sign In
              </a>
              <Btn href="#contact" variant="outline" size="md" className="w-full justify-center">
                Book Demo
              </Btn>
              <Btn href="/signup" size="md" className="w-full justify-center">
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Btn>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}

/* ─────────────────────────────────────────────────────────────────
   HERO
───────────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden bg-hero-glow pt-32 pb-20 sm:pt-36 sm:pb-24 lg:pt-40 lg:pb-28">
      {/* Refined Dot Grid Matrix */}
      <div className="absolute inset-0 -z-10 dot-grid opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_75%)]" />
      
      {/* Ambient Top Light Beam */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-[image:var(--gradient-brand)] opacity-[0.14] blur-[100px]" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-[1fr_1.08fr] lg:gap-14">
        {/* Left Column */}
        <div className="animate-rise">
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--brand-electric)]/30 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur-md">
            <span className="flex h-2 w-2 items-center justify-center">
              <span className="absolute h-2 w-2 animate-ping rounded-full bg-[color:var(--brand-electric)] opacity-75" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-[color:var(--brand-electric)]" />
            </span>
            <span className="font-semibold text-[color:var(--brand-electric)]">Nexora AI 2.0</span>
            <span className="text-muted-foreground/40">•</span>
            <span className="text-muted-foreground">The Business Copilot is Live</span>
          </div>

          <h1 className="mt-6 text-[clamp(2.5rem,4.8vw,4.15rem)] font-black leading-[1.06] tracking-[-0.04em] text-foreground">
            The AI Business{" "}
            <span className="text-gradient">Operating System.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-muted-foreground font-normal">
            One intelligent platform to unify billing, inventory, CRM, finance, and teams — powered by an AI that doesn't just give advice, but takes real action across your business operations.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <Btn href="/signup" size="lg">
              Start 14-Day Free Trial <ArrowRight className="h-4 w-4" />
            </Btn>
            <Btn href="#contact" variant="outline" size="lg">
              Book a Demo
            </Btn>
            <a
              href="#ai"
              className="group inline-flex items-center gap-2 rounded-full px-4 py-3 text-xs sm:text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-secondary text-foreground ring-1 ring-border transition-transform group-hover:scale-110">
                <Play className="h-3 w-3 fill-current ml-0.5 text-[color:var(--brand-electric)]" />
              </span>
              <span>Watch 2-min tour</span>
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs text-muted-foreground">
            {["14-day free trial", "No credit card required", "Live setup in 30 minutes", "Cancel anytime"].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5 font-medium">
                <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </span>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Right — Elevated Hero Mockup */}
        <HeroMockup />
      </div>
    </section>
  );
}

function HeroMockup() {
  return (
    <div className="relative animate-rise [animation-delay:120ms]">
      {/* Background radial glow */}
      <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-[image:var(--gradient-brand)] opacity-[0.18] blur-[70px]" />

      {/* Main browser glass container */}
      <div className="overflow-hidden rounded-3xl border border-white/20 bg-slate-950 p-2 shadow-[0_32px_80px_-16px_rgba(15,23,42,0.5),0_0_0_1px_rgba(255,255,255,0.08)]">
        <div className="overflow-hidden rounded-2xl bg-[#0B0F19] text-white">
          {/* Chrome bar */}
          <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
            </div>
            <div className="ml-2 flex flex-1 items-center gap-2 rounded-lg bg-white/5 px-3 py-1 text-[11px] text-white/50 border border-white/5">
              <Lock className="h-3 w-3 text-emerald-400/80" />
              <span className="text-white/40">app.nexora.io/</span>
              <span className="text-white/80 font-medium">dashboard</span>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/15 border border-emerald-400/20 px-2.5 py-0.5 text-[9px] font-bold text-emerald-300 uppercase tracking-wider">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Live Sync
            </span>
          </div>

          {/* Dashboard Canvas */}
          <div className="p-4 sm:p-5">
            {/* Top Bar inside OS */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 font-bold text-white text-xs shadow-md">
                  MR
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs sm:text-sm font-bold text-white">Meridian Retail Pvt Ltd</p>
                    <span className="rounded bg-white/10 px-1.5 py-0.2 text-[9px] text-white/60 font-mono">HQ • Bengaluru</span>
                  </div>
                  <p className="text-[10px] text-white/45">Good morning, Aarav • Mon, 14 Jul</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-white/60">
                  <span className="text-white/40">⌘K</span> Quick Search
                </span>
                <span className="relative grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 cursor-pointer">
                  <Bell className="h-3.5 w-3.5" />
                  <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
              </div>
            </div>

            {/* 4 KPI Cards */}
            <div className="mb-3.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: "Today's Sales", val: "₹1,24,860", delta: "+18.4%", tone: "text-emerald-400", sub: "87 invoices" },
                { label: "Active Orders", val: "348", delta: "+12.1%", tone: "text-sky-400", sub: "98% dispatched" },
                { label: "Receivables", val: "₹38,200", delta: "-4.2%", tone: "text-amber-400", sub: "4 pending" },
                { label: "Net Margin", val: "28.4%", delta: "+3.8%", tone: "text-violet-400", sub: "₹41,220 profit" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-white/5 bg-white/[0.04] p-2.5 transition-all hover:bg-white/[0.07]">
                  <p className="text-[9px] uppercase tracking-wider text-white/40 font-medium">{s.label}</p>
                  <p className="mt-1 text-sm sm:text-base font-extrabold text-white tracking-tight">{s.val}</p>
                  <div className="mt-0.5 flex items-center justify-between text-[9px]">
                    <span className={`font-semibold ${s.tone}`}>{s.delta}</span>
                    <span className="text-white/35 truncate">{s.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Middle row: Visual Chart + Inventory Status */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 mb-3">
              {/* Revenue Curve */}
              <div className="sm:col-span-2 rounded-xl border border-white/5 bg-white/[0.03] p-3">
                <div className="mb-2 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[color:var(--brand-electric)]" />
                    <span className="font-semibold text-white/80">Revenue Velocity</span>
                    <span className="text-[10px] text-white/40">· 14-day trailing</span>
                  </div>
                  <span className="rounded bg-emerald-400/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                    +18.4% WoW
                  </span>
                </div>
                <div className="h-20 w-full pt-1">
                  <svg viewBox="0 0 300 70" className="h-full w-full overflow-visible" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="heroChartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366F1" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0 52 C 25 45, 45 48, 70 38 C 95 28, 115 42, 145 25 C 175 10, 200 28, 230 18 C 260 8, 280 14, 300 4 L 300 70 L 0 70 Z"
                      fill="url(#heroChartGrad)"
                    />
                    <path
                      d="M 0 52 C 25 45, 45 48, 70 38 C 95 28, 115 42, 145 25 C 175 10, 200 28, 230 18 C 260 8, 280 14, 300 4"
                      fill="none"
                      stroke="#818CF8"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    {/* Tooltip Pip */}
                    <circle cx="230" cy="18" r="4" fill="#FFFFFF" stroke="#6366F1" strokeWidth="2.5" />
                  </svg>
                </div>
                <div className="mt-1 flex justify-between text-[9px] text-white/35 font-mono">
                  <span>01 Jul</span>
                  <span>05 Jul</span>
                  <span>09 Jul</span>
                  <span>14 Jul (Today: ₹1.24L)</span>
                </div>
              </div>

              {/* Real-time Inventory Meter */}
              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Fast Moving Stock</span>
                    <span className="text-[9px] text-emerald-400 font-mono">Sync OK</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: "Amul Gold 1L", count: "128 / 200", pct: 78, bar: "bg-emerald-400" },
                      { name: "Tata Salt 1kg", count: "4 / 100", pct: 8, bar: "bg-red-400" },
                      { name: "Maggi 70g", count: "46 / 80", pct: 58, bar: "bg-amber-400" },
                    ].map((item) => (
                      <div key={item.name}>
                        <div className="flex justify-between text-[9px] mb-1">
                          <span className="text-white/70 font-medium truncate">{item.name}</span>
                          <span className="text-white/50 font-mono">{item.count}</span>
                        </div>
                        <div className="h-1 w-full rounded-full bg-white/10">
                          <div className={`h-full rounded-full ${item.bar}`} style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-[9px] text-white/35 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> 1 item needs immediate reorder
                </p>
              </div>
            </div>

            {/* Recent Live Ledger Transactions */}
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
              <div className="flex items-center justify-between mb-2 text-[10px]">
                <span className="font-semibold text-white/70">Real-time Invoicing Ledger</span>
                <span className="text-[color:var(--brand-glow)] font-semibold cursor-pointer hover:underline">Full Ledger (87) →</span>
              </div>
              <div className="space-y-1.5">
                {[
                  { id: "INV-1042", client: "Priya Traders Pvt Ltd", amt: "₹24,780", mode: "UPI QR", status: "Paid", tone: "bg-emerald-400/15 text-emerald-300" },
                  { id: "INV-1041", client: "Cascade Foods (Mumbai)", amt: "₹18,900", mode: "Net Banking", status: "Pending", tone: "bg-amber-400/15 text-amber-300" },
                  { id: "INV-1040", client: "Halcyon Retail Group", amt: "₹1,20,000", mode: "NEFT Verified", status: "Settled", tone: "bg-emerald-400/15 text-emerald-300" },
                ].map((row) => (
                  <div key={row.id} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-2.5 py-1.5 text-[10px] border border-white/[0.02]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white/40">{row.id}</span>
                      <span className="font-semibold text-white truncate max-w-[130px] sm:max-w-[180px]">{row.client}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="hidden sm:inline text-white/40">{row.mode}</span>
                      <span className="font-bold text-white font-mono">{row.amt}</span>
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${row.tone}`}>
                        {row.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating: AI Autonomous Copilot Insight */}
      <div className="absolute -left-6 bottom-4 hidden animate-float sm:block">
        <div className="glass rounded-2xl p-3.5 max-w-[270px] shadow-[0_20px_50px_rgba(0,0,0,0.18)] border border-white/80">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-[image:var(--gradient-brand)] text-white shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <span>Nexora AI Copilot</span>
            </div>
            <span className="rounded-full bg-red-50 border border-red-200 px-1.5 py-0.5 text-[9px] font-bold text-red-600 uppercase">
              Alert
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            "Tata Salt 1kg is critically low (4 units). Drafted PO #108 to Tata Consumer Products for Friday."
          </p>
          <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-border/60">
            <span className="text-[10px] font-semibold text-[color:var(--brand-electric)] hover:underline cursor-pointer">
              Approve PO #108 →
            </span>
            <span className="text-[9px] text-muted-foreground/60">Auto-calculated</span>
          </div>
        </div>
      </div>

      {/* Floating: Real-time Business Health Score */}
      <div className="absolute -right-6 top-8 hidden animate-float-slower md:block">
        <div className="glass rounded-2xl p-3.5 min-w-[200px] shadow-[0_20px_50px_rgba(0,0,0,0.18)] border border-white/80">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Business Health</p>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
              Optimal
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-foreground tracking-tight">94</span>
            <span className="text-xs font-semibold text-muted-foreground">/ 100</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
            <div className="h-full w-[94%] rounded-full bg-[image:var(--gradient-brand)]" />
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Top 5% operational efficiency
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   STATS BANNER
───────────────────────────────────────────────────────────────── */

function StatsBanner() {
  const stats = [
    { value: "12,000+", label: "Businesses running on Nexora", detail: "Across retail, FMCG & services" },
    { value: "₹500 Cr+", label: "Monthly invoice volume", detail: "100% GST-compliant processing" },
    { value: "4.9 / 5", label: "Average customer rating", detail: "Based on 3,400+ verified reviews" },
    { value: "99.95%", label: "Platform uptime SLA", detail: "Bank-grade high availability" },
  ];
  return (
    <section className="border-y border-border/80 bg-white/60 backdrop-blur-sm py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:divide-x md:divide-border/80">
          {stats.map((s, i) => (
            <div key={s.label} className={`flex flex-col items-center text-center ${i !== 0 ? "md:pl-6" : ""}`}>
              <p className="text-3xl sm:text-4xl font-black tracking-tight text-foreground font-mono">
                {s.value}
              </p>
              <p className="mt-1.5 text-sm font-semibold text-foreground">{s.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   TRUSTED BY
───────────────────────────────────────────────────────────────── */

function TrustedBy() {
  const logos = [
    "Northwind Co.", "Cascade Foods", "Meridian Retail", "Lumen Group",
    "Vertex Trade", "Halcyon Mart", "Pinnacle Stores", "Solaris Pharma",
    "BluePath Tech", "Zenith Foods", "Orbit Logistics", "Crestline Co.",
  ];
  return (
    <section className="py-14 overflow-hidden border-b border-border/50">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-center text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
          Powering Operations for 12,000+ Fast-Growing Businesses
        </p>
      </div>
      <div className="relative mt-8">
        {/* Soft Edge Fade Masks */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />
        
        <div className="flex gap-0">
          <div className="flex shrink-0 animate-marquee items-center gap-14 pr-14">
            {logos.map((l) => (
              <span
                key={l}
                className="whitespace-nowrap text-base font-bold tracking-tight text-muted-foreground/60 transition-colors hover:text-foreground"
              >
                {l}
              </span>
            ))}
          </div>
          <div aria-hidden="true" className="flex shrink-0 animate-marquee items-center gap-14 pr-14">
            {logos.map((l) => (
              <span
                key={l + "-dup"}
                className="whitespace-nowrap text-base font-bold tracking-tight text-muted-foreground/60 transition-colors hover:text-foreground"
              >
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   FEATURE SHOWCASE — reusable alternating layout
───────────────────────────────────────────────────────────────── */

/* FeatureShowcase removed — replaced by ProductShowcase below */

/* ─────────────────────────────────────────────────────────────────
   LARGE PREVIEW SHELL (browser-style, more premium)
───────────────────────────────────────────────────────────────── */

function PreviewShell({
  title,
  children,
  right,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between border-b border-border bg-secondary/50 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
        </div>
        <p className="text-[11px] font-medium text-muted-foreground">{title}</p>
        <div className="text-[11px] text-muted-foreground">{right}</div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function LargePreviewShell({
  url,
  badge,
  children,
  floats,
}: {
  url: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  floats?: React.ReactNode;
}) {
  return (
    <div className="relative group">
      {/* Background glow */}
      <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-[image:var(--gradient-brand)] opacity-[0.10] blur-3xl transition-opacity duration-300 group-hover:opacity-[0.16]" />

      {/* Browser window */}
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_24px_70px_-16px_oklch(0.14_0.02_260/0.14),0_0_0_1px_oklch(0.14_0.02_260/0.05)] transition-all duration-300">
        {/* Chrome bar */}
        <div className="flex items-center gap-2 border-b border-border/80 bg-secondary/40 px-4 sm:px-5 py-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
          </div>
          <div className="ml-2 flex flex-1 items-center gap-2 rounded-lg border border-border/70 bg-background/80 px-3 py-1.5 text-[11px] shadow-2xs">
            <Lock className="h-3 w-3 text-emerald-600/70" />
            <span className="text-muted-foreground/50">app.nexora.io /</span>
            <span className="font-semibold text-foreground">{url}</span>
          </div>
          {badge && <div className="ml-1">{badge}</div>}
        </div>
        {/* Content canvas */}
        <div className="p-5 sm:p-6 bg-gradient-to-b from-card to-secondary/20">{children}</div>
      </div>

      {/* Floating cards */}
      {floats}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   BILLING PREVIEW (large)
───────────────────────────────────────────────────────────────── */

function BillingMockup() {
  return (
    <LargePreviewShell
      url="billing / invoice-generator"
      badge={
        <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">
          <Check className="h-3 w-3" /> GST Ready
        </span>
      }
      floats={
        <>
          {/* Floating: Collections badge */}
          <div className="absolute -right-5 top-12 hidden animate-float-slower lg:block">
            <div className="glass rounded-2xl p-3.5 shadow-xl min-w-[170px] border border-white/80">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Today's Collections</p>
              <p className="mt-1 text-2xl font-black text-foreground font-mono">₹64,320</p>
              <p className="mt-1 text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <span>↑ 12%</span>
                <span className="text-muted-foreground/70 font-normal">vs yesterday</span>
              </p>
            </div>
          </div>
          {/* Floating: Payment received */}
          <div className="absolute -left-5 bottom-8 hidden animate-float lg:block">
            <div className="glass rounded-2xl p-3 shadow-xl border border-white/80">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-white shadow-sm">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </span>
                <div>
                  <p className="text-xs font-bold text-foreground">Payment Received (UPI)</p>
                  <p className="text-[10px] text-muted-foreground font-mono">₹24,780 • Priya Traders</p>
                </div>
              </div>
            </div>
          </div>
        </>
      }
    >
      {/* Invoice header */}
      <div className="mb-4 flex items-start justify-between border-b border-border/60 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="rounded-md bg-[color:var(--brand-electric)]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[color:var(--brand-electric)] uppercase tracking-wider">
              INV-1042
            </span>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.2 text-[10px] font-semibold text-emerald-600">
              Tax Invoice
            </span>
          </div>
          <p className="text-sm sm:text-base font-extrabold text-foreground">Priya Traders Pvt. Ltd.</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">GSTIN 29ABCDE1234F1Z5 • Due: 20 Jul 2026</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Amount</p>
          <p className="text-2xl sm:text-3xl font-black text-foreground font-mono tracking-tight mt-0.5">₹24,780</p>
        </div>
      </div>

      {/* Line items table */}
      <div className="space-y-2 mb-4">
        {[
          { name: "Amul Gold Milk 1L (24 crates)", hsn: "0401", qty: "576 units", gst: "5% (₹72)", amt: "₹1,440" },
          { name: "Tata Salt Crystal 1kg (40 bags)", hsn: "2501", qty: "40 units", gst: "0% (₹0)", amt: "₹960" },
          { name: "Maggi 2-Min Noodles 70g (60 units)", hsn: "1902", qty: "60 units", gst: "18% (₹128)", amt: "₹840" },
        ].map((r) => (
          <div key={r.name} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/80 px-3.5 py-2.5 text-xs shadow-2xs">
            <div>
              <p className="font-semibold text-foreground">{r.name}</p>
              <p className="text-[10px] text-muted-foreground font-mono">HSN: {r.hsn} • {r.qty}</p>
            </div>
            <div className="flex items-center gap-4 text-right">
              <span className="text-[10px] font-medium text-muted-foreground/80 font-mono">GST {r.gst}</span>
              <span className="font-bold text-foreground font-mono min-w-[56px] text-right">{r.amt}</span>
            </div>
          </div>
        ))}
      </div>

      {/* GST auto-calculation summary */}
      <div className="flex items-center justify-between rounded-xl border border-dashed border-[color:var(--brand-electric)]/30 bg-[color:var(--brand-electric)]/5 px-4 py-3 mb-4">
        <div>
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[color:var(--brand-electric)]" />
            CGST (9%) + SGST (9%) Auto-Calculated
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">E-way bill and GSTR-1 payload prepared automatically</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Tax Payable</p>
          <p className="text-sm font-extrabold text-[color:var(--brand-electric)] font-mono">₹3,780.00</p>
        </div>
      </div>

      {/* Action triggers */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        {[
          { icon: QrCode, label: "Generate UPI QR", style: "bg-secondary/80 border border-border/80 text-foreground" },
          { icon: Printer, label: "Thermal 80mm Print", style: "bg-secondary/80 border border-border/80 text-foreground" },
          { icon: FileText, label: "Export PDF", style: "bg-secondary/80 border border-border/80 text-foreground" },
          { icon: Check, label: "Record Payment", style: "bg-[image:var(--gradient-brand)] text-white shadow-sm" },
        ].map(({ icon: Icon, label, style }) => (
          <button key={label} type="button" className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold ${style} transition-all hover:brightness-105 active:scale-95 cursor-pointer`}>
            <Icon className="h-3 w-3" /> {label}
          </button>
        ))}
      </div>
    </LargePreviewShell>
  );
}

/* ─────────────────────────────────────────────────────────────────
   INVENTORY PREVIEW (large)
───────────────────────────────────────────────────────────────── */

function InventoryMockup() {
  const rows = [
    { name: "Amul Gold 1L", sku: "SKU-0021", stock: 128, capacity: 200, pct: 64, tone: "bg-emerald-500", status: "In Stock", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { name: "Tata Salt 1kg", sku: "SKU-0034", stock: 4, capacity: 100, pct: 8, tone: "bg-red-500", status: "Critical", badge: "bg-red-50 text-red-700 border-red-200" },
    { name: "Maggi 70g", sku: "SKU-0058", stock: 9, capacity: 80, pct: 12, tone: "bg-amber-500", status: "Low Stock", badge: "bg-amber-50 text-amber-700 border-amber-200" },
    { name: "Colgate MaxFresh", sku: "SKU-0072", stock: 46, capacity: 80, pct: 57, tone: "bg-sky-500", status: "In Stock", badge: "bg-sky-50 text-sky-700 border-sky-200" },
    { name: "Britannia Good Day", sku: "SKU-0091", stock: 72, capacity: 120, pct: 60, tone: "bg-emerald-500", status: "In Stock", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  ];
  return (
    <LargePreviewShell
      url="inventory / live-stock"
      badge={
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live Warehouse Sync
        </span>
      }
      floats={
        <>
          <div className="absolute -left-5 top-16 hidden animate-float lg:block">
            <div className="glass rounded-2xl p-3.5 shadow-xl min-w-[210px] border border-white/80">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-red-500 text-white shadow-sm">
                  <Bell className="h-3 w-3 stroke-[3]" />
                </span>
                <p className="text-xs font-bold text-foreground">Stock Out Warning</p>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">2 items reached reorder point before weekend peak.</p>
              <p className="text-[11px] font-bold text-[color:var(--brand-electric)] mt-1.5 cursor-pointer hover:underline">
                Generate POs to Suppliers →
              </p>
            </div>
          </div>
          <div className="absolute -right-5 bottom-8 hidden animate-float-slower lg:block">
            <div className="glass rounded-2xl p-3 shadow-xl border border-white/80">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Total Tracked SKUs</p>
              <p className="mt-0.5 text-xl font-black text-foreground font-mono">1,284</p>
              <p className="text-[10px] text-muted-foreground">Across 3 warehouses</p>
            </div>
          </div>
        </>
      }
    >
      {/* Search Bar */}
      <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-border/80 bg-background/90 px-3.5 py-2.5 shadow-2xs">
        <Scan className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs sm:text-sm text-muted-foreground">Scan barcode or search product / SKU / batch…</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden sm:inline-block rounded bg-secondary px-2 py-0.5 text-[10px] font-mono text-muted-foreground border border-border">⌘B</span>
          <button type="button" className="text-xs font-bold text-[color:var(--brand-electric)] hover:underline">+ New SKU</button>
        </div>
      </div>

      {/* Grid Headers */}
      <div className="mb-2 grid grid-cols-[1fr_auto_auto_auto] gap-3 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        <span>Product Details</span>
        <span className="text-right">Available</span>
        <span className="w-24 text-center">Capacity</span>
        <span className="w-20 text-right">Status</span>
      </div>

      {/* Item rows */}
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.name} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 rounded-xl border border-border/50 bg-background/80 px-3 py-2 text-xs shadow-2xs">
            <div>
              <p className="font-semibold text-foreground">{r.name}</p>
              <p className="text-[10px] text-muted-foreground font-mono">{r.sku}</p>
            </div>
            <p className="text-sm font-black text-foreground text-right font-mono">{r.stock}</p>
            <div className="w-24">
              <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <div className={`h-full rounded-full ${r.tone}`} style={{ width: `${r.pct}%` }} />
              </div>
            </div>
            <span className={`w-20 rounded-full border px-2 py-0.5 text-center text-[10px] font-bold ${r.badge}`}>
              {r.status}
            </span>
          </div>
        ))}
      </div>

      {/* AI Automated Restock Suggestion */}
      <div className="mt-4 flex items-center gap-3 rounded-xl border border-[color:var(--brand-electric)]/20 bg-[color:var(--brand-electric)]/5 px-4 py-3">
        <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-xl bg-[image:var(--gradient-brand)] text-white shadow-sm">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-foreground">Nexora AI Auto-Restock Trigger</p>
          <p className="text-[11px] text-muted-foreground truncate">Reorder Tata Salt 1kg (200 units) from Tata Consumer to avoid Friday run-out.</p>
        </div>
        <button type="button" className="flex-shrink-0 rounded-full bg-[image:var(--gradient-brand)] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:brightness-105 cursor-pointer">
          Draft PO
        </button>
      </div>
    </LargePreviewShell>
  );
}

/* ─────────────────────────────────────────────────────────────────
   CRM PREVIEW (large)
───────────────────────────────────────────────────────────────── */

function CRMMockup() {
  const customers = [
    { name: "Meridian Retail Pvt Ltd", initials: "MR", ltv: "₹1.42L", orders: 48, tag: "VIP", health: 96, last: "2 hrs ago" },
    { name: "Cascade Foods (Mumbai)", initials: "CF", ltv: "₹98,400", orders: 34, tag: "Loyal", health: 82, last: "Yesterday" },
    { name: "Halcyon Group Enterprises", initials: "HG", ltv: "₹32,100", orders: 8, tag: "New", health: 61, last: "3 days ago" },
    { name: "Vertex Trade Corp", initials: "VT", ltv: "₹2.18L", orders: 72, tag: "VIP", health: 99, last: "1 hr ago" },
  ];
  return (
    <LargePreviewShell
      url="crm / 360-customer-view"
      badge={
        <span className="rounded-full bg-[color:var(--brand-electric)]/10 border border-[color:var(--brand-electric)]/20 px-2.5 py-0.5 text-[10px] font-bold text-[color:var(--brand-electric)]">
          Pipeline Active
        </span>
      }
      floats={
        <>
          <div className="absolute -right-5 top-12 hidden animate-float-slower lg:block">
            <div className="glass rounded-2xl p-3.5 shadow-xl min-w-[170px] border border-white/80">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Won Revenue (MTD)</p>
              <p className="mt-1 text-2xl font-black text-foreground font-mono">₹6.2L</p>
              <p className="mt-0.5 text-[11px] font-semibold text-emerald-600">↑ 24% vs last month</p>
            </div>
          </div>
        </>
      }
    >
      {/* Pipeline KPI Cards */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        {[
          { l: "Total Customers", v: "5,821", c: "text-foreground", sub: "Active buyers" },
          { l: "Deals in Pipeline", v: "12", c: "text-[color:var(--brand-electric)]", sub: "₹4.8L value" },
          { l: "Due Follow-ups", v: "7", c: "text-amber-600", sub: "Auto-reminders ready" },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border border-border/60 bg-background/80 p-3 shadow-2xs">
            <p className="text-[10px] text-muted-foreground font-medium">{k.l}</p>
            <p className={`mt-1 text-lg sm:text-xl font-black font-mono ${k.c}`}>{k.v}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Customer 360 List */}
      <div className="space-y-2">
        {customers.map((c) => (
          <div key={c.name} className="flex items-center gap-3.5 rounded-xl border border-border/50 bg-background/80 p-3 transition-colors hover:bg-secondary/60 cursor-pointer shadow-2xs">
            <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-xs font-bold text-white shadow-sm">
              {c.initials}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-foreground truncate">{c.name}</p>
                <span className={`rounded-full px-2 py-0.2 text-[9px] font-extrabold uppercase tracking-wider ${
                  c.tag === "VIP" ? "bg-[image:var(--gradient-brand)] text-white" : "bg-secondary text-muted-foreground border border-border"
                }`}>{c.tag}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">LTV: {c.ltv} • {c.orders} orders • Last active: {c.last}</p>
            </div>
            <div className="flex items-center gap-3 text-right">
              <div>
                <div className="h-1.5 w-16 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-[image:var(--gradient-brand)]" style={{ width: `${c.health}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 font-mono">{c.health}% health</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground/60" />
            </div>
          </div>
        ))}
      </div>
    </LargePreviewShell>
  );
}

/* ─────────────────────────────────────────────────────────────────
   REPORTS PREVIEW (large)
───────────────────────────────────────────────────────────────── */

function ReportsMockup() {
  const points = [18, 28, 22, 38, 32, 48, 42, 56, 50, 64, 58, 72];
  const w = 500;
  const h = 100;
  const step = w / (points.length - 1);
  const path = points.map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (v / 100) * h}`).join(" ");
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;

  return (
    <LargePreviewShell
      url="analytics / profit-and-loss"
      badge={
        <span className="rounded-full bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 text-[10px] font-bold text-violet-600">
          Live Financial Sync
        </span>
      }
      floats={
        <>
          <div className="absolute -left-5 bottom-8 hidden animate-float lg:block">
            <div className="glass rounded-2xl p-3.5 shadow-xl min-w-[170px] border border-white/80">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Business Score</p>
              <p className="mt-1 text-2xl font-black text-foreground font-mono">92 <span className="text-xs font-normal text-muted-foreground">/ 100</span></p>
              <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full w-[92%] rounded-full bg-[image:var(--gradient-brand)]" />
              </div>
              <p className="mt-1.5 text-[10px] text-emerald-600 font-semibold">Ready for quarterly filing</p>
            </div>
          </div>
        </>
      }
    >
      {/* KPI row */}
      <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { l: "Revenue (MTD)", v: "₹8.42L", d: "+12.4%", tone: "text-emerald-600" },
          { l: "Gross Margin", v: "₹2.10L", d: "25.0%", tone: "text-emerald-600" },
          { l: "Expenses", v: "₹6.32L", d: "-3.1%", tone: "text-sky-600" },
          { l: "Total Orders", v: "2,148", d: "+7.2%", tone: "text-violet-600" },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border border-border/60 bg-background/80 p-3 shadow-2xs">
            <p className="text-[10px] text-muted-foreground font-medium">{k.l}</p>
            <p className="mt-1 text-base font-black text-foreground font-mono">{k.v}</p>
            <p className={`text-[10px] font-bold mt-0.5 ${k.tone}`}>{k.d}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="rounded-xl border border-border/60 bg-background/80 p-4 mb-3 shadow-2xs">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm font-bold text-foreground">Revenue & Margin Growth</p>
            <p className="text-[11px] text-muted-foreground">12 months trailing audit</p>
          </div>
          <div className="flex gap-1 border border-border/60 rounded-lg p-0.5 bg-secondary/50">
            {["1M", "3M", "6M", "1Y"].map((t, i) => (
              <span key={t} className={`rounded-md px-2 py-0.5 text-[10px] font-semibold cursor-pointer transition-colors ${i === 3 ? "bg-white text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}>
                {t}
              </span>
            ))}
          </div>
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} className="h-24 w-full">
          <defs>
            <linearGradient id="rptArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.60 0.23 258)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="oklch(0.60 0.23 258)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#rptArea)" />
          <path d={path} fill="none" stroke="oklch(0.55 0.24 258)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Leaderboard */}
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-[11px] font-bold text-muted-foreground shrink-0">Top Performing Items:</p>
        {["Amul Gold 1L (₹2.4L)", "Colgate MaxF. (₹1.8L)", "Maggi 70g (₹1.1L)"].map((p, i) => (
          <span key={p} className="rounded-full border border-border/80 bg-secondary/60 px-3 py-1 text-[10px] font-semibold text-foreground">
            {i + 1}. {p}
          </span>
        ))}
      </div>
    </LargePreviewShell>
  );
}

/* ─────────────────────────────────────────────────────────────────
   FINANCE PREVIEW (large)
───────────────────────────────────────────────────────────────── */

function FinanceMockup() {
  return (
    <LargePreviewShell
      url="finance / cashflow-forecast"
      badge={
        <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-600">
          Bank Feed Reconciled ✓
        </span>
      }
      floats={
        <>
          <div className="absolute -right-5 top-16 hidden animate-float-slower lg:block">
            <div className="glass rounded-2xl p-3.5 shadow-xl min-w-[170px] border border-white/80">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">30-day Forecast</p>
              <p className="mt-1 text-2xl font-black text-foreground font-mono">₹9.2L</p>
              <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">↑ Surplus liquidity expected</p>
            </div>
          </div>
        </>
      }
    >
      {/* P&L Breakdown */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        {[
          { l: "Total Inflow (Revenue)", v: "₹8,42,910", bar: 100, tone: "bg-emerald-500", textTone: "text-emerald-600" },
          { l: "Total Outflow (COGS + OpEx)", v: "₹4,71,220", bar: 56, tone: "bg-red-400", textTone: "text-red-500" },
          { l: "Net Operating Profit", v: "₹3,71,690", bar: 44, tone: "bg-[color:var(--brand-electric)]", textTone: "text-[color:var(--brand-electric)]" },
          { l: "GST Net Liability", v: "₹92,210", bar: 11, tone: "bg-amber-400", textTone: "text-amber-600" },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border border-border/60 bg-background/80 p-3 shadow-2xs">
            <p className="text-[10px] text-muted-foreground font-medium">{k.l}</p>
            <p className={`mt-1 text-sm sm:text-base font-black font-mono ${k.textTone}`}>{k.v}</p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
              <div className={`h-full rounded-full ${k.tone}`} style={{ width: `${k.bar}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Automated Bank reconciliation */}
      <div className="rounded-xl border border-border/60 bg-background/80 p-4 mb-3 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs sm:text-sm font-bold text-foreground">HDFC Current Account Reconciliation</p>
            <p className="text-[11px] text-muted-foreground">Automated bank statement sync</p>
          </div>
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-600">
            94% Matched
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
          <div className="h-full w-[94%] rounded-full bg-[image:var(--gradient-brand)]" />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>1,842 ledger entries matched automatically</span>
          <span className="text-amber-600 font-semibold cursor-pointer hover:underline">12 require 1-click review</span>
        </div>
      </div>

      {/* Expense categories */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { cat: "COGS & Inventory", amt: "₹2.8L" },
          { cat: "Staff Salaries", amt: "₹92K" },
          { cat: "Store Rent", amt: "₹45K" },
          { cat: "Utilities & Logistics", amt: "₹18K" },
        ].map((e) => (
          <div key={e.cat} className="flex items-center gap-2 rounded-full border border-border/80 bg-secondary/50 px-3 py-1 text-[11px]">
            <span className="font-semibold text-foreground">{e.cat}</span>
            <span className="text-muted-foreground font-mono">{e.amt}</span>
          </div>
        ))}
      </div>
    </LargePreviewShell>
  );
}

/* ─────────────────────────────────────────────────────────────────
   MULTI-BRANCH PREVIEW (large)
───────────────────────────────────────────────────────────────── */

function MultiBranchMockup() {
  const branches = [
    { name: "Bengaluru HQ (Indiranagar)", city: "Karnataka", rev: "₹3.2L", delta: "+14.2%", health: 96, status: "Optimal" },
    { name: "Mumbai (Andheri West)", city: "Maharashtra", rev: "₹2.1L", delta: "+9.1%", health: 88, status: "Healthy" },
    { name: "Delhi (Karol Bagh)", city: "Delhi NCR", rev: "₹1.6L", delta: "+4.0%", health: 74, status: "Monitor" },
    { name: "Chennai (T. Nagar)", city: "Tamil Nadu", rev: "₹1.5L", delta: "+11.4%", health: 91, status: "Healthy" },
  ];
  return (
    <LargePreviewShell
      url="branches / command-view"
      badge={
        <span className="rounded-full bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 text-[10px] font-bold text-sky-600">
          4 Locations Synchronised
        </span>
      }
      floats={
        <>
          <div className="absolute -right-5 bottom-12 hidden animate-float-slower lg:block">
            <div className="glass rounded-2xl p-3.5 shadow-xl min-w-[170px] border border-white/80">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Combined Network Revenue</p>
              <p className="mt-1 text-2xl font-black text-foreground font-mono">₹8.4L</p>
              <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">↑ 9.5% MTD performance</p>
            </div>
          </div>
        </>
      }
    >
      {/* Summary KPI row */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        {[
          { l: "Consolidated Revenue", v: "₹8.4L" },
          { l: "Active Shift Users", v: "28 staff" },
          { l: "Inter-branch Transfers", v: "14 POs" },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border border-border/60 bg-background/80 p-3 shadow-2xs">
            <p className="text-[10px] text-muted-foreground font-medium">{k.l}</p>
            <p className="mt-1 text-sm sm:text-base font-black text-foreground font-mono">{k.v}</p>
          </div>
        ))}
      </div>

      {/* Branch list */}
      <div className="space-y-2">
        {branches.map((b) => (
          <div key={b.name} className="flex items-center gap-3.5 rounded-xl border border-border/50 bg-background/80 p-3 transition-colors hover:bg-secondary/60 cursor-pointer shadow-2xs">
            <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl border border-border/80 bg-secondary text-[color:var(--brand-deep)]">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{b.name}</p>
              <p className="text-[11px] text-muted-foreground">{b.city}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-black text-foreground font-mono">{b.rev}</p>
                <p className="text-[10px] font-bold text-emerald-600">{b.delta}</p>
              </div>
              <div className="hidden sm:block">
                <div className="h-1.5 w-16 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-[image:var(--gradient-brand)]" style={{ width: `${b.health}%` }} />
                </div>
                <p className="text-[10px] mt-0.5 font-bold text-emerald-600 text-right">{b.status}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3.5 flex items-center justify-between rounded-xl border border-dashed border-border/80 bg-secondary/40 px-3.5 py-2.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5 font-medium"><Key className="h-3.5 w-3.5 text-[color:var(--brand-electric)]" /> Central billing with location-based GST registration</span>
        <span className="text-emerald-600 font-bold">All 4 stores active</span>
      </div>
    </LargePreviewShell>
  );
}

/* ─────────────────────────────────────────────────────────────────
   CUSTOMERS MOCKUP (tab)
───────────────────────────────────────────────────────────────── */

function CustomersMockup() {
  const segments = [
    { label: "VIP Tier", count: 284, color: "bg-[image:var(--gradient-brand)] text-white" },
    { label: "Loyal", count: 1142, color: "bg-sky-500 text-white" },
    { label: "Regular", count: 2880, color: "bg-secondary text-foreground border border-border" },
    { label: "New Buyers", count: 1096, color: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
    { label: "At Risk", count: 419, color: "bg-red-50 text-red-700 border border-red-200" },
  ];
  return (
    <LargePreviewShell
      url="crm / segmentation-and-ltv"
      badge={
        <span className="rounded-full bg-[color:var(--brand-electric)]/10 border border-[color:var(--brand-electric)]/20 px-2.5 py-0.5 text-[10px] font-bold text-[color:var(--brand-electric)]">
          5,821 Total Profiles
        </span>
      }
      floats={
        <>
          <div className="absolute -right-5 top-12 hidden animate-float-slower lg:block">
            <div className="glass rounded-2xl p-3.5 shadow-xl min-w-[170px] border border-white/80">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Average LTV</p>
              <p className="mt-1 text-2xl font-black text-foreground font-mono">₹18,420</p>
              <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">↑ 14% this quarter</p>
            </div>
          </div>
        </>
      }
    >
      {/* 5 Segment Pills */}
      <div className="mb-4 grid grid-cols-5 gap-2">
        {segments.map((s) => (
          <div key={s.label} className={`rounded-xl p-2.5 text-center shadow-2xs ${s.color}`}>
            <p className="text-sm sm:text-base font-black font-mono">{s.count > 999 ? `${(s.count / 1000).toFixed(1)}k` : s.count}</p>
            <p className="text-[10px] font-semibold mt-0.5 opacity-90 truncate">{s.label}</p>
          </div>
        ))}
      </div>

      {/* LTV Contribution */}
      <div className="rounded-xl border border-border/60 bg-background/80 p-4 mb-3 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs sm:text-sm font-bold text-foreground">Revenue by Customer Tier</p>
            <p className="text-[11px] text-muted-foreground">Highest margin generated from VIP & Loyal segments</p>
          </div>
          <span className="text-[11px] font-bold text-[color:var(--brand-electric)] hover:underline cursor-pointer">Export CSV →</span>
        </div>
        <div className="space-y-2.5">
          {[
            { seg: "VIP (284)", rev: "₹4.03L", pct: 100, color: "bg-[image:var(--gradient-brand)]" },
            { seg: "Loyal (1.1k)", rev: "₹1.82L", pct: 45, color: "bg-sky-500" },
            { seg: "Regular (2.8k)", rev: "₹2.88L", pct: 71, color: "bg-slate-300" },
          ].map((r) => (
            <div key={r.seg} className="flex items-center gap-3 text-xs">
              <span className="w-24 text-[11px] font-semibold text-muted-foreground truncate">{r.seg}</span>
              <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                <div className={`h-full rounded-full ${r.color}`} style={{ width: `${r.pct}%` }} />
              </div>
              <span className="w-16 text-right font-bold text-foreground font-mono">{r.rev}</span>
            </div>
          ))}
        </div>
      </div>
    </LargePreviewShell>
  );
}

/* ─────────────────────────────────────────────────────────────────
   AI MOCKUP (tab panel version — lighter)
───────────────────────────────────────────────────────────────── */

function AIMockupTab() {
  const msgs = [
    { role: "user" as const, text: "How did sales perform today across our Bangalore stores?" },
    { role: "ai" as const, text: "You've generated ₹64,320 across 87 invoices — up 12% vs yesterday. Top product: Amul Gold 1L (42 units). Meridian Retail accounts for 28% of today's volume.", action: undefined },
    { role: "user" as const, text: "Create draft invoice for Priya Traders, their 3 usual items." },
    { role: "ai" as const, text: "Drafted INV-1042 for Priya Traders with their 3 most frequent items. GST auto-calculated at ₹3,780. Shall I dispatch via WhatsApp with UPI QR?", action: "Preview Invoice (INV-1042)" },
    { role: "user" as const, text: "Which items are in danger of stockout this week?" },
    { role: "ai" as const, text: "Tata Salt 1kg has only 4 units remaining. Restock PO drafted to supplier for Friday delivery.", action: "Approve Restock PO" },
  ];
  return (
    <div className="relative group">
      {/* Glow */}
      <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-[image:var(--gradient-brand)] opacity-[0.12] blur-3xl" />

      {/* Browser chrome */}
      <div className="overflow-hidden rounded-2xl border border-white/20 bg-[#0B0F19] text-white shadow-[0_24px_80px_-20px_rgba(15,23,42,0.45)]">
        {/* Chrome bar */}
        <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
          <div className="ml-2 flex flex-1 items-center gap-2 rounded-lg bg-white/5 px-3 py-1 text-[11px] text-white/50 border border-white/5">
            <span className="text-white/40">app.nexora.io/</span>
            <span className="text-white/80 font-medium">ai-copilot</span>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/15 border border-emerald-400/20 px-2.5 py-0.5 text-[9px] font-bold text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Copilot Online
          </span>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/8 px-5 py-3.5 bg-white/[0.02]">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-[image:var(--gradient-brand)] text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs sm:text-sm font-bold text-white">Nexora AI Autonomous Copilot</p>
            <p className="text-[10px] text-white/45">Trained directly on your ledger, inventory, & customer history</p>
          </div>
        </div>

        {/* Chat message thread */}
        <div className="max-h-[340px] overflow-y-auto p-4 sm:p-5 space-y-3.5 scrollbar-hide">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[88%] space-y-2">
                <div className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-white text-slate-950 font-medium shadow-sm"
                    : "bg-white/10 text-white border border-white/10"
                }`}>
                  {m.text}
                </div>
                {m.action && (
                  <button type="button" className="flex items-center gap-1.5 rounded-full border border-[color:var(--brand-electric)]/50 bg-[color:var(--brand-electric)]/20 px-3 py-1 text-[11px] font-bold text-[color:var(--brand-glow)] hover:bg-[color:var(--brand-electric)]/30 transition-colors cursor-pointer">
                    <Check className="h-3 w-3 stroke-[3]" /> {m.action}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-white/8 p-3 bg-white/[0.02]">
          <div className="flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-4 py-2.5">
            <Sparkles className="h-4 w-4 text-white/40 flex-shrink-0" />
            <span className="flex-1 text-xs text-white/35">Ask anything or command an action (e.g. "Draft invoice for Cascade Foods")…</span>
            <button type="button" className="grid h-7 w-7 place-items-center rounded-full bg-[image:var(--gradient-brand)] flex-shrink-0 hover:scale-105 transition-transform">
              <ArrowRight className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   PRODUCT SHOWCASE — premium tabbed interactive section
───────────────────────────────────────────────────────────────── */

interface ShowcaseTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  headline: string;
  description: string;
  items: string[];
  badges: string[];
  metrics: { label: string; value: string; sub?: string }[];
  mockup: ReactNode;
  reverse?: boolean;
  accentClass?: string;
}

function Features() {
  const [activeTab, setActiveTab] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  const tabs: ShowcaseTab[] = [
    {
      id: "billing",
      label: "Billing",
      icon: Receipt,
      eyebrow: "Billing & Invoicing",
      headline: "Billing that works as fast as your business.",
      description: "Create GST-compliant invoices, quotations, purchase bills and recurring invoices from one intelligent workspace. UPI QR, thermal printing and auto payment reminders included.",
      items: ["GST Invoices & Quotations", "Purchase Bills & Credit Notes", "Recurring Invoices", "Multiple Invoice Templates", "UPI Payment QR", "Razorpay & PhonePe", "Auto Payment Reminders", "GSTR-1 Export"],
      badges: ["GST Certified", "Razorpay Ready", "UPI Payments", "Thermal Printing"],
      metrics: [
        { label: "Invoices today", value: "87", sub: "+12% vs yesterday" },
        { label: "Collected", value: "₹64,320", sub: "today" },
        { label: "Outstanding", value: "₹3.2L", sub: "12 invoices" },
      ],
      mockup: <BillingMockup />,
      reverse: false,
      accentClass: "bg-emerald-500/10 text-emerald-600",
    },
    {
      id: "inventory",
      label: "Inventory",
      icon: Boxes,
      eyebrow: "Inventory Management",
      headline: "Every product, every unit, always accurate.",
      description: "Real-time stock updates with every sale and purchase. Batch tracking, expiry alerts, barcode scanning and AI-powered restock suggestions keep shelves full and cash flowing.",
      items: ["Unlimited Products & Categories", "Barcode Generation & Scanner", "Batch & Expiry Tracking", "Low Stock Alerts", "Purchase Orders & Suppliers", "Multi-location Inventory", "Stock Transfer", "Auto Restock Suggestions"],
      badges: ["Barcode Ready", "Multi-Warehouse", "Real-time Sync", "AI Reorder"],
      metrics: [
        { label: "Total SKUs", value: "1,284", sub: "3 warehouses" },
        { label: "Low stock", value: "3", sub: "need reorder" },
        { label: "Value tracked", value: "₹12.4L", sub: "at cost" },
      ],
      mockup: <InventoryMockup />,
      reverse: true,
      accentClass: "bg-sky-500/10 text-sky-600",
    },
    {
      id: "crm",
      label: "CRM",
      icon: Users,
      eyebrow: "CRM & Relationships",
      headline: "Every customer relationship, in one place.",
      description: "Complete customer profiles with full purchase history, outstanding dues, loyalty points and sales pipeline status. Follow-ups and reminders run automatically so nothing slips.",
      items: ["Customer Database & 360° View", "Full Purchase History", "Sales Pipeline & Leads", "Follow-up Reminders", "Customer Segmentation", "Loyalty Program", "Outstanding Tracking", "Customer Analytics"],
      badges: ["360° Customer View", "Pipeline Tracking", "Auto Follow-ups", "Loyalty Points"],
      metrics: [
        { label: "Total customers", value: "5,821", sub: "active buyers" },
        { label: "Active deals", value: "12", sub: "in pipeline" },
        { label: "Won MTD", value: "₹6.2L", sub: "+24% vs last month" },
      ],
      mockup: <CRMMockup />,
      reverse: false,
      accentClass: "bg-violet-500/10 text-violet-600",
    },
    {
      id: "reports",
      label: "Reports",
      icon: BarChart3,
      eyebrow: "Reports & Analytics",
      headline: "Every number, live. Every insight, instant.",
      description: "Live P&L, revenue trends, business health score, tax summaries and employee performance — always current, always precise. Monthly close drops from weeks to hours.",
      items: ["Daily & Monthly Sales Reports", "Profit & Loss Statement", "Revenue Analytics", "Best & Slow-Moving Products", "Employee Performance", "Tax Reports & GST Summary", "Business Health Score", "Export to PDF & Excel"],
      badges: ["Live Dashboard", "GST Summary", "P&L Reports", "Excel Export"],
      metrics: [
        { label: "Revenue MTD", value: "₹8.4L", sub: "+12% vs last month" },
        { label: "Net profit", value: "₹2.1L", sub: "25% margin" },
        { label: "Business score", value: "92/100", sub: "Excellent" },
      ],
      mockup: <ReportsMockup />,
      reverse: true,
      accentClass: "bg-violet-500/10 text-violet-600",
    },
    {
      id: "finance",
      label: "Finance",
      icon: Wallet,
      eyebrow: "Finance & Cash Flow",
      headline: "Full financial clarity, zero surprises.",
      description: "Track every rupee in and out. Cash flow forecasting, expense management, bank reconciliation and tax summary in one cockpit. Know your position 30 days ahead.",
      items: ["Expense Management", "Income Tracking", "Cash Flow Dashboard", "30-Day Forecast", "Profit Tracking", "Tax Summary", "Bank Reconciliation", "Financial Dashboard"],
      badges: ["Bank Reconciliation", "30-day Forecast", "Tax Summary", "Auto-Categorise"],
      metrics: [
        { label: "30-day forecast", value: "₹9.2L", sub: "positive cashflow" },
        { label: "Reconciled", value: "94%", sub: "1,842 transactions" },
        { label: "GST liability", value: "₹92,210", sub: "due 11 Nov" },
      ],
      mockup: <FinanceMockup />,
      reverse: false,
      accentClass: "bg-amber-500/10 text-amber-600",
    },
    {
      id: "ai",
      label: "AI Assistant",
      icon: Sparkles,
      eyebrow: "Nexora AI",
      headline: "An operator who never sleeps, inside your business.",
      description: "Ask in plain English or Hindi. Nexora AI understands your full business context — sales, inventory, customers, cash flow — and takes real actions, not just answers.",
      items: ["Plain-language business Q&A", "Auto-draft invoices & reports", "Stock & cash flow alerts", "Sales forecasting", "Inventory forecasting", "Natural language search", "Multi-language (English + Hindi)", "Learns from your business patterns"],
      badges: ["GPT-4 Powered", "Business-context AI", "Action-not-just-answers", "Hindi + English"],
      metrics: [
        { label: "AI actions today", value: "142", sub: "invoices · POs · alerts" },
        { label: "Time saved", value: "4.2h", sub: "per day avg" },
        { label: "Accuracy", value: "99.1%", sub: "GST calculations" },
      ],
      mockup: <AIMockupTab />,
      reverse: true,
      accentClass: "bg-[color:var(--brand-electric)]/10 text-[color:var(--brand-electric)]",
    },
    {
      id: "customers",
      label: "Customers",
      icon: UserCog,
      eyebrow: "Customer Intelligence",
      headline: "Know every customer. Grow every relationship.",
      description: "Deep customer analytics across segments — VIP, loyal, new, churned. LTV tracking, churn prediction, loyalty rewards and automated re-engagement campaigns built in.",
      items: ["Customer Segmentation (5 tiers)", "Lifetime Value Tracking", "Churn Risk Prediction", "Loyalty & Rewards Programme", "Automated Re-engagement", "Purchase Frequency Analysis", "Top Customer Leaderboard", "WhatsApp & SMS Campaigns"],
      badges: ["LTV Analytics", "Churn Prediction", "Loyalty Rewards", "Auto Campaigns"],
      metrics: [
        { label: "VIP customers", value: "284", sub: "5% of base" },
        { label: "Avg LTV", value: "₹18,420", sub: "+14% this quarter" },
        { label: "Retention", value: "87%", sub: "12-month rate" },
      ],
      mockup: <CustomersMockup />,
      reverse: false,
      accentClass: "bg-[color:var(--brand-electric)]/10 text-[color:var(--brand-electric)]",
    },
    {
      id: "branches",
      label: "Multi-Branch",
      icon: Building2,
      eyebrow: "Multi-Branch Management",
      headline: "Run every location from one command centre.",
      description: "Unlimited branches, centralised reporting and branch-wise inventory — all visible from a single login. Role-based access ensures the right people see the right data.",
      items: ["Unlimited Branch Management", "Centralised Dashboard", "Branch Performance Comparison", "Branch-wise Inventory", "Branch-wise Reports", "Central Billing", "Role-Based Access", "Stock Transfer Between Branches"],
      badges: ["Unlimited Branches", "Central Billing", "Role-Based Access", "Stock Transfer"],
      metrics: [
        { label: "Active branches", value: "4", sub: "across 4 states" },
        { label: "Combined revenue", value: "₹8.4L", sub: "+9.5% MTD" },
        { label: "Stock transfers", value: "14", sub: "this month" },
      ],
      mockup: <MultiBranchMockup />,
      reverse: true,
      accentClass: "bg-sky-500/10 text-sky-600",
    },
  ];

  const tab = tabs[activeTab];

  return (
    <section id="features" className="relative overflow-hidden py-24 sm:py-28">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_45%_at_50%_-10%,oklch(0.58_0.24_260/0.08),transparent_70%)]" />

      <div className="mx-auto max-w-7xl px-6">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center mb-12">
          <SectionLabel>Core Platform</SectionLabel>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Everything your business needs,{" "}
            <span className="text-[color:var(--brand-electric)]">built in.</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground lg:text-lg">
            No fragmented add-ons. No messy sync scripts. Switch between modules instantly from one unified workspace.
          </p>
        </div>

        {/* Tab navigation — Segmented control */}
        <div className="flex justify-center mb-12">
          <div className="overflow-x-auto scrollbar-hide max-w-full p-1">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-secondary/70 p-1.5 backdrop-blur-md shadow-2xs">
              {tabs.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={activeTab === i}
                  onClick={() => setActiveTab(i)}
                  className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    activeTab === i
                      ? "text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/40"
                  }`}
                >
                  {activeTab === i && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute inset-0 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)]"
                      transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", bounce: 0.16, duration: 0.35 }}
                    />
                  )}
                  <t.icon className="relative z-10 h-4 w-4 flex-shrink-0" />
                  <span className="relative z-10">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab content with animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Live Metrics row */}
            <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6">
              {tab.metrics.map((m) => (
                <div key={m.label} className="rounded-2xl border border-border/80 bg-white p-4 sm:p-5 shadow-2xs transition-all hover:border-[color:var(--brand-electric)]/30">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{m.label}</p>
                  <p className="mt-1.5 text-2xl sm:text-3xl font-black text-foreground font-mono leading-none">{m.value}</p>
                  {m.sub && <p className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1 font-medium">{m.sub}</p>}
                </div>
              ))}
            </div>

            {/* Main 2-column layout */}
            <div className={`grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] ${tab.reverse ? "lg:grid-cols-[0.9fr_1.1fr]" : ""}`}>
              {/* Mockup Column */}
              <div className={`relative ${tab.reverse ? "lg:order-2" : "lg:order-1"}`}>
                {tab.mockup}
              </div>

              {/* Copy Column */}
              <div className={`${tab.reverse ? "lg:order-1 lg:pr-8" : "lg:order-2 lg:pl-8"}`}>
                <SectionLabel>{tab.eyebrow}</SectionLabel>
                <h3 className="mt-4 text-2xl font-black leading-[1.15] tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                  {tab.headline}
                </h3>
                <p className="mt-4 text-sm sm:text-base leading-relaxed text-muted-foreground">
                  {tab.description}
                </p>

                {/* Feature checklist */}
                <ul className="mt-7 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {tab.items.map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-foreground">
                      <span className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                {/* Trust badges */}
                <div className="mt-7 flex flex-wrap gap-2">
                  {tab.badges.map((b) => (
                    <span
                      key={b}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-secondary/50 px-3 py-1 text-[11px] font-bold text-foreground"
                    >
                      <CheckCircle2 className="h-3 w-3 text-[color:var(--brand-electric)]" />
                      {b}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div className="mt-8 flex items-center gap-4">
                  <Btn href="/signup" size="md">
                    Start With {tab.label} Free <ArrowRight className="h-3.5 w-3.5" />
                  </Btn>
                  <a
                    href="#contact"
                    className="text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground hover:underline underline-offset-4"
                  >
                    Request Live Demo →
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   AI SHOWCASE
───────────────────────────────────────────────────────────────── */

const CHAT_MESSAGES: { role: "user" | "ai"; text: string; action?: string }[] = [
  { role: "user", text: "How did sales perform today across all channels?" },
  { role: "ai", text: "You've completed ₹64,320 across 87 invoices — up 12% vs yesterday. Best seller: Amul Gold 1L (42 units). Meridian Retail accounts for 28% of today's total volume." },
  { role: "user", text: "Create draft invoice for Priya Traders with their 3 standard items." },
  { role: "ai", text: "Drafted Tax Invoice INV-1042 for Priya Traders with Amul Gold, Tata Salt, and Maggi. GST auto-computed at ₹3,780. Shall I dispatch directly to their WhatsApp?", action: "Preview Invoice (INV-1042)" },
  { role: "user", text: "Which products will stock out before Friday?" },
  { role: "ai", text: "Tata Salt 1kg has only 4 units remaining. Recommended reorder: 200 bags from Tata Consumer Products.", action: "Approve Restock PO" },
  { role: "user", text: "What's my estimated net GST liability for October?" },
  { role: "ai", text: "Output GST: ₹1,84,320 • Input Tax Credit (ITC): ₹92,110 • Net payable: ₹92,210. GSTR-1 payload is ready for 1-click filing before 11 November." },
];

function AIShowcase() {
  return (
    <section id="ai" className="relative overflow-hidden bg-[#0A0D14] py-24 sm:py-28 text-white">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1000px_500px_at_20%_0%,oklch(0.58_0.24_260/0.32),transparent_60%),radial-gradient(800px_450px_at_90%_100%,oklch(0.74_0.18_250/0.22),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 dot-grid-dark opacity-30" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-6 lg:grid-cols-2">
        {/* Left Copy */}
        <div>
          <SectionLabel dark>Autonomous AI Engine</SectionLabel>
          <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl leading-[1.08]">
            An executive operator,{" "}
            <span className="text-[color:var(--brand-glow)]">inside your business.</span>
          </h2>
          <p className="mt-5 max-w-lg text-base sm:text-lg leading-relaxed text-white/70">
            Ask in plain English or Hindi. Nexora AI understands your full operational context — sales, inventory, customers, ledger, and tax — and takes real action instead of merely chatting.
          </p>

          <div className="mt-8 space-y-4">
            {[
              { icon: Brain, title: "Answers questions with audited live data", desc: "Revenue, profit margins, top customers, tax liability — ask anything, receive instant verified figures." },
              { icon: FileText, title: "Drafts invoices, purchase orders & GSTR-1", desc: "Just say 'Draft invoice for Priya Traders' and it's generated with precise GST calculation in seconds." },
              { icon: Bell, title: "Proactive cashflow and inventory guardians", desc: "Flags low stock, payment delays, and cash flow deficits before they cost you business." },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition-all hover:bg-white/[0.06]">
                <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-white/10">
                  <item.icon className="h-5 w-5 text-[color:var(--brand-glow)]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{item.title}</p>
                  <p className="mt-1 text-xs sm:text-sm text-white/60 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-4">
            <Btn href="/signup" variant="white" size="lg">
              Try Nexora AI Free <ArrowRight className="h-4 w-4" />
            </Btn>
            <a href="#contact" className="text-sm font-semibold text-white/70 hover:text-white hover:underline underline-offset-4">
              Schedule AI Walkthrough →
            </a>
          </div>
        </div>

        {/* Right: AI Copilot Interface */}
        <div className="overflow-hidden rounded-3xl border border-white/15 bg-white/[0.04] backdrop-blur-xl shadow-[0_32px_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.08)]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5 bg-white/[0.03]">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[image:var(--gradient-brand)] text-white shadow-md">
                <Sparkles className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-sm font-bold text-white">Nexora AI Copilot</p>
                <p className="text-[10px] text-white/50">Full Business Context Model • v2.0</p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/15 border border-emerald-400/20 px-3 py-1 text-[10px] font-bold text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>
          </div>

          {/* Quick Query Pill Suggestions */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-5 py-2.5 border-b border-white/5 bg-white/[0.01]">
            <span className="text-[10px] uppercase font-bold text-white/40 shrink-0">Try asking:</span>
            {["Today's sales", "Stockout alerts", "Draft PO #108", "October GST"].map((chip) => (
              <span key={chip} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] text-white/70 whitespace-nowrap cursor-pointer hover:bg-white/10 hover:text-white">
                {chip}
              </span>
            ))}
          </div>

          {/* Chat thread */}
          <div className="max-h-[380px] overflow-y-auto p-5 space-y-3.5 scrollbar-hide">
            {CHAT_MESSAGES.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[88%] space-y-2">
                  <div className={`rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-white text-slate-950 font-medium shadow-sm"
                      : "bg-white/10 text-white border border-white/10 shadow-sm"
                  }`}>
                    {m.text}
                  </div>
                  {m.action && (
                    <button type="button" className="flex items-center gap-1.5 rounded-full border border-[color:var(--brand-electric)]/50 bg-[color:var(--brand-electric)]/20 px-3.5 py-1.5 text-xs font-bold text-[color:var(--brand-glow)] transition-all hover:bg-[color:var(--brand-electric)]/30 cursor-pointer">
                      <Check className="h-3.5 w-3.5 stroke-[3]" /> {m.action}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Input Bar */}
          <div className="border-t border-white/10 p-3.5 bg-white/[0.02]">
            <div className="flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-4 py-3">
              <Sparkles className="h-4 w-4 text-white/40 flex-shrink-0" />
              <input
                disabled
                placeholder="Ask anything about billing, stock, customers or finances…"
                className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder:text-white/35 focus:outline-none"
              />
              <button type="button" className="grid h-8 w-8 place-items-center rounded-full bg-[image:var(--gradient-brand)] flex-shrink-0 hover:scale-105 transition-transform">
                <ArrowRight className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   AI AGENTS SHOWCASE
───────────────────────────────────────────────────────────────── */

function AIAgentsShowcase() {
  const agents = [
    {
      title: "Business Intelligence Agent",
      description: "Synthesizes company-wide metrics and highlights emerging revenue trends, profit leaks, and critical priorities.",
      icon: Brain,
      tag: "Executive Insights",
      accent: "bg-indigo-50 text-indigo-700 ring-indigo-100",
    },
    {
      title: "Billing Intelligence Agent",
      description: "Monitors overdue invoices, prioritizes collection follow-ups, and auto-dispatches WhatsApp payment links with UPI QR.",
      icon: Wallet,
      tag: "Receivables & Cash",
      accent: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    },
    {
      title: "Inventory Intelligence Agent",
      description: "Tracks velocity across warehouse SKUs, predicts potential stockouts, and drafts vendor purchase orders ahead of demand.",
      icon: Warehouse,
      tag: "Supply Chain",
      accent: "bg-sky-50 text-sky-700 ring-sky-100",
    },
    {
      title: "CRM Intelligence Agent",
      description: "Monitors customer purchasing intervals, spots churn risks, and triggers automated loyalty and re-engagement campaigns.",
      icon: Users,
      tag: "Customer Success",
      accent: "bg-violet-50 text-violet-700 ring-violet-100",
    },
    {
      title: "Analytics & P&L Agent",
      description: "Translates complex financial statements into plain-language actionable breakdowns and automated GST filing payloads.",
      icon: FileText,
      tag: "Finance & Tax",
      accent: "bg-amber-50 text-amber-700 ring-amber-100",
    },
    {
      title: "Workflow Automation Agent",
      description: "Coordinates repetitive approvals, multi-branch stock transfers, and invoice dispatches under your verified rules.",
      icon: GitBranch,
      tag: "Operations",
      accent: "bg-blue-50 text-blue-700 ring-blue-100",
    },
  ];

  return (
    <section id="ai-agents" className="relative overflow-hidden border-y border-border/60 bg-secondary/20 py-20 sm:py-24">
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>Specialized Automation</SectionLabel>
          <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.035em] text-foreground sm:text-4xl lg:text-[2.75rem]">
            Meet Your Autonomous Business Agents
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground">
            Nexora deploys specialized AI agents across every department of your business, working silently in the background to keep operations running at peak efficiency.
          </p>
        </div>

        <div className="mt-11 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {agents.map(({ title, description, icon: Icon, tag, accent }) => (
            <article
              key={title}
              className="group flex min-h-[250px] flex-col rounded-2xl border border-border/80 bg-background p-5 shadow-[var(--shadow-card)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[color:var(--brand-electric)]/35 hover:shadow-[0_12px_32px_-20px_oklch(0.32_0.16_262/0.28)] sm:p-6 motion-reduce:transform-none"
            >
              <div className="flex items-start justify-between gap-4">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 ${accent} transition-transform duration-200 group-hover:scale-[1.04] motion-reduce:transform-none`}>
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <span className="pt-1 text-right text-[10px] font-semibold uppercase leading-4 tracking-[0.12em] text-muted-foreground">
                  {tag}
                </span>
              </div>

              <div className="mt-5 flex-1">
                <h3 className="text-base font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-[color:var(--brand-deep)] sm:text-[17px]">
                  {title}
                </h3>
                <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/70 pt-4">
                <span className="inline-flex min-w-0 items-center gap-2 text-[11px] font-medium text-muted-foreground">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span>
                    <span className="font-semibold text-emerald-700">Active</span>
                    <span aria-hidden="true"> · </span>24/7 Monitoring
                  </span>
                </span>
                <a
                  href="#contact"
                  aria-label={`Configure ${title}`}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md text-xs font-semibold text-[color:var(--brand-electric)] transition-[gap,color] duration-200 hover:gap-1.5 hover:text-[color:var(--brand-deep)]"
                >
                  Configure →
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   DASHBOARD PREVIEW (COMMAND CENTRE)
───────────────────────────────────────────────────────────────── */

function DashboardPreview() {
  return (
    <section className="relative bg-secondary/40 py-24 sm:py-28 border-y border-border/60">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <SectionLabel>Real-time Command Centre</SectionLabel>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            See every part of your business, live.
          </h2>
          <p className="mt-4 text-base sm:text-lg leading-relaxed text-muted-foreground">
            A single high-density operational command centre for sales, cashflow, pending receivables, and warehouse velocity.
          </p>
        </div>

        {/* Dashboard Shell Frame */}
        <div className="rounded-3xl border border-border/80 bg-card p-3 shadow-xl sm:p-5">
          <div className="overflow-hidden rounded-2xl border border-border bg-background">
            {/* KPI row */}
            <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-4">
              {[
                { icon: Wallet, label: "Total Revenue (MTD)", value: "₹8,42,910", delta: "+12.3%", sub: "vs last month" },
                { icon: ShoppingCart, label: "Orders Dispatched", value: "2,148", delta: "+6.8%", sub: "99.2% on-time" },
                { icon: Users, label: "Active Customer Base", value: "5,821", delta: "+3.2%", sub: "87% repeat rate" },
                { icon: TrendingUp, label: "Net Operating Margin", value: "₹2,10,480", delta: "+9.1%", sub: "25.0% margin" },
              ].map((k) => (
                <div key={k.label} className="bg-card px-5 py-5 sm:px-6">
                  <div className="flex items-center justify-between mb-2.5">
                    <p className="text-xs font-semibold text-muted-foreground">{k.label}</p>
                    <k.icon className="h-4 w-4 text-muted-foreground/60" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-foreground font-mono">{k.value}</p>
                  <div className="mt-1 flex items-center gap-1.5 text-xs">
                    <span className="font-bold text-emerald-600">{k.delta}</span>
                    <span className="text-muted-foreground">{k.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart + pending receivables */}
            <div className="grid grid-cols-1 gap-px bg-border lg:grid-cols-3">
              <div className="col-span-2 bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground">Revenue & Margin Growth Velocity</p>
                    <p className="text-xs text-muted-foreground">Real-time daily aggregates</p>
                  </div>
                  <div className="flex gap-1 border border-border rounded-lg p-0.5 bg-secondary/50 text-[11px]">
                    {["1W", "1M", "3M", "1Y"].map((r, i) => (
                      <span key={r} className={`rounded-md px-2.5 py-1 font-semibold cursor-pointer transition-colors ${
                        i === 1 ? "bg-white font-bold text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                      }`}>
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
                <ChartArea />
              </div>

              <div className="bg-card p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-foreground">Outstanding Receivables</p>
                    <span className="rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-bold text-red-600">
                      12 Pending
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">₹3,24,110 total awaiting settlement</p>
                  <div className="mt-5 space-y-3">
                    {[
                      { name: "Meridian Traders", amt: "₹42,300", status: "Due in 2 days", urgent: false },
                      { name: "Cascade Foods", amt: "₹18,900", status: "Due tomorrow", urgent: true },
                      { name: "Halcyon Retail", amt: "₹1,20,000", status: "Overdue 3 days", urgent: true },
                      { name: "Vertex Wholesale", amt: "₹24,600", status: "Due in 5 days", urgent: false },
                    ].map((p) => (
                      <div key={p.name} className="flex items-center justify-between rounded-xl bg-secondary/40 p-2.5 border border-border/50 text-xs">
                        <div>
                          <p className="font-semibold text-foreground">{p.name}</p>
                          <p className={`text-[10px] font-bold mt-0.5 ${p.urgent ? "text-red-600" : "text-muted-foreground"}`}>
                            {p.status}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-foreground font-mono">{p.amt}</p>
                          <span className="text-[10px] font-semibold text-[color:var(--brand-electric)] hover:underline cursor-pointer">
                            Send UPI QR →
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button type="button" className="mt-4 w-full rounded-xl border border-border/80 bg-secondary/60 py-2.5 text-xs font-bold text-foreground hover:bg-secondary cursor-pointer">
                  Auto-dispatch All WhatsApp Reminders
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ChartArea() {
  const points = [10, 22, 18, 30, 26, 40, 34, 48, 42, 58, 52, 64, 60, 72, 68, 82, 78, 90, 84, 95];
  const max = 100;
  const w = 640;
  const h = 180;
  const step = w / (points.length - 1);
  const path = points.map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (v / max) * h}`).join(" ");
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-44 w-full">
      <defs>
        <linearGradient id="chartArea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.58 0.24 260)" stopOpacity="0.32" />
          <stop offset="100%" stopColor="oklch(0.58 0.24 260)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#chartArea)" />
      <path d={path} fill="none" stroke="oklch(0.55 0.24 258)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────
   INTEGRATIONS
───────────────────────────────────────────────────────────────── */

const INTEGRATIONS_LIVE = [
  {
    name: "UPI Payments",
    category: "Payments",
    desc: "QR code on every invoice. Customers scan and pay instantly — no gateway fees.",
    icon: QrCode,
    color: "bg-orange-50 border-orange-100 text-orange-600",
  },
  {
    name: "Razorpay",
    category: "Payments",
    desc: "Accept cards, net banking, wallets and EMI. Payments reconciled automatically.",
    icon: CreditCard,
    color: "bg-blue-50 border-blue-100 text-blue-600",
  },
  {
    name: "Excel & CSV",
    category: "Data",
    desc: "Bulk-import products, customers and opening stock. Export any report instantly.",
    icon: FileText,
    color: "bg-emerald-50 border-emerald-100 text-emerald-600",
  },
  {
    name: "Barcode Scanner",
    category: "Hardware",
    desc: "USB and webcam barcode scanning built directly into inventory and billing.",
    icon: Scan,
    color: "bg-slate-50 border-slate-200 text-slate-600",
  },
  {
    name: "Thermal Printer",
    category: "Hardware",
    desc: "Print 58mm and 80mm POS receipts from any page, with one click.",
    icon: Printer,
    color: "bg-slate-50 border-slate-200 text-slate-600",
  },
  {
    name: "Email (SMTP)",
    category: "Email",
    desc: "Send invoices, payment reminders and statements directly from Nexora.",
    icon: Mail,
    color: "bg-red-50 border-red-100 text-red-600",
  },
];

const INTEGRATIONS_SOON = [
  { name: "WhatsApp Business", category: "Messaging", desc: "Auto-send invoices and payment reminders on WhatsApp.", quarter: "Q3 2026" },
  { name: "PhonePe", category: "Payments", desc: "Accept PhonePe merchant gateway payments seamlessly.", quarter: "Q3 2026" },
  { name: "Tally Export", category: "Accounting", desc: "Two-way sync with Tally ERP for zero-effort bookkeeping.", quarter: "Q4 2026" },
  { name: "Google Sheets", category: "Data", desc: "Live-sync your reports and business data to Sheets.", quarter: "Q4 2026" },
  { name: "Stripe", category: "Payments", desc: "Accept international cards, subscriptions and checkout.", quarter: "Q1 2027" },
  { name: "Developer API", category: "Platform", desc: "REST API and webhooks to build custom integrations.", quarter: "Q1 2027" },
  { name: "Google Workspace", category: "Productivity", desc: "Single sign-on and Drive integration for document storage.", quarter: "Q2 2027" },
  { name: "Microsoft 365", category: "Productivity", desc: "Outlook email dispatch and OneDrive backup support.", quarter: "Q2 2027" },
];

function Integrations() {
  return (
    <section id="integrations" className="py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6">

        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <SectionLabel>Integrations</SectionLabel>
          <h2 className="mt-5 text-3xl font-black leading-[1.08] tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
            Honest about what connects today.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            We only show integrations that are actually built and working. Everything else is clearly marked with its planned release date.
          </p>
        </div>

        {/* ── Available Today ── */}
        <div className="mb-12">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex items-center gap-2 text-[12px] font-semibold text-emerald-600 uppercase tracking-[0.15em]">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Available in Nexora v1.0
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {INTEGRATIONS_LIVE.map((int) => (
              <div
                key={int.name}
                className="group flex items-start gap-4 rounded-2xl border border-border bg-white p-5 shadow-[0_1px_4px_oklch(0.14_0.02_260/0.07)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[color:var(--brand-electric)]/30 hover:shadow-[0_8px_30px_oklch(0.14_0.02_260/0.10)]"
              >
                <span className={`mt-0.5 grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl border ${int.color}`}>
                  <int.icon className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{int.name}</p>
                  <p className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider mt-0.5">{int.category}</p>
                  <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{int.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Coming Soon ── */}
        <div>
          <div className="mb-5 flex items-center gap-3">
            <span className="flex items-center gap-2 text-[12px] font-semibold text-amber-600 uppercase tracking-[0.15em]">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Coming soon — not available today
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {INTEGRATIONS_SOON.map((int) => (
              <div
                key={int.name}
                className="flex flex-col gap-3 rounded-2xl border border-dashed border-border/70 bg-secondary/30 p-4 opacity-75 transition-opacity hover:opacity-100"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground/70">{int.name}</p>
                    <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider mt-0.5">{int.category}</p>
                  </div>
                  <span className="flex-shrink-0 rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-[9px] font-semibold text-amber-600 uppercase tracking-wider">
                    {int.quarter}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground/60">{int.desc}</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground/50">
                  <Clock3 className="h-3 w-3" /> Coming Soon
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Don't see what you need?{" "}
          <a href="#contact" className="font-semibold text-[color:var(--brand-electric)] hover:underline underline-offset-4">
            Request an integration →
          </a>
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SECURITY & TRUST
───────────────────────────────────────────────────────────────── */

function Security() {
  const pillars = [
    {
      icon: Lock,
      title: "End-to-End Encryption",
      desc: "All data is encrypted at rest (AES-256) and in transit (TLS 1.3). Your business data is never readable by anyone but you.",
    },
    {
      icon: Cloud,
      title: "Automatic Cloud Backup",
      desc: "Daily automated backups with 30-day point-in-time restore. Business continuity guaranteed even in disaster scenarios.",
    },
    {
      icon: Key,
      title: "Role-Based Access Control",
      desc: "Define exactly what each employee can see and do. Cashiers, managers, accountants — each with the right access level.",
    },
    {
      icon: FileText,
      title: "Complete Audit Logs",
      desc: "Every action, change and login is logged with user, time and IP. Full accountability across your entire team.",
    },
    {
      icon: Shield,
      title: "99.9% Uptime SLA",
      desc: "Hosted on enterprise-grade cloud infrastructure with automatic failover. Your business never stops because Nexora does.",
    },
    {
      icon: Globe,
      title: "GST Compliance Built In",
      desc: "Stays current with every GST notification. GSTR-1 export, e-invoice, and e-way bills handled automatically.",
    },
  ];
  return (
    <section id="security" className="bg-[color:var(--brand-deep)] py-20 text-white lg:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-glow)]">Enterprise Trust</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            Enterprise-grade security,{" "}
            <span className="text-[color:var(--brand-glow)]">SMB-friendly pricing.</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/60">
            The same security standards used by Fortune 500 companies — available to every business on Nexora from day one.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map((p) => (
            <div
              key={p.title}
              className="group rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur transition-all duration-300 hover:bg-white/10 hover:border-[color:var(--brand-glow)]/30"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[color:var(--brand-glow)] transition-colors group-hover:bg-[image:var(--gradient-brand)]">
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-base font-semibold text-white">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{p.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-wrap items-center justify-center gap-6">
          {[
            "AES-256 Encryption", "TLS 1.3 in Transit", "Daily Backups",
            "RBAC Access Control", "GST Compliant", "99.9% SLA",
          ].map((badge) => (
            <span key={badge} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80">
              <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--brand-glow)]" />
              {badge}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   TESTIMONIALS
───────────────────────────────────────────────────────────────── */

const TESTIMONIALS = [
  {
    quote: "We replaced four different tools with Nexora. Monthly closing dropped from 2 weeks to 2 days. The AI catches things I'd miss on my busiest days.",
    name: "Priya Sharma",
    role: "Founder",
    company: "Meridian Retail, Bengaluru",
    revenue: "₹2.4 Cr annual revenue",
  },
  {
    quote: "The AI flagged a stock issue on a Friday afternoon that would have cost us a full weekend of sales. That one alert paid for a year's subscription.",
    name: "Rahul Menon",
    role: "COO",
    company: "Cascade Foods, Mumbai",
    revenue: "₹1.8 Cr annual revenue",
  },
  {
    quote: "One login for billing, inventory and reports across all 4 branches. Our store managers actually enjoy using it — that alone was worth it.",
    name: "Ananya Iyer",
    role: "Head of Operations",
    company: "Halcyon Group, Chennai",
    revenue: "4 branches · ₹5.1 Cr revenue",
  },
];

function Testimonials() {
  return (
    <section className="bg-secondary/40 py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <SectionLabel>Customer Stories</SectionLabel>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Real businesses. Measurable results.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            Nexora customers don't just save time — they make better decisions, catch more problems and grow faster.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col rounded-3xl border border-border bg-white p-8 shadow-[0_1px_4px_oklch(0.14_0.02_260/0.07)] transition-all duration-300 hover:shadow-[var(--shadow-elegant)] hover:-translate-y-0.5"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <blockquote className="flex-1 text-base leading-relaxed text-foreground">
                "{t.quote}"
              </blockquote>

              <figcaption className="mt-6 pt-6 border-t border-border flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-[image:var(--gradient-brand)] text-sm font-bold text-white flex-shrink-0">
                  {t.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role} · {t.company}</p>
                  <p className="text-xs font-medium text-[color:var(--brand-electric)] mt-0.5">{t.revenue}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   PRICING
───────────────────────────────────────────────────────────────── */

const PLANS = [
  {
    name: "Starter",
    price: "₹299",
    period: "/month",
    tagline: "For solo operators and small shops.",
    highlight: false,
    badge: null,
    features: [
      "Dashboard & analytics",
      "GST billing & invoicing",
      "Up to 500 invoices/month",
      "Customer management",
      "Inventory management",
      "Basic AI assistant",
      "PDF export & print",
      "Email support",
    ],
    cta: "Start Free Trial",
  },
  {
    name: "Growth",
    price: "₹499",
    period: "/month",
    tagline: "For growing businesses that need everything.",
    highlight: true,
    badge: "Most Popular",
    features: [
      "Everything in Starter",
      "Unlimited invoices",
      "CRM & sales pipeline",
      "Finance & cash flow",
      "Full AI business assistant",
      "Recurring invoices",
      "Multi-user (up to 5)",
      "Razorpay & PhonePe",
      "WhatsApp notifications",
      "Priority support",
    ],
    cta: "Start Free Trial",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    tagline: "For multi-branch and high-volume operations.",
    highlight: false,
    badge: null,
    features: [
      "Everything in Growth",
      "Multi-branch management",
      "Unlimited users",
      "Advanced AI & forecasting",
      "Custom integrations",
      "SLA guarantee",
      "Dedicated account manager",
      "Custom onboarding",
      "API access & webhooks",
      "SSO & advanced RBAC",
    ],
    cta: "Talk to Sales",
  },
];

function Pricing() {
  return (
    <section id="pricing" className="py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <SectionLabel>Pricing</SectionLabel>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Simple, honest pricing.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            No hidden fees. No per-feature upsells. Choose a plan and get everything listed — including a 14-day free trial on every paid plan.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative overflow-hidden rounded-3xl border transition-all duration-300 ${
                plan.highlight
                  ? "border-[color:var(--brand-electric)]/40 bg-[color:var(--brand-deep)] text-white shadow-[var(--shadow-elegant)] lg:scale-[1.02]"
                  : "border-border bg-white shadow-[0_1px_4px_oklch(0.14_0.02_260/0.07)] hover:shadow-[var(--shadow-elegant)] hover:-translate-y-1"
              }`}
            >
              {plan.highlight && (
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_300px_at_100%_0%,oklch(0.72_0.19_250/0.3),transparent_60%)]" />
              )}
              {plan.badge && (
                <div className="absolute -right-8 top-5 rotate-45 bg-[image:var(--gradient-brand)] px-10 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  {plan.badge}
                </div>
              )}

              <div className="relative p-8">
                <p className={`text-sm font-semibold ${plan.highlight ? "text-[color:var(--brand-glow)]" : "text-[color:var(--brand-electric)]"}`}>
                  {plan.name}
                </p>
                <p className={`mt-1 text-sm ${plan.highlight ? "text-white/60" : "text-muted-foreground"}`}>
                  {plan.tagline}
                </p>

                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className={`text-5xl font-black tracking-tight ${plan.highlight ? "text-white" : "text-foreground"}`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={`text-sm ${plan.highlight ? "text-white/50" : "text-muted-foreground"}`}>
                      {plan.period} · GST inclusive
                    </span>
                  )}
                </div>

                <ul className={`mt-7 space-y-3 text-sm ${plan.highlight ? "text-white/80" : "text-foreground/80"}`}>
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className={`mt-0.5 h-4 w-4 flex-shrink-0 ${plan.highlight ? "text-[color:var(--brand-glow)]" : "text-[color:var(--brand-electric)]"}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href="#contact"
                  className={`mt-8 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 ${
                    plan.highlight
                      ? "bg-white text-[color:var(--brand-deep)] hover:shadow-lg"
                      : "bg-[image:var(--gradient-brand)] text-white shadow-[var(--shadow-elegant)] hover:shadow-[0_24px_60px_-16px_oklch(0.62_0.22_258/0.5)]"
                  }`}
                >
                  {plan.cta} <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          All plans include a 14-day free trial. No credit card required to start.{" "}
          <a href="#faq" className="font-semibold text-[color:var(--brand-electric)] hover:underline underline-offset-4">
            Have questions? See FAQ →
          </a>
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   COMING SOON (ROADMAP)
───────────────────────────────────────────────────────────────── */

type RoadmapStatus = "In Development" | "In Design" | "Planned";

const ROADMAP: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  quarter: string;
  status: RoadmapStatus;
  value: string;
}[] = [
  {
    icon: MessageCircle,
    title: "WhatsApp Business",
    desc: "Sell, notify and support your customers where they already spend their time — with AI-powered replies and automated invoice delivery via WhatsApp.",
    quarter: "Q3 2026",
    status: "In Development",
    value: "Eliminate manual follow-up for 80% of payment reminders.",
  },
  {
    icon: UserCog,
    title: "Employee Management",
    desc: "A complete HR toolkit — attendance tracking, leave management, payroll calculation and performance reviews — built directly into your existing business OS.",
    quarter: "Q4 2026",
    status: "In Development",
    value: "Manage your entire workforce without a separate HR system.",
  },
  {
    icon: ShieldCheck,
    title: "Advanced Roles & Permissions",
    desc: "Granular access control with pre-built roles, custom permission sets and approval workflows — so every team member sees only what they need.",
    quarter: "Q4 2026",
    status: "In Design",
    value: "Prevent data leakage and enforce accountability at every level.",
  },
  {
    icon: Smartphone,
    title: "Native Mobile Apps",
    desc: "Full-featured Android and iOS apps that work fully offline — run billing, inventory and approvals from your pocket, with or without internet.",
    quarter: "Q1 2027",
    status: "In Design",
    value: "Stay in control of your business 24/7, from anywhere.",
  },
  {
    icon: Bot,
    title: "Specialised AI Agents",
    desc: "Dedicated AI agents for sales forecasting, inventory optimisation, accounting reconciliation and customer support — each trained on your business data.",
    quarter: "Q1 2027",
    status: "Planned",
    value: "Automate complex business decisions without hiring specialists.",
  },
  {
    icon: Puzzle,
    title: "Extended Integrations",
    desc: "Deep two-way sync with Tally ERP, Zoho Books, QuickBooks, POS machines and the complete suite of Indian enterprise tools including e-Invoice and e-Way Bill.",
    quarter: "Q2 2027",
    status: "Planned",
    value: "Connect your existing accounting stack without changing your workflow.",
  },
];

const STATUS_STYLE: Record<RoadmapStatus, { pill: string; bar: string; label: string }> = {
  "In Development": {
    pill: "bg-amber-50 border-amber-100 text-amber-700",
    bar: "bg-amber-400",
    label: "In Development",
  },
  "In Design": {
    pill: "bg-sky-50 border-sky-100 text-sky-700",
    bar: "bg-sky-400",
    label: "In Design",
  },
  Planned: {
    pill: "bg-slate-100 border-slate-200 text-slate-600",
    bar: "bg-slate-300",
    label: "Planned",
  },
};

function ComingSoon() {
  return (
    <section id="roadmap" className="relative overflow-hidden py-20 lg:py-24">
      {/* Subtle background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_100%,oklch(0.62_0.22_258/0.04),transparent_70%)]" />

      <div className="mx-auto max-w-7xl px-6">

        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <SectionLabel>Roadmap</SectionLabel>
          <h2 className="mt-5 text-3xl font-black leading-[1.08] tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
            Built in the open.{" "}
            <span className="text-[color:var(--brand-electric)]">Shipped every month.</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            Every feature below is <strong className="font-semibold text-foreground">planned, not yet available.</strong> We publish our roadmap because transparency is the foundation of trust.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ROADMAP.map((r) => {
            const s = STATUS_STYLE[r.status];
            return (
              <div
                key={r.title}
                className="group flex flex-col rounded-3xl border border-border bg-white p-8 shadow-[0_1px_4px_oklch(0.14_0.02_260/0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_oklch(0.14_0.02_260/0.10)]"
              >
                {/* Icon */}
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-secondary text-[color:var(--brand-deep)] transition-colors duration-300 group-hover:bg-[image:var(--gradient-brand)] group-hover:border-transparent group-hover:text-white">
                  <r.icon className="h-6 w-6" />
                </div>

                {/* Title + desc */}
                <h3 className="text-[1.1rem] font-bold leading-snug text-foreground">{r.title}</h3>
                <p className="mt-3 text-sm leading-[1.7] text-muted-foreground flex-1">{r.desc}</p>

                {/* Divider */}
                <div className="my-6 h-px bg-border" />

                {/* Meta grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-medium text-muted-foreground">Expected release</span>
                    <span className="font-semibold text-foreground">{r.quarter}</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-medium text-muted-foreground">Status</span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${s.pill}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${s.bar}`} />
                      {s.label}
                    </span>
                  </div>
                  <div className="rounded-xl bg-secondary/50 px-4 py-3 text-[12px] leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-foreground">Business value · </span>
                    {r.value}
                  </div>
                </div>

                {/* CTA */}
                <a
                  href="#contact"
                  className="mt-6 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[color:var(--brand-electric)] transition-all duration-200 hover:gap-2.5"
                >
                  Get notified when it launches
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="mx-auto mt-14 max-w-lg text-center text-[12px] leading-relaxed text-muted-foreground">
          Roadmap items are shared for transparency and may shift. Nothing above is available today.{" "}
          <a className="font-semibold text-foreground underline underline-offset-4 hover:text-[color:var(--brand-electric)]" href="#contact">
            Request early access →
          </a>
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   FAQ
───────────────────────────────────────────────────────────────── */

const FAQS = [
  {
    q: "Is GST fully supported, including e-invoicing?",
    a: "Yes. Nexora calculates CGST, SGST and IGST automatically on every invoice. You get monthly GST summaries, GSTR-1 export, and e-invoicing (IRN generation) support. GST compliance is core to the platform, not an add-on.",
  },
  {
    q: "How long does it take to get set up?",
    a: "Most businesses are billing their first customer within 30 minutes. Import your products from an Excel file, enter your GSTIN and bank details, and start. No consultant, no implementation project, no training budget.",
  },
  {
    q: "Can I migrate data from my existing software or Excel?",
    a: "Yes. Nexora supports bulk import of products, customers, suppliers and opening stock from CSV or Excel. For complex migrations from Tally or other software, our team assists at no extra cost.",
  },
  {
    q: "How does the AI assistant actually work?",
    a: "Nexora AI is trained on your business data — your products, customers, transactions and history. You ask questions in plain English (or Hindi) and it answers using your actual data. It can also draft invoices, generate reminders and flag anomalies proactively.",
  },
  {
    q: "Does it work on mobile?",
    a: "Yes. The web app is fully responsive and works on any phone, tablet or desktop browser without an install. Native Android and iOS apps with offline mode are on the roadmap.",
  },
  {
    q: "What happens to my data if I cancel?",
    a: "You can export all your data — customers, invoices, products, reports — in CSV or PDF format at any time. Your data belongs to you. We provide a 90-day data retention window after cancellation.",
  },
  {
    q: "Is multi-user access included?",
    a: "Growth plan includes up to 5 users. Enterprise plan is unlimited. Each user can be assigned a role (Admin, Manager, Cashier, Accountant, Warehouse) with custom permissions for exactly what they can see and do.",
  },
  {
    q: "How is my data secured?",
    a: "All data is encrypted at rest (AES-256) and in transit (TLS 1.3), stored on enterprise cloud infrastructure with daily automated backups and 30-day restore. No Nexora employee can read your data without explicit audit log entry.",
  },
  {
    q: "Can I manage multiple branches or stores?",
    a: "Yes, with the Enterprise plan. Each branch gets its own inventory, billing and reports, plus a centralised view across all branches. Central billing, stock transfer between branches, and branch performance comparison are all included.",
  },
  {
    q: "Do you offer a demo or onboarding help?",
    a: "Yes. Book a 30-minute live demo with our team who will walk through your specific business use case. Enterprise customers get a dedicated onboarding engineer and a custom setup session.",
  },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-20 lg:py-24">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center mb-14">
          <SectionLabel>FAQ</SectionLabel>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Questions business owners actually ask.
          </h2>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_1px_4px_oklch(0.14_0.02_260/0.07)]">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            const isLast = i === FAQS.length - 1;
            return (
              <div key={f.q} className={!isLast ? "border-b border-border" : ""}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-start gap-4 px-6 py-5 text-left transition-colors hover:bg-secondary/40"
                >
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-foreground sm:text-base">{f.q}</span>
                    {isOpen && (
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground pr-4">{f.a}</p>
                    )}
                  </div>
                  <span className="mt-0.5 grid h-7 w-7 flex-shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-colors">
                    {isOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Still have questions?{" "}
          <a href="#contact" className="font-semibold text-[color:var(--brand-electric)] hover:underline underline-offset-4">
            Talk to our team →
          </a>
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   CONTACT
───────────────────────────────────────────────────────────────── */

function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <section id="contact" className="bg-secondary/40 py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <SectionLabel>Get in Touch</SectionLabel>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Let's talk about your business.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            Book a demo, ask a question, or request a custom quote. Our team is online and responds within 2 hours on business days.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-4">
            {[
              { icon: Mail, title: "Email us", value: "hello@nexora.app", sub: "Replies within 2 hours" },
              { icon: Phone, title: "Call us", value: "+91 80 4718 0000", sub: "Mon–Sat, 9am–7pm IST" },
              { icon: MapPin, title: "Visit us", value: "Prestige Tower, 14th Floor", sub: "MG Road, Bengaluru 560001" },
            ].map((c) => (
              <div key={c.title} className="flex items-start gap-4 rounded-2xl border border-border bg-white p-5 shadow-[0_1px_4px_oklch(0.14_0.02_260/0.07)]">
                <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-[image:var(--gradient-brand)] text-white">
                  <c.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c.title}</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">{c.value}</p>
                  <p className="text-xs text-muted-foreground">{c.sub}</p>
                </div>
              </div>
            ))}

            <div className="rounded-2xl border border-[color:var(--brand-electric)]/20 bg-[color:var(--brand-electric)]/5 p-5">
              <p className="text-sm font-semibold text-foreground mb-2">Book a live demo</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                30 minutes with a Nexora product specialist. We'll walk through your specific business use case and answer every question.
              </p>
              <Btn href="#contact" size="sm" className="mt-4">
                Schedule Demo <ArrowRight className="h-3.5 w-3.5" />
              </Btn>
            </div>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); setSent(true); }}
            className="rounded-3xl border border-border bg-white p-8 shadow-[0_1px_4px_oklch(0.14_0.02_260/0.07)]"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { label: "Full Name", type: "text", placeholder: "Aarav Sharma", required: true },
                { label: "Work Email", type: "email", placeholder: "you@company.com", required: true },
              ].map((f) => (
                <label key={f.label} className="block">
                  <span className="text-xs font-semibold text-foreground">{f.label}</span>
                  <input required={f.required} type={f.type} placeholder={f.placeholder}
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-all focus:border-[color:var(--brand-electric)] focus:ring-2 focus:ring-[color:var(--brand-electric)]/20"
                  />
                </label>
              ))}
            </div>
            <label className="mt-4 block">
              <span className="text-xs font-semibold text-foreground">Business Name</span>
              <input type="text" placeholder="Sharma Traders Pvt. Ltd."
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-all focus:border-[color:var(--brand-electric)] focus:ring-2 focus:ring-[color:var(--brand-electric)]/20"
              />
            </label>
            <label className="mt-4 block">
              <span className="text-xs font-semibold text-foreground">How can we help?</span>
              <textarea required rows={4} placeholder="Tell us about your business and what you're looking for…"
                className="mt-1.5 w-full resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-all focus:border-[color:var(--brand-electric)] focus:ring-2 focus:ring-[color:var(--brand-electric)]/20"
              />
            </label>
            <button type="submit"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[image:var(--gradient-brand)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-elegant)] transition-transform duration-300 hover:-translate-y-0.5"
            >
              {sent ? "Message sent — we'll be in touch soon ✓" : (
                <><span>Send message</span><ArrowRight className="h-4 w-4" /></>
              )}
            </button>
            <p className="mt-3 text-xs text-muted-foreground">
              By submitting you agree to be contacted by the Nexora team. No spam, ever.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   FINAL CTA
───────────────────────────────────────────────────────────────── */

function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-[color:var(--brand-deep)] px-6 py-16 text-center text-white shadow-[var(--shadow-elegant)] sm:px-16 sm:py-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_400px_at_50%_-10%,oklch(0.72_0.19_250/0.45),transparent_55%),radial-gradient(600px_300px_at_50%_120%,oklch(0.55_0.24_258/0.4),transparent_60%)]" />
          {/* Subtle grid */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:48px_48px]" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              14-day free trial · No credit card required
            </span>
            <h2 className="mx-auto max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Ready to run your business on intelligence?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-white/60 leading-relaxed">
              Join 12,000+ operators who replaced spreadsheets and disconnected tools with one platform that actually thinks.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Btn href="/signup" variant="white" size="lg">
                Start Free Trial — 14 days free <ArrowRight className="h-4 w-4" />
              </Btn>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/8 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/15"
              >
                Book a Demo
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/50">
              {["No credit card needed", "Cancel anytime", "Live in 30 minutes", "Full support included"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-[color:var(--brand-glow)]" /> {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   FOOTER
───────────────────────────────────────────────────────────────── */

function Footer() {
  const groups = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#pricing" },
        { label: "AI Assistant", href: "#ai" },
        { label: "Roadmap", href: "#roadmap" },
        { label: "Changelog", href: "#" },
        { label: "Status", href: "#" },
      ],
    },
    {
      title: "Solutions",
      links: [
        { label: "Retail & FMCG", href: "#" },
        { label: "Wholesale & Distribution", href: "#" },
        { label: "Restaurants & F&B", href: "#" },
        { label: "Healthcare & Pharma", href: "#" },
        { label: "Multi-branch Chains", href: "#" },
      ],
    },
    {
      title: "Developers",
      links: [
        { label: "API Reference", href: "#" },
        { label: "Documentation", href: "#" },
        { label: "Webhooks", href: "#" },
        { label: "SDKs", href: "#" },
        { label: "Integrations", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Nexora", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Careers", href: "#" },
        { label: "Press", href: "#" },
        { label: "Contact", href: "#contact" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Help Center", href: "#" },
        { label: "Community", href: "#" },
        { label: "Book a Demo", href: "#contact" },
        { label: "Privacy Policy", href: "#" },
        { label: "Terms of Service", href: "#" },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-background">
      {/* Newsletter strip */}
      <div className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-foreground">Stay ahead with Nexora updates</p>
              <p className="text-xs text-muted-foreground mt-0.5">Product launches, GST updates and business growth tips — monthly.</p>
            </div>
            <form className="flex w-full max-w-sm gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="you@company.com"
                className="flex-1 rounded-xl border border-border bg-secondary px-4 py-2 text-sm text-foreground outline-none transition focus:border-[color:var(--brand-electric)] focus:ring-2 focus:ring-[color:var(--brand-electric)]/20"
              />
              <Btn href="#" size="sm">
                Subscribe
              </Btn>
            </form>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-7">
          {/* Brand */}
          <div className="col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              The AI Business Operating System. One intelligent platform to run billing, inventory, CRM, finance and teams — built for modern Indian businesses.
            </p>
            <div className="mt-5 flex gap-2">
              {[
                { label: "X", title: "Twitter / X" },
                { label: "In", title: "LinkedIn" },
                { label: "Ig", title: "Instagram" },
                { label: "Yt", title: "YouTube" },
              ].map((s) => (
                <a
                  key={s.label}
                  href="#"
                  title={s.title}
                  className="grid h-9 w-9 place-items-center rounded-full border border-border text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* Link groups */}
          {groups.map((g) => (
            <div key={g.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
                {g.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {g.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© 2026 Nexora Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            {["Privacy Policy", "Terms of Service", "Security", "Cookie Policy"].map((l) => (
              <a key={l} href="#" className="transition-colors hover:text-foreground">{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────────── */

function Landing() {
  // Safety net: Supabase email links land here with #access_token or #error
  // when /auth/callback isn't yet whitelisted in the Supabase redirect URLs list.
  // Use window.location.replace so the raw hash is preserved exactly as-is
  // (Supabase's client reads it directly from window.location.hash).
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && (hash.includes("access_token=") || hash.includes("error="))) {
      window.location.replace(`/auth/callback${hash}`);
    }
  }, []);

  return (
    <div className="landing-page min-h-screen bg-background text-foreground antialiased">
      <Nav />
      <main>
        <Hero />
        <StatsBanner />
        <TrustedBy />
        <Features />
        <AIShowcase />
        <AIAgentsShowcase />
        <DashboardPreview />
        <Integrations />
        <Security />
        <Testimonials />
        <Pricing />
        <ComingSoon />
        <FAQ />
        <Contact />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
