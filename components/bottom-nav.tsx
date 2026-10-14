'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { House, Landmark, Plus, ScrollText, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BottomNav({ followedCode }: { followedCode: string }) {
  const pathname = usePathname()
  const items = [
    { href: '/', label: 'Home', icon: House, active: pathname === '/' },
    {
      href: `/m/${followedCode}`,
      label: 'Finances',
      icon: Landmark,
      active: pathname.startsWith('/m/'),
    },
    { href: '/report', label: 'Report', icon: Plus, active: pathname === '/report', primary: true },
    { href: '/reports', label: 'History', icon: ScrollText, active: pathname.startsWith('/reports') },
    { href: '/m', label: 'Find', icon: Search, active: pathname === '/m' },
  ]

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto flex max-w-md items-end justify-between px-2 md:max-w-2xl">
        {items.map(({ href, label, icon: Icon, active, primary }) => (
          <li key={label} className="flex flex-1 justify-center">
            <Link
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center gap-1 px-2 py-2.5 text-[11px] font-semibold',
                active ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {primary ? (
                <span className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-4 ring-background">
                  <Icon className="size-6" aria-hidden />
                </span>
              ) : (
                <Icon className="size-5" aria-hidden />
              )}
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
