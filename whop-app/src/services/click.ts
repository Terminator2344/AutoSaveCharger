import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function recordClick(input: { userId: string; channel: string; messageId?: string | null }) {
  await prisma.click.create({ data: {
    userId: input.userId,
    channel: input.channel,
    messageId: input.messageId ?? undefined
  } })
}

export async function getLastFailedEvent(userId: string) {
  return prisma.event.findFirst({ where: { userId, status: 'failed' }, orderBy: { occurredAt: 'desc' } })
}


