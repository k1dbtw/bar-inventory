import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { createSessionValue, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { loginTokens } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

/** One-tap sign-in from the link the Telegram bot sends. */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/login", request.url));

  const db = await getDb();
  const rows = await db
    .select()
    .from(loginTokens)
    .where(and(eq(loginTokens.token, token), gt(loginTokens.expiresAt, new Date())))
    .limit(1);

  const row = rows[0] as { ownerId: number } | undefined;
  if (!row) return NextResponse.redirect(new URL("/login?error=expired", request.url));

  await db.delete(loginTokens).where(eq(loginTokens.token, token));

  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(SESSION_COOKIE, await createSessionValue(row.ownerId), sessionCookieOptions());
  return response;
}
