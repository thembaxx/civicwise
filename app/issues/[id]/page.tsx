import { notFound } from "next/navigation";
import { ReportDetail } from "@/components/issues/report-detail";
import { getMunicipalityProfile } from "@/lib/municipal-money";
import { getReport } from "@/lib/report-store";
import { getVisitorId } from "@/lib/session";

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const [{ id }, { new: isNew }, visitorId] = await Promise.all([
    params,
    searchParams,
    getVisitorId(),
  ]);
  const report = await getReport(id, visitorId ?? "");
  if (!report) notFound();
  const profile = await getMunicipalityProfile(report.municipality);

  return (
    <ReportDetail
      initial={report}
      municipalityName={profile?.name ?? report.municipality}
      isNew={isNew === "1"}
    />
  );
}
