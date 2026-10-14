import type { Metadata } from 'next'
import { IssuesList } from '@/components/issues/issues-list'
import { getMunicipalityProfile } from '@/lib/municipal-money'
import { getFollowedCode } from '@/lib/session'
import { PageIntro } from '@/components/page-intro'

export const metadata: Metadata = { title: 'Issue history' }

export default async function IssuesPage() {
  const code = await getFollowedCode()
  const profile = await getMunicipalityProfile(code)

  return (
    <div className="page-stack content-narrow">
      <PageIntro
        title="Issue history"
        eyebrow={profile?.name ?? code}
        description="Every report is timestamped and kept independently of the municipality’s own system."
      />
      <IssuesList code={code} />
    </div>
  )
}
