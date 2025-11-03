import { NextRequest, NextResponse } from 'next/server'

// Minimal dev proxy stub; see docs for specifics. This can forward Whop-origin traffic to local routes in dev.
export async function ALL(req: NextRequest) {
  const url = new URL(req.url)
  return NextResponse.json({ ok: true, path: url.pathname })
}


