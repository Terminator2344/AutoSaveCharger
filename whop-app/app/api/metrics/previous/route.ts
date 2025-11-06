import { NextResponse } from 'next/server'
import { countEvents, aggregateEvents, groupByChannel } from '@/lib/repo/eventsRepo'
import { countClicks } from '@/lib/repo/clicksRepo'
import { startOfWeek, subDays } from 'date-fns'

export async function GET() {
  const now = new Date()
  const startOfThisWeek = startOfWeek(now, { weekStartsOn: 1 })
  const startOfPrevWeek = subDays(startOfThisWeek, 7)

  const [failed, recovered, click, windowed, totalRevenueAgg, clicks] = await Promise.all([
    countEvents({
      type: 'payment_failed',
      occurredAt: { gte: startOfPrevWeek, lt: startOfThisWeek },
    }),
    countEvents({
      recovered: true,
      occurredAt: { gte: startOfPrevWeek, lt: startOfThisWeek },
    }),
    countEvents({
      recovered: true,
      reason: 'click',
      occurredAt: { gte: startOfPrevWeek, lt: startOfThisWeek },
    }),
    countEvents({
      recovered: true,
      reason: 'window',
      occurredAt: { gte: startOfPrevWeek, lt: startOfThisWeek },
    }),
    aggregateEvents({
      occurredAt: { gte: startOfPrevWeek, lt: startOfThisWeek },
    }),
    countClicks({
      clickedAt: { gte: startOfPrevWeek, lt: startOfThisWeek },
    }),
  ])

  const totalAmountCents = totalRevenueAgg._sum.amountCents || 0
  const avgRate =
    failed + recovered === 0 ? 0 : Math.round((recovered / (failed + recovered)) * 1000) / 10

  const topChannelGroup = await groupByChannel({
    channel: { not: null },
    occurredAt: { gte: startOfPrevWeek, lt: startOfThisWeek },
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
