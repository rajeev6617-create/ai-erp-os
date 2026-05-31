import { Briefcase, Building2, UserCheck, Users } from "lucide-react";
import { StatusBadge, ModuleDashboardShell } from "@/components/platform/module-dashboard";
import type { PeopleDashboardData } from "@/lib/people/types";

export function PeopleDashboard({ data }: { data: PeopleDashboardData }) {
  return (
    <ModuleDashboardShell
      eyebrow="User operations"
      title="People"
      description="Members, employee profiles, departments, and access roles for governed enterprise operations."
      stats={data.stats}
      statIcons={[Users, UserCheck, Building2, Briefcase]}
      listTitle="Organization members"
      listDescription="Users with membership and employee context"
      emptyIcon={Users}
      emptyTitle="No members"
      emptyDescription="Invite users to your organization to manage people here."
    >
      {data.members.length > 0 &&
        data.members.map((member) => (
          <div
            key={member.id}
            className="grid gap-2 rounded-lg border border-border p-3 md:grid-cols-[1fr_auto]"
          >
            <div>
              <p className="text-sm font-semibold">{member.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{member.email}</p>
              {(member.department || member.designation) && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {[member.designation, member.department].filter(Boolean).join(" · ")}
                  {member.employeeCode ? ` · ${member.employeeCode}` : ""}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <StatusBadge status={member.role} />
              <StatusBadge status={member.status} />
            </div>
          </div>
        ))}
    </ModuleDashboardShell>
  );
}
