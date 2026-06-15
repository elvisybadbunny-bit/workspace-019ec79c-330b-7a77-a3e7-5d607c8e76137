import { getCurrentUser } from "@/lib/core/session";
import { permissionsForRole } from "@/lib/core/permissions";
import { ok, handleError } from "@/lib/api/respond";

export const dynamic = "force-dynamic";

/** GET /api/auth/permissions — the effective permissions for the current user. */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return ok({ role: null, permissions: [] });
    
    // Combine primary and secondary roles permissions for dual-role staff support
    const primaryPerms = permissionsForRole(user.role);
    const secondaryPerms = user.secondaryRole ? permissionsForRole(user.secondaryRole) : [];
    
    const combinedPerms = Array.from(new Set([...primaryPerms, ...secondaryPerms])).sort();

    return ok({
      role: user.role,
      secondaryRole: user.secondaryRole,
      permissions: combinedPerms,
    });
  } catch (err) {
    return handleError(err);
  }
}
