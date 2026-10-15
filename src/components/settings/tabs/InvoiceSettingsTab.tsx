import { useState } from "react";
import { FileText } from "lucide-react";
import { SectionCard, FormField, TextInput, TextArea, Select, SaveBar } from "@/components/settings/shared";
import { invoiceNumberFormatOptions, currencyOptions } from "@/lib/settings-data";

export function InvoiceSettingsTab() {
  const [prefix, setPrefix] = useState("INV");
  const [numberFormat, setNumberFormat] = useState("prefix-yyyy-seq");
  const [terms, setTerms] = useState(
    "Payment due within the agreed credit period. Goods once sold will not be taken back. Subject to Mumbai jurisdiction."
  );
  const [notes, setNotes] = useState("Thank you for your business!");
  const [paymentTerms, setPaymentTerms] = useState("net-30");
  const [currency, setCurrency] = useState("INR");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Invoice Settings"
        subtitle="Numbering, terms, and defaults applied to every new invoice"
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
            <FileText className="h-4 w-4 text-blue-600" />
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField label="Invoice Prefix" hint="Shown before the invoice number, e.g. INV/2026/0001">
            <TextInput value={prefix} onChange={setPrefix} />
          </FormField>
          <FormField label="Invoice Number Format">
            <Select value={numberFormat} onChange={setNumberFormat} options={invoiceNumberFormatOptions} className="w-full" />
          </FormField>
          <FormField label="Payment Terms">
            <Select
              value={paymentTerms}
              onChange={setPaymentTerms}
              options={[
                { value: "due-on-receipt", label: "Due on Receipt" },
                { value: "net-15", label: "Net 15 days" },
                { value: "net-30", label: "Net 30 days" },
                { value: "net-45", label: "Net 45 days" },
              ]}
              className="w-full"
            />
          </FormField>
          <FormField label="Default Currency">
            <Select value={currency} onChange={setCurrency} options={currencyOptions} className="w-full" />
          </FormField>
          <FormField label="Default Terms & Conditions" className="sm:col-span-2">
            <TextArea value={terms} onChange={setTerms} rows={3} />
          </FormField>
          <FormField label="Default Notes" className="sm:col-span-2">
            <TextArea value={notes} onChange={setNotes} rows={2} />
          </FormField>
        </div>
      </SectionCard>

      <SaveBar saved={saved} onSave={handleSave} />
    </div>
  );
}
