import { requirePagePermission } from "@/lib/core/page-guards";
import { can } from "@/lib/core/permissions";
import { GateClient } from "@/components/security/gate-client";

export const dynamic = "force-dynamic";

/** B.22 Security — gate passes, pickup authorisation, panic alerts. */
export default async function GatePage() {
  const user = await requirePagePermission("security.view");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-navy-900 dark:text-navy-50">Security</h1>
      <p className="-mt-4 text-sm text-navy-500 dark:text-navy-400">
        Gate passes, who may pick each learner, and the emergency panic button.
      </p>
      <GateClient canManage={can(user.role, "security.manage")} canPanic={can(user.role, "panic.raise")} />
    </div>
  );
}
