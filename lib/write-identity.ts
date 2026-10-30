import "server-only";
import { getAuth, getVerifiedAccount } from "./auth.ts";
import { demoDataEnabled } from "./durable-state.ts";
import { isDeviceId } from "./device-identity.ts";

/** Never trust ownership in a request body or a device cookie for live changes. */
export async function requireWriteIdentity(
  request: Request,
  demoDeviceId: string,
): Promise<string | Response> {
  if (demoDataEnabled() && !process.env.DATABASE_URL && process.env.VERCEL !== "1") {
    if (isDeviceId(demoDeviceId)) return demoDeviceId;
  }
  const headers = { "Cache-Control": "no-store" };
  try {
    if (!getAuth())
      return Response.json(
        { error: "Account sign-in is not configured. Reports cannot be saved yet." },
        { status: 503, headers },
      );
    const account = await getVerifiedAccount(request.headers);
    if (!account)
      return Response.json(
        { error: "Sign in with a verified account before changing a report." },
        { status: 401, headers },
      );
    return account.id;
  } catch {
    return Response.json(
      { error: "Account verification is temporarily unavailable. Try again later." },
      { status: 503, headers },
    );
  }
}
