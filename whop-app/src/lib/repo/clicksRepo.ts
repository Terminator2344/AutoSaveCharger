import { supabaseAdmin } from '@/src/lib/db';

export interface ClickRow {
  id?: string;
  userId: string;
  channel: string;
  messageId?: string | null;
  clickedAt: string; // ISO date string
}

function mapClickData(data: ClickRow): Record<string, any> {
  return {
    id: data.id || `click_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    user_id: data.userId,
    channel: data.channel,
    message_id: data.messageId,
    clicked_at: data.clickedAt || new Date().toISOString(),
  };
}

function mapClickRow(row: any): ClickRow {
  return {
    id: row.id,
    userId: row.user_id,
    channel: row.channel,
    messageId: row.message_id,
    clickedAt: row.clicked_at,
  };
}

export async function createClick(data: ClickRow) {
  const row = mapClickData(data);
  const { data: created, error } = await supabaseAdmin
    .from('Click')
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error('Supabase createClick error:', error);
    throw error;
  }

  return mapClickRow(created);
}

export async function countClicks(where: {
  clickedAt?: { gte?: Date; lt?: Date };
}) {
  let query = supabaseAdmin.from('Click').select('*', { count: 'exact', head: true });

  if (where.clickedAt) {
    if (where.clickedAt.gte) {
      query = query.gte('clicked_at', where.clickedAt.gte.toISOString());
    }
    if (where.clickedAt.lt) {
      query = query.lt('clicked_at', where.clickedAt.lt.toISOString());
    }
  }

  const { count, error } = await query;

  if (error) {
    console.error('Supabase countClicks error:', error);
    throw error;
  }

  return count || 0;
}


