import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { recordClick, getLastFailedEvent, deriveBillingRedirect } from "../../../../src/services/click";

export async function GET(req: NextRequest, context: { params: Promise<{ userId: string }> }) {
  const { userId } = await context.params;
  const url = new URL(req.url);
  const c = url.searchParams.get("c");
  const m = url.searchParams.get("m");

  await recordClick({ userId, channel: c, messageId: m });
  const redirectUrl = await deriveBillingRedirect(userId);

  if (!redirectUrl || redirectUrl === "#") return new NextResponse("No billing URL available yet.");
  return NextResponse.redirect(redirectUrl);
}


