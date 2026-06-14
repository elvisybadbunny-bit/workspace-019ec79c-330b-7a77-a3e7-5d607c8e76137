/**
 * Web Push transport seam (Feature A.7 — PWA push, free).
 * Dev: logs to console. PROD: use web-push with VAPID keys when configured.
 */
export interface SendPushResult {
  ok: boolean;
  provider: "dev-console" | "web-push";
}

export async function sendPush(
  userId: string,
  title: string,
  body: string
): Promise<SendPushResult> {
  // --- Real web-push (VAPID) call goes here when keys exist ---
  console.log(`\n[PUSH → user:${userId}] ${title} — ${body}\n`);
  return { ok: true, provider: "dev-console" };
}

export const PUSH_CONFIGURED = Boolean(process.env.VAPID_PUBLIC_KEY);
