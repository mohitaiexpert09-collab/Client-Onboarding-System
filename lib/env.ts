/**
 * Centralized environment access.
 *
 * - Public values (NEXT_PUBLIC_*) are safe to read on the client.
 * - `serverEnv()` reads secrets and must only be called in server code
 *   (Server Components, Server Actions, Route Handlers, Inngest functions).
 *   Never import the result into a client component.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string): string | undefined {
  return process.env[name] || undefined;
}

/** Values safe for the browser bundle. */
export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
};

/**
 * True when real Supabase credentials are present (not the .env.local
 * placeholders). Lets the app render a setup screen instead of crashing when
 * keys haven't been added yet.
 */
export function isSupabaseConfigured(): boolean {
  const url = publicEnv.supabaseUrl;
  const key = publicEnv.supabaseAnonKey;
  return (
    !!url &&
    !!key &&
    url.startsWith("https://") &&
    !url.includes("YOUR-PROJECT") &&
    !key.includes("YOUR_SUPABASE")
  );
}

/** True when Stripe is configured with a real secret key. */
export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  return key.startsWith("sk_") && !key.includes("PLACEHOLDER");
}

/** True when Resend is configured. */
export function isResendConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith("re_"));
}

/** True when the OpenAI API (AI assists) is configured. */
export function isAIConfigured(): boolean {
  return !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith("sk-"));
}

/** True when a Slack bot token is present (auto-create client channels). */
export function isSlackConfigured(): boolean {
  return !!(process.env.SLACK_BOT_TOKEN && process.env.SLACK_BOT_TOKEN.startsWith("xoxb-"));
}

/** Server-only secrets. Calling any getter validates presence at call time. */
export const serverEnv = {
  get supabaseServiceRoleKey() {
    return required("SUPABASE_SERVICE_ROLE_KEY");
  },
  get stripeSecretKey() {
    return required("STRIPE_SECRET_KEY");
  },
  get stripeWebhookSecret() {
    return required("STRIPE_WEBHOOK_SECRET");
  },
  get dropboxSignApiKey() {
    return required("DROPBOX_SIGN_API_KEY");
  },
  get dropboxSignClientId() {
    return optional("DROPBOX_SIGN_CLIENT_ID");
  },
  get resendApiKey() {
    return required("RESEND_API_KEY");
  },
  get inngestEventKey() {
    return optional("INNGEST_EVENT_KEY");
  },
  get inngestSigningKey() {
    return optional("INNGEST_SIGNING_KEY");
  },
  get slackBotToken() {
    return optional("SLACK_BOT_TOKEN");
  },
};
