import { isResendConfigured } from "@/lib/env";

/**
 * Send a transactional email. Transport precedence:
 *   1. n8n webhook (N8N_WEBHOOK_URL) — POSTs { to, subject, html, from } so an
 *      n8n workflow (e.g. a Gmail node) delivers it. Best for sending to ANY
 *      address for free without verifying a domain.
 *   2. Resend (RESEND_API_KEY).
 *   3. Neither → graceful no-op (logged), so flows never break.
 * Returns true only if the email was actually accepted for delivery.
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  // 1. n8n webhook transport (preferred when configured). If it fails, we don't
  //    give up — we fall through to Resend so email still goes out.
  const n8nUrl = process.env.N8N_WEBHOOK_URL;
  if (n8nUrl) {
    try {
      const res = await fetch(n8nUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: params.to, subject: params.subject, html: params.html, from }),
      });
      if (res.ok) return true;
      console.warn(`[email:n8n-failed] to=${params.to} status=${res.status} — falling back to Resend`);
    } catch (err) {
      console.warn(`[email:n8n-error] to=${params.to} — falling back to Resend`, err);
    }
  }

  // 2. Resend transport (also the fallback when n8n is configured but failing).
  if (!isResendConfigured()) {
    console.log(`[email:skipped] to=${params.to} subject="${params.subject}"`);
    return false;
  }
  try {
    const { getResend } = await import("@/lib/integrations/resend");
    const { error } = await getResend().emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    if (error) {
      // e.g. free-tier "can only send to your own address" — don't break flows.
      console.warn(`[email:failed] to=${params.to} subject="${params.subject}" — ${error.message}`);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[email:error] to=${params.to} subject="${params.subject}" —`, err);
    return false;
  }
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
