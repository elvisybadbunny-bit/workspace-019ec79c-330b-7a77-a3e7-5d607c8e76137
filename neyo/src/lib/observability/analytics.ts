/**
 * Product analytics seam (Feature A.13 — PostHog).
 * Activates real PostHog when POSTHOG_KEY is set (install posthog-node at deploy
 * and replace the body of `track`). Until then events are logged for inspection.
 */
import { logger } from "@/lib/observability/logger";

export const ANALYTICS_ENABLED = Boolean(process.env.POSTHOG_KEY);

export function track(
  event: string,
  props?: Record<string, unknown> & { distinctId?: string }
) {
  // --- Real PostHog capture goes here in production ---
  // if (ANALYTICS_ENABLED) posthog.capture({ distinctId, event, properties });
  logger.debug({ event, ...props }, "analytics_event");
}
