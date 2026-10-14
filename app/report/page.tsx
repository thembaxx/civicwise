import type { Metadata } from 'next'
import { ReportForm } from '@/components/issues/report-form'
import { HonestyNote } from '@/components/issues/honesty-note'
import { getMunicipalities } from '@/lib/municipal-money'
import { getFollowedCode } from '@/lib/viewer'

export const metadata: Metadata = { title: 'Log a problem' }

export default async function ReportPage() {
  const [municipalities, followed] = await Promise.all([getMunicipalities(), getFollowedCode()])
  return (
    <div className="flex flex-col gap-5 pt-2">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight">Log a problem</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Your report is timestamped and kept in your own history, whatever happens on the municipal side.
        </p>
      </div>
      <ReportForm municipalities={municipalities} defaultCode={followed} />
      <HonestyNote />
    </div>
  )
}
