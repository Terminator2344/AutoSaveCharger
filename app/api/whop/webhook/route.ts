import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/src/services/whop'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  const raw = await req.text()
  const signature = req.headers.get('whop-signature') || ''
  if (!verifyWebhookSignature(raw, signature)) return NextResponse.json({ error: 'invalid_signature' }, { status: 400 })
  let payload: any
  try {
    payload = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const whopEventId = payload?.id
  const type = payload?.type
  const occurredAt = new Date(payload?.created_at || Date.now())
  try {
    await prisma.event.create({ data: {
      whopEventId,
      type,
      status: inferStatus(type),
      userId: payload?.data?.user_id ?? null,
      subscriptionId: payload?.data?.subscription_id ?? null,
      email: payload?.data?.email ?? null,
      occurredAt,
      meta: payload?.data ?? {}
    } })
  } catch (e: any) {
    if (!String(e?.message).includes('Unique constraint')) throw e
  }
  return NextResponse.json({ received: true })
}

function inferStatus(type: string | undefined): string | undefined {
  if (!type) return undefined
  if (type.includes('failed')) return 'failed'
  if (type.includes('succeeded') || type.includes('renewed')) return 'succeeded'
  return undefined
}


