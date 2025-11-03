import { db, insert, findOne } from "@/lib/db";

export async function recordClick({ userId, channel, messageId }: any) {
  return insert("clicks", { id: Date.now().toString(), userId, channel, messageId, clickedAt: new Date() });
}

export async function getLastFailedEvent(userId: string) {
  return findOne("events", (e) => e.userId === userId && e.type.includes("failed"));
}


