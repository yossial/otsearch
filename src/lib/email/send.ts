/**
 * Thin wrapper around the Resend REST API.
 * Used throughout the app to send transactional emails.
 */

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Sends an email via Resend.
 * Returns true on success, false on failure (non-throwing — callers decide whether to surface errors).
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — email skipped');
    return true; // don't block the flow in dev/test
  }

  const from = process.env.EMAIL_FROM ?? 'noreply@ot-connect.co.il';
  const to = Array.isArray(payload.to) ? payload.to : [payload.to];

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject: payload.subject,
      html: payload.html,
      ...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
    }),
  });

  if (!res.ok) {
    console.error('[email] Resend error:', res.status, await res.text());
    return false;
  }

  return true;
}
