/**
 * B.19 Cafeteria — weekly meal plan, food inventory (REUSES the B.18 Kitchen
 * Store — one stock truth, no double entry), student meal cards BILLED TO
 * THE STUDENT'S INVOICE on issue (founder rule), and kitchen management
 * (issue food against a meal, see today's headcount per meal).
 */
import { db } from "@/lib/db";
import { withTenant } from "@/lib/core/tenant-context";
import { tenantDb } from "@/lib/core/tenant-db";
import { nextTenantId } from "@/lib/services/identity.service";
import { stockOut } from "@/lib/services/inventory.service";
import type { SessionUser } from "@/lib/core/session";

export class CafeteriaError extends Error {
  constructor(public code: "NOT_FOUND" | "DUPLICATE" | "INVALID" | "ALREADY", message: string) {
    super(message);
    this.name = "CafeteriaError";
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
// Meal planning (B.19.1)
// ---------------------------------------------------------------------------

export async function weekMenu(user: SessionUser) {
  return withTenant(user.tenantId, async () => {
    const rows = await tenantDb().mealPlanEntry.findMany({ orderBy: [{ dayOfWeek: "asc" }] });
    return rows.map((r) => ({ id: r.id, dayOfWeek: r.dayOfWeek, mealType: r.mealType, menu: r.menu }));
  });
}

export async function setMenuEntry(user: SessionUser, input: { dayOfWeek: number; mealType: string; menu: string }) {
  return withTenant(user.tenantId, async () => {
    const row = await db.mealPlanEntry.upsert({
      where: { tenantId_dayOfWeek_mealType: { tenantId: user.tenantId, dayOfWeek: input.dayOfWeek, mealType: input.mealType } },
      create: { tenantId: user.tenantId, dayOfWeek: input.dayOfWeek, mealType: input.mealType, menu: input.menu },
      update: { menu: input.menu },
    });
    await audit(user, "cafeteria.menu_set", "mealPlanEntry", row.id, input);
    return row;
  });
}

// ---------------------------------------------------------------------------
// Food inventory (B.19.2) — the Kitchen Store view (B.18 reuse, no new tables)
// ---------------------------------------------------------------------------

export async function kitchenStock(user: SessionUser) {
  return withTenant(user.tenantId, async () => {
    const kitchen = await tenantDb().store.findFirst({ where: { name: { contains: "Kitchen" }, archived: false } });
    if (!kitchen) return { storeId: null, items: [] as { id: string; name: string; qty: number; unit: string; low: boolean }[] };
    const items = await tenantDb().stockItem.findMany({
      where: { storeId: kitchen.id, archived: false },
      orderBy: { name: "asc" },
    });
    return {
      storeId: kitchen.id,
      items: items.map((i) => ({
        id: i.id, name: i.name, qty: i.qty, unit: i.unit,
        low: i.reorderLevel > 0 && i.qty <= i.reorderLevel,
      })),
    };
  });
}

/** Kitchen issues food for a meal — wraps the B.18 stockOut (one stock truth). */
export async function issueForMeal(user: SessionUser, input: { itemId: string; qty: number; meal: string }) {
  return stockOut(user, { itemId: input.itemId, qty: input.qty, reason: `Kitchen — ${input.meal}` });
}

// ---------------------------------------------------------------------------
// Student meal cards (B.19.3) — FOUNDER RULE: billed on issue
// ---------------------------------------------------------------------------

export async function listCards(user: SessionUser) {
  return withTenant(user.tenantId, async () => {
    const cards = await tenantDb().mealCard.findMany({ orderBy: { issuedAt: "desc" }, take: 100 });
    const invoiceIds = cards.map((c) => c.invoiceId);
    const invoices = invoiceIds.length
      ? await tenantDb().invoice.findMany({ where: { id: { in: invoiceIds } }, select: { id: true, status: true, invoiceNo: true } })
      : [];
    const iMap = new Map(invoices.map((i) => [i.id, i]));
    return cards.map((c) => ({
      id: c.id, cardNo: c.cardNo, studentName: c.studentName, admissionNo: c.admissionNo,
      planName: c.planName, meals: JSON.parse(c.meals) as string[],
      termFeeKes: c.termFeeKes, active: c.active,
      invoiceNo: iMap.get(c.invoiceId)?.invoiceNo ?? "—",
      invoiceStatus: iMap.get(c.invoiceId)?.status ?? "—",
    }));
  });
}

export async function issueCard(
  user: SessionUser,
  input: { studentId: string; meals: string[]; termFeeKes: number; year: number; term: number }
) {
  return withTenant(user.tenantId, async () => {
    const student = await tenantDb().student.findFirst({ where: { id: input.studentId, status: "ACTIVE", deletedAt: null } });
    if (!student) throw new CafeteriaError("NOT_FOUND", "Student not found (or not active).");

    const planName = `${input.meals.map((m) => m.charAt(0) + m.slice(1).toLowerCase()).join(" + ")} plan — Term ${input.term} ${input.year}`;
    const dup = await tenantDb().mealCard.findFirst({ where: { studentId: student.id, year: input.year, term: input.term, active: true } });
    if (dup) throw new CafeteriaError("ALREADY", `${student.firstName} already has an active card this term (${dup.cardNo}). Cancel it first.`);

    // FOUNDER RULE: bill the invoice FIRST — no card without a ledger entry.
    const invoiceNo = await nextTenantId(user.tenantId, "INVOICE");
    const due = new Date(Date.now() + 3 * 3600_000 + 14 * 24 * 3600_000).toISOString().slice(0, 10);
    const invoice = await db.invoice.create({
      data: {
        tenantId: user.tenantId, invoiceNo, studentId: student.id,
        description: `Meals — ${planName}`,
        totalKes: input.termFeeKes, dueDate: due, status: "UNPAID",
        year: input.year, term: input.term,
      },
    });

    const count = await tenantDb().mealCard.count();
    const cardNo = `MC${count + 1}`;
    const card = await db.mealCard.create({
      data: {
        tenantId: user.tenantId, cardNo, studentId: student.id,
        studentName: fullName(student), admissionNo: student.admissionNo,
        planName, meals: JSON.stringify(input.meals), termFeeKes: input.termFeeKes,
        invoiceId: invoice.id, year: input.year, term: input.term,
      },
    });
    await audit(user, "cafeteria.card_issued", "mealCard", card.id, { cardNo, student: card.studentName, planName, invoiceNo, termFeeKes: input.termFeeKes });
    return { cardId: card.id, cardNo, invoiceId: invoice.id, invoiceNo, planName, studentName: card.studentName };
  });
}

export async function cancelCard(user: SessionUser, cardId: string) {
  return withTenant(user.tenantId, async () => {
    const card = await tenantDb().mealCard.findUnique({ where: { id: cardId } });
    if (!card) throw new CafeteriaError("NOT_FOUND", "Card not found.");
    if (!card.active) throw new CafeteriaError("ALREADY", "Card is already cancelled.");
    const row = await tenantDb().mealCard.update({ where: { id: cardId }, data: { active: false, cancelledAt: new Date() } });
    await audit(user, "cafeteria.card_cancelled", "mealCard", cardId, { cardNo: card.cardNo });
    return row;
  });
}

// ---------------------------------------------------------------------------
// Kitchen management (B.19.4) — today's headcount per meal + low stock
// ---------------------------------------------------------------------------

export async function kitchenToday(user: SessionUser) {
  return withTenant(user.tenantId, async () => {
    const cards = await tenantDb().mealCard.findMany({ where: { active: true } });
    const headcount: Record<string, number> = { BREAKFAST: 0, LUNCH: 0, SUPPER: 0 };
    for (const c of cards) {
      for (const m of JSON.parse(c.meals) as string[]) headcount[m] = (headcount[m] ?? 0) + 1;
    }
    // Boarders eat all meals regardless of cards (boarding fee covers meals).
    const boarders = await tenantDb().hostelAllocation.count({ where: { releasedAt: null } });

    const nairobiNow = new Date(Date.now() + 3 * 3600_000);
    const jsDay = nairobiNow.getUTCDay();
    const dayOfWeek = jsDay === 0 ? 7 : jsDay;
    const todayMenu = await tenantDb().mealPlanEntry.findMany({ where: { dayOfWeek } });

    const stock = await kitchenStock(user);

    // B.21 link: FOOD-allergy register for the kitchen crew (safety board).
    const { allergyRegister } = await import("@/lib/services/clinic.service");
    const allergic = await allergyRegister(user).catch(() => []);

    return {
      dayOfWeek,
      todayMenu: todayMenu.map((m) => ({ mealType: m.mealType, menu: m.menu })),
      headcount: {
        BREAKFAST: headcount.BREAKFAST + boarders,
        LUNCH: headcount.LUNCH + boarders,
        SUPPER: headcount.SUPPER + boarders,
      },
      dayScholarsWithCards: cards.length,
      boarders,
      lowStock: stock.items.filter((i) => i.low),
      foodAllergies: allergic.map((a) => ({ studentName: a.studentName, className: a.className, allergies: a.allergies })),
    };
  });
}
