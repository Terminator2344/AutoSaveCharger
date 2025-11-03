import { waitUntil } from "@vercel/functions";
import type { Payment } from "@whop/sdk/resources.js";
import type { NextRequest } from "next/server";
import { whopsdk } from "@/lib/whop-sdk";
import { PrismaClient } from '@prisma/client'
import { notifyPaymentFailed, markRecoveredOnSuccess } from '@/src/services/notifications'
import { getBillingUpdateUrl } from '@/src/services/whop'

export async function POST(request: NextRequest): Promise<Response> {
	// Validate the webhook to ensure it's from Whop
	const requestBodyText = await request.text();
	const headers = Object.fromEntries(request.headers);
	const webhookData = whopsdk.webhooks.unwrap(requestBodyText, { headers });

	// Persist event idempotently and handle
	waitUntil(handleEvent(webhookData));

	// Make sure to return a 2xx status code quickly. Otherwise the webhook will be retried.
	return new Response("OK", { status: 200 });
}

const prisma = new PrismaClient()

async function handleEvent(evt: any) {
  const type: string = evt?.type
  const data: any = evt?.data
  const whopEventId: string = evt?.id ?? data?.id ?? crypto.randomUUID()
  const occurredAt = new Date(evt?.created_at ?? Date.now())

  // idempotent insert
  try {
    await prisma.event.create({ data: {
      whopEventId,
      type,
      status: inferStatus(type),
      userId: data?.user_id ?? null,
      subscriptionId: data?.subscription_id ?? null,
      email: data?.email ?? null,
      occurredAt,
      meta: data ?? {}
    } })
  } catch (e: any) {
    if (!String(e?.message).includes('Unique constraint')) throw e
  }

  if (isFailure(type)) {
    const userId = data?.user_id ?? null
    if (userId) {
      await prisma.user.upsert({ where: { id: userId }, update: { email: data?.email ?? undefined }, create: { id: userId, email: data?.email ?? null } })
    }
    const billingUrl = getBillingUpdateUrl(data)
    await notifyPaymentFailed({ user: { id: userId ?? 'unknown', email: data?.email ?? null }, subscriptionId: data?.subscription_id ?? null, billingUrl })
  }

  if (isSuccess(type)) {
    await markRecoveredOnSuccess({ userId: data?.user_id ?? null })
  }
}

function isFailure(type?: string) {
  if (!type) return false
  return type.includes('failed')
}

function isSuccess(type?: string) {
  if (!type) return false
  return type.includes('succeeded') || type.includes('renewed')
}

function inferStatus(type?: string): string | undefined {
  if (!type) return undefined
  if (isFailure(type)) return 'failed'
  if (isSuccess(type)) return 'succeeded'
  return undefined
}
