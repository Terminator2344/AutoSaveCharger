import { NextResponse } from "next/server";

export async function GET() {
  // Placeholder for future server-side CSV export
  return new NextResponse("Not Implemented", { status: 501 });
}

export async function POST(req: Request) {
  // Accepts JSON payload to export; currently returns 501
  const _ = await req.json().catch(() => null);
  return new NextResponse("Not Implemented", { status: 501 });
}







