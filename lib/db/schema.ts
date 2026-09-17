import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const owners = pgTable("owners", {
  id: serial("id").primaryKey(),
  telegramChatId: text("telegram_chat_id").unique(),
  telegramName: text("telegram_name"),
  timezone: text("timezone").notNull().default("Europe/Moscow"),
  expiringSoonWindowDays: integer("expiring_soon_window_days").notNull().default(3),
  expirationReminderDays: integer("expiration_reminder_days").notNull().default(2),
  dailyDigestEnabled: boolean("daily_digest_enabled").notNull().default(true),
  dailyDigestHour: integer("daily_digest_hour").notNull().default(10),
  lowStockAlertsEnabled: boolean("low_stock_alerts_enabled").notNull().default(true),
  theme: text("theme").notNull().default("system"),
  lastDigestDate: text("last_digest_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey(),
    ownerId: integer("owner_id")
      .notNull()
      .references(() => owners.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category").notNull().default("other"),
    unit: text("unit").notNull().default("pcs"),
    quantity: doublePrecision("quantity").notNull().default(0),
    lowStockThreshold: doublePrecision("low_stock_threshold").notNull().default(0),
    expirationDate: date("expiration_date"),
    notes: text("notes").notNull().default(""),
    isArchived: boolean("is_archived").notNull().default(false),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("products_owner_archived_idx").on(table.ownerId, table.isArchived)],
);

export const historyEntries = pgTable(
  "history_entries",
  {
    id: text("id").primaryKey(),
    ownerId: integer("owner_id")
      .notNull()
      .references(() => owners.id, { onDelete: "cascade" }),
    productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
    productName: text("product_name").notNull(),
    category: text("category").notNull().default("other"),
    unit: text("unit").notNull().default("pcs"),
    changeType: text("change_type").notNull(),
    quantityDelta: doublePrecision("quantity_delta").notNull().default(0),
    resultingQuantity: doublePrecision("resulting_quantity").notNull().default(0),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("history_owner_created_idx").on(table.ownerId, table.createdAt)],
);

export const loginTokens = pgTable("login_tokens", {
  token: text("token").primaryKey(),
  ownerId: integer("owner_id")
    .notNull()
    .references(() => owners.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export type Owner = typeof owners.$inferSelect;
export type Product = typeof products.$inferSelect;
export type HistoryEntry = typeof historyEntries.$inferSelect;
