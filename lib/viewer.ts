import 'server-only'
import { cookies } from 'next/headers'

export const VIEWER_COOKIE = 'mat_viewer'
export const FOLLOW_COOKIE = 'mat_follow'
export const DEFAULT_MUNICIPALITY = 'CPT'

/** Anonymous per-device id until accounts ship. Set by proxy.ts. */
export async function getViewerId() {
  const store = await cookies()
  return store.get(VIEWER_COOKIE)?.value ?? 'anonymous'
}

export async function getFollowedCode() {
  const store = await cookies()
  return store.get(FOLLOW_COOKIE)?.value ?? DEFAULT_MUNICIPALITY
}
