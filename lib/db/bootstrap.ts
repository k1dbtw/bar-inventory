/**
 * Idempotent schema creation. Runs once per server process instead of a
 * separate migration step, so deploying is just "push and go".
 */
export const BOOTSTRAP_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS owners (
    id serial PRIMARY KEY,
    telegram_chat_id text UNIQUE,
    telegram_name text,
    timezone text NOT NULL DEFAULT 'Europe/Moscow',
    expiring_soon_window_days integer NOT NULL DEFAULT 3,
    expiration_reminder_days integer NOT NULL DEFAULT 2,
    daily_digest_enabled boolean NOT NULL DEFAULT true,
    daily_digest_hour integer NOT NULL DEFAULT 10,
    low_stock_alerts_enabled boolean NOT NULL DEFAULT true,
    theme text NOT NULL DEFAULT 'system',
    last_digest_date text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    id text PRIMARY KEY,
    owner_id integer NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
    name text NOT NULL,
    category text NOT NULL DEFAULT 'other',
    unit text NOT NULL DEFAULT 'pcs',
    quantity double precision NOT NULL DEFAULT 0,
    low_stock_threshold double precision NOT NULL DEFAULT 0,
    expiration_date date,
    notes text NOT NULL DEFAULT '',
    is_archived boolean NOT NULL DEFAULT false,
    archived_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS products_owner_archived_idx ON products (owner_id, is_archived)`,
  `CREATE TABLE IF NOT EXISTS history_entries (
    id text PRIMARY KEY,
    owner_id integer NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
    product_id text REFERENCES products(id) ON DELETE SET NULL,
    product_name text NOT NULL,
    category text NOT NULL DEFAULT 'other',
    unit text NOT NULL DEFAULT 'pcs',
    change_type text NOT NULL,
    quantity_delta double precision NOT NULL DEFAULT 0,
    resulting_quantity double precision NOT NULL DEFAULT 0,
    reason text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS history_owner_created_idx ON history_entries (owner_id, created_at)`,
  `CREATE TABLE IF NOT EXISTS login_tokens (
    token text PRIMARY KEY,
    owner_id integer NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
    expires_at timestamptz NOT NULL
  )`,
];
