import { PrismaClient } from '@prisma/client'
import { buildWhopBillingUrlFromMeta } from './whop'

const prisma = new PrismaClient()

export async function recordClick(params: { userId: string; channel: string; messageId?: string | null }) {
  await prisma.click.create({ data: {
    userId: params.userId,
    channel: params.channel,
    messageId: params.messageId ?? undefined
  } })
}

export async function deriveBillingRedirect(userId: string): Promise<{ url: string | null; message: string }>{
  const ev = await prisma.event.findFirst({ where: { userId, status: 'failed' }, orderBy: { occurredAt: 'desc' } })
  const url = buildWhopBillingUrlFromMeta(ev?.meta)
  if (!url) return { url: null, message: 'No billing URL available yet.' }
  return { url, message: 'OK' }
}

export async function markRecoveryIfClickedRecently(userId: string) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const lastClick = await prisma.click.findFirst({ where: { userId, clickedAt: { gte: since } }, orderBy: { clickedAt: 'desc' } })
  if (!lastClick) return { recovered: false, reason: 'window' as const }
  await prisma.event.updateMany({ where: { userId, recovered: false }, data: { recovered: true, reason: 'click' } })
  return { recovered: true, reason: 'click' as const }
}


