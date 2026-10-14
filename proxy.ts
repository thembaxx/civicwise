import { NextResponse, type NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  if (request.cookies.has('mat_viewer')) return NextResponse.next()
  const id = crypto.randomUUID()
  request.cookies.set('mat_viewer', id)
  const response = NextResponse.next({ request: { headers: request.headers } })
  response.cookies.set('mat_viewer', id, {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
