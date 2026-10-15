import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useId } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2, User, FileText, MapPin, Settings, CheckCircle2,
  Loader2, ChevronRight, ChevronLeft, Sparkles,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useBusiness } from "../../contexts/BusinessContext";
import { Logo } from "../../components/Logo";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingPage,
});

// ── Types ─────────────────────────────────────────────────────────

type WizardData = {
  business_name: string;
  business_type: string;
  logo_url: string;
  owner_name: string;
  phone: string;
  email: string;
  gst_number: string;
  pan_number: string;
  currency: string;
  timezone: string;
  financial_year: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  invoice_prefix: string;
  invoice_number_format: string;
  tax_enabled: boolean;
  language: string;
  theme: string;
};

const DEFAULTS: WizardData = {
  business_name: "",
  business_type: "",
  logo_url: "",
  owner_name: "",
  phone: "",
  email: "",
  gst_number: "",
  pan_number: "",
  currency: "INR",
  timezone: "Asia/Kolkata",
  financial_year: "April-March",
  address: "",
  city: "",
  state: "",
  country: "India",
  postal_code: "",
  invoice_prefix: "INV",
  invoice_number_format: "INV-{YYYY}-{####}",
  tax_enabled: true,
  language: "en",
  theme: "light",
};

// ── Step metadata ─────────────────────────────────────────────────

const STEPS = [
  { title: "Welcome",          short: "Welcome",  icon: Sparkles   },
  { title: "Business Info",    short: "Business", icon: Building2  },
  { title: "Owner Details",    short: "Owner",    icon: User       },
  { title: "Business Details", short: "Details",  icon: FileText   },
  { title: "Address",          short: "Address",  icon: MapPin     },
  { title: "Preferences",      short: "Prefs",    icon: Settings   },
  { title: "Complete",         short: "Done",     icon: CheckCircle2 },
];

// ── Per-step validation ───────────────────────────────────────────

type Errors = Record<string, string>;

function validate(step: number, d: WizardData): Errors {
  const e: Errors = {};
  if (step === 1) {
    if (!d.business_name.trim()) e.business_name = "Business name is required";
    if (!d.business_type)        e.business_type  = "Please select a business type";
  }
  if (step === 2) {
    if (!d.owner_name.trim()) e.owner_name = "Owner name is required";
    if (!d.phone.trim())      e.phone      = "Phone number is required";
    else if (!/^\+?[\d\s\-()]{7,15}$/.test(d.phone)) e.phone = "Enter a valid phone number";
    if (!d.email.trim())      e.email      = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) e.email = "Enter a valid email";
  }
  if (step === 3) {
    if (!d.currency) e.currency = "Please select a currency";
    if (!d.timezone) e.timezone = "Please select a timezone";
    if (d.gst_number && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(d.gst_number))
      e.gst_number = "Invalid GST format (e.g. 22AAAAA0000A1Z5)";
    if (d.pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(d.pan_number))
      e.pan_number = "Invalid PAN format (e.g. AAAAA9999A)";
  }
  if (step === 4) {
    if (!d.address.trim())     e.address     = "Address is required";
    if (!d.city.trim())        e.city        = "City is required";
    if (!d.state.trim())       e.state       = "State is required";
    if (!d.country.trim())     e.country     = "Country is required";
    if (!d.postal_code.trim()) e.postal_code = "PIN / postal code is required";
  }
  if (step === 5) {
    if (!d.invoice_prefix.trim()) e.invoice_prefix = "Invoice prefix is required";
  }
  return e;
}

// ── Reusable primitives ───────────────────────────────────────────

function Field({
  label, error, required = false, children,
}: {
  label: string; error?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

const inputCls =
  "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm " +
  "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring " +
  "focus:border-transparent transition-colors disabled:opacity-50";

const selectCls = inputCls + " cursor-pointer";

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={inputCls} {...props} />;
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return <select className={selectCls} {...props} />;
}

// ── Step components ───────────────────────────────────────────────

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center text-center py-4">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[image:var(--gradient-brand)] shadow-[var(--shadow-elegant)]">
        <Sparkles className="h-9 w-9 text-white" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground">
        Welcome to Nexora!
      </h2>
      <p className="mt-3 max-w-sm text-sm text-muted-foreground leading-relaxed">
        Nexora is your all-in-one AI-powered business operating system — GST billing,
        inventory, CRM, finance, and smart insights in one beautiful platform.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Let's get your business set up in about 2 minutes.
      </p>
      <button
        onClick={onNext}
        className="mt-8 flex items-center gap-2 rounded-xl bg-[image:var(--gradient-brand)] px-8 py-3 text-sm font-semibold text-white shadow-[var(--shadow-elegant)] hover:opacity-90 transition-opacity"
      >
        Let's set up your business
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

const BUSINESS_TYPES = [
  "Retail", "Wholesale", "Restaurant", "Pharmacy",
  "Manufacturing", "Service", "Other",
];

function StepBusiness({
  data, onChange, errors,
}: {
  data: WizardData; onChange: (k: keyof WizardData, v: string) => void; errors: Errors;
}) {
  return (
    <div className="space-y-5">
      <Field label="Business Name" required error={errors.business_name}>
        <Input
          placeholder="e.g. Sharma Traders"
          value={data.business_name}
          onChange={(e) => onChange("business_name", e.target.value)}
        />
      </Field>

      <Field label="Business Type" required error={errors.business_type}>
        <Select
          value={data.business_type}
          onChange={(e) => onChange("business_type", e.target.value)}
        >
          <option value="">Select type…</option>
          {BUSINESS_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
      </Field>

      <Field label="Business Logo URL" error={errors.logo_url}>
        <Input
          type="url"
          placeholder="https://example.com/logo.png  (optional)"
          value={data.logo_url}
          onChange={(e) => onChange("logo_url", e.target.value)}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Paste a public image URL. You can update this later from settings.
        </p>
      </Field>
    </div>
  );
}

function StepOwner({
  data, onChange, errors,
}: {
  data: WizardData; onChange: (k: keyof WizardData, v: string) => void; errors: Errors;
}) {
  return (
    <div className="space-y-5">
      <Field label="Owner / Director Name" required error={errors.owner_name}>
        <Input
          placeholder="e.g. Rajesh Sharma"
          value={data.owner_name}
          onChange={(e) => onChange("owner_name", e.target.value)}
        />
      </Field>

      <Field label="Phone Number" required error={errors.phone}>
        <Input
          type="tel"
          placeholder="e.g. +91 98765 43210"
          value={data.phone}
          onChange={(e) => onChange("phone", e.target.value)}
        />
      </Field>

      <Field label="Business Email" required error={errors.email}>
        <Input
          type="email"
          placeholder="e.g. info@sharmatraders.com"
          value={data.email}
          onChange={(e) => onChange("email", e.target.value)}
        />
      </Field>
    </div>
  );
}

const CURRENCIES = [
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "AED", label: "AED — UAE Dirham" },
  { value: "SGD", label: "SGD — Singapore Dollar" },
  { value: "AUD", label: "AUD — Australian Dollar" },
];

const TIMEZONES = [
  { value: "Asia/Kolkata",       label: "Asia/Kolkata (IST, UTC+5:30)" },
  { value: "UTC",                label: "UTC" },
  { value: "Asia/Dubai",         label: "Asia/Dubai (GST, UTC+4)" },
  { value: "Asia/Singapore",     label: "Asia/Singapore (SGT, UTC+8)" },
  { value: "Asia/Tokyo",         label: "Asia/Tokyo (JST, UTC+9)" },
  { value: "Europe/London",      label: "Europe/London (GMT/BST)" },
  { value: "Europe/Paris",       label: "Europe/Paris (CET, UTC+1)" },
  { value: "America/New_York",   label: "America/New_York (EST/EDT)" },
  { value: "America/Los_Angeles",label: "America/Los_Angeles (PST/PDT)" },
  { value: "Australia/Sydney",   label: "Australia/Sydney (AEST, UTC+10)" },
];

const FINANCIAL_YEARS = [
  { value: "April-March",   label: "April – March (India default)" },
  { value: "January-December", label: "January – December" },
  { value: "July-June",     label: "July – June" },
  { value: "October-September", label: "October – September" },
];

function StepDetails({
  data, onChange, errors,
}: {
  data: WizardData; onChange: (k: keyof WizardData, v: string) => void; errors: Errors;
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="GST Number" error={errors.gst_number}>
          <Input
            placeholder="22AAAAA0000A1Z5  (optional)"
            value={data.gst_number}
            onChange={(e) => onChange("gst_number", e.target.value.toUpperCase())}
            maxLength={15}
          />
        </Field>
        <Field label="PAN Number" error={errors.pan_number}>
          <Input
            placeholder="AAAAA9999A  (optional)"
            value={data.pan_number}
            onChange={(e) => onChange("pan_number", e.target.value.toUpperCase())}
            maxLength={10}
          />
        </Field>
      </div>

      <Field label="Currency" required error={errors.currency}>
        <Select value={data.currency} onChange={(e) => onChange("currency", e.target.value)}>
          {CURRENCIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </Select>
      </Field>

      <Field label="Time Zone" required error={errors.timezone}>
        <Select value={data.timezone} onChange={(e) => onChange("timezone", e.target.value)}>
          {TIMEZONES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </Select>
      </Field>

      <Field label="Financial Year Start" error={errors.financial_year}>
        <Select value={data.financial_year} onChange={(e) => onChange("financial_year", e.target.value)}>
          {FINANCIAL_YEARS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </Select>
      </Field>
    </div>
  );
}

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman & Nicobar Islands","Chandigarh","Dadra & Nagar Haveli and Daman & Diu",
  "Delhi","Jammu & Kashmir","Ladakh","Lakshadweep","Puducherry","Other",
];

function StepAddress({
  data, onChange, errors,
}: {
  data: WizardData; onChange: (k: keyof WizardData, v: string) => void; errors: Errors;
}) {
  const isIndia = data.country === "India";

  return (
    <div className="space-y-5">
      <Field label="Street Address" required error={errors.address}>
        <Input
          placeholder="e.g. 12, MG Road, Bandra West"
          value={data.address}
          onChange={(e) => onChange("address", e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="City" required error={errors.city}>
          <Input
            placeholder="e.g. Mumbai"
            value={data.city}
            onChange={(e) => onChange("city", e.target.value)}
          />
        </Field>

        <Field label="State / Province" required error={errors.state}>
          {isIndia ? (
            <Select value={data.state} onChange={(e) => onChange("state", e.target.value)}>
              <option value="">Select state…</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          ) : (
            <Input
              placeholder="State / Province"
              value={data.state}
              onChange={(e) => onChange("state", e.target.value)}
            />
          )}
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Country" required error={errors.country}>
          <Input
            placeholder="e.g. India"
            value={data.country}
            onChange={(e) => {
              onChange("country", e.target.value);
              if (e.target.value !== "India") onChange("state", "");
            }}
          />
        </Field>

        <Field label="PIN / Postal Code" required error={errors.postal_code}>
          <Input
            placeholder="e.g. 400050"
            value={data.postal_code}
            onChange={(e) => onChange("postal_code", e.target.value)}
            maxLength={10}
          />
        </Field>
      </div>
    </div>
  );
}

const INVOICE_FORMATS = [
  { value: "INV-{YYYY}-{####}", label: "INV-2025-0001" },
  { value: "{PREFIX}/{YYYY}/{####}", label: "INV/2025/0001" },
  { value: "{PREFIX}-{####}", label: "INV-0001" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी (Hindi)" },
  { value: "mr", label: "मराठी (Marathi)" },
  { value: "ta", label: "தமிழ் (Tamil)" },
  { value: "te", label: "తెలుగు (Telugu)" },
  { value: "kn", label: "ಕನ್ನಡ (Kannada)" },
  { value: "gu", label: "ગુજરાતી (Gujarati)" },
  { value: "bn", label: "বাংলা (Bengali)" },
  { value: "pa", label: "ਪੰਜਾਬੀ (Punjabi)" },
];

function StepPreferences({
  data, onChange, errors,
}: {
  data: WizardData;
  onChange: (k: keyof WizardData, v: string | boolean) => void;
  errors: Errors;
}) {
  const id = useId();
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Invoice Prefix" required error={errors.invoice_prefix}>
          <Input
            placeholder="e.g. INV"
            value={data.invoice_prefix}
            onChange={(e) => onChange("invoice_prefix", e.target.value.toUpperCase())}
            maxLength={10}
          />
        </Field>

        <Field label="Invoice Number Format" error={errors.invoice_number_format}>
          <Select
            value={data.invoice_number_format}
            onChange={(e) => onChange("invoice_number_format", e.target.value)}
          >
            {INVOICE_FORMATS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </Select>
        </Field>
      </div>

      {/* Tax Enabled toggle */}
      <div className="flex items-center justify-between rounded-lg border border-input bg-background px-4 py-3">
        <div>
          <p className="text-sm font-medium text-foreground">GST / Tax Enabled</p>
          <p className="text-xs text-muted-foreground">Apply tax on invoices by default</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={data.tax_enabled}
          onClick={() => onChange("tax_enabled", !data.tax_enabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            data.tax_enabled ? "bg-primary" : "bg-input"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-transform ${
              data.tax_enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <Field label="Default Language" error={errors.language}>
        <Select value={data.language} onChange={(e) => onChange("language", e.target.value)}>
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </Select>
      </Field>

      <Field label="Theme Preference" error={errors.theme}>
        <div className="grid grid-cols-2 gap-3">
          {(["light", "dark"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onChange("theme", t)}
              className={`flex items-center gap-2.5 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                data.theme === t
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-input bg-background text-foreground hover:bg-muted"
              }`}
            >
              <span className={`h-4 w-4 rounded-full border-2 ${t === "light" ? "bg-amber-100 border-amber-400" : "bg-slate-800 border-slate-600"}`} />
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}

function StepComplete() {
  return (
    <div className="flex flex-col items-center text-center py-6">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/60"
      >
        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-bold tracking-tight text-foreground"
      >
        You're all set!
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="mt-3 max-w-sm text-sm text-muted-foreground leading-relaxed"
      >
        Your business profile has been saved. Taking you to your dashboard…
      </motion.p>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-6"
      >
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </motion.div>
    </div>
  );
}

// ── Stepper ───────────────────────────────────────────────────────

function Stepper({ current }: { current: number }) {
  // Show steps 1–6 (not Welcome or Complete) in the stepper
  const visible = STEPS.slice(1, 6);
  return (
    <div className="mb-8 flex items-center justify-center">
      <div className="flex items-center gap-0">
        {visible.map((s, i) => {
          const stepIdx = i + 1; // 1–5 mapping to wizard steps 1–5
          const done = current > stepIdx;
          const active = current === stepIdx;
          return (
            <div key={s.title} className="flex items-center">
              {/* Circle */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    done
                      ? "bg-primary text-primary-foreground"
                      : active
                      ? "bg-[image:var(--gradient-brand)] text-white shadow-[var(--shadow-elegant)]"
                      : "border border-input bg-background text-muted-foreground"
                  }`}
                >
                  {done ? <CheckCircle2 className="h-4 w-4" /> : stepIdx}
                </div>
                <span
                  className={`hidden sm:block text-[10px] font-medium leading-none ${
                    active ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {s.short}
                </span>
              </div>
              {/* Connector (skip after last) */}
              {i < visible.length - 1 && (
                <div
                  className={`mb-4 h-px w-8 sm:w-12 transition-colors ${
                    done ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Animation variants ────────────────────────────────────────────

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (dir: number) => ({ x: dir > 0 ? -48 : 48, opacity: 0 }),
};

// ── Main page ─────────────────────────────────────────────────────

function OnboardingPage() {
  const { user } = useAuth();
  const { business, setOnboardingCompleted } = useBusiness();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<WizardData>(DEFAULTS);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Pre-fill from existing partial record (resume support)
  useEffect(() => {
    if (!business) return;
    setData({
      business_name:         business.business_name         ?? "",
      business_type:         business.business_type         ?? "",
      logo_url:              business.logo_url              ?? "",
      owner_name:            business.owner_name            ?? "",
      phone:                 business.phone                 ?? "",
      email:                 business.email                 ?? "",
      gst_number:            business.gst_number            ?? "",
      pan_number:            business.pan_number            ?? "",
      currency:              business.currency              ?? "INR",
      timezone:              business.timezone              ?? "Asia/Kolkata",
      financial_year:        business.financial_year        ?? "April-March",
      address:               business.address               ?? "",
      city:                  business.city                  ?? "",
      state:                 business.state                 ?? "",
      country:               business.country               ?? "India",
      postal_code:           business.postal_code           ?? "",
      invoice_prefix:        business.invoice_prefix        ?? "INV",
      invoice_number_format: business.invoice_number_format ?? "INV-{YYYY}-{####}",
      tax_enabled:           business.tax_enabled           ?? true,
      language:              business.language              ?? "en",
      theme:                 business.theme                 ?? "light",
    });
    // Resume at the right step if data already exists
    if (business.business_name && step === 0) setStep(1);
  }, [business]); // eslint-disable-line react-hooks/exhaustive-deps

  const change = (key: keyof WizardData, value: string | boolean) => {
    setData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => { const e = { ...prev }; delete e[key as string]; return e; });
  };

  /** Upsert current wizard data to DB */
  const saveProgress = async (extraFields?: Partial<WizardData & { onboarding_completed: boolean }>) => {
    if (!user) return;
    const payload = { ...data, ...extraFields, owner_id: user.id };
    const { error } = await supabase
      .from("business")
      .upsert(payload, { onConflict: "owner_id" });
    if (error) throw error;
  };

  const goNext = async () => {
    // Step 0 (Welcome) — no validation, no save
    if (step === 0) {
      setDirection(1);
      setStep(1);
      return;
    }

    const errs = validate(step, data);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setFormError("");
    setSaving(true);

    try {
      const isLastForm = step === 5;
      // On the final step, save with onboarding_completed: true in one shot
      await saveProgress(isLastForm ? { onboarding_completed: true } : undefined);

      if (isLastForm) {
        setOnboardingCompleted(true); // unblocks OnboardingGuard immediately
        setDirection(1);
        setStep(6);
        setTimeout(() => navigate({ to: "/dashboard" }), 2200);
      } else {
        setDirection(1);
        setStep((s) => s + 1);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : "Something went wrong. Please try again.";
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    if (step <= 1) return;
    setErrors({});
    setFormError("");
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const showStepper  = step >= 1 && step <= 5;
  const showBack     = step >= 2 && step <= 5;
  const showNext     = step >= 1 && step <= 5;
  const isLastForm   = step === 5;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Subtle glow */}
      <div className="pointer-events-none fixed inset-0 bg-hero-glow opacity-30" />

      {/* Header */}
      <header className="relative z-10 flex h-16 items-center px-6 sm:px-10">
        <Logo />
        {step > 0 && step < 6 && (
          <span className="ml-4 text-xs text-muted-foreground">
            Step {step} of 5
          </span>
        )}
      </header>

      {/* Main card */}
      <main className="relative z-10 flex flex-1 items-start justify-center px-4 py-8 sm:items-center sm:py-12">
        <div className="w-full max-w-[560px]">
          <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] p-7 sm:p-10">

            {showStepper && <Stepper current={step} />}

            {/* Step title */}
            {step !== 0 && step !== 6 && (
              <div className="mb-6">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {STEPS[step].title}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {step === 1 && "Tell us about your business."}
                  {step === 2 && "How should we contact you?"}
                  {step === 3 && "Tax and financial settings."}
                  {step === 4 && "Where is your business located?"}
                  {step === 5 && "Set your invoicing and app preferences."}
                </p>
              </div>
            )}

            {/* Step body (animated) */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                {step === 0 && <StepWelcome onNext={goNext} />}
                {step === 1 && <StepBusiness  data={data} onChange={change} errors={errors} />}
                {step === 2 && <StepOwner     data={data} onChange={change} errors={errors} />}
                {step === 3 && <StepDetails   data={data} onChange={change} errors={errors} />}
                {step === 4 && <StepAddress   data={data} onChange={change} errors={errors} />}
                {step === 5 && <StepPreferences data={data} onChange={change} errors={errors} />}
                {step === 6 && <StepComplete />}
              </motion.div>
            </AnimatePresence>

            {/* Global error */}
            {formError && (
              <p className="mt-4 rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                {formError}
              </p>
            )}

            {/* Navigation buttons */}
            {(showBack || showNext) && (
              <div className={`mt-8 flex gap-3 ${showBack ? "justify-between" : "justify-end"}`}>
                {showBack && (
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={saving}
                    className="flex items-center gap-1.5 rounded-xl border border-input bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </button>
                )}
                {showNext && (
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-[image:var(--gradient-brand)] px-6 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-elegant)] hover:opacity-90 transition-opacity disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        {isLastForm ? "Finish setup" : "Continue"}
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

          </div>

          {/* Skip hint — only on first real step */}
          {step === 1 && (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Your progress is saved automatically after each step.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
