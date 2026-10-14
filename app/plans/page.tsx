import type { Metadata } from 'next'
import { Check } from '@phosphor-icons/react/dist/ssr'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Plans' }

const PLANS = [
  {
    name: 'Free',
    price: 'R0',
    note: 'For every resident',
    features: [
      'Follow one municipality',
      'Unlimited timestamped reports',
      'Confirm neighbours’ reports',
      'In-app follow-up reminders',
      'CSV export of your own history',
    ],
  },
  {
    name: 'Plus',
    price: 'R39',
    note: 'per month · cancel anytime',
    highlight: true,
    features: [
      'Follow up to 5 municipalities',
      '10-year financial trends and side-by-side compare',
      'SMS, WhatsApp and email reminders',
      'Ward digests when reports go stale',
      'Full community CSV with event history',
    ],
  },
  {
    name: 'Institutional',
    price: 'Later',
    note: 'Councillors, NGOs, newsrooms',
    features: ['Ward and municipal dashboards', 'Bulk data access', 'Shared team workspaces'],
  },
]

export default function PlansPage() {
  return (
    <div className="flex flex-col gap-5 pt-2">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight">Plans</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Reporting stays free. Plus pays for independence: no municipal or political funding.
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {PLANS.map((plan) => (
          <li
            key={plan.name}
            className={cn(
              'flex flex-col gap-4 rounded-2xl border p-4',
              plan.highlight ? 'border-secondary bg-secondary text-secondary-foreground' : 'border-border bg-card',
            )}
          >
            <div className="flex items-end justify-between gap-3">
              <div className="flex flex-col">
                <h2 className="text-lg font-bold">{plan.name}</h2>
                <p className={cn('text-xs', plan.highlight ? 'opacity-75' : 'text-muted-foreground')}>{plan.note}</p>
              </div>
              <p className={cn('font-heading text-3xl font-extrabold', plan.highlight && 'text-primary')}>{plan.price}</p>
            </div>
            <ul className="flex flex-col gap-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm leading-relaxed">
                  <Check className={cn('mt-0.5 size-4 shrink-0', plan.highlight && 'text-primary')} aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
            {plan.highlight && (
              <button
                type="button"
                disabled
                className="h-11 rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-90"
              >
                Coming soon
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
