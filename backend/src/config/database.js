const path = require('path');

// ── Mode selector ────────────────────────────────────────────
// DB_MODE: 'sqlite' (default/demo), 'postgres' (Supabase), 'mysql'
const DB_MODE = process.env.DB_MODE || 'sqlite';

let pool;

if (DB_MODE === 'postgres') {
  // ── PostgreSQL / Supabase ─────────────────────────────────
  const { Pool } = require('pg');
  const pgPool   = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
    max: 10,
  });

  // Wrap pg Pool ke interface yg kompatibel dengan kode kita
  // pg returns { rows, rowCount }, kita perlu [ rows, fields ] seperti mysql2
  pool = {
    query: async (sql, params = []) => {
      // Replace MySQL ? placeholders ke PostgreSQL $1, $2, ...
      let idx = 0;
      const pgSql = sql.replace(/\?/g, () => `$${++idx}`);
      const result = await pgPool.query(pgSql, params);
      return [result.rows, result.fields];
    },
    getConnection: async () => {
      const client = await pgPool.connect();
      return {
        beginTransaction: async () => client.query('BEGIN'),
        commit:           async () => client.query('COMMIT'),
        rollback:         async () => client.query('ROLLBACK'),
        query: async (sql, params = []) => {
          let idx = 0;
          const pgSql = sql.replace(/\?/g, () => `$${++idx}`);
          const result = await client.query(pgSql, params);
          return [result.rows, result.fields];
        },
        release: () => client.release(),
      };
    },
  };

  console.log(`🐘 PostgreSQL mode (Supabase)`);

} else if (DB_MODE === 'mysql') {
  // ── MySQL (production) ────────────────────────────────────
  const mysql = require('mysql2/promise');
  pool = mysql.createPool({
    host:               process.env.DB_HOST     || 'localhost',
    port:               parseInt(process.env.DB_PORT || '3306'),
    user:               process.env.DB_USER     || 'root',
    password:           process.env.DB_PASSWORD || '',
    database:           process.env.DB_NAME     || 'seputihitu',
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0,
    timezone:           '+07:00',
  });

  console.log(`🐬 MySQL mode`);

} else {
  // ── SQLite (demo / testing) ────────────────────────────────
  const Database = require('better-sqlite3');
  const dbPath   = path.join(__dirname, '../../demo.db');
  const sqlite   = new Database(dbPath);

  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  pool = {
    query: async (sql, params = []) => {
      try {
        const stmt = sqlite.prepare(sql);
        const isSelect = /^\s*(SELECT|PRAGMA|WITH)/i.test(sql);
        if (isSelect) {
          const rows = stmt.all(...(Array.isArray(params) ? params : [params]));
          return [rows, []];
        } else {
          const info = stmt.run(...(Array.isArray(params) ? params : [params]));
          return [{ affectedRows: info.changes, insertId: info.lastInsertRowid }, []];
        }
      } catch (err) {
        if (err.message?.includes('UNIQUE constraint failed')) {
          const e = new Error(err.message);
          e.code = 'ER_DUP_ENTRY';
          throw e;
        }
        throw err;
      }
    },
    getConnection: async () => {
      let inTransaction = false;
      return {
        beginTransaction: async () => { sqlite.prepare('BEGIN').run(); inTransaction = true; },
        commit:           async () => { if (inTransaction) sqlite.prepare('COMMIT').run(); inTransaction = false; },
        rollback:         async () => { if (inTransaction) sqlite.prepare('ROLLBACK').run(); inTransaction = false; },
        query:            async (sql, params = []) => pool.query(sql, params),
        release:          () => {},
      };
    },
    _sqlite: sqlite,
  };

  console.log(`🗄️  SQLite demo mode: ${dbPath}`);
}

async function testConnection() {
  try {
    if (DB_MODE === 'postgres') {
      await pool.query('SELECT 1');
    } else {
      await pool.query('SELECT 1');
    }
    console.log('✅ Database connected');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = { pool, testConnection, DB_MODE };
