import { PrismaClient } from '@prisma/client'
import { env } from '@/src/config/env'
import { sendEmail } from '@/src/integrations/email'
import { sendTelegram } from '@/src/integrations/telegram'
import { sendDiscord } from '@/src/integrations/discord'

const prisma = new PrismaClient()

export async function notifyPaymentFailed(input: { user: { id: string; email?: string | null; tgUserId?: string | null; }; subscriptionId?: string | null; billingUrl: string }) {
  const redirect = `${env.APP_BASE_URL}/api/r/${input.user.id}?c=email&m=${Date.now()}`
  const html = `<p>We couldn't process your recent payment.</p><p><a href="${redirect}">Update your card</a></p>`

  let emailId: string | undefined
  if (input.user.email) {
    const res = await sendEmail({ to: input.user.email, subject: 'Payment failed — update your card', html })
    await prisma.notification.create({ data: { userId: input.user.id, subscriptionId: input.subscriptionId ?? undefined, channel: 'email', messageId: res.id, status: res.ok ? 'sent' : 'failed', error: res.error } })
    emailId = res.id
  }

  if (input.user.tgUserId) {
    const res = await sendTelegram({ chatId: input.user.tgUserId, text: `⚠️ Payment failed. Update your card: ${redirect}` })
    await prisma.notification.create({ data: { userId: input.user.id, subscriptionId: input.subscriptionId ?? undefined, channel: 'telegram', messageId: undefined, status: res.ok ? 'sent' : 'failed', error: res.error } })
  }

  const d = await sendDiscord({ text: `⚠️ Payment failed for user ${input.user.id}. Update: ${redirect}` })
  await prisma.notification.create({ data: { userId: input.user.id, subscriptionId: input.subscriptionId ?? undefined, channel: 'discord', status: d.ok ? 'sent' : 'failed', error: d.error } })

  return { emailId }
}

export async function markRecoveredOnSuccess(evt: { userId?: string | null }) {
  if (!evt.userId) return { recovered: false, reason: 'window' as const }
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const lastClick = await prisma.click.findFirst({ where: { userId: evt.userId, clickedAt: { gte: since } }, orderBy: { clickedAt: 'desc' } })
  const reason = lastClick ? 'click' : 'window'
  await prisma.event.updateMany({ where: { userId: evt.userId, recovered: false }, data: { recovered: true, reason } })
  return { recovered: true, reason }
}


