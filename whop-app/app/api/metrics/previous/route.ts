import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfWeek, subDays } from 'date-fns'

export async function GET() {
  const now = new Date()
  const startOfThisWeek = startOfWeek(now, { weekStartsOn: 1 })
  const startOfPrevWeek = subDays(startOfThisWeek, 7)

  const [failed, recovered, click, windowed, totalRevenueAgg, clicks] = await Promise.all([
    prisma.event.count({
      where: {
        type: 'payment_failed',
        occurredAt: { gte: startOfPrevWeek, lt: startOfThisWeek },
      },
    }),
    prisma.event.count({
      where: {
        recovered: true,
        occurredAt: { gte: startOfPrevWeek, lt: startOfThisWeek },
      },
    }),
    prisma.event.count({
      where: {
        recovered: true,
        reason: 'click',
        occurredAt: { gte: startOfPrevWeek, lt: startOfThisWeek },
      },
    }),
    prisma.event.count({
      where: {
        recovered: true,
        reason: 'window',
        occurredAt: { gte: startOfPrevWeek, lt: startOfThisWeek },
      },
    }),
    prisma.event.aggregate({
      _sum: { amountCents: true },
      where: { occurredAt: { gte: startOfPrevWeek, lt: startOfThisWeek } },
    }),
    prisma.click.count({
      where: { clickedAt: { gte: startOfPrevWeek, lt: startOfThisWeek } },
    }),
  ])

  const totalAmountCents = totalRevenueAgg._sum.amountCents || 0
  const avgRate =
    failed + recovered === 0 ? 0 : Math.round((recovered / (failed + recovered)) * 1000) / 10

  const topChannelGroup = await prisma.event.groupBy({
    by: ['channel'],
    _count: { channel: true },
    orderBy: { _count: { channel: 'desc' } },
    take: 1,
    where: {
      channel: { not: null },
      occurredAt: { gte: startOfPrevWeek, lt: startOfThisWeek },
    },
  })

  return NextResponse.json({
    failed,
    recovered,
    click,
    windowed,
    avgRate,
    totalRevenue: totalAmountCents / 100,
    clicks,
    topChannel: topChannelGroup[0]?.channel ?? '—',
  })
}
