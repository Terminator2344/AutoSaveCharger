import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/db";

import { notifyPaymentFailed, markRecoveredOnSuccess } from "@/src/services/notifications";

export async function POST(req: Request) {
  const body = await req.json();
  const type = body.type;
  const data = body.data || {};

  const { data: event, error } = await supabaseAdmin
  .from("event")
  .insert([
    {
      id: body.id || Date.now().toString(),
      type,
      userId: data.user_id,
      subscriptionId: data.subscription_id,
      email: data.email,
      billingUrl: data.billing_url,
      occurredAt: new Date(),
    },
  ])
  .select("*")
  .single();

if (error) {
  console.error("❌ Failed to insert event:", error.message);
  throw error;
}

console.log("✅ Event inserted successfully:", event);

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
