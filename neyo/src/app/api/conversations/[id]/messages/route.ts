import { NextRequest } from "next/server";
import { requireUser } from "@/lib/core/session";
import { sendMessageSchema } from "@/lib/validations/messaging";
import { getMessages, sendMessage } from "@/lib/services/messaging.service";
import { ok, handleError } from "@/lib/api/respond";

export const dynamic = "force-dynamic";

/** GET /api/conversations/:id/messages — thread (marks read). */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const data = await getMessages(user.tenantId, user.id, params.id, {
      markRead: true,
    });
    return ok(data);
  } catch (err) {
    return handleError(err);
  }
}

/** POST /api/conversations/:id/messages — send a message. */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const input = sendMessageSchema.parse({ ...body, conversationId: params.id });
    const msg = await sendMessage(
      user.tenantId,
      { id: user.id, fullName: user.fullName },
      input
    );
    return ok({ id: msg.id });
  } catch (err) {
    return handleError(err);
  }
}
