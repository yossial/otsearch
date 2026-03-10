/**
 * Reminder email sent to therapists whose profile is incomplete.
 * Sent periodically by the /api/admin/reminders cron route.
 */

export function profileIncompleteReminderHtml({
  name,
  dashboardUrl,
  missingItems,
}: {
  name: string;
  dashboardUrl: string;
  missingItems: string[];
}): string {
  const itemsHtml = missingItems
    .map((item) => `<li style="margin-bottom:6px">${item}</li>`)
    .join('');

  return `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6fa;font-family:Arial,sans-serif;direction:rtl">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fa;padding:32px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:100%">

        <!-- Header -->
        <tr>
          <td style="background:#001d3d;padding:28px 32px">
            <p style="margin:0;font-size:22px;font-weight:700;color:#ffc300">Therapio</p>
            <p style="margin:4px 0 0;font-size:13px;color:#aac4e0">הבית של המרפאים בעיסוק בישראל</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px">
            <h1 style="margin:0 0 8px;font-size:20px;color:#000814">שלום ${name},</h1>
            <p style="margin:0 0 20px;font-size:15px;color:#333;line-height:1.7">
              הפרופיל שלך ב-Therapio עדיין לא מלא.<br>
              פרופיל מלא מגדיל משמעותית את הסיכוי שמטופלים ימצאו אותך בחיפוש.
            </p>

            <p style="margin:0 0 8px;font-size:14px;color:#555;font-weight:600">מה חסר בפרופיל שלך:</p>
            <ul style="margin:0 0 24px;padding-inline-start:20px;font-size:14px;color:#333;line-height:2">
              ${itemsHtml}
            </ul>

            <table cellpadding="0" cellspacing="0" style="margin-bottom:24px">
              <tr>
                <td>
                  <a href="${dashboardUrl}"
                     style="display:inline-block;background:#ffc300;color:#000814;font-weight:700;font-size:14px;padding:12px 28px;border-radius:6px;text-decoration:none">
                    השלם את הפרופיל שלך
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#888">
              להסרה מרשימת התזכורות, עדכן את הפרופיל שלך או פנה אלינו בכתובת
              <a href="mailto:support@therapio.co.il" style="color:#001d3d">support@therapio.co.il</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f4f6fa;padding:20px 32px;border-top:1px solid #e8eaf0">
            <p style="margin:0;font-size:11px;color:#aaa;text-align:center">
              Therapio · ot-connect.co.il<br>
              קיבלת מייל זה כי נרשמת כמרפא/ה בעיסוק בפלטפורמת Therapio.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
  `.trim();
}
