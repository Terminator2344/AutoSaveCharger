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


