import type { Metadata } from 'next'
import { ReportForm } from '@/components/report/report-form'
import { getMunicipalityProfile } from '@/lib/municipal-money'
import { getFollowedCode } from '@/lib/session'

export const metadata: Metadata = { title: 'Log an issue · Municipal Accountability Tracker' }

export default async function ReportPage() {
  const code = await getFollowedCode()
  const profile = await getMunicipalityProfile(code)
  const name = profile?.name ?? code

  return (
    <div className="flex flex-col gap-5 pt-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">{name}</p>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight">Log an issue</h1>
      </div>
      <ReportForm code={code} municipalityName={name} phone={profile?.phone} />
    </div>
  )
}
