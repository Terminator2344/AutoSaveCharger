import { NextResponse } from 'next/server';
import { headers } from 'next/headers'
import { whopsdk } from '../../../lib/whop-sdk'

import { findManyEvents } from '@/src/lib/repo/eventsRepo';

export async function GET() {
  try {
    const user = await whopsdk.verifyUserToken(await headers());
    if (!user?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const events = await findManyEvents({
      orderBy: { field: 'occurredAt', direction: 'desc' },
      take: 100,
      where: { userId: user.userId },
    });
    return NextResponse.json(events);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}


