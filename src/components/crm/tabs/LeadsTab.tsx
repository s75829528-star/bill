import { Target } from "lucide-react";
import { EmptyState, SectionCard } from "@/components/crm/shared";

export function LeadsTab() {
  return (
    <SectionCard title="Leads" subtitle="Lead management is not connected to persistent CRM data.">
      <EmptyState
        icon={Target}
        title="Lead records are not configured"
        subtitle="This application has no verified leads table, authorization policy, or lead data service. A tenant-scoped schema and migration are required before lead records can be safely managed."
      />
    </SectionCard>
  );
}
