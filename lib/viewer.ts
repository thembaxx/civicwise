import "server-only";
import { cookies } from "next/headers";

export const VIEWER_COOKIE = "mat_viewer";
export const VISITOR_COOKIE = "mat_vid";
export const FOLLOW_COOKIE = "mat_follow";
export const DEFAULT_MUNICIPALITY = "CPT";

/** Device bearer ownership is not verified resident authentication. */
export function isDeviceId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

export class MissingDeviceIdentityError extends Error {
  readonly code = "DEVICE_COOKIE_REQUIRED";

  constructor() {
    super("A valid device cookie is required. Reload CivicWise and try again.");
    this.name = "MissingDeviceIdentityError";
  }
}

/** Issue records retain mat_viewer; legacy reports separately retain mat_vid. */
export async function getViewerId() {
  const store = await cookies();
  const id = store.get(VIEWER_COOKIE)?.value;
  if (!isDeviceId(id)) throw new MissingDeviceIdentityError();
  return id;
}

export async function getFollowedCode() {
  const store = await cookies();
  const code = store.get(FOLLOW_COOKIE)?.value;
  return code && /^[A-Z0-9]{2,8}$/.test(code) ? code : DEFAULT_MUNICIPALITY;
}
