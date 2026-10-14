import Link from 'next/link'

export function AppFooter() {
  return (
    <footer className="site-footer site-width flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
      <div className="flex flex-col gap-2">
        <p className="text-lg font-semibold tracking-tight">Civicwise.</p>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          Independent records. Public information.
          <br />A clearer picture of the place you call home.
        </p>
      </div>
      <nav
        aria-label="Footer"
        className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium"
      >
        <Link href="/ward" className="text-link">
          Find your ward
        </Link>
        <Link href="/plans" className="text-link">
          Plans
        </Link>
        <Link href="/account" className="text-link">
          About &amp; account
        </Link>
        <a
          href="https://municipalmoney.gov.za"
          target="_blank"
          rel="noreferrer"
          className="text-link"
        >
          Treasury data<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </nav>
    </footer>
  )
}
