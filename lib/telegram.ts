const API_BASE = "https://api.telegram.org";

export function botToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN || null;
}

export function appUrl(): string {
  const explicit = process.env.APP_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export type InlineButton = { text: string; callback_data?: string; url?: string };

async function callTelegram(method: string, payload: Record<string, unknown>): Promise<unknown> {
  const token = botToken();
  if (!token) return null;
  try {
    const response = await fetch(`${API_BASE}/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      console.error(`Telegram ${method} failed`, response.status, await response.text());
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`Telegram ${method} error`, error);
    return null;
  }
}

export async function sendMessage(
  chatId: string,
  text: string,
  buttons?: InlineButton[][],
): Promise<void> {
  await callTelegram("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(buttons ? { reply_markup: { inline_keyboard: buttons } } : {}),
  });
}

export async function editMessageText(
  chatId: string,
  messageId: number,
  text: string,
  buttons?: InlineButton[][],
): Promise<void> {
  await callTelegram("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(buttons ? { reply_markup: { inline_keyboard: buttons } } : {}),
  });
}

export async function answerCallbackQuery(id: string, text?: string): Promise<void> {
  await callTelegram("answerCallbackQuery", {
    callback_query_id: id,
    ...(text ? { text } : {}),
  });
}
