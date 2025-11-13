import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { notifyPaymentFailed, markRecoveredOnSuccess } from '@/services/notifications';

export async function POST(req: Request) {
  const body = await req.json();
  const type: string | undefined = body.type ?? body.event;
  const payload = body.data || {};

  const occurredAt =
    payload.occurredAt ??
    payload.occurred_at ??
    body.created_at ??
    new Date().toISOString();

  const { data: event, error } = await supabaseAdmin
    .from('event')
    .insert([
      {
        id: body.id ?? undefined,
        type: type ?? 'unknown',
        userId: payload.user_id ?? payload.user?.id ?? null,
        subscriptionId: payload.subscription_id ?? null,
        email: payload.email ?? payload.user?.email ?? null,
        occurredAt,
        amountCents: payload.amount_cents ?? payload.amountCents ?? null,
        channel: payload.channel ?? null,
        recovered: type?.includes('succeeded') ?? false,
        reason: payload.reason ?? null,
        meta: payload,
      },
    ])
    .select('*')
    .single();

  if (error) {
    console.error('❌ Failed to insert event:', error.message);
    throw error;
  }

  console.log('✅ Event inserted successfully:', event);

  if (type?.includes('failed')) {
    await notifyPaymentFailed({
      user: {
        id: payload.user?.id ?? payload.user_id ?? event.userId,
        email: payload.user?.email ?? payload.email ?? event.email ?? null,
        name: payload.user?.name ?? null,
      },
      subscriptionId: payload.subscription_id ?? null,
      billingUrl: payload.billing_url ?? null,
      amountCents: payload.amount_cents ?? payload.amountCents ?? null,
      channel: payload.channel ?? null,
      meta: payload,
    });
  }

  if (type?.includes('succeeded')) {
    await markRecoveredOnSuccess(event);
  }

  return NextResponse.json({ ok: true });
}
