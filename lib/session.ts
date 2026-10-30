import "server-only";
import { cookies, headers } from "next/headers";
import { getVerifiedAccount } from "./auth.ts";
import { isDeviceId } from "./device-identity.ts";

export const FOLLOW_COOKIE = "mat_follow";
export const VISITOR_COOKIE = "mat_vid";
export const DEFAULT_MUNICIPALITY = "CPT";

export async function getFollowedCode() {
  const jar = await cookies();
  const code = jar.get(FOLLOW_COOKIE)?.value;
  return code && /^[A-Z0-9]{2,8}$/.test(code) ? code : DEFAULT_MUNICIPALITY;
}

export async function getVisitorId() {
  const jar = await cookies();
  const account = await getVerifiedAccount(await headers());
  if (account) return account.id;
  const id = jar.get(VISITOR_COOKIE)?.value;
  return isDeviceId(id) ? id : null;
}

export const visitorCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};
