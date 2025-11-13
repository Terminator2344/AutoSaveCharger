import { supabaseAdmin } from '../lib/db';
import { sendDiscord } from '../integrations/discord';
import { sendEmail, buildPaymentEmailHtml } from '../integrations/email';
import { sendTelegram, sendTelegramAnimation } from '../integrations/telegram';
import { buildWhopBillingUrlFromMeta } from './whop';

type NotifyPaymentFailedInput = {
  user?: { id?: string | null; email?: string | null; name?: string | null };
  subscriptionId?: string | null;
  billingUrl?: string | null;
  amountCents?: number | null;
  channel?: string | null;
  meta?: Record<string, any> | null;
};

export async function notifyPaymentFailed(input: NotifyPaymentFailedInput) {
  const notificationId = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const channel = input.channel ?? 'email';
  const retryUrl =
    input.billingUrl ||
    buildWhopBillingUrlFromMeta(input.meta ?? undefined) ||
    'https://whop.com/dashboard/billing';
  const amount =
    typeof input.amountCents === 'number' ? (input.amountCents / 100).toFixed(2) : undefined;
  const userEmail = input.user?.email ?? null;
  const userName = input.user?.name ?? (userEmail ? userEmail.split('@')[0] : 'there');
  const tgChat = process.env.TELEGRAM_CHAT_ID;

  const telegramMessage = `⚠️ Whop Payment Failed

User: ${userName}
Amount: ${amount ? `$${amount}` : 'unknown'}
Channel: ${channel}

Retry: ${retryUrl}
`;

  await Promise.allSettled([
    tgChat
      ? (async () => {
          await sendTelegramAnimation(
            tgChat,
            'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExMzJsYjBoY3IyNGtraGlqaG9lY3JxdHN1OGdmZnFlMXVtN3Vwc3luNCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l3nWhI38IWDofyDrW/giphy.gif',
            '<b>💳 Processing your payment...</b>',
          );
          await new Promise((resolve) => setTimeout(resolve, 1500));
          await sendTelegram({
            chatId: tgChat,
            text: telegramMessage,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔁 Retry Payment', url: retryUrl }],
                [{ text: '💬 Contact Support', url: 'https://whop.com/support' }],
              ],
            },
          });
        })()
      : Promise.resolve({ ok: true }),
    sendDiscord({
      text: `💸 payment_failed | ${channel} | ${amount ? `$${amount}` : 'unknown amount'}`,
    }),
    userEmail
      ? sendEmail({
          to: userEmail,
          subject: 'Whop Payment Failed',
          html: buildPaymentEmailHtml({
            userName,
            amount: amount ?? 'unknown',
            retryUrl,
          }),
        })
      : Promise.resolve({ ok: true }),
  ]);

  try {
    const { error } = await supabaseAdmin.from('Notification').insert({
      id: notificationId,
      user_id: input.user?.id ?? null,
      subscription_id: input.subscriptionId ?? null,
      channel,
      message_id: notificationId,
      status: 'sent',
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('[notifyPaymentFailed] failed to persist notification', error);
    }
  } catch (err) {
    console.warn('[notifyPaymentFailed] storage error (ignored)', err);
  }

  return { id: notificationId };
}

type EventRecord = { id?: string; userId?: string | null; [key: string]: any };

export async function markRecoveredOnSuccess(event: EventRecord) {
  if (!event?.userId) {
    return event;
  }

  const { error } = await supabaseAdmin
    .from('event')
    .update({ recovered: true, reason: 'payment_succeeded' })
    .eq('userId', event.userId)
    .eq('recovered', false);

  if (error) {
    console.error('[markRecoveredOnSuccess] failed to update event status', error);
  }

  return { ...event, recovered: true, reason: 'payment_succeeded' };
}

export async function notifyPaymentFailedPositional(userId: string, notifyChannel: string) {
  return notifyPaymentFailed({
    user: { id: userId },
    channel: notifyChannel,
  });
}

export async function markRecoveredOnSuccessPositional(userId: string, reason: string) {
  return markRecoveredOnSuccess({ userId, reason });
}
