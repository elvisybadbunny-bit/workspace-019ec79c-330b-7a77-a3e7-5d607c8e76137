import { db } from "@/lib/db";
import { withTenant } from "@/lib/core/tenant-context";
import { tenantDb } from "@/lib/core/tenant-db";
import { isRole, type Role } from "@/lib/core/roles";
import { generateNeyoLoginId } from "@/lib/services/identity.service";
import { normalizeKePhone } from "@/lib/validations/auth";
import type { SessionUser } from "@/lib/core/session";

export interface StaffImportRow {
  fullName: string;
  role: string;
  phone?: string;
  email?: string;
  tscNumber?: string;
  nationalId?: string;
}

export interface StaffImportResult {
  totalRows: number;
  created: number;
  skipped: number;
  errors: { row: number; name: string; message: string }[];
}

/**
 * B.9 Staff Bulk Import Service.
 * Allows importing many staff records in a single batch with full validation.
 * Idempotent: checks for existing emails or TSC numbers.
 */
export async function importStaffBatch(
  user: SessionUser,
  rows: StaffImportRow[]
): Promise<StaffImportResult> {
  return withTenant(user.tenantId, async () => {
    const result: StaffImportResult = {
      totalRows: rows.length,
      created: 0,
      skipped: 0,
      errors: [],
    };

    let idx = 1;
    for (const r of rows) {
      const rowIdx = idx++;
      const name = r.fullName?.trim() || "";
      
      if (!name) {
        result.skipped++;
        result.errors.push({ row: rowIdx, name: "Row " + rowIdx, message: "Full Name is required." });
        continue;
      }

      // Validate role
      const rawRole = r.role?.toUpperCase().trim().replace(/\s+/g, "_") || "";
      const validatedRole: Role = isRole(rawRole) ? (rawRole as Role) : "TEACHER";
      
      if (!isRole(rawRole)) {
        result.skipped++;
        result.errors.push({
          row: rowIdx,
          name,
          message: `Invalid role "${r.role}". Defaulted to TEACHER or must match standard roles.`,
        });
        continue;
      }

      // Check duplicates
      const phone = r.phone ? normalizeKePhone(r.phone) : null;
      const email = r.email?.trim().toLowerCase() || null;

      try {
        if (email) {
          const emailExists = await db.user.findFirst({
            where: { tenantId: user.tenantId, email },
          });
          if (emailExists) {
            result.skipped++;
            result.errors.push({ row: rowIdx, name, message: `Email "${email}" already exists.` });
            continue;
          }
        }

        if (phone) {
          const phoneExists = await db.user.findFirst({
            where: { tenantId: user.tenantId, phone },
          });
          if (phoneExists) {
            result.skipped++;
            result.errors.push({ row: rowIdx, name, message: `Phone number "${phone}" already exists.` });
            continue;
          }
        }

        // Generate atomic two-ID credentials
        const loginId = await generateNeyoLoginId();

        // Create user record
        const staffUser = await db.user.create({
          data: {
            tenantId: user.tenantId,
            neyoLoginId: loginId,
            fullName: name,
            phone,
            email,
            role: validatedRole,
            isActive: true,
          },
        });

        // Create staff profile
        await db.staffProfile.create({
          data: {
            tenantId: user.tenantId,
            userId: staffUser.id,
            tscNumber: r.tscNumber?.trim() || null,
            nationalId: r.nationalId?.trim() || null,
          },
        });

        result.created++;
      } catch (err: any) {
        result.skipped++;
        result.errors.push({ row: rowIdx, name, message: err.message || "Failed to create staff." });
      }
    }

    // Audit log
    await db.auditLog.create({
      data: {
        tenantId: user.tenantId,
        actorId: user.id,
        actorName: user.fullName,
        action: "hr.staff_bulk_imported",
        entityType: "user",
        entityId: user.id,
        metadata: JSON.stringify({ created: result.created, skipped: result.skipped }),
      },
    });

    return result;
  });
}
