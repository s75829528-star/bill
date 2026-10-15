// ── SettingsTab ───────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { Check, Bell, Barcode, ShieldCheck, Tag, Calculator, Hash } from "lucide-react";
import { units } from "@/lib/inventory-data";
import { SectionCard, PrimaryButton, Select } from "@/components/inventory/shared";

// ── Toggle Switch ─────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none ${
          checked ? "bg-blue-500" : "bg-slate-200"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

// ── Save confirmation banner ──────────────────────────────────────

function SavedBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
      <Check className="h-4 w-4" />
      Settings saved successfully.
    </div>
  );
}

// ── Main Tab ──────────────────────────────────────────────────────

export function SettingsTab() {
  // Inventory Preferences
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [autoBarcode, setAutoBarcode] = useState(false);
  const [requireApproval, setRequireApproval] = useState(true);

  // Default Unit
  const [defaultUnit, setDefaultUnit] = useState("u1");

  // Stock Alert Threshold
  const [threshold, setThreshold] = useState(20);

  // Barcode Format
  const [barcodeFormat, setBarcodeFormat] = useState("EAN-13");

  // Tax Settings
  const [defaultGST, setDefaultGST] = useState(18);
  const [pricesIncludeTax, setPricesIncludeTax] = useState(false);

  // Number Format
  const [numberFormat, setNumberFormat] = useState("indian");

  // Save state
  const [saved, setSaved] = useState(false);
  const [timerId, setTimerId] = useState<ReturnType<typeof setTimeout> | null>(null);

  function handleSave() {
    if (timerId) clearTimeout(timerId);
    setSaved(true);
    const id = setTimeout(() => setSaved(false), 2000);
    setTimerId(id);
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [timerId]);

  return (
    <div className="space-y-6">

      {/* 1. Inventory Preferences */}
      <SectionCard
        title="Inventory Preferences"
        subtitle="Configure automatic behaviors and alerts"
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
            <Bell className="h-4 w-4 text-blue-600" />
          </div>
        }
      >
        <div className="space-y-5">
          <Toggle
            checked={lowStockAlerts}
            onChange={setLowStockAlerts}
            label="Enable low stock alerts"
            description="Receive warnings when product stock falls below the minimum threshold."
          />
          <div className="border-t border-slate-100" />
          <Toggle
            checked={autoBarcode}
            onChange={setAutoBarcode}
            label="Auto-generate barcodes for new products"
            description="Automatically assign an EAN-13 barcode when a new product is added."
          />
          <div className="border-t border-slate-100" />
          <Toggle
            checked={requireApproval}
            onChange={setRequireApproval}
            label="Require approval for stock adjustments"
            description="Manual stock adjustments must be approved by an admin before taking effect."
          />
        </div>
      </SectionCard>

      {/* 2. Units & Thresholds */}
      <SectionCard
        title="Units & Alert Thresholds"
        subtitle="Set default unit and reorder warning sensitivity"
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
            <Hash className="h-4 w-4 text-amber-600" />
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Default Unit for New Products</label>
            <p className="text-xs text-muted-foreground">
              This unit is pre-selected when adding a new product.
            </p>
            <Select
              value={defaultUnit}
              onChange={setDefaultUnit}
              options={units.map((u) => ({ value: u.id, label: `${u.name} (${u.shortCode})` }))}
              className="w-full mt-2"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Stock Alert Threshold (% of Min Stock)
            </label>
            <p className="text-xs text-muted-foreground">
              Warn when stock drops within this percentage of the minimum stock level.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <input
                type="number"
                min={1}
                max={100}
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value) || 1)}
                className="h-9 w-24 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
              <span className="text-sm font-medium text-muted-foreground">%</span>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* 3. Barcode Format */}
      <SectionCard
        title="Barcode Settings"
        subtitle="Choose the label format used for product barcodes"
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
            <Barcode className="h-4 w-4 text-violet-600" />
          </div>
        }
      >
        <div className="space-y-1.5 max-w-xs">
          <label className="text-sm font-medium text-foreground">Barcode Format</label>
          <Select
            value={barcodeFormat}
            onChange={setBarcodeFormat}
            options={[
              { value: "EAN-13", label: "EAN-13 (13-digit, International)" },
              { value: "UPC-A", label: "UPC-A (12-digit, North America)" },
              { value: "CODE-128", label: "CODE-128 (Alphanumeric)" },
              { value: "QR", label: "QR Code (2D Matrix)" },
            ]}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground pt-1">
            Selected format:{" "}
            <span className="font-semibold text-foreground">{barcodeFormat}</span>. New barcodes
            generated in the Barcode tab will use this format.
          </p>
        </div>
      </SectionCard>

      {/* 4. Tax Settings */}
      <SectionCard
        title="Tax Settings"
        subtitle="Configure default GST rates and pricing behaviour"
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
            <Calculator className="h-4 w-4 text-emerald-600" />
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Default GST Rate (%)</label>
            <p className="text-xs text-muted-foreground">
              Applied to new products unless overridden per product.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={defaultGST}
                onChange={(e) => setDefaultGST(parseFloat(e.target.value) || 0)}
                className="h-9 w-24 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
              <span className="text-sm font-medium text-muted-foreground">%</span>
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Pricing Mode</label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={pricesIncludeTax}
                onChange={(e) => setPricesIncludeTax(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-500 focus:ring-blue-400"
              />
              <div>
                <p className="text-sm font-medium text-foreground">Prices include tax</p>
                <p className="text-xs text-muted-foreground">
                  When checked, entered prices are treated as tax-inclusive. GST is back-calculated.
                </p>
              </div>
            </label>
          </div>
        </div>
      </SectionCard>

      {/* 5. Number Format */}
      <SectionCard
        title="Display & Number Format"
        subtitle="Customize how currency and numbers are shown in this module"
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50">
            <Tag className="h-4 w-4 text-cyan-600" />
          </div>
        }
      >
        <div className="space-y-1.5 max-w-xs">
          <label className="text-sm font-medium text-foreground">Number Format</label>
          <Select
            value={numberFormat}
            onChange={setNumberFormat}
            options={[
              { value: "indian", label: "Indian (₹1,23,456)" },
              { value: "international", label: "International (₹123,456)" },
            ]}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground pt-1">
            Preview:{" "}
            <span className="font-semibold text-foreground">
              {numberFormat === "indian" ? "₹12,34,567.00" : "₹1,234,567.00"}
            </span>
          </p>
        </div>
      </SectionCard>

      {/* Save bar */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
        <SavedBanner visible={saved} />
        {!saved && (
          <p className="text-xs text-muted-foreground">
            Changes are stored for this session only and reset on page reload.
          </p>
        )}
        <div className="ml-auto">
          <PrimaryButton icon={ShieldCheck} onClick={handleSave}>
            Save Changes
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
