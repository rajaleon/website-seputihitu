/**
 * DB helper — patch SQL agar kompatibel antara MySQL, PostgreSQL, dan SQLite
 */

const DB_MODE = process.env.DB_MODE || 'sqlite';

/**
 * q(sql) → transform MySQL-specific syntax untuk compatibility
 */
function q(sql) {
  if (DB_MODE === 'mysql') return sql;

  let s = sql
    // NOW() → compatible across all
    .replace(/\bNOW\(\)/gi, DB_MODE === 'sqlite' ? "datetime('now')" : 'NOW()')
    // DATE_ADD(...) → Postgres: NOW() + interval, SQLite: datetime('now',...)
    .replace(/DATE_ADD\(NOW\(\),\s*INTERVAL\s+(\d+)\s+HOUR\)/gi,
      DB_MODE === 'sqlite' ? "datetime('now','+$1 hours')" : "NOW() + interval '$1 hours'")
    .replace(/DATE_ADD\(NOW\(\),\s*INTERVAL\s+(\d+)\s+DAY\)/gi,
      DB_MODE === 'sqlite' ? "datetime('now','+$1 days')" : "NOW() + interval '$1 days'")
    // CURDATE()
    .replace(/\bCURDATE\(\)/gi, DB_MODE === 'sqlite' ? "date('now')" : 'CURRENT_DATE')
    // INSERT IGNORE → INSERT OR IGNORE (SQLite) or ON CONFLICT DO NOTHING (PG)
    .replace(/\bINSERT IGNORE\b/gi, DB_MODE === 'sqlite' ? 'INSERT OR IGNORE' : 'INSERT')
    // ON DUPLICATE KEY UPDATE → strip for SQLite
    ;

  if (DB_MODE === 'sqlite') {
    s = s.replace(/ON DUPLICATE KEY UPDATE[\s\S]*?(?=;|$)/gi, '');
  }

  return s;
}

function now() {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

module.exports = { q, now, DB_MODE };
