import type { Owner } from "./db/schema";

export type SettingsDTO = {
  timezone: string;
  expiringSoonWindowDays: number;
  expirationReminderDays: number;
  dailyDigestEnabled: boolean;
  dailyDigestHour: number;
  lowStockAlertsEnabled: boolean;
  theme: "system" | "light" | "dark";
  telegramLinked: boolean;
  telegramName: string | null;
  botUsername: string | null;
};

export function ownerSettings(owner: Owner): SettingsDTO {
  return {
    timezone: owner.timezone,
    expiringSoonWindowDays: owner.expiringSoonWindowDays,
    expirationReminderDays: owner.expirationReminderDays,
    dailyDigestEnabled: owner.dailyDigestEnabled,
    dailyDigestHour: owner.dailyDigestHour,
    lowStockAlertsEnabled: owner.lowStockAlertsEnabled,
    theme: owner.theme as "system" | "light" | "dark",
    telegramLinked: Boolean(owner.telegramChatId),
    telegramName: owner.telegramName,
    botUsername: process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, "") ?? null,
  };
}
