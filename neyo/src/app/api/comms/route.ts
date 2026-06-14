/**
 * B.14 Communication API.
 * GET  /api/comms            — audience options (sizes) + send history
 * POST /api/comms            — bulk send (dryRun:true = quota/cost preview only)
 * Permission: comms.send.
 */
import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/core/session";
import { ok, handleError } from "@/lib/api/respond";
import { bulkSendSchema } from "@/lib/validations/comms";
import { bulkSend, audienceOptions, listBulkMessages } from "@/lib/services/comms.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requirePermission("comms.send");
    const [audiences, history] = await Promise.all([
      audienceOptions(user),
      listBulkMessages(user),
    ]);
    return ok({ audiences, history });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission("comms.send");
    const input = bulkSendSchema.parse(await req.json().catch(() => ({})));
    return ok(await bulkSend(user, input));
  } catch (e) {
    return handleError(e);
  }
}
