import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/core/session";

/**
 * G.33 2.0 — COMPANY-GLOBAL appearance settings (PlatformSetting, NOT
 * tenant-owned — same family as PlatformFlag G.22). Only NEYO (SUPER_ADMIN)
 * writes; every signed-in client reads. Schools cannot change the system look
 * (founder rule 2026-06-13: liquidity level is set by the company only).
 *
 * Keys:
 *  - "liquid_level": "1" subtle · "2" standard (default) · "3" deep.
 */
const LIQUID_KEY = "liquid_level";
const LIQUID_LEVELS = ["1", "2", "3"] as const;
export type LiquidLevel = (typeof LIQUID_LEVELS)[number];

export class AppearanceError extends Error {
  constructor(public code: "INVALID", message: string) {
    super(message);
  }
}

export async function getLiquidLevel(): Promise<LiquidLevel> {
  const row = await db.platformSetting.findUnique({ where: { key: LIQUID_KEY } });
  return row && (LIQUID_LEVELS as readonly string[]).includes(row.value)
    ? (row.value as LiquidLevel)
    : "2";
}

export async function setLiquidLevel(user: SessionUser, level: string): Promise<LiquidLevel> {
  if (!(LIQUID_LEVELS as readonly string[]).includes(level)) {
    throw new AppearanceError("INVALID", "Liquidity level must be 1 (subtle), 2 (standard) or 3 (deep).");
  }
  await db.platformSetting.upsert({
    where: { key: LIQUID_KEY },
    update: { value: level, updatedBy: user.fullName },
    create: { key: LIQUID_KEY, value: level, updatedBy: user.fullName },
  });
  await db.auditLog.create({
    data: {
      tenantId: user.tenantId,
      actorId: user.id,
      actorName: user.fullName,
      action: "platform.appearance_updated",
      entityType: "platformSetting",
      entityId: LIQUID_KEY,
      metadata: JSON.stringify({ liquidLevel: level }),
    },
  });
  return level as LiquidLevel;
}
