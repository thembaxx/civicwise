import Link from 'next/link'
import { Suspense } from 'react'
import {
  MapPinLine,
  ClockCounterClockwise,
  UserCircle,
  ArrowUpRight,
} from '@phosphor-icons/react/dist/ssr'
import { ThemeToggle } from '@/components/theme-toggle'
import { MunicipalityPicker } from '@/components/municipality-picker'
import { getMunicipalities } from '@/lib/municipal-money'

export function AppHeader({ followedCode }: { followedCode: string }) {
  return (
    <header className="border-b border-border">
      <div className="site-width flex flex-wrap items-center gap-x-6 gap-y-4 py-5 lg:flex-nowrap lg:py-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label="Civicwise home"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <MapPinLine className="size-6" aria-hidden />
          </span>
          <span className="text-[25px] font-semibold tracking-[-.055em]">
            Civicwise<span className="text-positive">.</span>
          </span>
        </Link>
        <div className="order-3 min-w-0 w-full lg:order-none lg:mr-auto lg:max-w-[265px]">
          <Suspense
            fallback={
              <Link
                href="/m"
                className="flex h-11 items-center rounded-xl border border-border bg-card px-4 text-sm text-muted-foreground"
              >
                Choose your municipality
              </Link>
            }
          >
            <HeaderMunicipality followedCode={followedCode} />
          </Suspense>
        </div>
        <nav
          aria-label="Header"
          className="ml-auto flex shrink-0 items-center gap-3 lg:ml-0 xl:gap-5"
        >
          <Link
            href={`/m/${followedCode}`}
            className="text-link hidden lg:inline-flex"
          >
            Finances
          </Link>
          <Link href="/ward" className="text-link hidden xl:inline-flex">
            Find your ward
          </Link>
          <Link href="/reports" className="text-link hidden sm:inline-flex">
            <ClockCounterClockwise className="size-[18px]" aria-hidden />{' '}
            History
          </Link>
          <Link href="/account" className="text-link">
            <UserCircle className="size-5" aria-hidden />
            <span className="hidden sm:inline">Account</span>
            <span className="sr-only sm:hidden">Account</span>
          </Link>
          <ThemeToggle />
          <Link
            href="/report"
            className="button-primary hidden whitespace-nowrap lg:inline-flex"
          >
            Report a problem{' '}
            <ArrowUpRight className="size-[18px]" aria-hidden />
          </Link>
        </nav>
      </div>
    </header>
  )
}

async function HeaderMunicipality({ followedCode }: { followedCode: string }) {
  const municipalities = await getMunicipalities()
  return <MunicipalityPicker options={municipalities} current={followedCode} />
}
