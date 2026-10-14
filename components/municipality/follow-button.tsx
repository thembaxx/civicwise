'use client'

import { useTransition } from 'react'
import { Check, Plus } from 'lucide-react'
import { followMunicipality } from '@/app/actions'
import { cn } from '@/lib/utils'

export function FollowButton({ code, following }: { code: string; following: boolean }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={following || pending}
      onClick={() => startTransition(() => followMunicipality(code))}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
        following
          ? 'border border-border text-muted-foreground'
          : 'bg-primary text-primary-foreground hover:bg-primary/85',
      )}
    >
      {following ? <Check className="size-3.5" aria-hidden /> : <Plus className="size-3.5" aria-hidden />}
      {following ? 'Following' : pending ? 'Following…' : 'Follow'}
    </button>
  )
}
