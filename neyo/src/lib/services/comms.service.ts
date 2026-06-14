/**
 * B.14 Communication — bulk SMS / announcements with a real audience
 * resolver, PRE-SEND quota + cost preview, per-family dedupe (one SMS per
 * guardian phone even with siblings — cuts the school's SMS bill), the A.7
 * dispatcher for in-app delivery to users, and a send ledger (BulkMessage).
 */
import { db } from "@/lib/db";
import { withTenant } from "@/lib/core/tenant-context";
import { tenantDb } from "@/lib/core/tenant-db";
import { sendSms } from "@/lib/notifications/sms";
import { notify } from "@/lib/services/notification.service";
import { checkSmsQuota, recordUsage } from "@/lib/services/limits.service";
import { channelCost } from "@/lib/core/channels";
import { ROLES, type Role } from "@/lib/core/roles";
import { teacherClassIds } from "@/lib/services/teacher-portal.service";
import type { SessionUser } from "@/lib/core/session";

export class CommsError extends Error {
  constructor(public code: "NOT_FOUND" | "INVALID" | "QUOTA" | "EMPTY" | "FORBIDDEN", message: string) {
    super(message);
    this.name = "CommsError";
  }
}

const TEACHING_ROLES: Role[] = ["TEACHER", "CLASS_TEACHER", "HOD", "DEAN_OF_STUDIES"];

/**
 * Teachers may only broadcast to THEIR OWN classes' parents (B.12 class rule)
 * — never the whole school or staff roles. Protects the school's SMS quota
 * and keeps school-wide comms with leadership.
 */
async function assertAudienceAllowed(user: SessionUser, input: { audienceType: string; classId?: string }) {
  if (!TEACHING_ROLES.includes(user.role as Role)) return; // leadership/bursar/receptionist: full audiences
  if (input.audienceType !== "CLASS_GUARDIANS")
    throw new CommsError("FORBIDDEN", "Teachers can message their own class's parents — school-wide messages are sent by the school office.");
  const allowed = await teacherClassIds(user);
  if (allowed !== null && (!input.classId || !allowed.includes(input.classId)))
    throw new CommsError("FORBIDDEN", "That is not one of your classes.");
}

interface Target {
  /** Phone for SMS; userId for in-app. */
  phone?: string | null;
  userId?: string | null;
  label: string; // recipient display name (for skip reporting)
}

interface ResolvedAudience {
  label: string;
  targets: Target[];
}

const classLabel = (c: { level: string; stream: string | null }) =>
  [c.level, c.stream].filter(Boolean).join(" ");

/** Resolve WHO gets the message. Guardian audiences dedupe by phone (siblings = one SMS per family). */
async function resolveAudience(input: { audienceType: string; classId?: string; role?: string }): Promise<ResolvedAudience> {
  if (input.audienceType === "ROLE") {
    const role = input.role as Role;
    if (!ROLES.includes(role)) throw new CommsError("INVALID", "Unknown role.");
    const users = await tenantDb().user.findMany({
      where: { role, isActive: true },
      select: { id: true, fullName: true, phone: true },
    });
    return {
      label: `All ${role.toLowerCase().replace(/_/g, " ")}s`,
      targets: users.map((u) => ({ userId: u.id, phone: u.phone, label: u.fullName })),
    };
  }

  // Guardian audiences: school-wide or one class.
  let studentWhere: Record<string, unknown> = { status: "ACTIVE", deletedAt: null };
  let label = "All parents/guardians";
  if (input.audienceType === "CLASS_GUARDIANS") {
    const cls = await tenantDb().schoolClass.findUnique({ where: { id: input.classId! } });
    if (!cls) throw new CommsError("NOT_FOUND", "Class not found.");
    studentWhere = { ...studentWhere, classId: cls.id };
    label = `${classLabel(cls)} parents`;
  }
  const links = await tenantDb().studentGuardian.findMany({
    where: { student: studentWhere },
    include: { guardian: true },
  });
  // Dedupe by phone — one SMS per FAMILY (G.12 sibling intelligence).
  const byPhone = new Map<string, Target>();
  for (const l of links) {
    const phone = l.guardian.phone;
    if (!phone) continue;
    if (!byPhone.has(phone)) {
      byPhone.set(phone, { phone, userId: l.guardian.userId, label: l.guardian.fullName });
    }
  }
  return { label, targets: [...byPhone.values()] };
}

/**
 * Preview OR send a bulk message.
 * dryRun=true → audience size + quota status + cost, nothing sent.
 */
export async function bulkSend(
  user: SessionUser,
  input: { audienceType: string; classId?: string; role?: string; channel: "sms" | "in_app"; body: string; dryRun?: boolean }
) {
  return withTenant(user.tenantId, async () => {
    await assertAudienceAllowed(user, input);
    const audience = await resolveAudience(input);
    if (audience.targets.length === 0)
      throw new CommsError("EMPTY", "Nobody matches that audience (no phone numbers / users found).");

    const count = audience.targets.length;
    const costKes = input.channel === "sms" ? channelCost("sms", count) : 0;

    // PRE-SEND QUOTA CHECK (B.14.2) — always run for SMS, even on dry runs.
    let quotaMessage: string | undefined;
    if (input.channel === "sms") {
      const quota = await checkSmsQuota(user.tenantId, count);
      quotaMessage = quota.message;
      if (!quota.allowed) {
        if (input.dryRun) {
          return { dryRun: true, allowed: false, recipientCount: count, audienceLabel: audience.label, costKes, quota: quota.status, message: quota.message };
        }
        throw new CommsError("QUOTA", quota.message ?? "SMS quota exceeded.");
      }
    }
    if (input.dryRun) {
      return { dryRun: true, allowed: true, recipientCount: count, audienceLabel: audience.label, costKes, message: quotaMessage };
    }

    // SEND.
    const tenant = await db.tenant.findUniqueOrThrow({ where: { id: user.tenantId }, select: { name: true } });
    let sent = 0;
    let skipped = 0;
    const skippedWho: string[] = [];

    for (const t of audience.targets) {
      try {
        if (input.channel === "sms") {
          if (!t.phone) { skipped++; skippedWho.push(t.label); continue; }
          const r = await sendSms(t.phone, `${tenant.name}: ${input.body}`);
          if (r.ok) sent++; else { skipped++; skippedWho.push(t.label); }
        } else {
          // in_app via the A.7 dispatcher (creates inbox row + respects opt-outs).
          if (!t.userId) { skipped++; skippedWho.push(t.label); continue; }
          await notify({
            tenantId: user.tenantId, recipientId: t.userId,
            title: `Message from ${tenant.name}`, body: input.body,
            category: "announcement", channels: ["in_app"],
          });
          sent++;
        }
      } catch {
        skipped++; skippedWho.push(t.label);
      }
    }

    if (input.channel === "sms" && sent > 0) {
      await recordUsage(user.tenantId, "smsPerTerm", sent);
    }

    const record = await db.bulkMessage.create({
      data: {
        tenantId: user.tenantId,
        audienceType: input.audienceType,
        classId: input.classId ?? null,
        audienceLabel: audience.label,
        role: input.role ?? null,
        channel: input.channel,
        body: input.body,
        recipientCount: count,
        sentCount: sent,
        skippedCount: skipped,
        costKes: input.channel === "sms" ? channelCost("sms", sent) : 0,
        senderId: user.id,
        senderName: user.fullName,
      },
    });
    await db.auditLog.create({
      data: {
        tenantId: user.tenantId, actorId: user.id, actorName: user.fullName,
        action: "comms.bulk_sent", entityType: "bulkMessage", entityId: record.id,
        metadata: JSON.stringify({ audience: audience.label, channel: input.channel, sent, skipped }),
      },
    });

    return { dryRun: false, id: record.id, recipientCount: count, sent, skipped, skippedWho: skippedWho.slice(0, 10), costKes: record.costKes, audienceLabel: audience.label, message: quotaMessage };
  });
}

/** The audiences the sender can pick from (sizes computed live, teacher-scoped). */
export async function audienceOptions(user: SessionUser) {
  return withTenant(user.tenantId, async () => {
    const teaching = TEACHING_ROLES.includes(user.role as Role);
    const allowedClassIds = teaching ? await teacherClassIds(user) : null;

    const classes = await tenantDb().schoolClass.findMany({
      where: {
        archived: false,
        ...(allowedClassIds !== null ? { id: { in: allowedClassIds } } : {}),
      },
      orderBy: [{ level: "asc" }, { stream: "asc" }],
    });
    const classOpts = [];
    for (const c of classes) {
      const a = await resolveAudience({ audienceType: "CLASS_GUARDIANS", classId: c.id }).catch(() => null);
      classOpts.push({ id: c.id, label: classLabel(c), families: a?.targets.length ?? 0 });
    }

    if (teaching) {
      // Teachers: class audiences only — no school-wide, no roles.
      return { teacherScoped: true, schoolFamilies: 0, classes: classOpts, roles: [] as { role: string; users: number }[] };
    }

    const school = await resolveAudience({ audienceType: "SCHOOL_GUARDIANS" });
    const roleCounts = await tenantDb().user.groupBy({ by: ["role"], where: { isActive: true }, _count: { _all: true } });
    return {
      teacherScoped: false,
      schoolFamilies: school.targets.length,
      classes: classOpts,
      roles: roleCounts.map((r) => ({ role: r.role, users: r._count._all })).sort((a, b) => b.users - a.users),
    };
  });
}

/** Send history (the ledger). */
export async function listBulkMessages(user: SessionUser) {
  return withTenant(user.tenantId, async () => {
    return tenantDb().bulkMessage.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  });
}
