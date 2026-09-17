import { NextRequest, NextResponse } from "next/server";
import {
  accessCodeMatches,
  createSessionValue,
  getOrCreateOwner,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_code" }, { status: 400 });
  }

  if (!accessCodeMatches(parsed.data.code)) {
    // Slow down brute-force attempts a little.
    await new Promise((resolve) => setTimeout(resolve, 400));
    return NextResponse.json({ error: "wrong_code" }, { status: 401 });
  }

  const owner = await getOrCreateOwner();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, await createSessionValue(owner.id), sessionCookieOptions());
  return response;
}
