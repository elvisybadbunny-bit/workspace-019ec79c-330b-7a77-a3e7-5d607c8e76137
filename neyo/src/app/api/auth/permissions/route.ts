import { getCurrentUser } from "@/lib/core/session";
import { permissionsForRole } from "@/lib/core/permissions";
import { ok, handleError } from "@/lib/api/respond";

export const dynamic = "force-dynamic";

/** GET /api/auth/permissions — the effective permissions for the current user. */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return ok({ role: null, permissions: [] });
    return ok({
      role: user.role,
      permissions: permissionsForRole(user.role),
    });
  } catch (err) {
    return handleError(err);
  }
}
