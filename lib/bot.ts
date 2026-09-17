import { eq } from "drizzle-orm";
import { accessCodeMatches, getOrCreateOwner } from "./auth";
import { getDb } from "./db";
import { loginTokens, owners, type Owner } from "./db/schema";
import {
  formatQuantity,
  REASON_LABELS,
  shortExpiryLabel,
  todayInTimezone,
  type WriteOffReason,
} from "./domain";
import {
  adjustQuantity,
  collectAttention,
  writeOffProduct,
  type ProductDTO,
} from "./inventory";
import { answerCallbackQuery, appUrl, escapeHtml, sendMessage } from "./telegram";

type TelegramUpdate = {
  message?: {
    chat: { id: number | string };
    from?: { first_name?: string; username?: string };
    text?: string;
  };
  callback_query?: {
    id: string;
    data?: string;
    message?: { chat: { id: number | string }; message_id: number };
  };
};

async function ownerByChat(chatId: string): Promise<Owner | null> {
  const db = await getDb();
  const rows = await db.select().from(owners).where(eq(owners.telegramChatId, chatId)).limit(1);
  return (rows[0] as Owner) ?? null;
}

async function createLoginLink(ownerId: number): Promise<string> {
  const db = await getDb();
  const token = crypto.randomUUID().replace(/-/g, "");
  await db.insert(loginTokens).values({
    token,
    ownerId,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });
  return `${appUrl()}/api/auth/link?token=${token}`;
}

function openButton() {
  return [[{ text: "Открыть приложение", url: appUrl() }]];
}

export function attentionText(
  expiring: ProductDTO[],
  low: ProductDTO[],
  title = "Сводка по бару",
): string {
  const lines: string[] = [`<b>${title}</b>`];

  if (expiring.length > 0) {
    lines.push("", "<b>Скоро испортится</b>");
    for (const product of expiring.slice(0, 15)) {
      const days = product.daysLeft ?? 0;
      lines.push(`• ${escapeHtml(product.name)} — ${escapeHtml(shortExpiryLabel(days).toLowerCase())}`);
    }
  }

  if (low.length > 0) {
    lines.push("", "<b>Заканчивается</b>");
    for (const product of low.slice(0, 15)) {
      lines.push(
        `• ${escapeHtml(product.name)} — ${escapeHtml(
          formatQuantity(product.quantity, product.unit),
        )}`,
      );
    }
  }

  if (expiring.length === 0 && low.length === 0) {
    lines.push("", "Всё в порядке: ничего не заканчивается и не портится.");
  }

  return lines.join("\n");
}

async function handleMessage(chatId: string, text: string, name: string | null): Promise<void> {
  const trimmed = text.trim();
  const linked = await ownerByChat(chatId);

  if (!linked) {
    if (trimmed === "/start") {
      await sendMessage(
        chatId,
        "<b>Bar Inventory</b>\nПришли код доступа, чтобы привязать этот чат и получать уведомления о сроках и остатках.",
      );
      return;
    }
    if (accessCodeMatches(trimmed)) {
      const owner = await getOrCreateOwner();
      const db = await getDb();
      await db
        .update(owners)
        .set({ telegramChatId: chatId, telegramName: name })
        .where(eq(owners.id, owner.id));
      const link = await createLoginLink(owner.id);
      await sendMessage(
        chatId,
        "Готово, чат привязан. Буду присылать уведомления о сроках годности и заканчивающихся продуктах.\n\nКоманды: /stock — что требует внимания, /app — ссылка для входа.",
        [[{ text: "Войти в приложение", url: link }]],
      );
      return;
    }
    await sendMessage(chatId, "Неверный код. Попробуй ещё раз.");
    return;
  }

  if (trimmed === "/app" || trimmed === "/login") {
    const link = await createLoginLink(linked.id);
    await sendMessage(chatId, "Ссылка для входа действует 15 минут:", [
      [{ text: "Войти в приложение", url: link }],
    ]);
    return;
  }

  if (trimmed === "/stock" || trimmed === "/check" || trimmed === "/start") {
    const { expiring, low } = await collectAttention(linked);
    await sendMessage(chatId, attentionText(expiring, low), openButton());
    return;
  }

  await sendMessage(
    chatId,
    "Команды: /stock — что требует внимания, /app — ссылка для входа в приложение.",
  );
}

async function handleCallback(
  callbackId: string,
  chatId: string,
  data: string,
): Promise<void> {
  const owner = await ownerByChat(chatId);
  if (!owner) {
    await answerCallbackQuery(callbackId, "Чат не привязан");
    return;
  }

  const parts = data.split(":");

  if (parts[0] === "adj" && parts.length === 3) {
    const [, productId, rawDelta] = parts;
    const delta = Number(rawDelta);
    const updated = await adjustQuantity(owner, productId, delta);
    if (!updated) {
      await answerCallbackQuery(callbackId, "Продукт не найден");
      return;
    }
    await answerCallbackQuery(
      callbackId,
      `${updated.name}: ${formatQuantity(updated.quantity, updated.unit)}`,
    );
    return;
  }

  if (parts[0] === "wo" && parts.length === 4) {
    const [, productId, rawAmount, reason] = parts;
    const updated = await writeOffProduct(
      owner,
      productId,
      Number(rawAmount),
      reason as WriteOffReason,
    );
    if (!updated) {
      await answerCallbackQuery(callbackId, "Продукт не найден");
      return;
    }
    await answerCallbackQuery(
      callbackId,
      `Списано (${REASON_LABELS[reason as WriteOffReason]}). Осталось ${formatQuantity(
        updated.quantity,
        updated.unit,
      )}`,
    );
    return;
  }

  await answerCallbackQuery(callbackId);
}

export async function handleTelegramUpdate(update: TelegramUpdate): Promise<void> {
  if (update.message?.text) {
    const chatId = String(update.message.chat.id);
    const name =
      update.message.from?.username ?? update.message.from?.first_name ?? null;
    await handleMessage(chatId, update.message.text, name);
    return;
  }

  if (update.callback_query?.data && update.callback_query.message) {
    await handleCallback(
      update.callback_query.id,
      String(update.callback_query.message.chat.id),
      update.callback_query.data,
    );
  }
}

/** Sends each owner their daily summary once their configured hour has passed. */
export async function runDailyDigest(): Promise<{ sent: number; skipped: number }> {
  const db = await getDb();
  const all = (await db.select().from(owners)) as Owner[];
  let sent = 0;
  let skipped = 0;

  for (const owner of all) {
    if (!owner.telegramChatId || !owner.dailyDigestEnabled) {
      skipped += 1;
      continue;
    }

    const today = todayInTimezone(owner.timezone);
    if (owner.lastDigestDate === today) {
      skipped += 1;
      continue;
    }

    const localHour = Number(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: owner.timezone,
        hour: "2-digit",
        hour12: false,
      }).format(new Date()),
    );
    if (Number.isFinite(localHour) && localHour < owner.dailyDigestHour) {
      skipped += 1;
      continue;
    }

    const { expiring, low } = await collectAttention(owner);
    const relevant = expiring.filter(
      (product) => (product.daysLeft ?? 99) <= owner.expirationReminderDays,
    );

    if (relevant.length > 0 || low.length > 0) {
      await sendMessage(
        owner.telegramChatId,
        attentionText(relevant, low, "Проверка бара"),
        openButton(),
      );
      sent += 1;
    } else {
      skipped += 1;
    }

    await db
      .update(owners)
      .set({ lastDigestDate: today })
      .where(eq(owners.id, owner.id));
  }

  return { sent, skipped };
}

