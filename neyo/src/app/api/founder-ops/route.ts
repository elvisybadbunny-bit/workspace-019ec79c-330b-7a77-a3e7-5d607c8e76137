import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/core/session";
import { ok, handleError } from "@/lib/api/respond";
import {
  neyoBuildLogSchema,
  neyoMetricSnapshotSchema,
  neyoFounderOpsEntrySchema,
  neyoCustomerInterviewSchema,
  founderOpsListQuerySchema,
  founderOpsIdSchema,
} from "@/lib/validations/founder-ops";
import {
  founderOpsDashboard,
  listBuildLogs,
  upsertBuildLog,
  deleteBuildLog,
  listMetricSnapshots,
  upsertMetricSnapshot,
  deleteMetricSnapshot,
  listFounderOpsEntries,
  upsertFounderOpsEntry,
  deleteFounderOpsEntry,
  listCustomerInterviews,
  createCustomerInterview,
  updateCustomerInterview,
  deleteCustomerInterview,
} from "@/lib/services/founder-ops.service";

export const dynamic = "force-dynamic";

const viewSchema = z.enum(["dashboard", "build_logs", "metrics", "entries", "interviews"]);
const actionSchema = z.object({
  action: z.enum([
    "upsert_build_log",
    "delete_build_log",
    "upsert_metric",
    "delete_metric",
    "upsert_entry",
    "delete_entry",
    "create_interview",
    "update_interview",
    "delete_interview",
  ]),
  id: z.string().optional(),
  data: z.unknown().optional(),
});

function parseId(id: string | undefined) {
  return founderOpsIdSchema.parse({ id }).id;
}

/**
 * GET /api/founder-ops?view=dashboard
 * NEYO company internal ops. SUPER_ADMIN only.
 */
export async function GET(req: NextRequest) {
  try {
    await requireRole("SUPER_ADMIN");
    const url = new URL(req.url);
    const view = viewSchema.parse(url.searchParams.get("view") || "dashboard");
    const limit = Number(url.searchParams.get("limit") || 50);

    if (view === "dashboard") return ok({ dashboard: await founderOpsDashboard() });
    if (view === "build_logs") return ok({ buildLogs: await listBuildLogs(limit) });
    if (view === "metrics") return ok({ metrics: await listMetricSnapshots(limit) });
    if (view === "entries") {
      const query = founderOpsListQuerySchema.parse({
        kind: url.searchParams.get("kind") || undefined,
        status: url.searchParams.get("status") || undefined,
        limit,
      });
      return ok({ entries: await listFounderOpsEntries(query) });
    }
    if (view === "interviews") {
      return ok({ interviews: await listCustomerInterviews(limit, url.searchParams.get("status") || undefined) });
    }

    return ok({ dashboard: await founderOpsDashboard() });
  } catch (err) {
    return handleError(err);
  }
}

/** POST /api/founder-ops — mutate NEYO company ops records. SUPER_ADMIN only. */
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("SUPER_ADMIN");
    const body = actionSchema.parse(await req.json().catch(() => ({})));

    switch (body.action) {
      case "upsert_build_log":
        return ok({ buildLog: await upsertBuildLog(user, neyoBuildLogSchema.parse(body.data)) });
      case "delete_build_log":
        return ok(await deleteBuildLog(parseId(body.id)));

      case "upsert_metric":
        return ok({ metric: await upsertMetricSnapshot(user, neyoMetricSnapshotSchema.parse(body.data)) });
      case "delete_metric":
        return ok(await deleteMetricSnapshot(parseId(body.id)));

      case "upsert_entry":
        return ok({ entry: await upsertFounderOpsEntry(user, neyoFounderOpsEntrySchema.parse(body.data)) });
      case "delete_entry":
        return ok(await deleteFounderOpsEntry(parseId(body.id)));

      case "create_interview":
        return ok({ interview: await createCustomerInterview(user, neyoCustomerInterviewSchema.parse(body.data)) }, 201);
      case "update_interview":
        return ok({ interview: await updateCustomerInterview(parseId(body.id), neyoCustomerInterviewSchema.parse(body.data)) });
      case "delete_interview":
        return ok(await deleteCustomerInterview(parseId(body.id)));
    }
  } catch (err) {
    return handleError(err);
  }
}
