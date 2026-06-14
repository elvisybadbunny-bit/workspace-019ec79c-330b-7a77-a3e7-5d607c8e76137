/**
 * G.22 Platform feature flags (founder 2026-06-12: "US THE COMPANY SHOULD
 * HAVE A FEATURE WHERE WE CAN PAUSE SOMETHING AS WE STILL CONTINUE BUILDING
 * IT BEFORE RELEASING TO THE PUBLIC").
 *
 * SUPER_ADMIN (NEYO company) pauses a module key GLOBALLY: it vanishes from
 * every school's nav + its page/API returns "coming soon" — while we keep
 * building. NOT tenant-owned; lives at the platform level.
 */
import { db } from "@/lib/db";
import { MODULES, isModuleKey } from "@/lib/core/modules";
import type { SessionUser } from "@/lib/core/session";

export class FlagError extends Error {
  constructor(public code: "NOT_FOUND" | "FORBIDDEN", message: string) {
    super(message);
    this.name = "FlagError";
  }
}

/** Module keys currently paused platform-wide. Cheap query — called per layout render. */
export async function pausedModuleKeys(): Promise<Set<string>> {
  const rows = await db.platformFlag.findMany({ where: { paused: true } });
  return new Set(rows.map((r) => r.moduleKey));
}

/** Is one module paused? (For API guards.) */
export async function isPaused(moduleKey: string): Promise<{ paused: boolean; note: string | null }> {
  const row = await db.platformFlag.findUnique({ where: { moduleKey } });
  return { paused: Boolean(row?.paused), note: row?.note ?? null };
}

/** All flags w/ module labels (SUPER_ADMIN console). */
export async function listFlags() {
  const rows = await db.platformFlag.findMany();
  const map = new Map(rows.map((r) => [r.moduleKey, r]));
  return MODULES.filter((m) => !m.core).map((m) => ({
    moduleKey: m.key,
    label: m.label,
    paused: map.get(m.key)?.paused ?? false,
    note: map.get(m.key)?.note ?? null,
  }));
}

/** Pause/release a module platform-wide. SUPER_ADMIN only (route-gated). */
export async function setFlag(user: SessionUser, moduleKey: string, paused: boolean, note?: string) {
  if (!isModuleKey(moduleKey)) throw new FlagError("NOT_FOUND", "Unknown module key.");
  const row = await db.platformFlag.upsert({
    where: { moduleKey },
    create: { moduleKey, paused, note: note ?? null, updatedBy: user.fullName },
    update: { paused, note: note ?? null, updatedBy: user.fullName },
  });
  await db.auditLog.create({
    data: {
      tenantId: user.tenantId, actorId: user.id, actorName: user.fullName,
      action: paused ? "platform.module_paused" : "platform.module_released",
      entityType: "platformFlag", entityId: row.id,
      metadata: JSON.stringify({ moduleKey, note }),
    },
  });
  return row;
}
