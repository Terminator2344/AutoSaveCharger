import { NextRequest, NextResponse } from 'next/server'
import { exchangeOAuthCodeForToken } from '@/services/whop'
import { storeUserTokens } from '@/services/auth'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const cookieState = req.cookies.get('whop_oauth_state')?.value

  if (!code || !state || state !== cookieState)
    return NextResponse.json({ error: 'invalid_state' }, { status: 400 })

  const tokens = await exchangeOAuthCodeForToken({
    code,
    redirectUri: url.origin + '/api/whop/oauth/callback',
  })

  // TODO: resolve user identity mapping; placeholder user id
  await storeUserTokens('placeholder-user-id', tokens)

  return NextResponse.redirect(url.origin + '/views/dashboard')
}


