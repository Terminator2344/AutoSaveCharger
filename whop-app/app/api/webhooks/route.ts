import { NextResponse } from "next/server";
import { insert } from "@/lib/db";
import { notifyPaymentFailed, markRecoveredOnSuccess } from "@/services/notifications";

export async function POST(req: Request) {
  const body = await req.json();
  const type = body.type;
  const data = body.data || {};

  const event = insert("events", {
    id: body.id || Date.now().toString(),
    type,
    userId: data.user_id,
    subscriptionId: data.subscription_id,
    email: data.email,
    billing_url: data.billing_url,
    occurredAt: new Date(),
  });

  if (type.includes("failed")) {
    await notifyPaymentFailed({
      user: { id: data.user_id },
      subscriptionId: data.subscription_id,
      billingUrl: data.billing_url,
    });
  }
  if (type.includes("succeeded")) {
    await markRecoveredOnSuccess(event);
  }

  return NextResponse.json({ ok: true });
}
