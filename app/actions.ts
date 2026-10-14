'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { FOLLOW_COOKIE } from '@/lib/viewer'

export async function followMunicipality(code: string) {
  if (!/^[A-Z0-9]{2,8}$/.test(code)) return
  const store = await cookies()
  store.set(FOLLOW_COOKIE, code, {
    sameSite: 'none',
    secure: true,
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })
  revalidatePath('/', 'layout')
}
