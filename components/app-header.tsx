import Link from 'next/link'

export function AppHeader() {
  return (
    <header className="flex items-center justify-between px-4 py-4 md:px-6">
      <Link href="/" className="flex items-center gap-2.5" aria-label="Municipal Accountability Tracker home">
        <span aria-hidden className="flex h-8 w-8 flex-col items-center justify-center gap-1 rounded-md bg-secondary">
          <span className="h-1 w-1 rounded-full bg-primary" />
          <span className="h-2 w-1 rounded-full bg-primary" />
          <span className="h-1 w-1 rounded-full bg-primary" />
        </span>
        <span className="flex flex-col leading-none">
          <span className="font-heading text-[15px] font-extrabold tracking-tight">Accountability</span>
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Municipal tracker
          </span>
        </span>
      </Link>
      <Link
        href="/plans"
        className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-muted"
      >
        Plus R39
      </Link>
    </header>
  )
}
