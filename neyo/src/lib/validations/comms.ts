/**
 * B.14 Communication — Zod validation.
 * Bulk SMS / announcements to audiences (whole school's guardians, one
 * class's guardians, or all users of a role).
 */
import { z } from "zod";

export const AUDIENCE_TYPES = ["SCHOOL_GUARDIANS", "CLASS_GUARDIANS", "ROLE"] as const;

export const bulkSendSchema = z
  .object({
    audienceType: z.enum(AUDIENCE_TYPES),
    classId: z.string().min(1).optional(), // required for CLASS_GUARDIANS
    role: z.string().min(1).optional(), // required for ROLE
    channel: z.enum(["sms", "in_app"]),
    body: z
      .string()
      .trim()
      .min(5, "Write the message (at least 5 characters).")
      .max(480, "Keep it under 480 characters (3 SMS segments)."),
    /** True = only check quota/cost and return the preview, don't send. */
    dryRun: z.boolean().optional(),
  })
  .refine((v) => v.audienceType !== "CLASS_GUARDIANS" || Boolean(v.classId), {
    message: "Pick the class.",
  })
  .refine((v) => v.audienceType !== "ROLE" || Boolean(v.role), {
    message: "Pick the role.",
  });
export type BulkSendInput = z.infer<typeof bulkSendSchema>;
