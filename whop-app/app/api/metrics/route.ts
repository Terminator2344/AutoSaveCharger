import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { whopsdk } from '@/lib/whop-sdk';
import { supabaseAdmin } from '@/lib/db';
import { startOfWeek } from 'date-fns';

export async function GET() {
  try {
    const h = await headers();
    let userId: string | null = null;

    try {
      const user = await whopsdk.verifyUserToken(h);
      userId = user?.userId ?? null;
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const startOfThisWeek = startOfWeek(now, { weekStartsOn: 1 });

    // Direct Supabase queries
    const [failedRes, succeededRes, revenueRes] = await Promise.all([
      supabaseAdmin
        .from('event')
        .select('*', { count: 'exact', head: true })
        .eq('userId', userId)
        .eq('type', 'payment_failed')
        .gte('occurredAt', startOfThisWeek.toISOString()),
      supabaseAdmin
        .from('event')
        .select('*', { count: 'exact', head: true })
        .eq('userId', userId)
        .eq('type', 'payment_succeeded')
        .gte('occurredAt', startOfThisWeek.toISOString()),
      supabaseAdmin
        .from('event')
        .select('amountCents')
        .eq('userId', userId)
        .gte('occurredAt', startOfThisWeek.toISOString()),
    ]);

    const failed = failedRes.count || 0;
    const recovered = succeededRes.count || 0;
    const totalAmountCents = (revenueRes.data || []).reduce((sum: number, row: any) => {
      const amount = typeof row.amountCents === 'number' ? row.amountCents : Number(row.amountcents || 0);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    const avgRate = failed + recovered === 0 ? 0 : Math.round((recovered / (failed + recovered)) * 1000) / 10;

    return NextResponse.json({
      failed,
      recovered,
      avgRate,
      totalRevenue: totalAmountCents / 100,
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
