import 'server-only'
import { cookies } from 'next/headers'

export const FOLLOW_COOKIE = 'mat_follow'
export const VISITOR_COOKIE = 'mat_vid'
export const DEFAULT_MUNICIPALITY = 'CPT'

export async function getFollowedCode() {
  const jar = await cookies()
  const code = jar.get(FOLLOW_COOKIE)?.value
  return code && /^[A-Z0-9]{2,8}$/.test(code) ? code : DEFAULT_MUNICIPALITY
}

export async function getVisitorId() {
  const jar = await cookies()
  return jar.get(VISITOR_COOKIE)?.value ?? null
}

export const visitorCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 365,
}
