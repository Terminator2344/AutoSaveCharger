import { NextResponse } from 'next/server'
import { env } from '@/src/config/env'

export async function GET() {
  const state = crypto.randomUUID()
  const params = new URLSearchParams({
    client_id: env.WHOP_CLIENT_ID,
    redirect_uri: env.WHOP_REDIRECT_URI,
    response_type: 'code',
    scope: 'read:subscriptions read:users', // minimal placeholder; see README
    state
  })
  const url = `https://whop.com/oauth/authorize?${params.toString()}`
  const res = NextResponse.redirect(url)
  res.headers.set('Set-Cookie', `whop_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax`)
  return res
}


