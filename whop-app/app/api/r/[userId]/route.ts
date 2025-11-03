import { NextRequest, NextResponse } from 'next/server'
import { recordClick, getLastFailedEvent } from '@/src/services/click'
import { getBillingUpdateUrl } from '@/src/services/whop'

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  const url = new URL(req.url)
  const channel = url.searchParams.get('c') || 'unknown'
  const messageId = url.searchParams.get('m')
  await recordClick({ userId: params.userId, channel, messageId: messageId ?? undefined })
  const last = await getLastFailedEvent(params.userId)
  const billing = getBillingUpdateUrl(last?.meta)
  if (!billing || billing === '#') return new Response('No billing URL available yet.', { status: 200, headers: { 'Content-Type': 'text/plain' } })
  return NextResponse.redirect(billing, { status: 302 })
}


