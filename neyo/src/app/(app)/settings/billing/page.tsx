import { requirePageUser } from "@/lib/core/page-guards";
import { ensureSubscription } from "@/lib/services/billing.service";
import { getAllLimitStatuses } from "@/lib/services/limits.service";
import { getPlan, PLANS } from "@/lib/core/plans";
import { can } from "@/lib/core/permissions";
import { BillingManager } from "@/components/settings/billing-manager";

export const dynamic = "force-dynamic";

/** Settings → Billing (A.5). Everyone can view; leadership can change plan. */
export default async function BillingSettingsPage() {
  const user = await requirePageUser();
  const sub = await ensureSubscription(user.tenantId);
  const limits = await getAllLimitStatuses(user.tenantId);
  const plan = getPlan(sub.planKey);

  const data = {
    subscription: {
      planKey: sub.planKey,
      planName: plan?.name ?? sub.planKey,
      status: sub.status,
      price: sub.grandfatheredPrice,
      currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
    },
    limits: limits.map((l) => ({
      metric: l.metric,
      used: l.used,
      limit: l.limit,
      blocked: l.blocked,
      overLimit: l.overLimit,
    })),
    plans: PLANS.map((p) => ({
      key: p.key,
      name: p.name,
      pricePerTerm: p.pricePerTerm,
      highlights: p.highlights,
    })),
  };

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-900 dark:text-navy-50">
          Billing
        </h1>
        <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">
          Your NEYO plan, usage and payments.
        </p>
      </div>
      <BillingManager data={data} canManage={can(user.role, "tenant.manage_settings")} />
    </div>
  );
}
