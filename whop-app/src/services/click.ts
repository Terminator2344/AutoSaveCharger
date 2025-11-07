import { createClick } from '../lib/repo/clicksRepo';
import { findManyEvents } from '../lib/repo/eventsRepo';

export async function recordClick({ userId, channel, messageId }: any) {
  return createClick({
    userId,
    channel: channel || 'unknown',
    messageId: messageId || null,
    clickedAt: new Date().toISOString(),
  });
}

// Stub with positional args (for compatibility with other imports)
export async function recordClickPositional(userId: string, channel: string, messageId?: string) {
  return recordClick({ userId, channel, messageId });
}

export async function getLastFailedEvent(userId: string) {
  const events = await findManyEvents({
    where: {
      type: 'payment_failed',
    },
    orderBy: { field: 'occurredAt', direction: 'desc' },
    take: 1,
  });
  
  // Filter by userId if available
  const userEvents = events.filter((e) => e.userId === userId || e.whopUserId === userId);
  return userEvents[0] || null;
}

// Stub deriveBillingRedirect expected by some routes
export async function deriveBillingRedirect(userId: string) {
  const mockBillingUrl = "https://whop.com/billing";
  return mockBillingUrl;
}


