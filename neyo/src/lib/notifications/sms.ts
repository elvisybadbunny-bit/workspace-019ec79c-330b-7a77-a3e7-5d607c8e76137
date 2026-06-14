/**
 * SMS transport seam (Feature A.7 — Africa's Talking, built later).
 *
 * RIGHT NOW: development transport. It logs the message to the server console
 * and reports success. NOTHING about OTP generation/hashing/verification is
 * faked — only the physical delivery. When A.7 lands, we replace the body of
 * `sendSms` with a real Africa's Talking call and every caller keeps working.
 */
export interface SendSmsResult {
  ok: boolean;
  provider: "dev-console" | "africas-talking";
  messageId?: string;
}

export async function sendSms(to: string, message: string): Promise<SendSmsResult> {
  // --- Real provider goes here in A.7 (Africa's Talking) ---
  // const at = new AfricasTalking({ apiKey, username }); await at.SMS.send(...)

  // Development transport:
  console.log(`\n[SMS → ${to}]\n${message}\n`);
  return {
    ok: true,
    provider: "dev-console",
    messageId: `dev_${Date.now()}`,
  };
}

/**
 * In development we also surface the OTP to the caller so the founder can test
 * login without a live SMS gateway. This is GATED to non-production only.
 */
export const SHOW_DEV_OTP = process.env.NODE_ENV !== "production";
