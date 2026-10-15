import { useState } from "react";
import { Calculator } from "lucide-react";
import { SectionCard, FormField, TextInput, Toggle, SaveBar } from "@/components/settings/shared";

export function TaxGSTTab() {
  const [gstNumber, setGstNumber] = useState("27AAAPL1234C1ZV");
  const [cgst, setCgst] = useState("9");
  const [sgst, setSgst] = useState("9");
  const [igst, setIgst] = useState("18");
  const [defaultTax, setDefaultTax] = useState("18");
  const [pricesIncludeTax, setPricesIncludeTax] = useState(false);
  const [showTaxBreakup, setShowTaxBreakup] = useState(true);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Tax & GST"
        subtitle="Default GST rates applied to invoices and quotations"
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
            <Calculator className="h-4 w-4 text-emerald-600" />
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField label="GST Number" className="sm:col-span-2">
            <TextInput value={gstNumber} onChange={setGstNumber} />
          </FormField>
          <FormField label="CGST (%)" hint="Central GST — for intra-state sales">
            <TextInput value={cgst} onChange={setCgst} type="number" />
          </FormField>
          <FormField label="SGST (%)" hint="State GST — for intra-state sales">
            <TextInput value={sgst} onChange={setSgst} type="number" />
          </FormField>
          <FormField label="IGST (%)" hint="Integrated GST — for inter-state sales">
            <TextInput value={igst} onChange={setIgst} type="number" />
          </FormField>
          <FormField label="Default Tax Rate (%)" hint="Applied to new products unless overridden">
            <TextInput value={defaultTax} onChange={setDefaultTax} type="number" />
          </FormField>
        </div>
      </SectionCard>

      <SectionCard title="Invoice Tax Settings" subtitle="How tax is calculated and displayed on invoices">
        <div className="space-y-5">
          <Toggle
            checked={pricesIncludeTax}
            onChange={setPricesIncludeTax}
            label="Prices include tax"
            description="When enabled, entered prices are treated as tax-inclusive and GST is back-calculated."
          />
          <div className="border-t border-slate-100" />
          <Toggle
            checked={showTaxBreakup}
            onChange={setShowTaxBreakup}
            label="Show CGST/SGST breakup on invoices"
            description="Displays a detailed tax breakup line instead of a single combined GST line."
          />
        </div>
      </SectionCard>

      <SaveBar saved={saved} onSave={handleSave} />
    </div>
  );
}
