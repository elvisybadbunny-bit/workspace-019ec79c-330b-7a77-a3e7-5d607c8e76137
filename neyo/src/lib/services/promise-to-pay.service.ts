/**
 * G.28 — Fee Promise-to-Pay service.
 * Allows parents to commit to a payment date, and provides the bursar with
 * a "promises calendar" + auto-flagging of broken promises and follow-up SMS.
 */
import { db } from "@/lib/db";
import { withTenant } from "@/lib/core/tenant-context";
import { tenantDb } from "@/lib/core/tenant-db";
import { sendSms } from "@/lib/notifications/sms";
import { checkSmsQuota, recordUsage } from "@/lib/services/limits.service";
import type { SessionUser } from "@/lib/core/session";

export class PromiseError extends Error {
  constructor(public code: "NOT_FOUND" | "FORBIDDEN" | "QUOTA" | "INVALID", message: string) {
    super(message);
    this.name = "PromiseError";
  }
}

/** Parent: Commit to a payment date for an invoice. */
export async function createPromiseToPay(
  user: SessionUser,
  input: { invoiceId: string; promiseDate: string; amountKes: number }
) {
  return withTenant(user.tenantId, async () => {
    const tdb = tenantDb();
    const inv = await tdb.invoice.findUnique({ where: { id: input.invoiceId } });
    if (!inv) throw new PromiseError("NOT_FOUND", "Invoice not found.");

    // Scoping check: must be their child's invoice
    const guardian = await tdb.guardian.findFirst({ where: { userId: user.id } });
    if (!guardian) throw new PromiseError("FORBIDDEN", "Only registered guardians can create promises.");

    const link = await tdb.studentGuardian.findFirst({
      where: { studentId: inv.studentId, guardianId: guardian.id },
    });
    if (!link) throw new PromiseError("FORBIDDEN", "This invoice does not belong to your child.");

    // Check if there is already an active promise for this invoice
    const existing = await tdb.promiseToPay.findFirst({
      where: { invoiceId: input.invoiceId, status: "ACTIVE" },
    });
    if (existing) throw new PromiseError("INVALID", "An active promise already exists for this invoice.");

    const balance = inv.totalKes - inv.discountKes - inv.paidKes;
    if (input.amountKes > balance) throw new PromiseError("INVALID", `Amount exceeds the invoice balance of KES ${balance}.`);

    const promise = await tdb.promiseToPay.create({
      data: {
        tenantId: user.tenantId,
        invoiceId: input.invoiceId,
        studentId: inv.studentId,
        guardianId: guardian.id,
        promiseDate: input.promiseDate,
        amountKes: input.amountKes,
        status: "ACTIVE",
      },
    });

    await db.auditLog.create({
      data: {
        tenantId: user.tenantId,
        actorId: user.id,
        actorName: user.fullName,
        action: "promise.created",
        entityType: "invoice",
        entityId: input.invoiceId,
        metadata: JSON.stringify({ promiseDate: input.promiseDate, amountKes: input.amountKes }),
      },
    });

    return promise;
  });
}

/** Bursar: List all promises. */
export async function listPromises(user: SessionUser) {
  return withTenant(user.tenantId, async () => {
    const list = await tenantDb().promiseToPay.findMany({
      include: {
        invoice: { select: { invoiceNo: true, description: true, status: true, totalKes: true, paidKes: true, discountKes: true } },
        student: { select: { firstName: true, lastName: true, admissionNo: true } },
        guardian: { select: { fullName: true, phone: true } },
      },
      orderBy: { promiseDate: "asc" },
    });

    return list.map((p) => ({
      id: p.id,
      promiseDate: p.promiseDate,
      amountKes: p.amountKes,
      status: p.status,
      studentName: `${p.student.firstName} ${p.student.lastName}`,
      admissionNo: p.student.admissionNo,
      invoiceNo: p.invoice.invoiceNo,
      guardianName: p.guardian.fullName,
      guardianPhone: p.guardian.phone,
      invoiceBalance: Math.max(0, p.invoice.totalKes - p.invoice.discountKes - p.invoice.paidKes),
    }));
  });
}

/** Background Task: Auto-check and flag broken/kept promises. */
export async function checkBrokenPromises(tenantId: string) {
  return withTenant(tenantId, async () => {
    const tdb = tenantDb();
    const today = new Date().toISOString().slice(0, 10);

    const activePromises = await tdb.promiseToPay.findMany({
      where: { status: "ACTIVE" },
      include: {
        invoice: true,
        guardian: true,
        student: true,
      },
    });

    let brokenCount = 0;
    let keptCount = 0;

    const tenant = await db.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { name: true } });

    for (const p of activePromises) {
      const invBal = p.invoice.totalKes - p.invoice.discountKes - p.invoice.paidKes;

      // 1) Is it KEPT? (invoice is fully paid or remaining balance is 0)
      if (invBal === 0 || p.invoice.status === "PAID") {
        await tdb.promiseToPay.update({
          where: { id: p.id },
          data: { status: "KEPT" },
        });
        keptCount++;
        continue;
      }

      // 2) Is it BROKEN? (promise date has passed, and invoice still has outstanding balance)
      if (p.promiseDate < today && invBal > 0) {
        await tdb.promiseToPay.update({
          where: { id: p.id },
          data: { status: "BROKEN" },
        });
        brokenCount++;

        // Send follow-up SMS automatically
        const quota = await checkSmsQuota(tenantId, 1);
        if (quota.allowed && p.guardian.phone) {
          const msg = `${tenant.name}: Dear ${p.guardian.fullName}, the promise to pay KES ${p.amountKes.toLocaleString("en-KE")} for ${p.student.firstName} (due ${p.promiseDate}) is overdue. Please settle it to avoid service disruption.`;
          try {
            await sendSms(p.guardian.phone, msg);
            await recordUsage(tenantId, "smsPerTerm", 1);
          } catch {
            /* ignore */
          }
        }
      }
    }

    return { keptCount, brokenCount };
  });
}
