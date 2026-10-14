import 'server-only'
import type { NextRequest, NextResponse } from 'next/server'
import { VISITOR_COOKIE, visitorCookieOptions } from './session'

export function resolveVisitor(req: NextRequest) {
  const existing = req.cookies.get(VISITOR_COOKIE)?.value
  return { id: existing ?? crypto.randomUUID(), isNew: !existing }
}

export function withVisitor(res: NextResponse, visitor: { id: string; isNew: boolean }) {
  if (visitor.isNew) res.cookies.set(VISITOR_COOKIE, visitor.id, visitorCookieOptions)
  return res
}
