import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/send';

const SUBJECT_LABELS: Record<string, string> = {
  newPatient: 'New patient inquiry',
  appointment: 'Appointment request',
  insurance: 'Insurance / fees question',
  general: 'General question',
  other: 'Other',
};

export async function POST(req: NextRequest) {
  const { fromName, fromEmail, fromPhone, subject, message, therapistName, therapistEmail } =
    await req.json();

  if (!fromName || !fromEmail || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const subjectLabel = SUBJECT_LABELS[subject] ?? subject;

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
      <h2 style="font-size:18px;margin-bottom:4px">New message via Therapio</h2>
      <p style="font-size:13px;color:#666;margin-bottom:24px">Someone reached out to <strong>${therapistName}</strong></p>

      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr>
          <td style="padding:8px 0;color:#666;width:120px">From</td>
          <td style="padding:8px 0;font-weight:600">${fromName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#666">Email</td>
          <td style="padding:8px 0"><a href="mailto:${fromEmail}">${fromEmail}</a></td>
        </tr>
        ${fromPhone ? `<tr><td style="padding:8px 0;color:#666">Phone</td><td style="padding:8px 0">${fromPhone}</td></tr>` : ''}
        <tr>
          <td style="padding:8px 0;color:#666">Subject</td>
          <td style="padding:8px 0">${subjectLabel}</td>
        </tr>
      </table>

      <div style="margin-top:20px;border-top:1px solid #eee;padding-top:20px">
        <p style="font-size:13px;color:#666;margin-bottom:8px">Message</p>
        <p style="font-size:15px;line-height:1.6;white-space:pre-wrap">${message}</p>
      </div>

      <div style="margin-top:32px;padding:16px;background:#f7f6fb;border-radius:8px;font-size:12px;color:#888">
        This message was sent via Therapio. Reply directly to this email to respond to ${fromName}.
      </div>
    </div>
  `;

  // Fall back to admin email for general inquiries that have no therapist email
  const toEmail = therapistEmail || process.env.ADMIN_EMAIL || process.env.EMAIL_FROM;

  if (!toEmail) {
    return NextResponse.json({ error: 'No recipient email configured' }, { status: 500 });
  }

  const ok = await sendEmail({
    to: toEmail,
    subject: `[Therapio] ${subjectLabel} — from ${fromName}`,
    html,
    replyTo: fromEmail as string,
  });

  if (!ok) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
