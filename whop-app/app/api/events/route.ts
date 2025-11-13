import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { whopsdk } from '@/lib/whop-sdk';
import { supabaseAdmin } from '@/lib/db';

export async function GET() {
  try {
    const h = await headers();
    let userId: string | null = null;

    try {
      const user = await whopsdk.verifyUserToken(h);
      userId = user?.userId ?? null;
    } catch {
      // No valid token - return empty
      return NextResponse.json([]);
    }

    if (!userId) {
      return NextResponse.json([]);
    }

    // Direct Supabase query scoped by userId
    const { data, error } = await supabaseAdmin
      .from('event')
      .select('*')
      .eq('userId', userId)
      .order('occurredAt', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json({ error: 'Failed to load events' }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to load events' }, { status: 500 });
  }
}
