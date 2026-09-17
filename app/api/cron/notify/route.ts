import { NextRequest, NextResponse } from "next/server";
import { runDailyDigest } from "@/lib/bot";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const header = request.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  return request.nextUrl.searchParams.get("key") === secret;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const result = await runDailyDigest();
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  return GET(request);
}
