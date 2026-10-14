import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowRight } from '@phosphor-icons/react/dist/ssr'
import { Section, SectionSkeleton } from '@/components/section'
import { IssueList } from '@/components/issues/issue-list'
import { HonestyNote } from '@/components/issues/honesty-note'
import { FinanceSnapshot } from '@/components/finance/finance-snapshot'
import { getMunicipalityProfile } from '@/lib/municipal-money'
import { getFollowedCode } from '@/lib/viewer'

export default async function HomePage() {
  const code = await getFollowedCode()
  const profile = await getMunicipalityProfile(code)
  const name = profile?.name ?? code

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-3 pt-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">You follow</p>
        <div className="flex items-end justify-between gap-3">
          <h1 className="text-3xl font-extrabold leading-none tracking-tight text-balance md:text-4xl">{name}</h1>
          <Link href="/m" className="shrink-0 text-xs font-semibold underline underline-offset-2">
            Change
          </Link>
        </div>
        {profile && (
          <p className="text-sm text-muted-foreground">
            {profile.province} · {profile.category === 'A' ? 'Metropolitan municipality' : 'Local municipality'}
          </p>
        )}
      </section>

      <Link
        href="/report"
        className="flex items-center justify-between gap-3 rounded-2xl bg-secondary p-4 text-secondary-foreground"
      >
        <span className="flex flex-col gap-0.5">
          <span className="font-heading text-lg font-bold">Spotted a problem?</span>
          <span className="text-sm opacity-80">Pothole, streetlight or water. Logged with a timestamp in 30 seconds.</span>
        </span>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <ArrowRight className="size-5" aria-hidden />
          <span className="sr-only">Report a problem</span>
        </span>
      </Link>

      <Section
        title="Your open reports"
        action={
          <Link href="/reports" className="text-xs font-semibold underline underline-offset-2">
            History
          </Link>
        }
      >
        <IssueList
          scope="mine"
          limit={2}
          emptyText="Nothing logged yet. Every report you make builds an independent, exportable record."
        />
      </Section>

      <Suspense fallback={<SectionSkeleton rows={4} />}>
        <FinanceSnapshot code={code} />
      </Suspense>

      <Section
        title={`Reported around ${name}`}
        description="Confirm problems you can see too. Numbers carry weight."
      >
        <IssueList
          scope="all"
          municipality={code}
          limit={4}
          emptyText="No community reports here yet. Be the first."
        />
      </Section>

      <HonestyNote />
    </div>
  )
}
