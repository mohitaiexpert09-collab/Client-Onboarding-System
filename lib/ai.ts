import "server-only";
import OpenAI from "openai";
import { isAIConfigured } from "@/lib/env";

/**
 * AI assists powered by the OpenAI API. Lazy, server-only client. Every function
 * returns null when OPENAI_API_KEY is missing, so the app degrades gracefully
 * (the UI hides AI actions until a key is added).
 */

// Capable + economical default; override with OPENAI_MODEL in .env.local.
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

let _client: OpenAI | null = null;
function getClient(): OpenAI {
  // Reads OPENAI_API_KEY from the environment.
  if (!_client) _client = new OpenAI();
  return _client;
}

/** One-shot chat completion. Returns trimmed text, or null when AI isn't configured. */
async function generate(system: string, user: string, maxTokens = 2048): Promise<string | null> {
  if (!isAIConfigured()) return null;

  const response = await getClient().chat.completions.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  return response.choices[0]?.message?.content?.trim() ?? null;
}

/** Draft a professional service agreement from a short prompt. */
export async function draftContract(params: {
  orgName: string;
  clientName: string;
  prompt: string;
}): Promise<string | null> {
  const system =
    "You write polished, client-ready proposals & service agreements for a professional " +
    "services agency. Output clean GitHub-flavored Markdown that will be rendered (NOT shown " +
    "as raw text), so use proper Markdown: '## ' for section headings, '- ' for bullet lists, " +
    "'**bold**' sparingly for emphasis, and '---' as a divider before the agreement terms. " +
    "Do NOT wrap the whole thing in a code block.\n\n" +
    "Structure the document in this order:\n" +
    "1. A warm 2-3 sentence opening addressed to the client that shows you understand their goal.\n" +
    "2. '## Scope of Work' — what you'll do.\n" +
    "3. '## Deliverables' — a bulleted list of concrete outputs.\n" +
    "4. '## Timeline' — phases or milestones.\n" +
    "5. '## Investment & Payment' — fees and payment terms.\n" +
    "6. '---' then '## Agreement Terms' with concise sub-sections: Responsibilities, " +
    "Confidentiality, Ownership, Termination.\n" +
    "7. A short professional closing line.\n\n" +
    "Keep it concise, specific, and free of legalese where plain English works. Use " +
    "[bracketed placeholders] only when a figure or date is genuinely unknown. This is a " +
    "draft for human review, not final legal advice. Respond ONLY with the document — no preamble.";

  const user =
    `Service provider (agency): ${params.orgName}\n` +
    `Client: ${params.clientName}\n\n` +
    `What the client wants / engagement details:\n${params.prompt}\n\n` +
    `Write the full proposal & agreement in Markdown.`;

  return generate(system, user, 3000);
}

/** Summarize a client's intake form answers into a brief + suggested next steps. */
export async function summarizeIntake(params: {
  clientName: string;
  answers: Record<string, unknown>;
}): Promise<string | null> {
  const system =
    "You help an agency owner quickly understand a new client from their onboarding " +
    "questionnaire. Produce a tight brief in markdown with two sections: '## Summary' " +
    "(3-5 bullet points capturing goals, context, and anything notable) and " +
    "'## Suggested next steps' (3-4 concrete, prioritized actions for the team). Be specific. " +
    "Respond only with the markdown brief.";

  const qa = Object.entries(params.answers)
    .map(([k, v]) => `- ${k}: ${String(v)}`)
    .join("\n");

  return generate(system, `Client: ${params.clientName}\n\nQuestionnaire responses:\n${qa}`, 1500);
}

/** Draft a friendly weekly client update email from recent activity context. */
export async function draftWeeklyUpdate(params: {
  orgName: string;
  clientName: string;
  context: string;
}): Promise<string | null> {
  const system =
    "You write concise, warm weekly client update emails for an agency. Structure: a one-line " +
    "greeting, a short 'What we did this week' bulleted list, a 'What's next' line, and a sign-off " +
    "from the team. Professional but personable. No subject line; sign off as 'The {agency} team'. " +
    "Respond only with the email body.";

  const user =
    `Agency: ${params.orgName}\nClient: ${params.clientName}\n\n` +
    `Recent activity / progress to base the update on:\n${params.context}\n\n` +
    `Write the email body.`;

  return generate(system, user, 1200);
}
