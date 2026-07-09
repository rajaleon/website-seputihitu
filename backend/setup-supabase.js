const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: 'postgresql://postgres.okddpnznvkbdbcvqdate:%40Indra130310@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    const schema = fs.readFileSync('./database/schema-postgres.sql', 'utf8');
    console.log('Running schema...');
    await pool.query(schema);
    console.log('✅ Schema created!');

    const seed = fs.readFileSync('./database/seed-postgres.sql', 'utf8');
    console.log('Running seed...');
    await pool.query(seed);
    console.log('✅ Seed data inserted!');

    // Verify
    const cats = await pool.query('SELECT COUNT(*) as cnt FROM categories');
    const prods = await pool.query('SELECT COUNT(*) as cnt FROM products');
    const users = await pool.query('SELECT COUNT(*) as cnt FROM users');
    const banners = await pool.query('SELECT COUNT(*) as cnt FROM banners');
    console.log('');
    console.log('📊 Verifikasi:');
    console.log('  Categories:', cats.rows[0].cnt);
    console.log('  Products:', prods.rows[0].cnt);
    console.log('  Users:', users.rows[0].cnt);
    console.log('  Banners:', banners.rows[0].cnt);
    console.log('');
    console.log('✅ Supabase setup selesai!');
  } catch (e) {
    console.error('❌ ERROR:', e.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

run();
