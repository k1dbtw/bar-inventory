import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { owners, type Owner } from "./db/schema";

export const SESSION_COOKIE = "bi_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 365;

function secret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.ACCESS_CODE ||
    "bar-inventory-dev-secret"
  );
}

function base64url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return base64url(new Uint8Array(signature));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionValue(ownerId: number): Promise<string> {
  const payload = `${ownerId}.${Date.now()}`;
  return `${payload}.${await sign(payload)}`;
}

export async function readSessionValue(value: string | undefined): Promise<number | null> {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const payload = `${parts[0]}.${parts[1]}`;
  const expected = await sign(payload);
  if (!safeEqual(expected, parts[2])) return null;
  const ownerId = Number(parts[0]);
  return Number.isInteger(ownerId) ? ownerId : null;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

/** The single owner record, created on first use. */
export async function getOrCreateOwner(): Promise<Owner> {
  const db = await getDb();
  const existing = await db.select().from(owners).limit(1);
  if (existing.length > 0) return existing[0] as Owner;
  const inserted = await db.insert(owners).values({}).returning();
  return inserted[0] as Owner;
}

export async function getOwnerById(ownerId: number): Promise<Owner | null> {
  const db = await getDb();
  const rows = await db.select().from(owners).where(eq(owners.id, ownerId)).limit(1);
  return (rows[0] as Owner) ?? null;
}

/** Owner for the current request, or null when signed out. */
export async function getCurrentOwner(): Promise<Owner | null> {
  const store = await cookies();
  const ownerId = await readSessionValue(store.get(SESSION_COOKIE)?.value);
  if (ownerId === null) return null;
  return getOwnerById(ownerId);
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
  }
}

export async function requireOwner(): Promise<Owner> {
  const owner = await getCurrentOwner();
  if (!owner) throw new UnauthorizedError();
  return owner;
}

export function accessCodeMatches(code: string): boolean {
  const expected = process.env.ACCESS_CODE;
  if (!expected) {
    // No code configured: open access (intended for local development).
    return process.env.NODE_ENV !== "production";
  }
  return safeEqual(expected, code);
}

export function isAccessCodeConfigured(): boolean {
  return Boolean(process.env.ACCESS_CODE);
}
