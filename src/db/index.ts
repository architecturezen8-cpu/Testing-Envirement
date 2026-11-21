import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { Pool } from "pg";
import ws from "ws";
import * as schema from "./schema";

/**
 * Dual-mode database connection:
 * - Vercel / Neon (production): neon-serverless Pool (WebSocket — supports transactions!)
 * - Local development: pg Pool (TCP — works with localhost)
 *
 * IMPORTANT: We use neon-serverless Pool (not neon-http) because the
 * checkout flow needs db.transaction() which the HTTP driver doesn't support.
 */

const connectionString =
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  "";

if (!connectionString) {
  throw new Error(
    "Database connection required: set POSTGRES_URL (Vercel) or DATABASE_URL (local)."
  );
}

const useNeon =
  !!process.env.POSTGRES_URL ||
  connectionString.includes("neon.tech") ||
  connectionString.includes("vercel");

let _db: NodePgDatabase<typeof schema>;

if (useNeon) {
  // ---- Serverless mode (Vercel / Neon) ----
  // WebSocket-based Pool — supports transactions, works in serverless functions.
  // Node.js 20 (Vercel default) lacks native WebSocket, so we inject `ws`.
  neonConfig.webSocketConstructor = ws;

  const pool = new NeonPool({ connectionString });
  _db = drizzleNeon(pool, { schema }) as unknown as NodePgDatabase<typeof schema>;
} else {
  // ---- Local development mode (pg Pool over TCP) ----
  const globalForDb = globalThis as typeof globalThis & {
    __novaDbPool?: Pool;
  };

  const pool = globalForDb.__novaDbPool ?? new Pool({ connectionString });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__novaDbPool = pool;
  }

  _db = drizzleNodePg(pool, { schema });
}

export const db = _db;
