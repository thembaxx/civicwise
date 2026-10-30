import { NextResponse, type NextRequest } from "next/server";
import { VIEWER_COOKIE, VISITOR_COOKIE, isDeviceId } from "./lib/device-identity";
import { getAuthConfiguration } from "./lib/account-identity";

export function proxy(request: NextRequest) {
  // The configured public origin survives a trusted TLS-terminating proxy;
  // Next's internal request URL can use HTTP or a loopback host instead.
  const expectedOrigin = getAuthConfiguration()?.baseURL ?? request.nextUrl.origin;
  const api = request.nextUrl.pathname === "/api" || request.nextUrl.pathname.startsWith("/api/");
  if (
    api &&
    !["GET", "HEAD", "OPTIONS"].includes(request.method) &&
    request.headers.get("origin") !== expectedOrigin
  ) {
    return NextResponse.json(
      { error: "This change must come from CivicWise. Reload the app and try again." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const existingViewer = request.cookies.get(VIEWER_COOKIE)?.value;
  const existingVisitor = request.cookies.get(VISITOR_COOKIE)?.value;
  // Older issue and report routes issued independent bearer device cookies.
  // Keep both when valid: overwriting either would orphan that namespace's records.
  const viewer = isDeviceId(existingViewer)
    ? existingViewer
    : isDeviceId(existingVisitor)
      ? existingVisitor
      : crypto.randomUUID();
  const visitor = isDeviceId(existingVisitor) ? existingVisitor : viewer;
  request.cookies.set(VIEWER_COOKIE, viewer);
  request.cookies.set(VISITOR_COOKIE, visitor);
  const response = NextResponse.next({ request: { headers: request.headers } });
  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  };
  response.cookies.set(VIEWER_COOKIE, viewer, options);
  response.cookies.set(VISITOR_COOKIE, visitor, options);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
