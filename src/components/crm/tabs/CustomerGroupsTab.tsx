// ── Customer Groups Tab ───────────────────────────────────────────
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Users, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBusiness } from "@/contexts/BusinessContext";
import { useCustomers } from "@/hooks/useCustomersQuery";
import { useInvoices } from "@/hooks/useInvoicesQuery";
import { buildCustomerAnalytics, formatCrmCurrency, formatCrmDate } from "@/lib/crm-analytics";
import {
  SectionCard,
  EmptyState,
  CrmStatusPill,
  Avatar,
} from "@/components/crm/shared";

const EMPTY_RECORDS: never[] = [];

// ── CustomerGroupsTab ─────────────────────────────────────────────
export function CustomerGroupsTab() {
  const { business, businessLoading, businessError } = useBusiness();
  const businessId = business?.id ?? null;
  const customerQuery = useCustomers(businessId);
  const invoiceQuery = useInvoices(businessId);
  const customerRows = customerQuery.data ?? EMPTY_RECORDS;
  const invoices = invoiceQuery.data ?? EMPTY_RECORDS;
  const currency = business?.currency ?? "INR";
  const customerAnalytics = useMemo(
    () => buildCustomerAnalytics(customerRows, invoices),
    [customerRows, invoices],
  );
  const groups = useMemo(
    () => [...new Set(customerRows.map((customer) => customer.customer_group).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b)),
    [customerRows],
  );
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const groupMembers = expandedGroup
    ? customerAnalytics.filter((customer) => customer.customer_group === expandedGroup)
    : [];
  const isLoading = businessLoading || customerQuery.isLoading || invoiceQuery.isLoading;
  const loadError = businessError || customerQuery.error || invoiceQuery.error;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-44 animate-pulse rounded-xl border border-slate-200 bg-white" />
        ))}
      </div>
    );
  }

  if (loadError) {
    return (
      <SectionCard title="Customer groups unavailable">
        <p className="mb-3 text-sm text-muted-foreground">
          {loadError instanceof Error ? loadError.message : loadError || "Group data could not be loaded."}
        </p>
        <button
          onClick={() => void Promise.all([customerQuery.refetch(), invoiceQuery.refetch()])}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
        >
          Retry
        </button>
      </SectionCard>
    );
  }

  if (!businessId || groups.length === 0) {
    return (
      <SectionCard title="Customer groups">
        <EmptyState
          icon={Users}
          title={businessId ? "No customer groups found" : "Business profile unavailable"}
          subtitle={businessId ? "Groups are taken from existing customer records; add a customer group to see it here." : "Complete business setup to load tenant-scoped records."}
        />
      </SectionCard>
    );
  }

  const groupColors = [
    "bg-blue-50 text-blue-700 border-blue-200",
    "bg-emerald-50 text-emerald-700 border-emerald-200",
    "bg-amber-50 text-amber-700 border-amber-200",
    "bg-cyan-50 text-cyan-700 border-cyan-200",
    "bg-rose-50 text-rose-700 border-rose-200",
    "bg-slate-100 text-slate-700 border-slate-200",
  ];

  return (
    <div className="space-y-6">
      {/* Group Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group, i) => {
          const members = customerAnalytics.filter((customer) => customer.customer_group === group);
          const revenue = members.reduce((sum, customer) => sum + customer.totalRevenue, 0);
          const outstanding = members.reduce((sum, customer) => sum + customer.outstandingAmount, 0);
          const isExpanded = expandedGroup === group;
          return (
            <motion.div
              key={group}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.3, ease: "easeOut" }}
              className={`rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${
                isExpanded
                  ? "border-[color:var(--brand-electric)] ring-1 ring-[color:var(--brand-electric)]"
                  : "border-slate-200"
              }`}
              onClick={() => setExpandedGroup(isExpanded ? null : group)}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${groupColors[i % groupColors.length]}`}>
                      {group}
                    </span>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">Existing customers assigned to this group.</p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                    <Users className="h-5 w-5 text-slate-500" />
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{members.length}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Customers</p>
                  </div>
                  <div className="text-center border-x border-slate-100">
                    <p className="text-sm font-bold text-foreground">{formatCrmCurrency(revenue, currency)}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Revenue</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-bold ${outstanding > 0 ? "text-red-600" : "text-emerald-600"}`}>
                      {outstanding > 0 ? formatCrmCurrency(outstanding, currency) : "Nil"}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium">Outstanding</p>
                  </div>
                </div>

                {/* Toggle hint */}
                <p className="mt-3 text-center text-[10px] font-medium text-[color:var(--brand-electric)] transition-opacity">
                  {isExpanded ? "Click to collapse" : "Click to view members"}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Members list — shown when a group is expanded */}
      {expandedGroup && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <SectionCard
            title={`${expandedGroup} — Members`}
            subtitle={`${groupMembers.length} customer${groupMembers.length !== 1 ? "s" : ""} in this group`}
            action={
              <button
                onClick={() => setExpandedGroup(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            }
            noPadding
          >
            {groupMembers.length === 0 ? (
              <EmptyState icon={Users} title="No customers in this group" subtitle="Assign customers to this group to see them here." />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/60">
                        <TableHead className="pl-6">Customer</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Total Revenue</TableHead>
                        <TableHead>Outstanding</TableHead>
                        <TableHead>Last Purchase</TableHead>
                        <TableHead className="pr-6">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupMembers.map((c, i) => (
                        <motion.tr
                          key={c.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.02 * i, duration: 0.2 }}
                          className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
                        >
                          <TableCell className="pl-6">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={c.name} size="sm" />
                              <div>
                                <p className="text-xs font-semibold text-foreground">{c.name}</p>
                                <p className="text-[11px] text-muted-foreground">{c.customer_code}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-xs text-foreground max-w-[120px] truncate">{c.company_name || "—"}</p>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{c.city || "—"}</TableCell>
                          <TableCell className="text-xs font-semibold text-foreground">{formatCrmCurrency(c.totalRevenue, currency)}</TableCell>
                          <TableCell>
                            {c.outstandingAmount > 0 ? (
                              <span className="text-xs font-semibold text-red-600">{formatCrmCurrency(c.outstandingAmount, currency)}</span>
                            ) : (
                              <span className="text-xs text-emerald-600 font-medium">Nil</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatCrmDate(c.lastPurchaseDate)}</TableCell>
                          <TableCell className="pr-6">
                            <CrmStatusPill status={c.status} />
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="border-t border-slate-100 px-6 py-3">
                  <p className="text-xs text-muted-foreground">{groupMembers.length} member{groupMembers.length !== 1 ? "s" : ""}</p>
                </div>
              </>
            )}
          </SectionCard>
        </motion.div>
      )}
    </div>
  );
}
