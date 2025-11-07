import { supabaseAdmin } from '@/src/lib/db';

export async function notifyPaymentFailed({ user, subscriptionId, billingUrl }: any) {
  // Store notification record in Supabase (if Notification table exists)
  try {
    const { data, error } = await supabaseAdmin
      .from('Notification')
      .insert({
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: user?.id,
        subscription_id: subscriptionId,
        channel: 'email',
        status: 'sent',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.warn('Failed to store notification record:', error);
    }
    return data;
  } catch (err) {
    console.warn('Notification storage error (ignored):', err);
    return null;
  }
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


