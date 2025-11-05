import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTelegram } from '@/integrations/telegram';
import { sendDiscord } from '@/integrations/discord';
import { sendEmail } from '@/integrations/email';

export async function POST(req: Request) {
  const data = await req.json();

  const eventType: string | undefined = data?.event || data?.type;
  const payload = data?.data || {};

  try {
    switch (eventType) {
      case 'payment_failed': {
        const created = await prisma.event.create({
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
        // fire-and-forget notifications
        try {
          const amountCents = created.amountCents ?? 0;
          const channel = created.channel ?? '—';
          const type = created.type;
          const msg = `💸 ${type} | ${channel} | $${(amountCents / 100).toFixed(2)}`;
          const tgChat = process.env.TELEGRAM_CHAT_ID;
          await Promise.allSettled([
            tgChat ? sendTelegram({ chatId: tgChat, text: msg }) : Promise.resolve({ ok: true }),
            sendDiscord({ text: msg }),
            created.userEmail ? sendEmail({ to: created.userEmail, subject: 'New Event', html: `Type: ${type}, Amount: $${(amountCents / 100).toFixed(2)}` }) : Promise.resolve({ ok: true }),
          ]);
        } catch (e) {
          console.warn('Notification error (ignored):', e);
        }
        break;
      }
      case 'payment_succeeded':
      case 'payment_recovered': {
        const created = await prisma.event.create({
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
        try {
          const amountCents = created.amountCents ?? 0;
          const channel = created.channel ?? '—';
          const type = created.type;
          const msg = `💸 ${type} | ${channel} | $${(amountCents / 100).toFixed(2)}`;
          const tgChat = process.env.TELEGRAM_CHAT_ID;
          await Promise.allSettled([
            tgChat ? sendTelegram({ chatId: tgChat, text: msg }) : Promise.resolve({ ok: true }),
            sendDiscord({ text: msg }),
            created.userEmail ? sendEmail({ to: created.userEmail, subject: 'New Event', html: `Type: ${type}, Amount: $${(amountCents / 100).toFixed(2)}` }) : Promise.resolve({ ok: true }),
          ]);
        } catch (e) {
          console.warn('Notification error (ignored):', e);
        }
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


