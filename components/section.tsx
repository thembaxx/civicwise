import { cn } from '@/lib/utils'

export function Section({
  title,
  action,
  children,
  className,
  description,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('flex flex-col gap-4 rounded-2xl border border-border bg-card p-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-bold tracking-tight">{title}</h2>
          {description && <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function SourceNote() {
  return (
    <p className="text-xs leading-relaxed text-muted-foreground">
      {'Financial data: '}
      <a
        href="https://municipalmoney.gov.za"
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2"
      >
        National Treasury Municipal Money
      </a>
      {', audited actuals. Reused under its open data terms.'}
    </p>
  )
}

export function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4" aria-busy="true">
      <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-8 animate-pulse rounded bg-muted" />
      ))}
      <span className="sr-only">Loading Treasury data</span>
    </div>
  )
}
