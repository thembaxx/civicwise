import { Suspense } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  MapPin,
  NotePencil,
  ClockCounterClockwise,
  UsersThree,
  ArrowRight,
} from '@phosphor-icons/react/dist/ssr'
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
    <div className="flex flex-col gap-10 lg:gap-14">
      <section
        aria-labelledby="home-heading"
        className="grid gap-6 lg:grid-cols-[1.55fr_1fr] lg:gap-14"
      >
        <div className="flex flex-col items-start justify-center gap-4 py-1 sm:gap-5 lg:py-5">
          <p className="eyebrow text-positive">
            Local knowledge. Shared responsibility.
          </p>
          <h1 id="home-heading" className="hero-title">
            Your municipality,
            <br />
            <span className="text-positive">clearly.</span>
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            Know what’s happening on your street, keep a record, and see where
            public money goes. A little clarity goes a long way.
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-1">
            <Link
              href={`/m/${code}`}
              className="inline-flex items-center gap-2 rounded-xl bg-positive-soft px-3 py-2 text-sm font-medium text-positive"
            >
              <MapPin className="size-[18px]" aria-hidden />
              {name}
            </Link>
            {profile && (
              <span className="text-sm text-muted-foreground">
                {profile.province}
              </span>
            )}
          </div>
        </div>
        <Link
          href="/report"
          aria-label="Report a problem"
          className="report-action group flex flex-col justify-between gap-5 p-6 sm:gap-6 sm:p-8 lg:min-h-[350px]"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="eyebrow">Small action. Lasting record.</span>
            <NotePencil className="size-14 shrink-0 sm:size-16" aria-hidden />
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="editorial-title text-[35px] sm:text-[40px]">
              Spotted a problem?
            </h2>
            <p className="max-w-xs text-sm leading-relaxed sm:text-base">
              A pothole, broken streetlight or water leak. Make a timestamped
              record of what you see.
            </p>
          </div>
          <span className="flex items-center justify-between gap-3 border-t border-black/20 pt-5 text-base font-semibold">
            Report a problem{' '}
            <ArrowUpRight
              className="size-6 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden
            />
          </span>
        </Link>
      </section>

      <div className="grid items-start gap-8 lg:grid-cols-[.85fr_1.6fr] lg:gap-10">
        <Section
          title="Your open reports"
          eyebrow="YOUR OWN RECORD"
          variant="stone"
          icon={<ClockCounterClockwise className="size-6" aria-hidden />}
          description="Keep track of the problems you’ve logged."
          action={
            <Link href="/reports" className="text-link">
              History <ArrowUpRight className="size-4" aria-hidden />
            </Link>
          }
        >
          <IssueList
            scope="mine"
            openOnly
            limit={2}
            emptyText="Your record starts here. Log a problem and keep its updates, reference numbers and timestamps in one place."
          />
        </Section>
        <Section
          id="community"
          title="Around your neighbourhood"
          eyebrow="COMMUNITY REPORTS"
          variant="plain"
          icon={<UsersThree className="size-6" aria-hidden />}
          description={`Resident reports in ${name}. See it too? Add your confirmation.`}
          action={
            <Link href="/reports" className="text-link">
              View all <ArrowRight className="size-4" aria-hidden />
            </Link>
          }
        >
          <IssueList
            scope="all"
            municipality={code}
            limit={4}
            columns
            emptyText="No community reports here yet. Share a problem you’ve noticed to start an independent local record."
          />
        </Section>
      </div>

      <Suspense fallback={<SectionSkeleton rows={4} />}>
        <FinanceSnapshot code={code} />
      </Suspense>
      <HonestyNote />
    </div>
  )
}
