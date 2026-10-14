import type { Metadata } from 'next'
import { ReportsTabs } from '@/components/issues/reports-tabs'
import { PageIntro } from '@/components/page-intro'

export const metadata: Metadata = { title: 'Report history' }

export default function ReportsPage() {
  return (
    <div className="page-stack content-narrow">
      <PageIntro
        eyebrow="EVERY UPDATE COUNTS"
        title="Report history"
        description="A portable record you own. Keep your updates together, or export them for your ward councillor, ombud or local paper."
      />
      <ReportsTabs />
    </div>
  )
}
