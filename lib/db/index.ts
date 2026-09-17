import { sql } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import { BOOTSTRAP_STATEMENTS } from "./bootstrap";

export type DB = PgDatabase<any, any, any>;

let dbPromise: Promise<DB> | null = null;

async function createDb(): Promise<DB> {
  const url = process.env.DATABASE_URL;
  let db: DB;

  if (url && !url.startsWith("pglite")) {
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    db = drizzle(neon(url)) as unknown as DB;
  } else {
    // Local development: an embedded Postgres, no server to install.
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const dir = url?.replace(/^pglite:\/\//, "") || ".pglite";
    const client = new PGlite(dir);
    await client.waitReady;
    db = drizzle(client) as unknown as DB;
  }

  for (const statement of BOOTSTRAP_STATEMENTS) {
    await db.execute(sql.raw(statement));
  }

  return db;
}

export function getDb(): Promise<DB> {
  if (!dbPromise) {
    dbPromise = createDb().catch((error) => {
      dbPromise = null;
      throw error;
    });
  }
  return dbPromise;
}
