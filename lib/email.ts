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

/** Minimal branded HTML email wrapper. */
export function emailLayout(opts: { heading: string; body: string; cta?: { label: string; url: string } }): string {
  return `
  <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px">
    <h1 style="font-size:20px;color:#18181b">${opts.heading}</h1>
    <div style="font-size:14px;line-height:1.6;color:#3f3f46">${opts.body}</div>
    ${
      opts.cta
        ? `<a href="${opts.cta.url}" style="display:inline-block;margin-top:20px;background:#4f46e5;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px">${opts.cta.label}</a>`
        : ""
    }
    <p style="margin-top:28px;font-size:12px;color:#a1a1aa">Sent by your Client Onboarding System</p>
  </div>`;
}
