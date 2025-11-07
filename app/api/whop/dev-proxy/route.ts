import { NextRequest, NextResponse } from 'next/server'

// Универсальный dev-proxy, который отвечает на любые запросы
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  return NextResponse.json({ ok: true, path: url.pathname, method: 'GET' })
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url)
  return NextResponse.json({ ok: true, path: url.pathname, method: 'POST' })
}
