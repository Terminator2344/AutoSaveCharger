import { sendEmail } from '@/src/integrations/email'
import { sendTelegram } from '@/src/integrations/telegram'
import { sendDiscord } from '@/src/integrations/discord'
import { env } from '@/src/config/env'

type NotifyInput = {
  userId?: string
  subscriptionId?: string
  email?: string
  telegramChatId?: string
  messageId?: string
}

export async function notifyPaymentFailure(input: NotifyInput) {
  const cta = `${env.APP_BASE_URL}/r/${input.userId ?? 'unknown'}?c=email&m=${input.messageId ?? ''}`
  const html = `<p>We could not process your latest payment.</p><p><a href="${cta}">Update billing</a></p>`
  if (input.email) await sendEmail({ to: input.email, subject: 'Payment failed', html })
  if (input.telegramChatId) await sendTelegram({ chatId: input.telegramChatId, text: `Payment failed. Update: ${cta}` })
  await sendDiscord({ text: `Payment failed for user ${input.userId ?? 'unknown'}` })
}


