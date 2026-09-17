import { and, desc, eq, gte } from "drizzle-orm";
import { getDb } from "./db";
import { historyEntries, products, type Owner, type Product } from "./db/schema";
import {
  daysUntil,
  formatQuantity,
  statusOf,
  todayInTimezone,
  type Category,
  type ChangeType,
  type ProductStatus,
  type Unit,
  type WriteOffReason,
} from "./domain";
import { appUrl, escapeHtml, sendMessage } from "./telegram";

export type ProductDTO = {
  id: string;
  name: string;
  category: Category;
  unit: Unit;
  quantity: number;
  lowStockThreshold: number;
  expirationDate: string | null;
  notes: string;
  isArchived: boolean;
  archivedAt: string | null;
  updatedAt: string;
  daysLeft: number | null;
  status: ProductStatus;
};

export type HistoryDTO = {
  id: string;
  productId: string | null;
  productName: string;
  category: Category;
  unit: Unit;
  changeType: ChangeType;
  quantityDelta: number;
  resultingQuantity: number;
  reason: WriteOffReason | null;
  createdAt: string;
};

export type ProductInput = {
  name: string;
  category: Category;
  unit: Unit;
  quantity: number;
  lowStockThreshold: number;
  expirationDate: string | null;
  notes: string;
};

function toProductDTO(row: Product, timezone: string): ProductDTO {
  return {
    id: row.id,
    name: row.name,
    category: row.category as Category,
    unit: row.unit as Unit,
    quantity: row.quantity,
    lowStockThreshold: row.lowStockThreshold,
    expirationDate: row.expirationDate,
    notes: row.notes,
    isArchived: row.isArchived,
    archivedAt: row.archivedAt ? row.archivedAt.toISOString() : null,
    updatedAt: row.updatedAt.toISOString(),
    daysLeft: daysUntil(row.expirationDate, timezone),
    status: statusOf(row.quantity, row.lowStockThreshold),
  };
}

function toHistoryDTO(row: typeof historyEntries.$inferSelect): HistoryDTO {
  return {
    id: row.id,
    productId: row.productId,
    productName: row.productName,
    category: row.category as Category,
    unit: row.unit as Unit,
    changeType: row.changeType as ChangeType,
    quantityDelta: row.quantityDelta,
    resultingQuantity: row.resultingQuantity,
    reason: (row.reason as WriteOffReason | null) ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

async function logHistory(
  owner: Owner,
  product: Product,
  changeType: ChangeType,
  quantityDelta: number,
  resultingQuantity: number,
  reason?: WriteOffReason | null,
): Promise<void> {
  const db = await getDb();
  await db.insert(historyEntries).values({
    id: crypto.randomUUID(),
    ownerId: owner.id,
    productId: product.id,
    productName: product.name,
    category: product.category,
    unit: product.unit,
    changeType,
    quantityDelta,
    resultingQuantity,
    reason: reason ?? null,
  });
}

/** Fires a Telegram alert the moment a product crosses into low stock. */
async function notifyIfCrossedLowStock(
  owner: Owner,
  product: Product,
  previousQuantity: number,
  nextQuantity: number,
): Promise<void> {
  if (!owner.lowStockAlertsEnabled || !owner.telegramChatId) return;
  const wasHealthy = previousQuantity > product.lowStockThreshold;
  const isLowNow = nextQuantity <= product.lowStockThreshold;
  if (!wasHealthy || !isLowNow) return;

  const unit = product.unit as Unit;
  const title = nextQuantity <= 0 ? "Закончилось" : "Заканчивается";
  await sendMessage(
    owner.telegramChatId,
    `<b>${title}</b>\n${escapeHtml(product.name)} — осталось ${escapeHtml(
      formatQuantity(nextQuantity, unit),
    )}`,
    [
      [
        { text: "+1", callback_data: `adj:${product.id}:1` },
        { text: "+5", callback_data: `adj:${product.id}:5` },
        { text: "Открыть", url: appUrl() },
      ],
    ],
  );
}

export async function listProducts(
  owner: Owner,
  options: { archived?: boolean } = {},
): Promise<ProductDTO[]> {
  const db = await getDb();
  const rows = (await db
    .select()
    .from(products)
    .where(
      and(eq(products.ownerId, owner.id), eq(products.isArchived, options.archived ?? false)),
    )) as Product[];

  return rows
    .map((row) => toProductDTO(row, owner.timezone))
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));
}

export async function getProductRow(owner: Owner, id: string): Promise<Product | null> {
  const db = await getDb();
  const rows = (await db
    .select()
    .from(products)
    .where(and(eq(products.ownerId, owner.id), eq(products.id, id)))
    .limit(1)) as Product[];
  return rows[0] ?? null;
}

export async function createProduct(owner: Owner, input: ProductInput): Promise<ProductDTO> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const inserted = (await db
    .insert(products)
    .values({
      id,
      ownerId: owner.id,
      name: input.name,
      category: input.category,
      unit: input.unit,
      quantity: input.quantity,
      lowStockThreshold: input.lowStockThreshold,
      expirationDate: input.expirationDate,
      notes: input.notes,
    })
    .returning()) as Product[];

  const product = inserted[0];
  await logHistory(owner, product, "created", input.quantity, input.quantity);
  return toProductDTO(product, owner.timezone);
}

export async function updateProduct(
  owner: Owner,
  id: string,
  input: ProductInput,
): Promise<ProductDTO | null> {
  const existing = await getProductRow(owner, id);
  if (!existing) return null;

  const db = await getDb();
  const updated = (await db
    .update(products)
    .set({
      name: input.name,
      category: input.category,
      unit: input.unit,
      quantity: input.quantity,
      lowStockThreshold: input.lowStockThreshold,
      expirationDate: input.expirationDate,
      notes: input.notes,
      updatedAt: new Date(),
    })
    .where(and(eq(products.ownerId, owner.id), eq(products.id, id)))
    .returning()) as Product[];

  const product = updated[0];
  const delta = input.quantity - existing.quantity;
  if (delta !== 0) {
    await logHistory(owner, product, "adjustment", delta, input.quantity);
    await notifyIfCrossedLowStock(owner, product, existing.quantity, input.quantity);
  } else {
    await logHistory(owner, product, "edited", 0, product.quantity);
  }
  return toProductDTO(product, owner.timezone);
}

export async function adjustQuantity(
  owner: Owner,
  id: string,
  delta: number,
): Promise<ProductDTO | null> {
  const existing = await getProductRow(owner, id);
  if (!existing) return null;

  const next = Math.max(0, roundQuantity(existing.quantity + delta));
  const applied = next - existing.quantity;
  if (applied === 0) return toProductDTO(existing, owner.timezone);

  const db = await getDb();
  const updated = (await db
    .update(products)
    .set({ quantity: next, updatedAt: new Date() })
    .where(and(eq(products.ownerId, owner.id), eq(products.id, id)))
    .returning()) as Product[];

  const product = updated[0];
  await logHistory(owner, product, applied > 0 ? "restock" : "adjustment", applied, next);
  await notifyIfCrossedLowStock(owner, product, existing.quantity, next);
  return toProductDTO(product, owner.timezone);
}

export async function writeOffProduct(
  owner: Owner,
  id: string,
  amount: number,
  reason: WriteOffReason,
): Promise<ProductDTO | null> {
  const existing = await getProductRow(owner, id);
  if (!existing) return null;

  const applied = Math.min(Math.abs(amount), existing.quantity);
  if (applied === 0) return toProductDTO(existing, owner.timezone);
  const next = roundQuantity(existing.quantity - applied);

  const db = await getDb();
  const updated = (await db
    .update(products)
    .set({ quantity: next, updatedAt: new Date() })
    .where(and(eq(products.ownerId, owner.id), eq(products.id, id)))
    .returning()) as Product[];

  const product = updated[0];
  await logHistory(owner, product, "write_off", -applied, next, reason);
  await notifyIfCrossedLowStock(owner, product, existing.quantity, next);
  return toProductDTO(product, owner.timezone);
}

export async function archiveProduct(owner: Owner, id: string): Promise<boolean> {
  const existing = await getProductRow(owner, id);
  if (!existing) return false;
  const db = await getDb();
  await db
    .update(products)
    .set({ isArchived: true, archivedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(products.ownerId, owner.id), eq(products.id, id)));
  await logHistory(owner, existing, "archived", 0, existing.quantity);
  return true;
}

export async function restoreProduct(owner: Owner, id: string): Promise<boolean> {
  const existing = await getProductRow(owner, id);
  if (!existing) return false;
  const db = await getDb();
  await db
    .update(products)
    .set({ isArchived: false, archivedAt: null, updatedAt: new Date() })
    .where(and(eq(products.ownerId, owner.id), eq(products.id, id)));
  await logHistory(owner, existing, "restored", 0, existing.quantity);
  return true;
}

/** Permanent removal. History rows survive with the product name snapshot. */
export async function deleteProduct(owner: Owner, id: string): Promise<boolean> {
  const existing = await getProductRow(owner, id);
  if (!existing) return false;
  const db = await getDb();
  await db
    .delete(products)
    .where(and(eq(products.ownerId, owner.id), eq(products.id, id)));
  return true;
}

export async function listHistory(owner: Owner, limit = 300): Promise<HistoryDTO[]> {
  const db = await getDb();
  const rows = (await db
    .select()
    .from(historyEntries)
    .where(eq(historyEntries.ownerId, owner.id))
    .orderBy(desc(historyEntries.createdAt))
    .limit(limit)) as (typeof historyEntries.$inferSelect)[];
  return rows.map(toHistoryDTO);
}

export type Stats = {
  totalProducts: number;
  lowStockCount: number;
  expiringSoonCount: number;
  writeOffsThisWeek: number;
  chart: { date: string; count: number }[];
  topWasted: { name: string; count: number } | null;
};

export async function getStats(owner: Owner): Promise<Stats> {
  const db = await getDb();
  const active = await listProducts(owner);

  const weekAgo = new Date(Date.now() - 6 * 86_400_000);
  weekAgo.setHours(0, 0, 0, 0);
  const recent = (await db
    .select()
    .from(historyEntries)
    .where(
      and(eq(historyEntries.ownerId, owner.id), gte(historyEntries.createdAt, weekAgo)),
    )) as (typeof historyEntries.$inferSelect)[];
  const writeOffs = recent.filter((row) => row.changeType === "write_off");

  const chart: { date: string; count: number }[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(Date.now() - offset * 86_400_000);
    const key = todayInTimezone(owner.timezone, day);
    const count = writeOffs.filter(
      (row) => todayInTimezone(owner.timezone, row.createdAt) === key,
    ).length;
    chart.push({ date: key, count });
  }

  const counts = new Map<string, number>();
  for (const row of writeOffs) {
    counts.set(row.productName, (counts.get(row.productName) ?? 0) + 1);
  }
  let topWasted: { name: string; count: number } | null = null;
  for (const [name, count] of counts) {
    if (!topWasted || count > topWasted.count) topWasted = { name, count };
  }

  return {
    totalProducts: active.length,
    lowStockCount: active.filter((p) => p.status !== "ok").length,
    expiringSoonCount: active.filter(
      (p) => p.daysLeft !== null && p.daysLeft <= owner.expiringSoonWindowDays,
    ).length,
    writeOffsThisWeek: writeOffs.length,
    chart,
    topWasted,
  };
}

/** Products that need attention right now, used by the bot and the digest. */
export async function collectAttention(owner: Owner): Promise<{
  expiring: ProductDTO[];
  low: ProductDTO[];
}> {
  const active = await listProducts(owner);
  const expiring = active
    .filter((p) => p.daysLeft !== null && p.daysLeft <= owner.expiringSoonWindowDays)
    .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0));
  const low = active
    .filter((p) => p.status !== "ok")
    .sort((a, b) => a.quantity - b.quantity);
  return { expiring, low };
}

function roundQuantity(value: number): number {
  return Math.round(value * 1000) / 1000;
}
