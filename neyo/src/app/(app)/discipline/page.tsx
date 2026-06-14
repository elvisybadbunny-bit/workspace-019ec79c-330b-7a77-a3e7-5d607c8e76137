import { requirePagePermission } from "@/lib/core/page-guards";
import { can } from "@/lib/core/permissions";
import { DisciplineClient } from "@/components/discipline/discipline-client";

export const dynamic = "force-dynamic";

/** B.20 Discipline — incidents, behavior board, suspensions, counseling. */
export default async function DisciplinePage() {
  const user = await requirePagePermission("discipline.view");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-navy-900 dark:text-navy-50">Discipline</h1>
      <p className="-mt-4 text-sm text-navy-500 dark:text-navy-400">
        Incident reports, demerit tracking, suspensions — major incidents SMS the parent automatically.
      </p>
      <DisciplineClient
        canManage={can(user.role, "discipline.manage")}
        canConfidential={can(user.role, "counseling.confidential")}
      />
    </div>
  );
}
