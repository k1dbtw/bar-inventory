export const CATEGORIES = [
  "coffee",
  "dairy",
  "syrup",
  "juice",
  "fruit",
  "alcohol",
  "soft",
  "bakery",
  "other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  coffee: "Кофе",
  dairy: "Молочка",
  syrup: "Сиропы",
  juice: "Соки",
  fruit: "Фрукты",
  alcohol: "Алкоголь",
  soft: "Газировка",
  bakery: "Выпечка",
  other: "Другое",
};

/** Hue used for the category accent, resolved to a color in CSS. */
export const CATEGORY_HUE: Record<Category, number> = {
  coffee: 25,
  dairy: 214,
  syrup: 330,
  juice: 38,
  fruit: 4,
  alcohol: 275,
  soft: 175,
  bakery: 45,
  other: 240,
};

export const UNITS = ["pcs", "g", "kg", "ml", "l", "bottle", "portion"] as const;

export type Unit = (typeof UNITS)[number];

export const UNIT_LABELS: Record<Unit, string> = {
  pcs: "шт",
  g: "г",
  kg: "кг",
  ml: "мл",
  l: "л",
  bottle: "бут",
  portion: "порц",
};

export const UNIT_FULL_LABELS: Record<Unit, string> = {
  pcs: "Штуки",
  g: "Граммы",
  kg: "Килограммы",
  ml: "Миллилитры",
  l: "Литры",
  bottle: "Бутылки",
  portion: "Порции",
};

type UnitSteps = { quick: number; large: number; whole: boolean };

export const UNIT_STEPS: Record<Unit, UnitSteps> = {
  pcs: { quick: 1, large: 5, whole: true },
  g: { quick: 50, large: 250, whole: false },
  kg: { quick: 0.5, large: 1, whole: false },
  ml: { quick: 100, large: 500, whole: false },
  l: { quick: 0.5, large: 1, whole: false },
  bottle: { quick: 1, large: 5, whole: true },
  portion: { quick: 1, large: 5, whole: true },
};

export const WRITE_OFF_REASONS = [
  "expired",
  "spoiled",
  "broken",
  "mistake",
  "other",
] as const;

export type WriteOffReason = (typeof WRITE_OFF_REASONS)[number];

export const REASON_LABELS: Record<WriteOffReason, string> = {
  expired: "Просрочено",
  spoiled: "Испортилось",
  broken: "Разбили",
  mistake: "Ошибка",
  other: "Другое",
};

export const CHANGE_TYPES = [
  "created",
  "restock",
  "adjustment",
  "write_off",
  "edited",
  "archived",
  "restored",
] as const;

export type ChangeType = (typeof CHANGE_TYPES)[number];

export const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  created: "Добавлено",
  restock: "Пополнено",
  adjustment: "Изменено",
  write_off: "Списано",
  edited: "Отредактировано",
  archived: "В архив",
  restored: "Восстановлено",
};

export type ProductStatus = "ok" | "low" | "out";

export function statusOf(quantity: number, threshold: number): ProductStatus {
  if (quantity <= 0) return "out";
  if (quantity <= threshold) return "low";
  return "ok";
}

export function formatQuantity(value: number, unit: Unit): string {
  const whole = UNIT_STEPS[unit].whole;
  const rounded = Math.round(value * 100) / 100;
  const text = whole
    ? String(Math.round(rounded))
    : Number.isInteger(rounded)
      ? String(rounded)
      : String(rounded).replace(".", ",");
  return `${text} ${UNIT_LABELS[unit]}`;
}

export function formatAmount(value: number, unit: Unit): string {
  const whole = UNIT_STEPS[unit].whole;
  const rounded = Math.round(Math.abs(value) * 100) / 100;
  return whole
    ? String(Math.round(rounded))
    : Number.isInteger(rounded)
      ? String(rounded)
      : String(rounded).replace(".", ",");
}

/** Today in the given IANA timezone, as YYYY-MM-DD. */
export function todayInTimezone(timezone: string, now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return parts;
}

/** Whole days from today (in `timezone`) until the given YYYY-MM-DD date. */
export function daysUntil(date: string | null, timezone: string, now?: Date): number | null {
  if (!date) return null;
  const today = todayInTimezone(timezone, now);
  const a = Date.parse(`${today}T00:00:00Z`);
  const b = Date.parse(`${date}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / 86_400_000);
}

export function expiryLabel(days: number): string {
  if (days < 0) {
    const n = Math.abs(days);
    return n === 1 ? "Просрочено вчера" : `Просрочено ${n} ${pluralDays(n)} назад`;
  }
  if (days === 0) return "Истекает сегодня";
  if (days === 1) return "Истекает завтра";
  return `Осталось ${days} ${pluralDays(days)}`;
}

export function shortExpiryLabel(days: number): string {
  if (days < 0) return "Просрочено";
  if (days === 0) return "Сегодня";
  if (days === 1) return "Завтра";
  return `${days} ${pluralDays(days)}`;
}

export function pluralDays(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "дня";
  return "дней";
}
