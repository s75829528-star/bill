import { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings, Shield, FileText, Landmark, Eye, EyeOff, ToggleLeft, ToggleRight, Save
} from "lucide-react";
import {
  defaultFinanceSettings, bankAccounts, fmtINR
} from "@/lib/finance-data";
import { SectionCard, PrimaryButton } from "@/components/finance/shared";

type Settings = typeof defaultFinanceSettings;

export function FinanceSettingsTab() {
  const [settings, setSettings] = useState<Settings>({ ...defaultFinanceSettings });
  const [panVisible, setPanVisible] = useState(false);
  const [saved, setSaved] = useState(false);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  // Live invoice preview
  const invoicePreview = `${settings.invoicePrefix}-2025-${String(settings.invoiceStartNumber).padStart(4, "0")}`;

  const maskedPan = panVisible
    ? settings.panNumber
    : settings.panNumber.slice(0, 2) + "●●●●●" + settings.panNumber.slice(-1);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">Finance Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your financial year, tax details, invoice settings, and bank accounts.
        </p>
      </div>

      {/* 1. General Settings */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
        <SectionCard
          title="General Settings"
          subtitle="Currency, financial year, and payment defaults"
          action={
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
              <Settings className="h-4 w-4 text-slate-500" />
            </div>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Default Currency</label>
              <select
                value={settings.currency}
                onChange={e => update("currency", e.target.value)}
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
              >
                {["INR", "USD", "EUR", "GBP"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Financial Year Start</label>
              <select
                value={settings.financialYearStart}
                onChange={e => update("financialYearStart", e.target.value)}
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
              >
                {["April", "January", "July", "October"].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Default Payment Terms</label>
              <select
                value={settings.defaultPaymentTerms}
                onChange={e => update("defaultPaymentTerms", e.target.value)}
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
              >
                {["Net 15", "Net 30", "Net 45", "Net 60"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </SectionCard>
      </motion.div>

      {/* 2. Tax & GST */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
        <SectionCard
          title="Tax & GST"
          subtitle="GST registration, PAN, and TDS configuration"
          action={
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
              <Shield className="h-4 w-4 text-amber-600" />
            </div>
          }
        >
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Tax Registration Type</label>
                <select
                  value={settings.taxRegistrationType}
                  onChange={e => update("taxRegistrationType", e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-foreground outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
                >
                  {["Regular", "Composition", "Unregistered"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">GSTIN</label>
                <input
                  type="text"
                  value={settings.gstNumber}
                  onChange={e => update("gstNumber", e.target.value)}
                  maxLength={15}
                  className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 px-3 font-mono text-sm outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">PAN Number</label>
                <div className="relative mt-1.5">
                  <input
                    type="text"
                    value={maskedPan}
                    readOnly
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 pr-10 font-mono text-sm outline-none bg-slate-50 cursor-default"
                  />
                  <button
                    type="button"
                    onClick={() => setPanVisible(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {panVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* TDS Toggle */}
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">TDS Applicable</p>
                <p className="text-xs text-muted-foreground mt-0.5">Enable Tax Deducted at Source for eligible transactions</p>
              </div>
              <button
                type="button"
                onClick={() => update("tdsApplicable", !settings.tdsApplicable)}
                className="transition-transform active:scale-95"
              >
                {settings.tdsApplicable ? (
                  <ToggleRight className="h-8 w-8 text-indigo-600" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-slate-400" />
                )}
              </button>
            </div>
          </div>
        </SectionCard>
      </motion.div>

      {/* 3. Invoice Settings */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <SectionCard
          title="Invoice Settings"
          subtitle="Configure invoice number format and sequence"
          action={
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
              <FileText className="h-4 w-4 text-indigo-600" />
            </div>
          }
        >
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Invoice Number Prefix</label>
                <input
                  type="text"
                  value={settings.invoicePrefix}
                  onChange={e => update("invoicePrefix", e.target.value.toUpperCase())}
                  maxLength={8}
                  placeholder="INV"
                  className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm uppercase outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Invoice Start Number</label>
                <input
                  type="number"
                  value={settings.invoiceStartNumber}
                  onChange={e => update("invoiceStartNumber", parseInt(e.target.value) || 1)}
                  min={1}
                  className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[color:var(--brand-electric)] focus:ring-1 focus:ring-[color:var(--brand-electric)]"
                />
              </div>
            </div>

            {/* Live Preview */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-indigo-100">
                <FileText className="h-4 w-4 text-indigo-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Invoice Preview</p>
                <p className="text-base font-bold text-indigo-700 font-mono tracking-wide">{invoicePreview}</p>
              </div>
              <p className="ml-auto text-xs text-muted-foreground">Next invoice number generated</p>
            </div>
          </div>
        </SectionCard>
      </motion.div>

      {/* 4. Bank Details */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
        <SectionCard
          title="Bank Accounts"
          subtitle="Connected bank accounts — read-only summary"
          action={
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
              <Landmark className="h-4 w-4 text-emerald-600" />
            </div>
          }
        >
          <div className="space-y-3">
            {bankAccounts.map((acc, i) => (
              <motion.div
                key={acc.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.06 }}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600">
                    {acc.bankName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{acc.bankName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{acc.accountNumber} · {acc.accountType}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{fmtINR(acc.balance)}</p>
                  <p className="text-xs text-muted-foreground">{acc.ifsc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </SectionCard>
      </motion.div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24 }}
        className="flex items-center gap-4 pt-2"
      >
        <PrimaryButton icon={Save} onClick={handleSave}>
          Save Settings
        </PrimaryButton>
        {saved && (
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm font-medium text-emerald-600 flex items-center gap-1.5"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
            Settings saved successfully!
          </motion.span>
        )}
      </motion.div>
    </div>
  );
}
