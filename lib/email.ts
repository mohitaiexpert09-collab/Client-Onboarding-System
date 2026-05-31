import { isResendConfigured } from "@/lib/env";

/**
 * Send a transactional email via Resend. If Resend isn't configured, this is a
 * graceful no-op (logs to the server console) so flows still work in dev.
 * Returns true if actually sent.
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  if (!isResendConfigured()) {
    console.log(`[email:skipped] to=${params.to} subject="${params.subject}"`);
    return false;
  }
  const { getResend } = await import("@/lib/integrations/resend");
  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  await getResend().emails.send({
    from,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
  return true;
}

/** Premium branded HTML email wrapper (table-based for email-client robustness). */
export function emailLayout(opts: {
  heading: string;
  body: string;
  cta?: { label: string; url: string };
  brandColor?: string;
  orgName?: string;
}): string {
  const brand = opts.brandColor || "#4f46e5";
  const org = opts.orgName || "Leadly.ai";
  return `
  <div style="background:#f4f4f5;padding:32px 12px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
      <tr>
        <td style="background:${brand};padding:24px 32px">
          <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.01em">${org}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:36px 32px 8px">
          <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#18181b;font-weight:700">${opts.heading}</h1>
          <div style="font-size:15px;line-height:1.65;color:#3f3f46">${opts.body}</div>
          ${
            opts.cta
              ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px"><tr><td style="border-radius:10px;background:${brand}">
                  <a href="${opts.cta.url}" style="display:inline-block;padding:13px 26px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:10px">${opts.cta.label}</a>
                </td></tr></table>`
              : ""
          }
        </td>
      </tr>
      <tr>
        <td style="padding:24px 32px 32px;border-top:1px solid #f4f4f5">
          <p style="margin:16px 0 0;font-size:12px;color:#a1a1aa">Sent by ${org} · Powered by Leadly.ai</p>
        </td>
      </tr>
    </table>
  </div>`;
}
