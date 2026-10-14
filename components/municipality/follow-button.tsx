'use client'

import { useTransition } from 'react'
import { Check, Plus } from '@phosphor-icons/react'
import { followMunicipality } from '@/app/actions'
import { cn } from '@/lib/utils'

export function FollowButton({
  code,
  following,
}: {
  code: string
  following: boolean
}) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={following || pending}
      onClick={() => startTransition(() => followMunicipality(code))}
      className={cn(
        'inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors',
        following
          ? 'bg-positive-soft text-positive'
          : 'bg-primary text-primary-foreground hover:bg-primary/85',
      )}
    >
      {following ? (
        <Check className="size-3.5" aria-hidden />
      ) : (
        <Plus className="size-3.5" aria-hidden />
      )}
      {following ? 'Following' : pending ? 'Following…' : 'Follow'}
    </button>
  )
}
