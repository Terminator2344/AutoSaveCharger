import { NextResponse } from 'next/server'

export async function GET() {
  // Template uses Whop SDK/NextAuth; this is a placeholder if explicit consent URL is needed.
  // TODO: If required, build consent URL with minimal scopes per docs and redirect.
  return NextResponse.redirect('/')
}


