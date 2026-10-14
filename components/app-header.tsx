import Link from 'next/link'
import { MapPinLine } from '@phosphor-icons/react/dist/ssr/MapPinLine'
import { ThemeToggle } from '@/components/theme-toggle'

export function AppHeader() {
  return (
    <header className="flex items-center justify-between px-4 py-4 md:px-6">
      <Link href="/" className="group flex items-center gap-2.5" aria-label="Civic Ledger home">
        <span aria-hidden className="brand-mark flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-primary shadow-sm">
          <MapPinLine weight="fill" className="size-5 transition-transform duration-300 group-hover:-translate-y-0.5" />
        </span>
        <span className="flex flex-col leading-none">
          <span className="font-heading text-[15px] font-extrabold tracking-tight">Civic Ledger</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Your municipality, clearly
          </span>
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Link href="/plans" className="rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition-transform hover:-translate-y-0.5">
          Plus R39
        </Link>
      </div>
    </header>
  )
}
