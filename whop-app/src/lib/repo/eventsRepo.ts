import { supabaseAdmin } from '@/src/lib/db';

export interface EventRow {
  id?: string;
  type: string;
  userEmail?: string | null;
  whopUserId?: string | null;
  userId?: string | null;
  email?: string | null;
  recovered?: boolean;
  reason?: string | null;
  amountCents?: number | null;
  channel?: string | null;
  occurredAt: string; // ISO date string
}

/**
 * Maps webhook event data to database row format
 */
function mapEventData(data: EventRow): Record<string, any> {
  return {
    id: data.id,
    type: data.type,
    userEmail: data.userEmail ?? data.email ?? null,
    whopUserId: data.whopUserId ?? data.userId ?? null,
    userId: data.userId ?? null,
    email: data.email ?? data.userEmail ?? null,
    recovered: data.recovered ?? false,
    reason: data.reason ?? null,
    amountCents: data.amountCents ?? null,
    channel: data.channel ?? null,
    occurredAt: data.occurredAt,
  };
}

/**
 * Maps database row back to application format
 */
function mapEventRow(row: any): EventRow {
  return {
    id: row.id,
    type: row.type,
    userEmail: row.useremail ?? row.userEmail ?? row.email ?? null,
    whopUserId: row.whopuserid ?? row.whopUserId ?? row.userId ?? null,
    userId: row.userid ?? row.userId ?? null,
    email: row.email ?? null,
    recovered: row.recovered ?? false,
    reason: row.reason ?? null,
    amountCents: typeof row.amountcents !== 'undefined' ? Number(row.amountcents) : row.amountCents ?? null,
    channel: row.channel ?? null,
    occurredAt: row.occurredat ?? row.occurredAt,
  };
}

export async function createEvent(data: EventRow) {
  const row = mapEventData(data);
  const { data: created, error } = await supabaseAdmin
    .from('event')
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error('Supabase createEvent error:', error);
    throw error;
  }

  return mapEventRow(created);
}

export async function findManyEvents(options: {
  orderBy?: { field: string; direction: 'asc' | 'desc' };
  take?: number;
  where?: {
    userId?: string;
    type?: string;
    recovered?: boolean;
    reason?: string;
    occurredAt?: { gte?: Date; lt?: Date };
    channel?: { not: null } | string;
  };
}) {
  let query = supabaseAdmin.from('event').select('*');

  // Apply filters
  if (options.where) {
    if (options.where.userId) query = query.eq('userId', options.where.userId);
    if (options.where.type) query = query.eq('type', options.where.type);
    if (options.where.recovered !== undefined) query = query.eq('recovered', options.where.recovered);
    if (options.where.reason) query = query.eq('reason', options.where.reason);
    if (options.where.occurredAt) {
      if (options.where.occurredAt.gte) query = query.gte('occurredAt', options.where.occurredAt.gte.toISOString());
      if (options.where.occurredAt.lt) query = query.lt('occurredAt', options.where.occurredAt.lt.toISOString());
    }
    if (options.where.channel) {
      if (typeof options.where.channel === 'object' && 'not' in options.where.channel) {
        query = query.not('channel', 'is', null);
      } else {
        query = query.eq('channel', options.where.channel as any);
      }
    }
  }

  // Apply ordering
  if (options.orderBy) {
    query = query.order(options.orderBy.field, { ascending: options.orderBy.direction === 'asc' });
  }

  // Apply limit
  if (options.take) {
    query = query.limit(options.take);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Supabase findManyEvents error:', error);
    throw error;
  }

  return (data || []).map(mapEventRow);
}

export async function countEvents(where: {
  userId?: string;
  type?: string;
  recovered?: boolean;
  reason?: string;
  occurredAt?: { gte?: Date; lt?: Date };
}) {
  let query = supabaseAdmin.from('event').select('*', { count: 'exact', head: true });

  if (where.userId) query = query.eq('userId', where.userId);
  if (where.type) query = query.eq('type', where.type);
  if (where.recovered !== undefined) query = query.eq('recovered', where.recovered);
  if (where.reason) query = query.eq('reason', where.reason);
  if (where.occurredAt) {
    if (where.occurredAt.gte) query = query.gte('occurredAt', where.occurredAt.gte.toISOString());
    if (where.occurredAt.lt) query = query.lt('occurredAt', where.occurredAt.lt.toISOString());
  }

  const { count, error } = await query;

  if (error) {
    console.error('Supabase countEvents error:', error);
    throw error;
  }

  return count || 0;
}

export async function aggregateEvents(where: {
  userId?: string;
  occurredAt?: { gte?: Date; lt?: Date };
}) {
  // Fetch and sum amountCents in JS
  let query = supabaseAdmin.from('event').select('amountCents');

  if (where.userId) query = query.eq('userId', where.userId);
  if (where.occurredAt) {
    if (where.occurredAt.gte) query = query.gte('occurredAt', where.occurredAt.gte.toISOString());
    if (where.occurredAt.lt) query = query.lt('occurredAt', where.occurredAt.lt.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error('Supabase aggregateEvents error:', error);
    throw error;
  }

  const sum = (data || []).reduce((acc, row) => {
    const amount = typeof row.amountCents === 'number' ? row.amountCents : Number((row as any)['amountcents'] || 0);
    return acc + (isNaN(amount) ? 0 : amount);
  }, 0);

  return { _sum: { amountCents: sum } };
}

export async function groupByChannel(where: {
  userId?: string;
  channel?: { not: null };
  occurredAt?: { gte?: Date; lt?: Date };
}) {
  // Fetch all matching events and group in JS
  let query = supabaseAdmin.from('event').select('channel');

  if (where.userId) query = query.eq('userId', where.userId);
  if (where.channel && typeof where.channel === 'object' && 'not' in where.channel) {
    query = query.not('channel', 'is', null);
  }

  if (where.occurredAt) {
    if (where.occurredAt.gte) query = query.gte('occurredAt', where.occurredAt.gte.toISOString());
    if (where.occurredAt.lt) query = query.lt('occurredAt', where.occurredAt.lt.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error('Supabase groupByChannel error:', error);
    throw error;
  }

  // Group by channel
  const channelCounts: Record<string, number> = {};
  (data || []).forEach((row: any) => {
    const channel = row.channel || 'unknown';
    channelCounts[channel] = (channelCounts[channel] || 0) + 1;
  });

  // Convert to array and sort
  const result = Object.entries(channelCounts)
    .map(([channel, _count]) => ({
      channel,
      _count: { channel: _count },
    }))
    .sort((a, b) => b._count.channel - a._count.channel);

  return result;
}

