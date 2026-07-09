import { Pool } from 'pg';

// Singleton pool — reuse across serverless invocations
let pool: Pool;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
      max: 5,
    });
  }
  return pool;
}

/**
 * Query helper — auto-replaces ? placeholders with $1, $2, etc for pg
 */
export async function query(sql: string, params: any[] = []) {
  const pg = getPool();
  let idx = 0;
  const pgSql = sql.replace(/\?/g, () => `$${++idx}`);
  const result = await pg.query(pgSql, params);
  return result.rows;
}

/**
 * Query single row
 */
export async function queryOne(sql: string, params: any[] = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

/**
 * Execute (INSERT/UPDATE/DELETE) — returns rowCount
 */
export async function execute(sql: string, params: any[] = []) {
  const pg = getPool();
  let idx = 0;
  const pgSql = sql.replace(/\?/g, () => `$${++idx}`);
  const result = await pg.query(pgSql, params);
  return result.rowCount ?? 0;
}

/**
 * Transaction helper
 */
export async function transaction<T>(fn: (client: any) => Promise<T>): Promise<T> {
  const pg = getPool();
  const client = await pg.connect();
  try {
    await client.query('BEGIN');
    const result = await fn({
      query: async (sql: string, params: any[] = []) => {
        let idx = 0;
        const pgSql = sql.replace(/\?/g, () => `$${++idx}`);
        const res = await client.query(pgSql, params);
        return res.rows;
      },
      execute: async (sql: string, params: any[] = []) => {
        let idx = 0;
        const pgSql = sql.replace(/\?/g, () => `$${++idx}`);
        const res = await client.query(pgSql, params);
        return res.rowCount ?? 0;
      },
    });
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
