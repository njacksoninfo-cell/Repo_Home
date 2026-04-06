import { Pool } from "pg";
import { config } from "../config";

let _pool: Pool | null = null;

export function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({ connectionString: config.db.url });
    _pool.on("error", (err) => {
      console.error("[PG] unexpected client error:", err.message);
    });
  }
  return _pool;
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await getPool().query(sql, params);
  return result.rows as T[];
}
