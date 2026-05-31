import { NextResponse } from "next/server";
import { inngest } from "@/inngest/client";

/**
 * Dropbox Sign webhook. Dropbox Sign sends events as multipart form data with a
 * `json` field and expects the literal response body `Hello API Event Received`.
 * On `signature_request_all_signed` we emit `contract/signed`. Must be idempotent.
 */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const raw = form.get("json");
    if (typeof raw === "string") {
      const payload = JSON.parse(raw) as { event?: { event_type?: string } };
      if (payload.event?.event_type === "signature_request_all_signed") {
        // TODO(step 5): resolve orgId/clientId/contractId from metadata and emit.
        // await inngest.send({ name: "contract/signed", data: { ... } });
        void inngest;
      }
    }
  } catch {
    // Fall through — still acknowledge so Dropbox Sign doesn't retry forever on
    // a malformed test ping.
  }

  // Dropbox Sign requires this exact acknowledgement string.
  return new NextResponse("Hello API Event Received");
}
