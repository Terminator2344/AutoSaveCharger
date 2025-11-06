import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // Dev proxy stub; see Whop docs to configure local iframe proxying.
  const url = new URL(req.url)
  return NextResponse.json({ ok: true, path: url.pathname })
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url)
  return NextResponse.json({ ok: true, path: url.pathname })
}


