'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from '@phosphor-icons/react'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggleTheme() {
    const nextIsDark = !document.documentElement.classList.contains('dark')
    document.documentElement.classList.toggle('dark', nextIsDark)
    document.documentElement.classList.toggle('light', !nextIsDark)
    document.documentElement.style.colorScheme = nextIsDark ? 'dark' : 'light'
    document.cookie = `theme=${nextIsDark ? 'dark' : 'light'}; path=/; max-age=31536000; SameSite=Lax`
    setIsDark(nextIsDark)
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      className="theme-toggle inline-flex size-9 items-center justify-center rounded-full border border-border bg-card/70 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {isDark ? <Sun weight="fill" className="size-4" aria-hidden /> : <Moon weight="fill" className="size-4" aria-hidden />}
    </button>
  )
}
