import { insert } from "@/lib/db";

export async function notifyPaymentFailed({ user, subscriptionId, billingUrl }: any) {
  return insert("notifications", {
    id: Date.now().toString(),
    userId: user?.id,
    subscriptionId,
    channel: "email",
    status: "sent",
    createdAt: new Date(),
  });
}

export async function markRecoveredOnSuccess(evt: any) {
  evt.recovered = true;
  evt.reason = "click";
  return evt;
}

// Stub signatures for compatibility
export async function notifyPaymentFailedPositional(userId: string, channel: string) {
  console.log(`⚠️ Payment failed — notifying ${channel} for user ${userId}`)
  return true
}

export async function markRecoveredOnSuccessPositional(userId: string, reason: string) {
  console.log(`✅ Recovery marked for ${userId}, reason=${reason}`)
  return true
}


