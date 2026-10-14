import type { Metadata } from 'next'
import { Check, DownloadSimple as Download } from '@phosphor-icons/react/dist/ssr'
import { getMunicipalityProfile } from '@/lib/municipal-money'
import { getFollowedCode } from '@/lib/session'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Account & plans · Municipal Accountability Tracker' }

const PLANS = [
  {
    name: 'Free',
    price: 'R0',
    current: true,
    features: [
      'Follow one municipality',
      'Audited finance dashboard',
      'Unlimited issue reports',
      'Community confirmations',
      'CSV export of your history',
    ],
  },
  {
    name: 'Plus',
    price: 'R39',
    current: false,
    features: [
      'Follow up to 5 municipalities',
      'Side-by-side financial comparisons',
      'Email & SMS follow-up reminders',
      'Ward-level alerts for new reports',
      'Full multi-year export',
    ],
  },
]

export default async function AccountPage() {
  const code = await getFollowedCode()
  const profile = await getMunicipalityProfile(code)

  return (
    <div className="flex flex-col gap-5 pt-2">
      <h1 className="font-heading text-3xl font-extrabold tracking-tight">Account</h1>

      <section aria-labelledby="plans-heading" className="flex flex-col gap-3">
        <h2 id="plans-heading" className="sr-only">
          Plans
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {PLANS.map((plan) => (
            <article
              key={plan.name}
              className={cn(
                'flex flex-col gap-4 rounded-xl p-4',
                plan.current ? 'border border-border bg-card' : 'bg-primary text-primary-foreground',
              )}
            >
              <div className="flex items-baseline justify-between">
                <h3 className="font-heading text-xl font-bold">{plan.name}</h3>
                <p className="font-heading text-2xl font-extrabold tabular-nums">
                  {plan.price}
                  <span className="text-sm font-medium opacity-75">/month</span>
                </p>
              </div>
              <ul className="flex flex-col gap-2 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className={cn('mt-0.5 size-4 shrink-0', plan.current ? 'text-primary' : 'text-accent')} aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              {plan.current ? (
                <p className="rounded-lg bg-secondary py-2.5 text-center text-sm font-semibold">Your current plan</p>
              ) : (
                <button
                  disabled
                  className="rounded-lg bg-accent py-2.5 text-sm font-bold text-accent-foreground disabled:cursor-not-allowed"
                >
                  Plus launches soon
                </button>
              )}
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="export-heading" className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <h2 id="export-heading" className="text-base font-bold">
          Your portable history
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Download every report for {profile?.name ?? code}, including timestamps, confirmations and municipal reference
          numbers. Useful for ward councillor meetings, ombud complaints or media.
        </p>
        <a
          href={`/api/reports/export?m=${code}`}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
        >
          <Download className="size-4" aria-hidden="true" /> Download CSV
        </a>
      </section>

      <section aria-labelledby="inst-heading" className="rounded-xl border border-dashed border-border p-4">
        <h2 id="inst-heading" className="text-base font-bold">
          For councillors, newsrooms &amp; NGOs
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Institutional dashboards with ward-level aggregation and API access are on the roadmap.
        </p>
      </section>

      <section aria-labelledby="about-heading" className="text-xs leading-relaxed text-muted-foreground">
        <h2 id="about-heading" className="mb-1 font-semibold text-foreground">
          About the data
        </h2>
        <p>
          Financial and audit data from National Treasury&apos;s Municipal Money API, reused free of charge under its
          terms. Ward boundaries from the IEC. Issue reports are submitted by residents; MAT is independent and cannot
          confirm whether a municipality received or resolved a report.
        </p>
      </section>
    </div>
  )
}
