import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  CalendarClock,
  FileText,
  IndianRupee,
  Search,
  StickyNote,
  UserPlus,
  UserRoundPen,
} from "lucide-react";
import { useBusiness } from "@/contexts/BusinessContext";
import { useCustomerNotesForBusiness, useCustomers } from "@/hooks/useCustomersQuery";
import { useInvoices } from "@/hooks/useInvoicesQuery";
import { usePayments } from "@/hooks/usePaymentsQuery";
import { formatCrmCurrency, formatCrmDate } from "@/lib/crm-analytics";
import { EmptyState, SearchInput, SectionCard, Select } from "@/components/crm/shared";

const EMPTY_RECORDS: never[] = [];

type ActivityType = "customer-created" | "customer-updated" | "invoice" | "payment" | "note";
interface ActivityEvent {
  id: string;
  type: ActivityType;
  title: string;
  subtitle: string;
  timestamp: string;
}

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  "customer-created": "Customer created",
  "customer-updated": "Customer updated",
  invoice: "Invoice",
  payment: "Payment",
  note: "Note",
};

function activityIcon(type: ActivityType) {
  switch (type) {
    case "customer-created":
      return { icon: UserPlus, bg: "bg-blue-50", color: "text-blue-600" };
    case "customer-updated":
      return { icon: UserRoundPen, bg: "bg-amber-50", color: "text-amber-600" };
    case "invoice":
      return { icon: FileText, bg: "bg-indigo-50", color: "text-indigo-600" };
    case "payment":
      return { icon: IndianRupee, bg: "bg-emerald-50", color: "text-emerald-600" };
    case "note":
      return { icon: StickyNote, bg: "bg-yellow-50", color: "text-yellow-700" };
  }
}

export function ActivitiesTab() {
  const { business, businessLoading, businessError } = useBusiness();
  const businessId = business?.id ?? null;
  const currency = business?.currency ?? "INR";
  const customerQuery = useCustomers(businessId);
  const notesQuery = useCustomerNotesForBusiness(businessId);
  const invoiceQuery = useInvoices(businessId);
  const paymentQuery = usePayments(businessId);
  const customers = customerQuery.data ?? EMPTY_RECORDS;
  const notes = notesQuery.data ?? EMPTY_RECORDS;
  const invoices = invoiceQuery.data ?? EMPTY_RECORDS;
  const payments = paymentQuery.data ?? EMPTY_RECORDS;
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const isLoading =
    businessLoading ||
    customerQuery.isLoading ||
    notesQuery.isLoading ||
    invoiceQuery.isLoading ||
    paymentQuery.isLoading;
  const loadError =
    businessError ||
    customerQuery.error ||
    notesQuery.error ||
    invoiceQuery.error ||
    paymentQuery.error;

  const events = useMemo<ActivityEvent[]>(() => {
    const customerNames = new Map(customers.map((customer) => [customer.id, customer.name]));
    return [
      ...customers.flatMap((customer) => {
        const customerEvents: ActivityEvent[] = [
          {
            id: `created-${customer.id}`,
            type: "customer-created",
            title: `Customer added: ${customer.name}`,
            subtitle: "Customer record created",
            timestamp: customer.created_at,
          },
        ];
        if (customer.updated_at > customer.created_at) {
          customerEvents.push({
            id: `updated-${customer.id}`,
            type: "customer-updated",
            title: `Customer updated: ${customer.name}`,
            subtitle: "Customer record changed",
            timestamp: customer.updated_at,
          });
        }
        return customerEvents;
      }),
      ...notes.map((note) => ({
        id: `note-${note.id}`,
        type: "note" as const,
        title: `Note added for ${note.customer_name}`,
        subtitle: `${note.author}: ${note.text}`,
        timestamp: note.created_at,
      })),
      ...invoices
        .filter((invoice) => invoice.customerId)
        .map((invoice) => ({
          id: `invoice-${invoice.id}`,
          type: "invoice" as const,
          title: `Invoice ${invoice.invoiceNumber} for ${customerNames.get(invoice.customerId) ?? "Customer"}`,
          subtitle: `Invoice date · ${invoice.status}`,
          timestamp: invoice.createdDate,
        })),
      ...payments
        .filter((payment) => payment.customerId)
        .map((payment) => ({
          id: `payment-${payment.id}`,
          type: "payment" as const,
          title: `Payment recorded${payment.customerName ? ` from ${payment.customerName}` : ""}`,
          subtitle: `${formatCrmCurrency(payment.amount, currency)} · ${payment.status}`,
          timestamp: payment.date,
        })),
    ].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [customers, notes, invoices, payments, currency]);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return events.filter((event) => {
      const matchesType = filterType === "all" || event.type === filterType;
      const matchesSearch =
        !query || `${event.title} ${event.subtitle}`.toLowerCase().includes(query);
      return matchesType && matchesSearch;
    });
  }, [events, filterType, search]);

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-xl border border-slate-200 bg-white" />;
  }

  if (loadError) {
    return (
      <SectionCard title="Activity unavailable">
        <p className="mb-3 text-sm text-muted-foreground">
          {loadError instanceof Error
            ? loadError.message
            : loadError || "Customer activity could not be loaded."}
        </p>
        <button
          onClick={() =>
            void Promise.all([
              customerQuery.refetch(),
              notesQuery.refetch(),
              invoiceQuery.refetch(),
              paymentQuery.refetch(),
            ])
          }
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
        >
          Retry
        </button>
      </SectionCard>
    );
  }

  if (!businessId || events.length === 0) {
    return (
      <SectionCard title="Customer activity">
        <EmptyState
          icon={Activity}
          title={businessId ? "No customer activity recorded" : "Business profile unavailable"}
          subtitle={
            businessId
              ? "Activity is derived from existing customer, invoice, and payment records."
              : "Complete business setup to load tenant-scoped records."
          }
        />
      </SectionCard>
    );
  }

  const options = [
    { value: "all", label: "All activity" },
    ...Object.entries(ACTIVITY_LABELS).map(([value, label]) => ({ value, label })),
  ];
  const grouped = new Map<string, ActivityEvent[]>();
  for (const event of filteredEvents) {
    const date = event.timestamp.slice(0, 10);
    const group = grouped.get(date) ?? [];
    group.push(event);
    grouped.set(date, group);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search customer activity…" />
        <Select value={filterType} onChange={setFilterType} options={options} />
        <span className="ml-auto text-xs text-muted-foreground">
          {filteredEvents.length} event{filteredEvents.length === 1 ? "" : "s"}
        </span>
      </div>
      {filteredEvents.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching activity"
          subtitle="Try a different search or activity type."
        />
      ) : (
        [...grouped.entries()].map(([date, dayEvents]) => (
          <SectionCard
            key={date}
            title={formatCrmDate(date)}
            subtitle={`${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}`}
          >
            <div className="space-y-3">
              {dayEvents.map((event, index) => {
                const { icon: Icon, bg, color } = activityIcon(event.type);
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.2 }}
                    className="flex items-start gap-3"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bg}`}
                    >
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{event.subtitle}</p>
                    </div>
                    <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
                      {ACTIVITY_LABELS[event.type]}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </SectionCard>
        ))
      )}
    </div>
  );
}
