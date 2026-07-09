/**
 * Setup schema SQLite untuk demo mode.
 * Dijalankan sekali saat server start jika DB_MODE != mysql.
 */
function setupSqliteSchema(sqlite) {
  sqlite.exec(`
    PRAGMA foreign_keys = OFF;

    CREATE TABLE IF NOT EXISTS users (
      id          TEXT      NOT NULL PRIMARY KEY,
      name        TEXT      NOT NULL,
      email       TEXT      NOT NULL UNIQUE,
      password    TEXT      NOT NULL,
      phone       TEXT,
      avatar_url  TEXT,
      role        TEXT      NOT NULL DEFAULT 'customer',
      is_active   INTEGER   NOT NULL DEFAULT 1,
      created_at  TEXT      NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT      NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id          INTEGER   PRIMARY KEY AUTOINCREMENT,
      name        TEXT      NOT NULL,
      slug        TEXT      NOT NULL UNIQUE,
      parent_id   INTEGER,
      icon_url    TEXT,
      is_active   INTEGER   NOT NULL DEFAULT 1,
      created_at  TEXT      NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id              TEXT      NOT NULL PRIMARY KEY,
      sku             TEXT      NOT NULL UNIQUE,
      name            TEXT      NOT NULL,
      slug            TEXT      NOT NULL UNIQUE,
      description     TEXT,
      specification   TEXT,
      price           REAL      NOT NULL,
      discount_price  REAL,
      stock           INTEGER   NOT NULL DEFAULT 0,
      category_id     INTEGER,
      thumbnail_url   TEXT,
      rating_avg      REAL      NOT NULL DEFAULT 0,
      total_sold      INTEGER   NOT NULL DEFAULT 0,
      weight_gram     INTEGER   NOT NULL DEFAULT 0,
      length_cm       REAL,
      width_cm        REAL,
      height_cm       REAL,
      is_active       INTEGER   NOT NULL DEFAULT 1,
      is_featured     INTEGER   NOT NULL DEFAULT 0,
      is_flash_sale   INTEGER   NOT NULL DEFAULT 0,
      flash_sale_end  TEXT,
      created_at      TEXT      NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT      NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS product_images (
      id          INTEGER   PRIMARY KEY AUTOINCREMENT,
      product_id  TEXT      NOT NULL,
      image_url   TEXT      NOT NULL,
      sort_order  INTEGER   NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS product_variants (
      id            TEXT    NOT NULL PRIMARY KEY,
      product_id    TEXT    NOT NULL,
      variant_name  TEXT    NOT NULL,
      sku           TEXT    NOT NULL UNIQUE,
      price         REAL,
      stock         INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS product_reviews (
      id          TEXT    NOT NULL PRIMARY KEY,
      product_id  TEXT    NOT NULL,
      user_id     TEXT    NOT NULL,
      rating      INTEGER NOT NULL,
      comment     TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS banners (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT    NOT NULL,
      image_url   TEXT    NOT NULL,
      link_url    TEXT,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      is_active   INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS addresses (
      id              TEXT    NOT NULL PRIMARY KEY,
      user_id         TEXT    NOT NULL,
      recipient_name  TEXT    NOT NULL,
      phone           TEXT    NOT NULL,
      full_address    TEXT    NOT NULL,
      postal_code     TEXT    NOT NULL,
      city            TEXT    NOT NULL,
      province        TEXT    NOT NULL,
      latitude        REAL,
      longitude       REAL,
      is_primary      INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS carts (
      id          TEXT    NOT NULL PRIMARY KEY,
      user_id     TEXT    NOT NULL UNIQUE,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id              TEXT    NOT NULL PRIMARY KEY,
      cart_id         TEXT    NOT NULL,
      product_id      TEXT    NOT NULL,
      variant_id      TEXT,
      qty             INTEGER NOT NULL DEFAULT 1,
      price_snapshot  REAL    NOT NULL,
      is_selected     INTEGER NOT NULL DEFAULT 1,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS vouchers (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      code          TEXT    NOT NULL UNIQUE,
      type          TEXT    NOT NULL,
      value         REAL    NOT NULL,
      min_purchase  REAL    NOT NULL DEFAULT 0,
      max_discount  REAL,
      quota         INTEGER,
      used_count    INTEGER NOT NULL DEFAULT 0,
      expired_at    TEXT    NOT NULL,
      is_active     INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id                TEXT    NOT NULL PRIMARY KEY,
      order_number      TEXT    NOT NULL UNIQUE,
      user_id           TEXT    NOT NULL,
      address_id        TEXT,
      voucher_id        INTEGER,
      courier_service   TEXT,
      shipping_cost     REAL    NOT NULL DEFAULT 0,
      subtotal          REAL    NOT NULL,
      discount          REAL    NOT NULL DEFAULT 0,
      total             REAL    NOT NULL,
      status            TEXT    NOT NULL DEFAULT 'pending_payment',
      notes             TEXT,
      snap_token        TEXT,
      idempotency_key   TEXT    UNIQUE,
      created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at        TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id          TEXT    NOT NULL PRIMARY KEY,
      order_id    TEXT    NOT NULL,
      product_id  TEXT    NOT NULL,
      variant_id  TEXT,
      qty         INTEGER NOT NULL,
      price       REAL    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id                      TEXT    NOT NULL PRIMARY KEY,
      order_id                TEXT    NOT NULL UNIQUE,
      midtrans_transaction_id TEXT,
      payment_type            TEXT,
      gross_amount            REAL    NOT NULL,
      transaction_status      TEXT    DEFAULT 'pending',
      fraud_status            TEXT,
      paid_at                 TEXT,
      expired_at              TEXT,
      raw_response_json       TEXT,
      created_at              TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at              TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS shipments (
      id                  TEXT    NOT NULL PRIMARY KEY,
      order_id            TEXT    NOT NULL UNIQUE,
      biteship_order_id   TEXT,
      courier_name        TEXT,
      courier_service     TEXT,
      tracking_id         TEXT,
      status              TEXT    NOT NULL DEFAULT 'pending',
      waybill_url         TEXT,
      last_status_at      TEXT,
      created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at          TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS wishlists (
      id          TEXT    NOT NULL PRIMARY KEY,
      user_id     TEXT    NOT NULL,
      product_id  TEXT    NOT NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, product_id)
    );

    PRAGMA foreign_keys = ON;
  `);

  console.log('✅ SQLite schema ready');
}

module.exports = { setupSqliteSchema };
