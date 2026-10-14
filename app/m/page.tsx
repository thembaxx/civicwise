import type { Metadata } from 'next'
import { MunicipalitySearch } from '@/components/municipality/municipality-search'
import { getMunicipalities } from '@/lib/municipal-money'
import { getFollowedCode } from '@/lib/viewer'
import { PageIntro } from '@/components/page-intro'

export const metadata: Metadata = { title: 'Find your municipality' }

export default async function FindPage() {
  const [municipalities, followed] = await Promise.all([
    getMunicipalities(),
    getFollowedCode(),
  ])
  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="GET TO KNOW YOUR PLACE"
        title="Find your municipality"
        description="Explore metro and local municipalities, with audited finances from National Treasury and records from residents."
      />
      <MunicipalitySearch municipalities={municipalities} followed={followed} />
    </div>
  )
}
