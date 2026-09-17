import { NextRequest, NextResponse } from "next/server";
import { accessCodeMatches, requireOwner, UnauthorizedError } from "@/lib/auth";
import { appUrl, botToken } from "@/lib/telegram";

export const dynamic = "force-dynamic";

/**
 * Registers the Telegram webhook against this deployment, so the bot can be
 * wired up from a browser instead of a terminal.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code || !accessCodeMatches(code)) {
    try {
      await requireOwner();
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
      throw error;
    }
  }

  const token = botToken();
  if (!token) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN is not set" }, { status: 400 });
  }

  const webhookUrl = `${appUrl()}/api/telegram/webhook`;
  const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: ["message", "callback_query"],
      ...(process.env.TELEGRAM_WEBHOOK_SECRET
        ? { secret_token: process.env.TELEGRAM_WEBHOOK_SECRET }
        : {}),
    }),
  });

  return NextResponse.json({ webhookUrl, telegram: await response.json() });
}
