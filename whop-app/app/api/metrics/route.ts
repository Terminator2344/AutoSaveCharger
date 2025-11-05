import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const [failed, recovered, click, windowed, totalRevenueAgg, clicks] = await Promise.all([
    prisma.event.count({ where: { type: 'payment_failed' } }),
    prisma.event.count({ where: { recovered: true } }),
    prisma.event.count({ where: { recovered: true, reason: 'click' } }),
    prisma.event.count({ where: { recovered: true, reason: 'window' } }),
    prisma.event.aggregate({ _sum: { amountCents: true } }),
    prisma.click.count(),
  ]);

  const totalAmountCents = totalRevenueAgg._sum.amountCents || 0;
  const avgRate = (failed + recovered) === 0 ? 0 : Math.round((recovered / (failed + recovered)) * 1000) / 10;

  const topChannelGroup = await prisma.event.groupBy({
    by: ['channel'],
    _count: { channel: true },
    orderBy: { _count: { channel: 'desc' } },
    take: 1,
    where: { channel: { not: null } },
  });

  return NextResponse.json({
    failed,
    recovered,
    click,
    windowed,
    avgRate,
    totalRevenue: totalAmountCents / 100,
    clicks,
    topChannel: topChannelGroup[0]?.channel ?? '—',
  });
}


