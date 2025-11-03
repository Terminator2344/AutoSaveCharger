import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // Placeholder: template SDK handles auth; this endpoint reserved if manual OAuth is needed.
  // TODO (docs/whop/apps/guides/oauth): verify state, exchange code, bind to user.
  const url = new URL(req.url)
  return NextResponse.redirect(url.origin + '/')
}


