import { useState } from "react";
import { Palette, Image as ImageIcon, FileText } from "lucide-react";
import { SectionCard, FormField, SaveBar } from "@/components/settings/shared";

const colorSwatches = ["#2563EB", "#7C3AED", "#059669", "#DC2626", "#D97706", "#0891B2", "#DB2777", "#0F172A"];

export function BrandingTab() {
  const [primary, setPrimary] = useState("#2563EB");
  const [secondary, setSecondary] = useState("#7C3AED");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Company Branding"
        subtitle="Logo, favicon, and brand colors used across invoices and the customer portal"
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-50">
            <Palette className="h-4 w-4 text-pink-600" />
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField label="Company Logo" hint="PNG or SVG, recommended 512×512px">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[image:var(--gradient-brand)] text-2xl font-bold text-white shadow-sm">
                N
              </div>
              <button className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-foreground hover:bg-slate-50">
                Upload Logo
              </button>
            </div>
          </FormField>
          <FormField label="Favicon" hint="ICO or PNG, 32×32px">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                <ImageIcon className="h-6 w-6 text-slate-400" />
              </div>
              <button className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-foreground hover:bg-slate-50">
                Upload Favicon
              </button>
            </div>
          </FormField>

          <FormField label="Primary Color" hint="Used for buttons, links, and active states">
            <div className="flex flex-wrap items-center gap-2">
              {colorSwatches.map((c) => (
                <button
                  key={c}
                  onClick={() => setPrimary(c)}
                  className={`h-8 w-8 rounded-full border-2 transition-transform ${primary === c ? "scale-110 border-slate-900" : "border-white"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <span className="ml-2 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-mono text-muted-foreground">{primary}</span>
            </div>
          </FormField>
          <FormField label="Secondary Color" hint="Used for accents and secondary highlights">
            <div className="flex flex-wrap items-center gap-2">
              {colorSwatches.map((c) => (
                <button
                  key={c}
                  onClick={() => setSecondary(c)}
                  className={`h-8 w-8 rounded-full border-2 transition-transform ${secondary === c ? "scale-110 border-slate-900" : "border-white"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <span className="ml-2 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-mono text-muted-foreground">{secondary}</span>
            </div>
          </FormField>
        </div>
      </SectionCard>

      <SectionCard
        title="Invoice Logo Preview"
        subtitle="How your branding will appear on generated invoices"
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
            <FileText className="h-4 w-4 text-blue-600" />
          </div>
        }
      >
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold text-white shadow-sm"
                style={{ backgroundColor: primary }}
              >
                N
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Nexora Retail Pvt. Ltd.</p>
                <p className="text-xs text-muted-foreground">GSTIN: 27AAAPL1234C1ZV</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: secondary }}>Tax Invoice</p>
              <p className="text-xs text-muted-foreground">INV/2026/0142</p>
            </div>
          </div>
        </div>
      </SectionCard>

      <SaveBar saved={saved} onSave={handleSave} />
    </div>
  );
}
