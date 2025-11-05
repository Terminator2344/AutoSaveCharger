import { NextRequest, NextResponse } from 'next/server'
import { recordClick, deriveBillingRedirect } from '../../../../src/services/click';



export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  const url = new URL(req.url)
  const channel = url.searchParams.get('c') || 'unknown'
  const messageId = url.searchParams.get('m')
  await recordClick({ userId: params.userId, channel, messageId })
  const { url: billingUrl, message } = await deriveBillingRedirect(params.userId)
  if (!billingUrl) return new Response(message, { status: 200, headers: { 'Content-Type': 'text/plain' } })
  return NextResponse.redirect(billingUrl, { status: 302 })
}


