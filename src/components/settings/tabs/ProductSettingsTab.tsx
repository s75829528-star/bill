import { useState } from "react";
import { Package } from "lucide-react";
import { SectionCard, FormField, TextInput, Select, SaveBar } from "@/components/settings/shared";
import { unitOptions, barcodeFormatOptions } from "@/lib/settings-data";

export function ProductSettingsTab() {
  const [defaultUnit, setDefaultUnit] = useState("pcs");
  const [barcodeFormat, setBarcodeFormat] = useState("EAN-13");
  const [lowStockThreshold, setLowStockThreshold] = useState("20");
  const [productNumberFormat, setProductNumberFormat] = useState("prod-seq");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Product Settings"
        subtitle="Defaults applied when creating new products in Inventory"
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
            <Package className="h-4 w-4 text-violet-600" />
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField label="Default Unit" hint="Pre-selected when adding a new product">
            <Select value={defaultUnit} onChange={setDefaultUnit} options={unitOptions} className="w-full" />
          </FormField>
          <FormField label="Barcode Format">
            <Select value={barcodeFormat} onChange={setBarcodeFormat} options={barcodeFormatOptions} className="w-full" />
          </FormField>
          <FormField label="Low Stock Threshold" hint="Warn when stock falls below this quantity">
            <TextInput value={lowStockThreshold} onChange={setLowStockThreshold} type="number" />
          </FormField>
          <FormField label="Product Number Format">
            <Select
              value={productNumberFormat}
              onChange={setProductNumberFormat}
              options={[
                { value: "prod-seq", label: "PROD-0001" },
                { value: "sku-cat-seq", label: "SKU-CAT-0001" },
                { value: "plain-seq", label: "0001" },
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
