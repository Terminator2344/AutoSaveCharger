import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/services/whop';
import { markRecoveryIfClickedRecently } from '@/services/click';
import { supabaseAdmin } from '@/lib/db';

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get('whop-signature') || '';

  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const type: string | undefined = payload?.type;
  const data = payload?.data ?? {};
  const occurredAt = new Date(payload?.created_at ?? Date.now()).toISOString();
  const status = inferStatus(type);

  try {
    const { error } = await supabaseAdmin
      .from('event')
      .insert({
        id: payload?.id ?? `event_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        whopEventId: payload?.id ?? null,
        type: type ?? null,
        status: status ?? null,
        userId: data.user_id ?? data.user?.id ?? null,
        subscriptionId: data.subscription_id ?? null,
        email: data.email ?? data.user?.email ?? null,
        occurredAt,
        recovered: false,
        amountCents: data.amount_cents ?? null,
        channel: data.channel ?? null,
        meta: data,
      });

    if (error && !isDuplicateError(error)) {
      throw error;
    }
  } catch (err: any) {
    if (!isDuplicateError(err)) {
      console.error('Failed to persist webhook event', err);
      throw err;
    }
  }

  if (status === 'succeeded' && (data.user_id || data.user?.id)) {
    await markRecoveryIfClickedRecently(data.user_id ?? data.user?.id);
  }

  return NextResponse.json({ received: true });
}

function inferStatus(type: string | undefined): 'failed' | 'succeeded' | undefined {
  if (!type) return undefined;
  if (type.includes('failed')) return 'failed';
  if (type.includes('succeeded') || type.includes('renewed')) return 'succeeded';
  return undefined;
}

function isDuplicateError(error: { message?: string }) {
  const message = error?.message?.toLowerCase() ?? '';
  return message.includes('duplicate') || message.includes('unique');
}


