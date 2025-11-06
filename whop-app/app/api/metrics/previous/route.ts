import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { whopsdk } from '@/lib/whop-sdk'
import { countEvents, aggregateEvents } from '@/lib/repo/eventsRepo'
import { startOfWeek, subDays } from 'date-fns'

export async function GET() {
  try {
    const user = await whopsdk.verifyUserToken(await headers())
    if (!user?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const now = new Date()
    const startOfThisWeek = startOfWeek(now, { weekStartsOn: 1 })
    const startOfPrevWeek = subDays(startOfThisWeek, 7)

    const [failed, recovered, totalRevenueAgg] = await Promise.all([
      countEvents({ userId: user.userId, type: 'payment_failed', occurredAt: { gte: startOfPrevWeek, lt: startOfThisWeek } }),
      countEvents({ userId: user.userId, type: 'payment_succeeded', occurredAt: { gte: startOfPrevWeek, lt: startOfThisWeek } }),
      aggregateEvents({ userId: user.userId, occurredAt: { gte: startOfPrevWeek, lt: startOfThisWeek } }),
    ])

    const totalAmountCents = totalRevenueAgg._sum.amountCents || 0
    const avgRate = failed + recovered === 0 ? 0 : Math.round((recovered / (failed + recovered)) * 1000) / 10

    return NextResponse.json({
      failed,
      recovered,
      avgRate,
      totalRevenue: totalAmountCents / 100,
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
