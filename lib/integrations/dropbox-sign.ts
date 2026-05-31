import "server-only";
import * as DropboxSign from "@dropbox/sign";
import { serverEnv } from "@/lib/env";

/**
 * Dropbox Sign (HelloSign) API for e-signatures (server-only).
 * Returns a configured SignatureRequest API client. Use embedded signing so the
 * client signs inside our portal; the `signature_request_signed`/`signed`
 * webhook drives the `contract.signed` domain event.
 */
export function getSignatureRequestApi(): DropboxSign.SignatureRequestApi {
  const api = new DropboxSign.SignatureRequestApi();
  api.username = serverEnv.dropboxSignApiKey; // API key as basic-auth username
  return api;
}

export { DropboxSign };
