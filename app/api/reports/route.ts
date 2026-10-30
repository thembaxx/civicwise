import { requireWriteIdentity } from "@/lib/write-identity";
import { NextResponse, type NextRequest } from "next/server";
import { createReport, listReports } from "@/lib/report-store";
import { CATEGORIES, type Category } from "@/lib/reports";
import { resolveVisitor, withVisitor } from "@/lib/visitor";

const CODE = /^[A-Z0-9]{2,8}$/;

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("m") ?? "";
  if (!CODE.test(code))
    return NextResponse.json({ error: "Invalid municipality" }, { status: 400 });
  const visitor = await resolveVisitor(req);
  return withVisitor(NextResponse.json({ reports: await listReports(code, visitor.id) }), visitor);
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const municipality = clean(body.municipality, 8);
  const category = body.category as Category;
  const title = clean(body.title, 80);
  const description = clean(body.description, 600);
  const location = clean(body.location, 120);
  const ward = clean(body.ward, 10) || undefined;
  const lat = typeof body.lat === "number" && Math.abs(body.lat) <= 90 ? body.lat : undefined;
  const lng = typeof body.lng === "number" && Math.abs(body.lng) <= 180 ? body.lng : undefined;

  const errors: Record<string, string> = {};
  if (!CODE.test(municipality)) errors.municipality = "Choose a municipality";
  if (!CATEGORIES.includes(category)) errors.category = "Choose an issue type";
  if (title.length < 4) errors.title = "Add a short title (at least 4 characters)";
  if (location.length < 3) errors.location = "Add a street, landmark or suburb";
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 422 });

  const idForWrite = await requireWriteIdentity(req, req.cookies.get("mat_vid")?.value ?? "");
  if (idForWrite instanceof Response) return idForWrite;
  const visitor = { id: idForWrite, isNew: false };
  const report = await createReport(
    { municipality, category, title, description, location, ward, lat, lng },
    visitor.id,
  );
  return withVisitor(NextResponse.json({ report }, { status: 201 }), visitor);
}
