import type { Metadata } from 'next'
import { ReportsTabs } from '@/components/issues/reports-tabs'

export const metadata: Metadata = { title: 'Report history' }

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-5 pt-2">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight">Report history</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A portable record you own. Export it for your ward councillor, ombud or local paper.
        </p>
      </div>
      <ReportsTabs />
    </div>
  )
}
