import "server-only";
import type { NextRequest, NextResponse } from "next/server";
import { isDeviceId } from "./device-identity.ts";
import { getVerifiedAccount } from "./auth.ts";
import { VISITOR_COOKIE, visitorCookieOptions } from "./session";

export async function resolveVisitor(req: NextRequest) {
  const account = await getVerifiedAccount(req.headers);
  if (account) return { id: account.id, isNew: false };
  const existing = req.cookies.get(VISITOR_COOKIE)?.value;
  return {
    id: isDeviceId(existing) ? existing : crypto.randomUUID(),
    isNew: !isDeviceId(existing),
  };
}

export function withVisitor(res: NextResponse, visitor: { id: string; isNew: boolean }) {
  if (visitor.isNew) res.cookies.set(VISITOR_COOKIE, visitor.id, visitorCookieOptions);
  return res;
}
