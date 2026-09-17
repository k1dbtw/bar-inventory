import { NextRequest, NextResponse } from "next/server";
import { handleTelegramUpdate } from "@/lib/bot";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expectedSecret) {
    const provided = request.headers.get("x-telegram-bot-api-secret-token");
    if (provided !== expectedSecret) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  const update = await request.json().catch(() => null);
  if (!update) return NextResponse.json({ ok: true });

  try {
    await handleTelegramUpdate(update);
  } catch (error) {
    // Always answer 200 so Telegram does not retry a poisoned update forever.
    console.error("telegram update failed", error);
  }

  return NextResponse.json({ ok: true });
}
