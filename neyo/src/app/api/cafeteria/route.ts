/**
 * B.19 Cafeteria API.
 * GET  /api/cafeteria — week menu + kitchen stock + meal cards + today's kitchen board
 * POST /api/cafeteria {action: setMenu|issueCard|cancelCard|kitchenIssue}
 * issueCard bills the student's B.7 invoice (founder rule).
 * Permissions: cafeteria.view (read) / cafeteria.manage (write).
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/core/session";
import { ok, handleError } from "@/lib/api/respond";
import { menuEntrySchema, issueCardSchema, kitchenIssueSchema } from "@/lib/validations/cafeteria";
import {
  weekMenu, setMenuEntry, kitchenStock, issueForMeal, listCards, issueCard,
  cancelCard, kitchenToday,
} from "@/lib/services/cafeteria.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requirePermission("cafeteria.view");
    const [menu, stock, cards, today] = await Promise.all([
      weekMenu(user), kitchenStock(user), listCards(user), kitchenToday(user),
    ]);
    return ok({ menu, stock, cards, today });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission("cafeteria.manage");
    const body = await req.json().catch(() => ({}));
    const action = z
      .object({ action: z.enum(["setMenu", "issueCard", "cancelCard", "kitchenIssue"]) })
      .parse(body).action;
    if (action === "setMenu") return ok(await setMenuEntry(user, menuEntrySchema.parse(body)));
    if (action === "issueCard") return ok(await issueCard(user, issueCardSchema.parse(body)), 201);
    if (action === "cancelCard") {
      const { cardId } = z.object({ cardId: z.string().min(1) }).parse(body);
      return ok(await cancelCard(user, cardId));
    }
    return ok(await issueForMeal(user, kitchenIssueSchema.parse(body)), 201);
  } catch (e) {
    return handleError(e);
  }
}
