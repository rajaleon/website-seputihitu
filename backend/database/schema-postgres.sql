-- ============================================================
-- Seputihitu E-Commerce — PostgreSQL Schema (Supabase)
-- ============================================================

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- Users & Auth
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id          UUID        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  email       VARCHAR(150)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,
  phone       VARCHAR(20)   DEFAULT NULL,
  avatar_url  VARCHAR(500)  DEFAULT NULL,
  role        VARCHAR(20)   NOT NULL DEFAULT 'customer',
  is_active   BOOLEAN       NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ------------------------------------------------------------
-- Categories
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL        PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  slug        VARCHAR(120)  NOT NULL UNIQUE,
  parent_id   INTEGER       DEFAULT NULL REFERENCES categories(id) ON DELETE SET NULL,
  icon_url    VARCHAR(500)  DEFAULT NULL,
  is_active   BOOLEAN       NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Products
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id              UUID          NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  sku             VARCHAR(100)  NOT NULL UNIQUE,
  name            VARCHAR(255)  NOT NULL,
  slug            VARCHAR(280)  NOT NULL UNIQUE,
  description     TEXT          DEFAULT NULL,
  specification   TEXT          DEFAULT NULL,
  price           DECIMAL(15,2) NOT NULL,
  discount_price  DECIMAL(15,2) DEFAULT NULL,
  stock           INTEGER       NOT NULL DEFAULT 0,
  category_id     INTEGER       DEFAULT NULL REFERENCES categories(id) ON DELETE SET NULL,
  thumbnail_url   VARCHAR(500)  DEFAULT NULL,
  rating_avg      DECIMAL(3,2)  NOT NULL DEFAULT 0,
  total_sold      INTEGER       NOT NULL DEFAULT 0,
  weight_gram     INTEGER       NOT NULL DEFAULT 0,
  length_cm       DECIMAL(8,2)  DEFAULT NULL,
  width_cm        DECIMAL(8,2)  DEFAULT NULL,
  height_cm       DECIMAL(8,2)  DEFAULT NULL,
  is_active       BOOLEAN       NOT NULL DEFAULT true,
  is_featured     BOOLEAN       NOT NULL DEFAULT false,
  is_flash_sale   BOOLEAN       NOT NULL DEFAULT false,
  flash_sale_end  TIMESTAMPTZ   DEFAULT NULL,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_flash ON products(is_flash_sale);

CREATE TABLE IF NOT EXISTS product_images (
  id          SERIAL        PRIMARY KEY,
  product_id  UUID          NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url   VARCHAR(500)  NOT NULL,
  sort_order  INTEGER       NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_variants (
  id            UUID          NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id    UUID          NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_name  VARCHAR(100)  NOT NULL,
  sku           VARCHAR(120)  NOT NULL UNIQUE,
  price         DECIMAL(15,2) DEFAULT NULL,
  stock         INTEGER       NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_reviews (
  id          UUID          NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id  UUID          NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id     UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating      SMALLINT      NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT          DEFAULT NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ------------------------------------------------------------
-- Banners
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS banners (
  id          SERIAL        PRIMARY KEY,
  title       VARCHAR(200)  NOT NULL,
  image_url   VARCHAR(500)  NOT NULL,
  link_url    VARCHAR(500)  DEFAULT NULL,
  sort_order  INTEGER       NOT NULL DEFAULT 0,
  is_active   BOOLEAN       NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Addresses
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS addresses (
  id              UUID          NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_name  VARCHAR(100)  NOT NULL,
  phone           VARCHAR(20)   NOT NULL,
  full_address    TEXT          NOT NULL,
  postal_code     VARCHAR(10)   NOT NULL,
  city            VARCHAR(100)  NOT NULL,
  province        VARCHAR(100)  NOT NULL,
  latitude        DECIMAL(10,8) DEFAULT NULL,
  longitude       DECIMAL(11,8) DEFAULT NULL,
  is_primary      BOOLEAN       NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);

-- ------------------------------------------------------------
-- Cart
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS carts (
  id          UUID        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cart_items (
  id              UUID          NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  cart_id         UUID          NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id      UUID          NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id      UUID          DEFAULT NULL REFERENCES product_variants(id) ON DELETE SET NULL,
  qty             INTEGER       NOT NULL DEFAULT 1,
  price_snapshot  DECIMAL(15,2) NOT NULL,
  is_selected     BOOLEAN       NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Vouchers
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vouchers (
  id            SERIAL          PRIMARY KEY,
  code          VARCHAR(50)     NOT NULL UNIQUE,
  type          VARCHAR(20)     NOT NULL,
  value         DECIMAL(15,2)   NOT NULL,
  min_purchase  DECIMAL(15,2)   NOT NULL DEFAULT 0,
  max_discount  DECIMAL(15,2)   DEFAULT NULL,
  quota         INTEGER         DEFAULT NULL,
  used_count    INTEGER         NOT NULL DEFAULT 0,
  expired_at    TIMESTAMPTZ     NOT NULL,
  is_active     BOOLEAN         NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Orders
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id                UUID          NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number      VARCHAR(50)   NOT NULL UNIQUE,
  user_id           UUID          NOT NULL REFERENCES users(id),
  address_id        UUID          DEFAULT NULL REFERENCES addresses(id) ON DELETE SET NULL,
  voucher_id        INTEGER       DEFAULT NULL REFERENCES vouchers(id) ON DELETE SET NULL,
  courier_service   VARCHAR(100)  DEFAULT NULL,
  shipping_cost     DECIMAL(15,2) NOT NULL DEFAULT 0,
  subtotal          DECIMAL(15,2) NOT NULL,
  discount          DECIMAL(15,2) NOT NULL DEFAULT 0,
  total             DECIMAL(15,2) NOT NULL,
  status            VARCHAR(30)   NOT NULL DEFAULT 'pending_payment',
  notes             TEXT          DEFAULT NULL,
  snap_token        VARCHAR(255)  DEFAULT NULL,
  idempotency_key   VARCHAR(100)  DEFAULT NULL UNIQUE,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
  id          UUID          NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id    UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID          NOT NULL REFERENCES products(id),
  variant_id  UUID          DEFAULT NULL,
  qty         INTEGER       NOT NULL,
  price       DECIMAL(15,2) NOT NULL
);

-- ------------------------------------------------------------
-- Payments (Midtrans)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id                      UUID          NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id                UUID          NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  midtrans_transaction_id VARCHAR(100)  DEFAULT NULL,
  payment_type            VARCHAR(50)   DEFAULT NULL,
  gross_amount            DECIMAL(15,2) NOT NULL,
  transaction_status      VARCHAR(50)   DEFAULT 'pending',
  fraud_status            VARCHAR(50)   DEFAULT NULL,
  paid_at                 TIMESTAMPTZ   DEFAULT NULL,
  expired_at              TIMESTAMPTZ   DEFAULT NULL,
  raw_response_json       JSONB         DEFAULT NULL,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Shipments (BiteShip)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shipments (
  id                  UUID          NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id            UUID          NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  biteship_order_id   VARCHAR(100)  DEFAULT NULL,
  courier_name        VARCHAR(100)  DEFAULT NULL,
  courier_service     VARCHAR(100)  DEFAULT NULL,
  tracking_id         VARCHAR(100)  DEFAULT NULL,
  status              VARCHAR(50)   NOT NULL DEFAULT 'pending',
  waybill_url         VARCHAR(500)  DEFAULT NULL,
  last_status_at      TIMESTAMPTZ   DEFAULT NULL,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Wishlists
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wishlists (
  id          UUID        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ============================================================
-- Seed Data
-- ============================================================
INSERT INTO categories (name, slug) VALUES
  ('Elektronik', 'elektronik'),
  ('Fashion', 'fashion'),
  ('Makanan & Minuman', 'makanan-minuman'),
  ('Kecantikan', 'kecantikan'),
  ('Olahraga', 'olahraga'),
  ('Rumah & Taman', 'rumah-taman')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO banners (title, image_url, link_url, sort_order) VALUES
  ('Promo Spesial — Diskon s/d 50%', 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80', '/catalog', 1),
  ('Flash Sale Hari Ini!', 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1200&q=80', '/catalog?flash_sale=true', 2),
  ('Gratis Ongkir Min. Rp50rb', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80', '/catalog', 3)
ON CONFLICT DO NOTHING;
