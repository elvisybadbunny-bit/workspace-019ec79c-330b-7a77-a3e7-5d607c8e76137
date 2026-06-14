/**
 * WhatsApp transport seam (Feature A.7 — WhatsApp Business API).
 * Dev: logs to console. PROD: replace with real WhatsApp Business API call when
 * the founder provides credentials. Caller code is unchanged.
 */
export interface SendWhatsAppResult {
  ok: boolean;
  provider: "dev-console" | "whatsapp-business";
}

export async function sendWhatsApp(
  to: string,
  message: string
): Promise<SendWhatsAppResult> {
  // --- Real WhatsApp Business API call goes here when keys exist ---
  console.log(`\n[WHATSAPP → ${to}]\n${message}\n`);
  return { ok: true, provider: "dev-console" };
}

export const WHATSAPP_CONFIGURED = Boolean(process.env.WHATSAPP_TOKEN);
