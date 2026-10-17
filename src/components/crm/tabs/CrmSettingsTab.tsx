import { useEffect, useState } from "react";
import { Globe, Hash, Info, Loader2, Save, Tag } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useBusiness } from "@/contexts/BusinessContext";
import { useCustomers } from "@/hooks/useCustomersQuery";
import { useUpsertBusiness } from "@/hooks/useBusinessQuery";
import { EmptyState, SectionCard } from "@/components/crm/shared";

const EMPTY_RECORDS: never[] = [];

const CURRENCY_OPTIONS = [
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "AED", label: "AED — UAE Dirham" },
];

const COUNTRY_OPTIONS = [
  { value: "India", label: "India" },
  { value: "United States", label: "United States" },
  { value: "United Kingdom", label: "United Kingdom" },
  { value: "UAE", label: "UAE" },
  { value: "Singapore", label: "Singapore" },
];

export function CrmSettingsTab() {
  const { user } = useAuth();
  const { business, businessLoading, businessError, refetchBusiness } = useBusiness();
  const businessId = business?.id ?? null;
  const customerQuery = useCustomers(businessId);
  const upsertBusiness = useUpsertBusiness(user?.id ?? null);
  const customers = customerQuery.data ?? EMPTY_RECORDS;
  const persistedCurrency = business?.currency ?? "INR";
  const persistedCountry = business?.country ?? "India";
  const [currency, setCurrency] = useState(persistedCurrency);
  const [country, setCountry] = useState(persistedCountry);
  const isLoading = businessLoading || customerQuery.isLoading;
  const loadError = businessError || customerQuery.error;

  useEffect(() => {
    setCurrency(persistedCurrency);
    setCountry(persistedCountry);
  }, [persistedCurrency, persistedCountry]);

  const groups = [
    ...new Set(customers.map((customer) => customer.customer_group).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));
  const currencyOptions =
    business?.currency && !CURRENCY_OPTIONS.some((option) => option.value === business.currency)
      ? [{ value: business.currency, label: business.currency }, ...CURRENCY_OPTIONS]
      : CURRENCY_OPTIONS;
  const countryOptions =
    business?.country && !COUNTRY_OPTIONS.some((option) => option.value === business.country)
      ? [{ value: business.country, label: business.country }, ...COUNTRY_OPTIONS]
      : COUNTRY_OPTIONS;

  async function saveBusinessPreferences() {
    if (!business || !user) return;
    const { id, created_at, updated_at, ...payload } = business;
    try {
      await upsertBusiness.mutateAsync({ ...payload, currency, country });
      await refetchBusiness();
      toast.success("Business preferences saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save business preferences.");
    }
  }

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-xl border border-slate-200 bg-white" />;
  }

  if (loadError || !businessId || !business) {
    return (
      <SectionCard title="CRM settings unavailable">
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            {loadError instanceof Error
              ? loadError.message
              : loadError || "A business profile is required to view persisted preferences."}
          </p>
          <button
            onClick={() => void Promise.all([customerQuery.refetch(), refetchBusiness()])}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
          >
            Retry
          </button>
        </div>
      </SectionCard>
    );
  }

  const selectClass =
    "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground";

  return (
    <div className="space-y-5">
      <SectionCard
        title="Business preferences"
        subtitle="These values are stored on your authorized business profile."
        action={<Globe className="h-4 w-4 text-muted-foreground" />}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-medium text-foreground">
            Currency
            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              className={selectClass}
            >
              {currencyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 text-sm font-medium text-foreground">
            Country
            <select
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              className={selectClass}
            >
              {countryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={saveBusinessPreferences}
            disabled={upsertBusiness.isPending || !user}
            className="inline-flex items-center gap-2 rounded-lg bg-[image:var(--gradient-brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {upsertBusiness.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save preferences
          </button>
        </div>
      </SectionCard>

      <SectionCard
        title="Customer groups"
        subtitle="Group values present on saved customer records."
        action={<Tag className="h-4 w-4 text-muted-foreground" />}
      >
        {groups.length === 0 ? (
          <EmptyState
            icon={Tag}
            title="No customer groups"
            subtitle="Group choices appear after customers are assigned a group."
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {groups.map((group) => (
              <span
                key={group}
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                {group}
              </span>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Unavailable CRM preferences"
        action={<Info className="h-4 w-4 text-muted-foreground" />}
      >
        <div className="space-y-3 text-sm text-muted-foreground">
          <p className="flex items-start gap-2">
            <Hash className="mt-0.5 h-4 w-4 shrink-0" /> Customer code prefix and next-number
            sequence are not stored in the current schema.
          </p>
          <p>
            Default credit days are stored per customer, not as a business-level setting. Group
            names are stored directly on customer rows; there is no separate category configuration
            table.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
