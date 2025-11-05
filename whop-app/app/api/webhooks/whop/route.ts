import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const data = await req.json();

  const eventType: string | undefined = data?.event || data?.type;
  const payload = data?.data || {};

  try {
    switch (eventType) {
      case 'payment_failed': {
        await prisma.event.create({
          data: {
            type: 'payment_failed',
            userEmail: payload?.user?.email ?? null,
            whopUserId: payload?.user?.id ?? null,
            recovered: false,
            reason: payload?.reason ?? null,
            amountCents: payload?.amount_cents ?? null,
            channel: payload?.channel ?? 'email',
          },
        });
        break;
      }
      case 'payment_succeeded':
      case 'payment_recovered': {
        await prisma.event.create({
          data: {
            type: eventType,
            userEmail: payload?.user?.email ?? null,
            whopUserId: payload?.user?.id ?? null,
            recovered: true,
            reason: payload?.recovered_by ?? payload?.reason ?? 'window',
            amountCents: payload?.amount_cents ?? null,
            channel: payload?.channel ?? null,
          },
        });
        break;
      }
      default: {
        // Ignore other events for now
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ ok: false, error: 'failed to process' }, { status: 500 });
  }
}


