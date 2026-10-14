import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr'
import { cn } from '@/lib/utils'

export function Section({
  title,
  action,
  children,
  className,
  description,
  eyebrow,
  icon,
  variant = 'paper',
  id,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  description?: string
  eyebrow?: string
  icon?: React.ReactNode
  variant?: 'paper' | 'stone' | 'plain'
  id?: string
}) {
  return (
    <section
      id={id}
      className={cn(
        'panel flex min-w-0 flex-col gap-6',
        variant === 'paper' && 'border border-border bg-card p-6 sm:p-8',
        variant === 'stone' && 'bg-muted/70 p-6 sm:p-7',
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          {eyebrow && (
            <p className="eyebrow text-muted-foreground">{eyebrow}</p>
          )}
          <div className="flex items-center gap-2.5">
            {icon && <span className="text-positive">{icon}</span>}
            <h2 className="editorial-title text-[27px] sm:text-[30px]">
              {title}
            </h2>
          </div>
          {description && (
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function SourceNote() {
  return (
    <p className="flex flex-wrap items-center gap-x-1 text-sm leading-relaxed text-muted-foreground">
      Source:{' '}
      <a
        href="https://municipalmoney.gov.za"
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 font-medium underline underline-offset-4"
      >
        National Treasury · Municipal Money{' '}
        <ArrowUpRight className="size-3.5" aria-hidden />
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
      <span>Audited actuals, reused under its open data terms.</span>
    </p>
  )
}

export function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div
      className="panel flex flex-col gap-4 border border-border bg-card p-6 sm:p-8"
      aria-busy="true"
    >
      <div className="h-7 w-2/3 animate-pulse rounded-xl bg-muted" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-xl bg-muted" />
      ))}
      <span className="sr-only">Loading Treasury data</span>
    </div>
  )
}
