import { NextRequest, NextResponse } from 'next/server'
import { recordClick, deriveBillingRedirect } from '@/services/click'

// типизация теперь ждёт params как Promise
export async function GET(req: NextRequest, context: { params: Promise<{ userId: string }> }) {
  const { userId } = await context.params

  const url = new URL(req.url)
  const channel = url.searchParams.get('c') || 'unknown'
  const messageId = url.searchParams.get('m')

  await recordClick({ userId, channel, messageId })

  const { url: billingUrl, message } = await deriveBillingRedirect(userId)

  if (!billingUrl)
    return new Response(message, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })

  return NextResponse.redirect(billingUrl, { status: 302 })
}
