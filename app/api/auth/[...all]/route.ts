import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth";

export const runtime = "nodejs";

async function handle(request: Request) {
  const auth = getAuth();
  if (!auth)
    return Response.json(
      { error: "Account sign-in is not configured yet." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  const handler = toNextJsHandler(auth);
  return request.method === "GET" ? handler.GET(request) : handler.POST(request);
}

export const GET = handle;
export const POST = handle;
