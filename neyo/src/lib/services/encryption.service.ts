/**
 * Per-tenant encryption service (Feature A.2.7).
 * Each tenant has a DEK (wrapped by the master KEK). Sensitive per-tenant
 * fields (e.g. M-Pesa credentials in A.6) are encrypted with that DEK.
 *
 * Reads/writes the Tenant root table (Tenant is not tenant-scoped).
 */
import { db } from "@/lib/db";
import {
  wrapWithKek,
  unwrapWithKek,
  wrapWithKeyExplicit,
  unwrapWithKeyExplicit,
} from "@/lib/crypto/kek";
import {
  generateDek,
  encryptWithDek,
  decryptWithDek,
} from "@/lib/crypto/envelope";

/** Ensure a tenant has a DEK; create + wrap one if missing. Returns raw DEK. */
async function getTenantDek(tenantId: string): Promise<Buffer> {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { encryptedDek: true, dekIv: true, dekTag: true },
  });
  if (!tenant) throw new Error(`Tenant ${tenantId} not found.`);

  if (tenant.encryptedDek && tenant.dekIv && tenant.dekTag) {
    return unwrapWithKek({
      ciphertext: tenant.encryptedDek,
      iv: tenant.dekIv,
      tag: tenant.dekTag,
    });
  }

  // Lazily provision a DEK for this tenant.
  const dek = generateDek();
  const wrapped = wrapWithKek(dek);
  await db.tenant.update({
    where: { id: tenantId },
    data: {
      encryptedDek: wrapped.ciphertext,
      dekIv: wrapped.iv,
      dekTag: wrapped.tag,
    },
  });
  return dek;
}

/** Public: make sure a tenant has a key (call at tenant creation). */
export async function ensureTenantDek(tenantId: string): Promise<void> {
  await getTenantDek(tenantId);
}

/** Encrypt a string with the tenant's DEK. */
export async function encryptForTenant(
  tenantId: string,
  plaintext: string
): Promise<string> {
  const dek = await getTenantDek(tenantId);
  return encryptWithDek(dek, plaintext);
}

/** Decrypt a string previously encrypted for this tenant. */
export async function decryptForTenant(
  tenantId: string,
  ciphertext: string
): Promise<string> {
  const dek = await getTenantDek(tenantId);
  return decryptWithDek(dek, ciphertext);
}

/**
 * Rotate the master KEK: unwrap every tenant DEK with the OLD KEK and re-wrap
 * it with the NEW KEK. Encrypted DATA is never touched — that's the whole point
 * of the envelope pattern. Pass both 32-byte keys explicitly.
 *
 * Deploy flow: keep OLD KEK available, set NEW KEK, run this, then retire OLD.
 */
export async function rotateKek(
  oldKek: Buffer,
  newKek: Buffer
): Promise<number> {
  const tenants = await db.tenant.findMany({
    where: { NOT: { encryptedDek: null } },
    select: { id: true, encryptedDek: true, dekIv: true, dekTag: true },
  });
  let count = 0;
  for (const t of tenants) {
    const dek = unwrapWithKeyExplicit(
      { ciphertext: t.encryptedDek!, iv: t.dekIv!, tag: t.dekTag! },
      oldKek
    );
    const rewrapped = wrapWithKeyExplicit(dek, newKek);
    await db.tenant.update({
      where: { id: t.id },
      data: {
        encryptedDek: rewrapped.ciphertext,
        dekIv: rewrapped.iv,
        dekTag: rewrapped.tag,
      },
    });
    count++;
  }
  return count;
}
