/**
 * Error capture seam (Feature A.13 — Sentry).
 * Activates real Sentry when SENTRY_DSN is set (install @sentry/nextjs at deploy
 * and replace the body of `captureError`). Until then it logs structured errors.
 * App code calls captureError(err, context) everywhere — never changes.
 */
import { logger } from "@/lib/observability/logger";

export const SENTRY_ENABLED = Boolean(process.env.SENTRY_DSN);

export function captureError(err: unknown, context?: Record<string, unknown>) {
  // --- Real Sentry call goes here in production ---
  // if (SENTRY_ENABLED) Sentry.captureException(err, { extra: context });

  const e = err instanceof Error ? err : new Error(String(err));
  logger.error(
    { err: { name: e.name, message: e.message, stack: e.stack }, ...context },
    "captured_error"
  );
}

export function captureMessage(message: string, context?: Record<string, unknown>) {
  logger.warn({ ...context }, message);
}
