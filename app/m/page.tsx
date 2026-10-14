import type { Metadata } from 'next'
import { MunicipalitySearch } from '@/components/municipality/municipality-search'
import { getMunicipalities } from '@/lib/municipal-money'
import { getFollowedCode } from '@/lib/viewer'

export const metadata: Metadata = { title: 'Find your municipality' }

export default async function FindPage() {
  const [municipalities, followed] = await Promise.all([getMunicipalities(), getFollowedCode()])
  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight">Find your municipality</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          All 257 metros and local municipalities, with audited finances from National Treasury.
        </p>
      </div>
      <MunicipalitySearch municipalities={municipalities} followed={followed} />
    </div>
  )
}
