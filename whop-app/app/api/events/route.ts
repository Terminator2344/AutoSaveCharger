import { NextResponse } from 'next/server';
import { findManyEvents } from '@/lib/repo/eventsRepo';

export async function GET() {
  const events = await findManyEvents({
    orderBy: { field: 'occurredAt', direction: 'desc' },
    take: 100,
  });
  return NextResponse.json(events);
}


