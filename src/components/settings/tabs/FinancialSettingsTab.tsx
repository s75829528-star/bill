import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { SectionCard, FormField, Select, SaveBar } from "@/components/settings/shared";
import { currencyOptions } from "@/lib/settings-data";

export function FinancialSettingsTab() {
  const [financialYear, setFinancialYear] = useState("apr-mar");
  const [currency, setCurrency] = useState("INR");
  const [decimalPrecision, setDecimalPrecision] = useState("2");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Financial Settings"
        subtitle="Fiscal year, currency, and numeric precision used in reports and finance"
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField label="Financial Year" hint="Used to group revenue, expenses, and tax filings">
            <Select
              value={financialYear}
              onChange={setFinancialYear}
              options={[
                { value: "apr-mar", label: "April – March (India standard)" },
                { value: "jan-dec", label: "January – December" },
                { value: "jul-jun", label: "July – June" },
              ]}
              className="w-full"
            />
          </FormField>
          <FormField label="Currency">
            <Select value={currency} onChange={setCurrency} options={currencyOptions} className="w-full" />
          </FormField>
          <FormField label="Decimal Precision" hint="Number of decimal places shown for amounts">
            <Select
              value={decimalPrecision}
              onChange={setDecimalPrecision}
              options={[
                { value: "0", label: "0 (₹1,235)" },
                { value: "2", label: "2 (₹1,234.56)" },
                { value: "3", label: "3 (₹1,234.567)" },
              ]}
              className="w-full"
            />
          </FormField>
        </div>
      </SectionCard>

      <SaveBar saved={saved} onSave={handleSave} />
    </div>
  );
}
