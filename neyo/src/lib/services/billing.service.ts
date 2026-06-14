/**
 * Billing & subscription service (Feature A.5).
 * - Subscribe / change plan with PRICE GRANDFATHERING (price locked at signup).
 * - Subscription STATE MACHINE: ACTIVE -> PAST_DUE -> GRACE -> SUSPENDED.
 *   Data is PRESERVED throughout (we never delete on non-payment).
 * - Payment goes through a swappable seam (real Daraja STK lands in A.6).
 *   In dev the seam auto-confirms so the whole flow is testable.
 */
import { db } from "@/lib/db";
import { getPlan, DEFAULT_PLAN_KEY } from "@/lib/core/plans";

const TERM_DAYS = 120; // ~one school term
const GRACE_DAYS = 14; // grace period after a missed payment (A.5)

export class BillingError extends Error {
  constructor(
    public code: "UNKNOWN_PLAN" | "TOO_MANY_ADDONS" | "NO_SUBSCRIPTION",
    message: string
  ) {
    super(message);
    this.name = "BillingError";
  }
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}

/** Ensure a tenant has a subscription row (defaults to Free Karibu). */
export async function ensureSubscription(tenantId: string) {
  const existing = await db.subscription.findUnique({ where: { tenantId } });
  if (existing) return existing;
  const plan = getPlan(DEFAULT_PLAN_KEY)!;
  return db.subscription.create({
    data: {
      tenantId,
      planKey: plan.key,
      status: "ACTIVE",
      grandfatheredPrice: plan.pricePerTerm,
      currentPeriodEnd: addDays(new Date(), TERM_DAYS),
    },
  });
}

/**
 * Subscribe/change to a plan. Creates a PENDING payment, "charges" via the
 * seam, and on success activates the plan with its price grandfathered.
 */
export async function subscribeToPlan(
  tenantId: string,
  actor: { id: string; fullName: string },
  planKey: string
) {
  const plan = getPlan(planKey);
  if (!plan) throw new BillingError("UNKNOWN_PLAN", "That plan does not exist.");

  const sub = await ensureSubscription(tenantId);
  const now = new Date();
  const periodEnd = addDays(now, TERM_DAYS);

  // Free plan: activate immediately, no payment.
  if (plan.pricePerTerm === 0) {
    const updated = await db.subscription.update({
      where: { tenantId },
      data: {
        planKey: plan.key,
        status: "ACTIVE",
        grandfatheredPrice: 0,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        graceEndsAt: null,
      },
    });
    await audit(tenantId, actor, "billing.subscribed", { planKey, price: 0 });
    return { subscription: updated, payment: null };
  }

  // Paid plan: record a pending payment then run it through the seam.
  const payment = await db.subscriptionPayment.create({
    data: {
      subscriptionId: sub.id,
      tenantId,
      amount: plan.pricePerTerm,
      status: "PENDING",
      method: "mpesa_stk",
      periodStart: now,
      periodEnd,
    },
  });

  const result = await chargeViaSeam(payment.amount);

  if (!result.ok) {
    await db.subscriptionPayment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });
    await audit(tenantId, actor, "billing.payment_failed", { planKey });
    return { subscription: sub, payment: { ...payment, status: "FAILED" } };
  }

  const [updated, paid] = await db.$transaction([
    db.subscription.update({
      where: { tenantId },
      data: {
        planKey: plan.key,
        status: "ACTIVE",
        grandfatheredPrice: plan.pricePerTerm, // lock today's price (A.5)
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        graceEndsAt: null,
      },
    }),
    db.subscriptionPayment.update({
      where: { id: payment.id },
      data: { status: "PAID", paidAt: new Date(), mpesaRef: result.ref },
    }),
  ]);

  await audit(tenantId, actor, "billing.subscribed", {
    planKey,
    price: plan.pricePerTerm,
    mpesaRef: result.ref,
  });
  return { subscription: updated, payment: paid };
}

/**
 * Subscription STATE MACHINE tick (A.5). Run by cron in prod.
 * - ACTIVE past its period end -> PAST_DUE (start grace).
 * - GRACE/PAST_DUE past graceEndsAt -> SUSPENDED (data preserved).
 * Returns how many subscriptions changed state.
 */
export async function runSubscriptionStateMachine(now = new Date()) {
  let changed = 0;

  // 1) ACTIVE but overdue -> PAST_DUE + GRACE window.
  const overdue = await db.subscription.findMany({
    where: { status: "ACTIVE", currentPeriodEnd: { lt: now }, grandfatheredPrice: { gt: 0 } },
  });
  for (const s of overdue) {
    await db.subscription.update({
      where: { id: s.id },
      data: { status: "GRACE", graceEndsAt: addDays(now, GRACE_DAYS) },
    });
    await audit(s.tenantId, { id: "system", fullName: "System" }, "billing.entered_grace", {});
    changed++;
  }

  // 2) GRACE expired -> SUSPENDED (we DO NOT delete any data).
  const graceExpired = await db.subscription.findMany({
    where: { status: "GRACE", graceEndsAt: { lt: now } },
  });
  for (const s of graceExpired) {
    await db.subscription.update({
      where: { id: s.id },
      data: { status: "SUSPENDED" },
    });
    await audit(s.tenantId, { id: "system", fullName: "System" }, "billing.suspended", {});
    changed++;
  }

  return changed;
}

/** Mark a subscription overdue for testing the state machine. */
async function audit(
  tenantId: string,
  actor: { id: string; fullName: string },
  action: string,
  metadata: Record<string, unknown>
) {
  await db.auditLog.create({
    data: {
      tenantId,
      actorId: actor.id === "system" ? null : actor.id,
      actorName: actor.fullName,
      action,
      entityType: "Subscription",
      metadata: JSON.stringify(metadata),
    },
  });
}

/**
 * Payment seam (A.6 — M-Pesa STK via Daraja, built later).
 * DEV: auto-confirm with a fake ref so the billing flow is fully testable.
 * PROD: replace with a real Daraja STK push + callback confirmation.
 */
async function chargeViaSeam(
  amountKes: number
): Promise<{ ok: true; ref: string } | { ok: false }> {
  void amountKes;
  // --- Real Daraja STK push goes here in A.6 ---
  if (process.env.NODE_ENV === "production") {
    // Without real creds we cannot charge in prod; fail closed.
    return { ok: false };
  }
  return { ok: true, ref: `DEV-${Date.now().toString(36).toUpperCase()}` };
}
