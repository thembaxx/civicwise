'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bank, House, MagnifyingGlass, Plus, Scroll } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

export function BottomNav({ followedCode }: { followedCode: string }) {
  const pathname = usePathname()
  const items = [
    { href: '/', label: 'Home', icon: House, active: pathname === '/' },
    { href: `/m/${followedCode}`, label: 'Finance', icon: Bank, active: pathname.startsWith('/m/') },
    { href: '/report', label: 'Report', icon: Plus, active: pathname === '/report', primary: true },
    { href: '/reports', label: 'History', icon: Scroll, active: pathname.startsWith('/reports') },
    { href: '/m', label: 'Find', icon: MagnifyingGlass, active: pathname === '/m' },
  ]

  return (
    <nav aria-label="Primary" className="ios-bottom-nav fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(10px,env(safe-area-inset-bottom))]">
      <ul className="mx-auto flex h-[68px] max-w-md items-center justify-between rounded-[28px] border border-white/10 bg-[#17181c]/90 px-2 shadow-[0_14px_40px_rgba(0,0,0,.3)] backdrop-blur-2xl">
        {items.map(({ href, label, icon: Icon, active, primary }) => (
          <li key={label} className="flex h-full flex-1 justify-center">
            <Link href={href} aria-current={active ? 'page' : undefined} className={cn('ios-nav-item group relative flex min-w-12 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 text-[10px] font-semibold transition-all duration-300', active ? 'text-white' : 'text-white/55')}>
              {active && !primary ? <span aria-hidden className="absolute inset-x-2 top-1 h-9 rounded-2xl bg-white/[.13] transition-transform duration-300" /> : null}
              <span className={cn('relative z-10 flex size-10 items-center justify-center transition-transform duration-300 group-active:scale-90', primary && '-mt-1 rounded-2xl bg-[#ff4f6d] text-white shadow-[0_7px_18px_rgba(255,79,109,.35)]') }>
                <Icon weight={active || primary ? 'fill' : 'regular'} className="size-[22px]" aria-hidden />
              </span>
              <span className="relative z-10">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
