import { requirePagePermission } from "@/lib/core/page-guards";
import { can } from "@/lib/core/permissions";
import { ExamsClient } from "@/components/exams/exams-client";

export const dynamic = "force-dynamic";

/** B.5 Examination — exams, marks entry, positions, report cards. */
export default async function ExamsPage() {
  const user = await requirePagePermission("exam.view");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-900 dark:text-navy-50">Exams</h1>
        <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">
          Set exams, enter marks, see positions and release report cards.
        </p>
      </div>
      <ExamsClient
        canManage={can(user.role, "exam.manage")}
        canEnterMarks={can(user.role, "exam.enter_marks")}
        canPublish={can(user.role, "exam.publish")}
      />
    </div>
  );
}
