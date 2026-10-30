import { requireWriteIdentity } from "@/lib/write-identity";
import { NextResponse, type NextRequest } from "next/server";
import { CATEGORIES, type Category } from "@/lib/issues";
import { createIssue, listIssues } from "@/lib/issues-store";
import { getViewerId } from "@/lib/viewer";

export async function GET(request: NextRequest) {
  const viewerId = await getViewerId();
  const { searchParams } = request.nextUrl;
  const scope = searchParams.get("scope") === "mine" ? "mine" : "all";
  const municipality = searchParams.get("m") ?? undefined;
  return NextResponse.json(await listIssues(viewerId, { scope, municipality }));
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: NextRequest) {
  const viewerId = await requireWriteIdentity(
    request,
    request.cookies.get("mat_viewer")?.value ?? "",
  );
  if (viewerId instanceof Response) return viewerId;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const category = body.category as Category;
  const input = {
    municipalityCode: clean(body.municipalityCode, 8).toUpperCase(),
    municipalityName: clean(body.municipalityName, 80),
    category,
    title: clean(body.title, 90),
    description: clean(body.description, 600),
    location: clean(body.location, 140),
    ward: clean(body.ward, 6) || undefined,
    photoUrl:
      typeof body.photoUrl === "string" && body.photoUrl.startsWith("data:image/")
        ? body.photoUrl.slice(0, 1_500_000)
        : undefined,
  };

  if (!(category in CATEGORIES)) {
    return NextResponse.json({ error: "Choose a problem type" }, { status: 400 });
  }
  if (!/^[A-Z0-9]{2,8}$/.test(input.municipalityCode) || !input.municipalityName) {
    return NextResponse.json({ error: "Choose a municipality" }, { status: 400 });
  }
  if (input.title.length < 4 || input.location.length < 4) {
    return NextResponse.json({ error: "Add a short title and a location" }, { status: 400 });
  }

  return NextResponse.json(await createIssue(viewerId, input), { status: 201 });
}
