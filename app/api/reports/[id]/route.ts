import { requireWriteIdentity } from "@/lib/write-identity";
import { NextResponse, type NextRequest } from "next/server";
import { applyAction, getReport, type ReportAction } from "@/lib/report-store";
import { resolveVisitor, withVisitor } from "@/lib/visitor";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const visitor = await resolveVisitor(req);
  const report = await getReport(id, visitor.id);
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return withVisitor(NextResponse.json({ report }), visitor);
}

function parseAction(body: Record<string, unknown> | null): ReportAction | null {
  switch (body?.action) {
    case "confirm":
    case "resolved":
      return { action: body.action };
    case "municipal_ref": {
      const value = typeof body.value === "string" ? body.value.trim().slice(0, 40) : "";
      return /^[A-Za-z0-9\-/ ]{3,40}$/.test(value) ? { action: "municipal_ref", value } : null;
    }
    case "remind": {
      const days = Number(body.days);
      return [3, 7, 14, 30].includes(days) ? { action: "remind", days } : null;
    }
    default:
      return null;
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = parseAction(await req.json().catch(() => null));
  if (!payload) return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  const idForWrite = await requireWriteIdentity(req, req.cookies.get("mat_vid")?.value ?? "");
  if (idForWrite instanceof Response) return idForWrite;
  const visitor = { id: idForWrite, isNew: false };
  const report = await applyAction(id, visitor.id, payload);
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return withVisitor(NextResponse.json({ report }), visitor);
}
