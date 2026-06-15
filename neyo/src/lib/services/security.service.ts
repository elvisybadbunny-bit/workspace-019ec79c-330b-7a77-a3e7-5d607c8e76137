/**
 * B.22 Security — gate passes (authorised exits w/ GP-#### codes the gate
 * checks), the authorised-pickup list per student (ID-checked at the gate),
 * and EMERGENCY PANIC ALERTS (any staff raises; leadership SMSed + every
 * staff member gets an in-app alert instantly). Visitor management = A.18.
 * CCTV integration = hardware-deferred (flagged, never faked).
 */
import { db } from "@/lib/db";
import { withTenant } from "@/lib/core/tenant-context";
import { tenantDb } from "@/lib/core/tenant-db";
import { sendSms } from "@/lib/notifications/sms";
import { checkSmsQuota, recordUsage } from "@/lib/services/limits.service";
import { createInApp } from "@/lib/services/notification.service";
import type { SessionUser } from "@/lib/core/session";

export class SecurityError extends Error {
  constructor(public code: "NOT_FOUND" | "INVALID" | "ALREADY", message: string) {
    super(message);
    this.name = "SecurityError";
  }
}

async function audit(user: SessionUser, action: string, entityType: string, entityId: string, metadata?: unknown) {
  await db.auditLog.create({
    data: {
      tenantId: user.tenantId, actorId: user.id, actorName: user.fullName,
      action, entityType, entityId,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}

const fullName = (s: { firstName: string; middleName: string | null; lastName: string }) =>
  [s.firstName, s.middleName, s.lastName].filter(Boolean).join(" ");

// ---------------------------------------------------------------------------
// Gate passes (B.22.2)
// ---------------------------------------------------------------------------

export async function issueGatePass(
  user: SessionUser,
  input: { studentId: string; reason: string; leaveAt: string; returnBy?: string; escortName?: string }
) {
  return withTenant(user.tenantId, async () => {
    const student = await tenantDb().student.findFirst({ where: { id: input.studentId, deletedAt: null } });
    if (!student) throw new SecurityError("NOT_FOUND", "Student not found.");
    const open = await tenantDb().gatePass.findFirst({ where: { studentId: student.id, status: "ACTIVE" } });
    if (open) throw new SecurityError("ALREADY", `${student.firstName} already has an active pass (${open.passNo}).`);

    const count = await tenantDb().gatePass.count();
    const passNo = `GP${count + 1}`;
    const pass = await db.gatePass.create({
      data: {
        tenantId: user.tenantId, passNo, studentId: student.id,
        studentName: fullName(student), admissionNo: student.admissionNo,
        reason: input.reason, leaveAt: new Date(input.leaveAt),
        returnBy: input.returnBy ? new Date(input.returnBy) : null,
        escortName: input.escortName ?? null,
        issuedById: user.id, issuedByName: user.fullName,
      },
    });
    await audit(user, "security.gatepass_issued", "gatePass", pass.id, { passNo, student: pass.studentName, reason: input.reason });
    return pass;
  });
}

/** Gate checks/uses a pass by its number. */
export async function useGatePass(user: SessionUser, passNo: string) {
  return withTenant(user.tenantId, async () => {
    const pass = await tenantDb().gatePass.findFirst({ where: { passNo: passNo.trim().toUpperCase() } });
    if (!pass) throw new SecurityError("NOT_FOUND", "No pass with that number.");
    if (pass.status !== "ACTIVE") throw new SecurityError("ALREADY", `Pass ${pass.passNo} is ${pass.status.toLowerCase()} — do not allow exit.`);
    const row = await tenantDb().gatePass.update({
      where: { id: pass.id }, data: { status: "USED", usedAt: new Date() },
    });
    await audit(user, "security.gatepass_used", "gatePass", pass.id, { passNo: pass.passNo, student: pass.studentName });
    return row;
  });
}

export async function cancelGatePass(user: SessionUser, passId: string) {
  return withTenant(user.tenantId, async () => {
    const pass = await tenantDb().gatePass.findUnique({ where: { id: passId } });
    if (!pass) throw new SecurityError("NOT_FOUND", "Pass not found.");
    if (pass.status !== "ACTIVE") throw new SecurityError("ALREADY", "Only active passes can be cancelled.");
    const row = await tenantDb().gatePass.update({ where: { id: passId }, data: { status: "CANCELLED" } });
    await audit(user, "security.gatepass_cancelled", "gatePass", passId, { passNo: pass.passNo });
    return row;
  });
}

export async function listGatePasses(user: SessionUser) {
  return withTenant(user.tenantId, async () => {
    return tenantDb().gatePass.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  });
}

// ---------------------------------------------------------------------------
// Pickup authorisation (B.22.3)
// ---------------------------------------------------------------------------

export async function addPickupPerson(
  user: SessionUser,
  input: { studentId: string; fullName: string; relationship: string; phone: string; nationalId?: string }
) {
  return withTenant(user.tenantId, async () => {
    const student = await tenantDb().student.findFirst({ where: { id: input.studentId, deletedAt: null } });
    if (!student) throw new SecurityError("NOT_FOUND", "Student not found.");
    const person = await db.pickupPerson.create({
      data: {
        tenantId: user.tenantId, studentId: student.id, fullName: input.fullName,
        relationship: input.relationship, phone: input.phone,
        nationalId: input.nationalId ?? null, addedById: user.id,
      },
    });
    await audit(user, "security.pickup_added", "pickupPerson", person.id, { student: fullName(student), person: input.fullName });
    return person;
  });
}

export async function removePickupPerson(user: SessionUser, personId: string) {
  return withTenant(user.tenantId, async () => {
    const person = await tenantDb().pickupPerson.findUnique({ where: { id: personId } });
    if (!person) throw new SecurityError("NOT_FOUND", "Person not found.");
    const row = await tenantDb().pickupPerson.update({ where: { id: personId }, data: { active: false } });
    await audit(user, "security.pickup_removed", "pickupPerson", personId, { person: person.fullName });
    return row;
  });
}

/** Gate lookup: who is ALLOWED to pick this student (by name/adm search). */
export async function pickupListFor(user: SessionUser, q: string) {
  return withTenant(user.tenantId, async () => {
    const students = await tenantDb().student.findMany({
      where: {
        deletedAt: null, status: "ACTIVE",
        OR: [
          { firstName: { contains: q } }, { lastName: { contains: q } },
          { admissionNo: { contains: q } },
        ],
      },
      take: 5,
    });
    const out = [];
    for (const s of students) {
      const persons = await tenantDb().pickupPerson.findMany({ where: { studentId: s.id, active: true } });
      out.push({
        studentId: s.id, studentName: fullName(s), admissionNo: s.admissionNo,
        persons: persons.map((p) => ({ id: p.id, fullName: p.fullName, relationship: p.relationship, phone: p.phone, nationalId: p.nationalId })),
      });
    }
    return out;
  });
}

// ---------------------------------------------------------------------------
// Panic alerts (B.22.5)
// ---------------------------------------------------------------------------

export async function raisePanic(
  user: SessionUser,
  input: { kind: string; location: string; note?: string }
) {
  return withTenant(user.tenantId, async () => {
    const alert = await db.panicAlert.create({
      data: {
        tenantId: user.tenantId, kind: input.kind, location: input.location,
        note: input.note ?? null, raisedById: user.id, raisedByName: user.fullName,
      },
    });

    const tenant = await db.tenant.findUniqueOrThrow({ where: { id: user.tenantId }, select: { name: true } });
    const message = `🚨 ${tenant.name} EMERGENCY (${input.kind}): ${input.location}. Raised by ${user.fullName}.${input.note ? ` ${input.note}` : ""}`;

    // In-app alert to EVERY active staff member (not parents/students).
    const staff = await tenantDb().user.findMany({
      where: { isActive: true, role: { notIn: ["PARENT", "STUDENT"] } },
      select: { id: true, phone: true, role: true },
    });
    for (const s of staff) {
      if (s.id === user.id) continue;
      await createInApp({
        tenantId: user.tenantId, recipientId: s.id,
        title: `🚨 EMERGENCY — ${input.kind}`,
        body: `${input.location}. Raised by ${user.fullName}. Follow the school emergency procedure.`,
        category: "emergency",
      });
    }

    // SMS leadership (principal + deputy) — the people who must act NOW.
    let smsSent = 0;
    const leadership = staff.filter((s) => ["PRINCIPAL", "DEPUTY_PRINCIPAL", "SCHOOL_OWNER"].includes(s.role) && s.phone);
    const quota = await checkSmsQuota(user.tenantId, leadership.length);
    if (quota.allowed) {
      for (const l of leadership) {
        try { await sendSms(l.phone!, message); smsSent++; } catch { /* skip */ }
      }
      if (smsSent > 0) await recordUsage(user.tenantId, "smsPerTerm", smsSent);
    }
    await db.panicAlert.update({ where: { id: alert.id }, data: { smsSent } });
    await audit(user, "security.panic_raised", "panicAlert", alert.id, { kind: input.kind, location: input.location, smsSent, inApp: staff.length - 1 });
    return { id: alert.id, smsSent, notified: staff.length - 1 };
  });
}

export async function resolvePanic(user: SessionUser, alertId: string) {
  return withTenant(user.tenantId, async () => {
    const alert = await tenantDb().panicAlert.findUnique({ where: { id: alertId } });
    if (!alert) throw new SecurityError("NOT_FOUND", "Alert not found.");
    if (alert.resolvedAt) throw new SecurityError("ALREADY", "Already resolved.");
    const row = await tenantDb().panicAlert.update({
      where: { id: alertId }, data: { resolvedAt: new Date(), resolvedBy: user.fullName },
    });
    await audit(user, "security.panic_resolved", "panicAlert", alertId, {});
    return row;
  });
}

export async function listPanics(user: SessionUser) {
  return withTenant(user.tenantId, async () => {
    return tenantDb().panicAlert.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
  });
}

/** Confirm student pickup at the gate & dispatch auto-SMS to parents (H.3) */
export async function confirmPickupPerson(user: SessionUser, studentId: string, personId: string) {
  return withTenant(user.tenantId, async () => {
    const student = await tenantDb().student.findUnique({
      where: { id: studentId, deletedAt: null },
    });
    if (!student) throw new SecurityError("NOT_FOUND", "Student not found.");

    const person = await tenantDb().pickupPerson.findUnique({
      where: { id: personId },
    });
    if (!person || !person.active) throw new SecurityError("NOT_FOUND", "Pickup person not found or inactive.");

    const tenant = await db.tenant.findUniqueOrThrow({ where: { id: user.tenantId }, select: { name: true } });

    // Find the student's primary guardian or any registered guardian
    const link = await tenantDb().studentGuardian.findFirst({
      where: { studentId, isPrimary: true },
      include: { guardian: true },
    }) ?? await tenantDb().studentGuardian.findFirst({
      where: { studentId },
      include: { guardian: true },
    });

    const studentName = fullName(student);

    // Dispatch an instant automated SMS to the parent's phone!
    if (link?.guardian.phone) {
      const timeStr = new Date().toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
      const msg = `Dear Parent, your child ${studentName} was picked up from school by ${person.fullName} (${person.relationship}, ID: ${person.nationalId || "Checked"}) at ${timeStr}. Thank you, ${tenant.name}.`;
      try {
        const quota = await checkSmsQuota(user.tenantId, 1);
        if (quota.allowed) {
          await sendSms(link.guardian.phone, msg);
          await recordUsage(user.tenantId, "smsPerTerm", 1);
        }
      } catch {
        // ignore and continue
      }
    }

    await audit(user, "security.pickup_authorized", "student", studentId, {
      student: studentName,
      picker: person.fullName,
      pickerId: person.nationalId,
    });

    return { success: true, studentName, pickerName: person.fullName };
  });
}
