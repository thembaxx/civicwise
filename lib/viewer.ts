import "server-only";
import { cookies } from "next/headers";

import { headers } from "next/headers";
import { getVerifiedAccount } from "./auth.ts";
import {
  VIEWER_COOKIE,
  FOLLOW_COOKIE,
  DEFAULT_MUNICIPALITY,
  isDeviceId,
} from "./device-identity.ts";
export {
  VIEWER_COOKIE,
  VISITOR_COOKIE,
  FOLLOW_COOKIE,
  DEFAULT_MUNICIPALITY,
  isDeviceId,
} from "./device-identity.ts";

export class MissingDeviceIdentityError extends Error {
  readonly code = "DEVICE_COOKIE_REQUIRED";

  constructor() {
    super("A valid device cookie is required. Reload CivicWise and try again.");
    this.name = "MissingDeviceIdentityError";
  }
}

/** Issue records retain mat_viewer; legacy reports separately retain mat_vid. */
export async function getViewerId() {
  const account = await getVerifiedAccount(await headers());
  if (account) return account.id;
  const store = await cookies();
  const id = store.get(VIEWER_COOKIE)?.value;
  // Legacy device ownership remains readable; writes require a verified account.
  return isDeviceId(id) ? id : "";
}

export async function getFollowedCode() {
  const store = await cookies();
  const code = store.get(FOLLOW_COOKIE)?.value;
  return code && /^[A-Z0-9]{2,8}$/.test(code) ? code : DEFAULT_MUNICIPALITY;
}
