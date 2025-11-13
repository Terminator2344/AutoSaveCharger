import { supabaseAdmin } from '../lib/db';
import { createClick } from '../lib/repo/clicksRepo';
import { findManyEvents } from '../lib/repo/eventsRepo';
import { buildWhopBillingUrlFromMeta } from './whop';

type RecordClickInput = {
  userId: string;
  channel?: string | null;
  messageId?: string | null;
};

export async function recordClick({ userId, channel, messageId }: RecordClickInput) {
  await createClick({
    userId,
    channel: channel || 'unknown',
    messageId: messageId ?? null,
    clickedAt: new Date().toISOString(),
  });
}

export async function recordClickPositional(userId: string, channel: string, messageId?: string) {
  return recordClick({ userId, channel, messageId });
}

export async function getLastFailedEvent(userId: string) {
  const events = await findManyEvents({
    where: { userId, type: 'payment_failed' },
    orderBy: { field: 'occurredAt', direction: 'desc' },
    take: 1,
  });
  return events[0] ?? null;
}

export async function deriveBillingRedirect(userId: string): Promise<string | null> {
  const event = await getLastFailedEvent(userId);
  if (!event) {
    return null;
  }

  const url = buildWhopBillingUrlFromMeta((event as any).meta);
  return url ?? null;
}

export async function markRecoveryIfClickedRecently(userId: string) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const { data: clickRows, error: clickError } = await supabaseAdmin
    .from('Click')
    .select('id, clicked_at')
    .eq('user_id', userId)
    .gte('clicked_at', since.toISOString())
    .order('clicked_at', { ascending: false })
    .limit(1);

  if (clickError) {
    console.error('[markRecoveryIfClickedRecently] failed to fetch clicks', clickError);
    return { recovered: false, reason: 'error' as const };
  }

  const lastClick = Array.isArray(clickRows) ? clickRows[0] : undefined;
  if (!lastClick) {
    return { recovered: false, reason: 'window' as const };
  }

  const { error: updateError } = await supabaseAdmin
    .from('event')
    .update({ recovered: true, reason: 'click' })
    .eq('userId', userId)
    .eq('recovered', false);

  if (updateError) {
    console.error('[markRecoveryIfClickedRecently] failed to mark recovery', updateError);
    return { recovered: false, reason: 'error' as const };
  }

  return { recovered: true, reason: 'click' as const };
}
