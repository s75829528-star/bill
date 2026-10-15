import { useState } from "react";
import { Building2 } from "lucide-react";
import { useBusiness } from "@/contexts/BusinessContext";
import { SectionCard, FormField, TextInput, TextArea, Select, SaveBar } from "@/components/settings/shared";
import { businessTypeOptions, indianStates } from "@/lib/settings-data";

export function BusinessProfileTab() {
  const { business } = useBusiness();

  const [name, setName] = useState(business?.business_name ?? "Nexora Retail Pvt. Ltd.");
  const [type, setType] = useState("pvt-ltd");
  const [gstin, setGstin] = useState(business?.gst_number ?? "27AAAPL1234C1ZV");
  const [pan, setPan] = useState(business?.pan_number ?? "AAAPL1234C");
  const [address, setAddress] = useState(business?.address ?? "402, Crescent Business Park, Andheri East");
  const [city, setCity] = useState(business?.city ?? "Mumbai");
  const [state, setState] = useState(business?.state ?? "Maharashtra");
  const [country] = useState("India");
  const [postalCode, setPostalCode] = useState("400069");
  const [phone, setPhone] = useState(business?.phone ?? "+91 98200 12345");
  const [email, setEmail] = useState(business?.email ?? "hello@nexora.app");
  const [website, setWebsite] = useState("https://nexora.app");
  const [description, setDescription] = useState(
    "Nexora Retail runs a chain of specialty grocery stores across Mumbai, supplying fresh produce and packaged goods to over 1,200 households weekly."
  );
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Business Profile"
        subtitle="Core details used across invoices, quotations, and official documents"
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
            <Building2 className="h-4 w-4 text-blue-600" />
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField label="Business Name">
            <TextInput value={name} onChange={setName} />
          </FormField>
          <FormField label="Business Type">
            <Select value={type} onChange={setType} options={businessTypeOptions} className="w-full" />
          </FormField>
          <FormField label="GSTIN" hint="15-character GST identification number">
            <TextInput value={gstin} onChange={setGstin} />
          </FormField>
          <FormField label="PAN" hint="10-character Permanent Account Number">
            <TextInput value={pan} onChange={setPan} />
          </FormField>
          <FormField label="Address" className="sm:col-span-2">
            <TextInput value={address} onChange={setAddress} />
          </FormField>
          <FormField label="City">
            <TextInput value={city} onChange={setCity} />
          </FormField>
          <FormField label="State">
            <Select
              value={state}
              onChange={setState}
              options={indianStates.map((s) => ({ value: s, label: s }))}
              className="w-full"
            />
          </FormField>
          <FormField label="Country">
            <TextInput value={country} onChange={() => {}} />
          </FormField>
          <FormField label="Postal Code">
            <TextInput value={postalCode} onChange={setPostalCode} />
          </FormField>
          <FormField label="Phone">
            <TextInput value={phone} onChange={setPhone} type="tel" />
          </FormField>
          <FormField label="Email">
            <TextInput value={email} onChange={setEmail} type="email" />
          </FormField>
          <FormField label="Website" className="sm:col-span-2">
            <TextInput value={website} onChange={setWebsite} />
          </FormField>
          <FormField label="Business Description" className="sm:col-span-2">
            <TextArea value={description} onChange={setDescription} rows={4} />
          </FormField>
        </div>
      </SectionCard>

      <SaveBar saved={saved} onSave={handleSave} />
    </div>
  );
}
