import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const { pathname } = req.nextUrl
  if (pathname.startsWith('/views/')) {
    res.headers.set('Content-Security-Policy', "frame-ancestors 'self' https://*.whop.com")
    res.headers.delete('X-Frame-Options')
  }
  return res
}

export const config = { matcher: ['/views/:path*'] }


