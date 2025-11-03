import { db, insert, findOne } from "@/lib/db";

export async function recordClick({ userId, channel, messageId }: any) {
  return insert("clicks", { id: Date.now().toString(), userId, channel, messageId, clickedAt: new Date() });
}

// Stub with positional args (for compatibility with other imports)
export async function recordClickPositional(userId: string, channel: string, messageId?: string) {
  return recordClick({ userId, channel, messageId });
}

export async function getLastFailedEvent(userId: string) {
  return findOne("events", (e) => e.userId === userId && e.type.includes("failed"));
}

// Stub deriveBillingRedirect expected by some routes
export async function deriveBillingRedirect(userId: string) {
  const mockBillingUrl = "https://whop.com/billing";
  return mockBillingUrl;
}


