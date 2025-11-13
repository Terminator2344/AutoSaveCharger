import { NextRequest, NextResponse } from 'next/server';
import { recordClick, deriveBillingRedirect } from '@/services/click';

export async function GET(req: NextRequest, context: { params: Promise<{ userId: string }> }) {
  const { userId } = await context.params;
  const url = new URL(req.url);
  const c = url.searchParams.get('c');
  const m = url.searchParams.get('m');

  await recordClick({ userId, channel: c ?? undefined, messageId: m ?? undefined });
  const redirectUrl = await deriveBillingRedirect(userId);

  if (!redirectUrl || redirectUrl === '#') {
    return new NextResponse('No billing URL available yet.');
  }
  return NextResponse.redirect(redirectUrl);
}
