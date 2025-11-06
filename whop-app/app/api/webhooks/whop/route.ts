import { NextResponse } from 'next/server';
import { createEvent } from '@/lib/repo/eventsRepo';
import { sendTelegram } from '@/integrations/telegram';
import { sendDiscord } from '@/integrations/discord';
import { sendEmail, buildPaymentEmailHtml } from '@/integrations/email';

import { sendTelegramAnimation } from '@/integrations/telegram';


export async function POST(req: Request) {
  console.log('📩 Incoming Webhook...');
  const data = await req.json();

  const eventType: string | undefined = data?.event || data?.type;
  const payload = data?.data || {};

  try {
    switch (eventType) {
      case 'payment_failed': {
        const created = await createEvent({
          type: 'payment_failed',
          userEmail: payload?.user?.email ?? null,
          whopUserId: payload?.user?.id ?? null,
          userId: payload?.user?.id ?? null,
          email: payload?.user?.email ?? null,
          recovered: false,
          reason: payload?.reason ?? null,
          amountCents: payload?.amount_cents ?? null,
          channel: payload?.channel ?? 'email',
          occurredAt: new Date().toISOString(),
        });
        console.log('✅ Event inserted successfully:', created);
        // fire-and-forget notifications
        try {
          const amountCents = created.amountCents ?? 0;
          const amount = (amountCents / 100).toFixed(2);
          const channel = created.channel ?? 'your payment method';
          const type = created.type;
          const msg = `💸 ${type} | ${channel} | $${amount}`;
          const telegramMessage = `
          ⚠️ <b>Whop Payment Failed</b>
          
          Hello 👋,
          
          We couldn’t process your recent payment of <b>$${((created.amountCents ?? 0) / 100).toFixed(2)}</b> via <b>${created.channel ?? 'your payment method'}</b> on <b>Whop</b> 💳  
          
          <b>Possible reasons:</b>
          • Card expired or declined  
          • Insufficient funds  
          • Bank temporarily blocked the transaction  
          
          <b>How to fix:</b>
          1️⃣ Log in to your <b>Whop</b> account  
          2️⃣ Open <b>AutoChargeSaver</b>  
          3️⃣ Update your payment method 💳  
          
          If the issue persists, reach out to us — we’re here to help 💙  
          <b>AutoChargeSaver Billing Team</b>
          `;
          
          const tgChat = process.env.TELEGRAM_CHAT_ID;
          if (tgChat) {
            await sendTelegramAnimation(
              tgChat,
              'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExMzJsYjBoY3IyNGtraGlqaG9lY3JxdHN1OGdmZnFlMXVtN3Vwc3luNCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l3nWhI38IWDofyDrW/giphy.gif',
              '<b>💳 Processing your payment...</b>'
            );
            
// ⏳ Пауза перед следующим сообщением
await new Promise((resolve) => setTimeout(resolve, 4000));
          }
          console.log('🧩 New template active');
          
          await Promise.allSettled([
            tgChat
              ? sendTelegram({
                  chatId: tgChat,
                  text: telegramMessage,
                  parse_mode: 'HTML',
                  reply_markup: {
                    inline_keyboard: [
                      [{ text: '🔁 Retry Payment', url: 'https://whop.com' }],
                      [{ text: '💬 Contact Support', url: 'https://whop.com/support' }],
                    ],
                  },
                })
              : Promise.resolve({ ok: true }),
            sendDiscord({ text: msg }),
            created.userEmail
            ? sendEmail({
                to: created.userEmail,
                subject: 'Whop Payment Failed',
                html: buildPaymentEmailHtml({
                  userName: payload?.user?.name || created.userEmail.split('@')[0],
                  amount: ((created.amountCents ?? 0) / 100).toFixed(2),
                  retryUrl: 'https://whop.com/dashboard/billing',
                }),
                
              })
            : Promise.resolve({ ok: true }),
          
          ]);
        } catch (e) {
          console.warn('Notification error (ignored):', e);
        }
        break;
      }
      case 'payment_succeeded':
      case 'payment_recovered': {
        const created = await createEvent({
          type: eventType,
          userEmail: payload?.user?.email ?? null,
          whopUserId: payload?.user?.id ?? null,
          userId: payload?.user?.id ?? null,
          email: payload?.user?.email ?? null,
          recovered: true,
          reason: payload?.recovered_by ?? payload?.reason ?? 'window',
          amountCents: payload?.amount_cents ?? payload?.amountCents ?? null,

          channel: payload?.channel ?? null,
          occurredAt: new Date().toISOString(),
        });
        console.log('✅ Event inserted successfully:', created);
        try {
          const amountCents = created.amountCents ?? payload?.amount_cents ?? 0;
          const amount = (amountCents / 100).toFixed(2);
          const channel = created.channel ?? 'your payment method';
          const type = created.type;
        
          const msg = `💸 ${type} | ${channel} | $${amount}`;
        
          const telegramMessage = created.type === 'payment_failed'
            ? `
       ⚠️ Whop Payment Failed

Hello,

We attempted to process your recent payment of $${((created.amountCents ?? 0) / 100).toFixed(2)} via ${created.channel ?? 'unknown channel'} on Whop, but unfortunately, it did not go through.

Possible reasons:
• Your card has expired or was declined
• There were insufficient funds in your account
• Your bank temporarily blocked the transaction

Please try again:
1. Log in to your Whop account
2. Open your active product – AutoChargeSaver
3. Update your payment method and make sure your card details are correct

If the issue persists, please contact Whop Support or reach out to us – we’ll be happy to help.

Thank you for using AutoChargeSaver on Whop 💙
Billing Support Team
`
            : msg;
        
          const tgChat = process.env.TELEGRAM_CHAT_ID;
        
          console.log('🧩 New template active');
          await Promise.allSettled([
            tgChat
              ? sendTelegram({ chatId: tgChat, text: telegramMessage })
              : Promise.resolve({ ok: true }),
            sendDiscord({ text: msg }),
            created.userEmail
              ? sendEmail({
                  to: created.userEmail,
                  subject: 'Whop Payment Failed',
                  html: telegramMessage.replace(/\n/g, '<br>')
                })
              : Promise.resolve({ ok: true }),
          ]);
        
          console.log('✅ Notification sent successfully');
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
  } catch (err: any) {
    console.error('❌ Webhook processing error:', err.message || err);
    console.error('🔍 Full error object:', JSON.stringify(err, null, 2));
    return NextResponse.json(
      { ok: false, error: err?.message || 'failed to process' },
      { status: 500 }
    );
  }
}


