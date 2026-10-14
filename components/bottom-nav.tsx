'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bank, House, MagnifyingGlass, PlusSquare, Scroll } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

export function BottomNav({ followedCode }: { followedCode: string }) {
  const pathname = usePathname()
  const items = [
    { href: '/', label: 'Home', icon: House, active: pathname === '/' },
    { href: `/m/${followedCode}`, label: 'Finance', icon: Bank, active: pathname.startsWith('/m/') },
    { href: '/report', label: 'Report', icon: PlusSquare, active: pathname === '/report' },
    { href: '/reports', label: 'History', icon: Scroll, active: pathname.startsWith('/reports') },
    { href: '/m', label: 'Find', icon: MagnifyingGlass, active: pathname === '/m' },
  ]

  return (
    <nav aria-label="Primary" className="ios-bottom-nav pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(12px,env(safe-area-inset-bottom))]">
      <ul className="pointer-events-auto mx-auto flex h-[68px] max-w-md items-center rounded-full border border-white/20 bg-[#303238]/80 px-3 py-[5px] shadow-[inset_0_1px_1px_rgba(255,255,255,.12),0_8px_28px_rgba(0,0,0,.2)] backdrop-blur-2xl">
        {items.map(({ href, label, icon: Icon, active }) => (
          <li key={label} className="flex h-full min-w-0 flex-1">
            <Link
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'ios-nav-item group relative flex h-full w-full items-center justify-center rounded-full text-white transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                !active && 'hover:bg-white/10',
              )}
            >
              {active ? <span aria-hidden className="absolute inset-y-0 -inset-x-1 rounded-full bg-white/[.18]" /> : null}
              <Icon weight={active ? 'fill' : 'bold'} className="relative z-10 size-[26px] shrink-0 transition-transform duration-200 group-active:scale-90" aria-hidden />
              <span className="sr-only">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
