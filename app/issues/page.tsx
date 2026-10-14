import type { Metadata } from 'next'
import { IssuesList } from '@/components/issues/issues-list'
import { getMunicipalityProfile } from '@/lib/municipal-money'
import { getFollowedCode } from '@/lib/session'

export const metadata: Metadata = { title: 'Issues · Municipal Accountability Tracker' }

export default async function IssuesPage() {
  const code = await getFollowedCode()
  const profile = await getMunicipalityProfile(code)

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">{profile?.name ?? code}</p>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight">Issue history</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground text-pretty">
          Every report is timestamped and kept independently of the municipality&apos;s own system.
        </p>
      </div>
      <IssuesList code={code} />
    </div>
  )
}
