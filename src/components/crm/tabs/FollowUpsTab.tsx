import { CalendarClock } from "lucide-react";
import { EmptyState, SectionCard } from "@/components/crm/shared";

export function FollowUpsTab() {
  return (
    <SectionCard
      title="Follow-ups"
      subtitle="Follow-up scheduling is not connected to persistent CRM data."
    >
      <EmptyState
        icon={CalendarClock}
        title="Follow-up records are not configured"
        subtitle="This application has no verified follow-up table, authorization policy, or follow-up service. A tenant-scoped schema and migration are required before reminders can be safely scheduled."
      />
    </SectionCard>
  );
}
