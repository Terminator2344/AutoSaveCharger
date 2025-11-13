import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db'




export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('event')
      .select('id')
      .limit(1);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, connected: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}


