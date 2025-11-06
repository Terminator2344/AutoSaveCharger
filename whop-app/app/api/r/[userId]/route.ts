import { NextResponse } from "next/server";
import { recordClick, getLastFailedEvent, deriveBillingRedirect } from "@/services/click";

export async function GET(req: Request, { params }: any) {
  const { userId } = params;
  const url = new URL(req.url);
  const c = url.searchParams.get("c");
  const m = url.searchParams.get("m");

  await recordClick({ userId, channel: c, messageId: m });
  const redirectUrl = await deriveBillingRedirect(userId);

  if (!redirectUrl || redirectUrl === "#") return new NextResponse("No billing URL available yet.");
  return NextResponse.redirect(redirectUrl);
}


