-- ============================================================
-- Seputihitu E-Commerce Database Schema
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- Users & Auth
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id          CHAR(36)      NOT NULL PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  email       VARCHAR(150)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,
  phone       VARCHAR(20)   DEFAULT NULL,
  avatar_url  VARCHAR(500)  DEFAULT NULL,
  role        ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  is_active   TINYINT(1)    NOT NULL DEFAULT 1,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Categories
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  slug        VARCHAR(120)  NOT NULL UNIQUE,
  parent_id   INT UNSIGNED  DEFAULT NULL,
  icon_url    VARCHAR(500)  DEFAULT NULL,
  is_active   TINYINT(1)    NOT NULL DEFAULT 1,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_slug (slug),
  INDEX idx_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Products
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id              CHAR(36)        NOT NULL PRIMARY KEY,
  sku             VARCHAR(100)    NOT NULL UNIQUE,
  name            VARCHAR(255)    NOT NULL,
  slug            VARCHAR(280)    NOT NULL UNIQUE,
  description     LONGTEXT        DEFAULT NULL,
  specification   LONGTEXT        DEFAULT NULL,
  price           DECIMAL(15,2)   NOT NULL,
  discount_price  DECIMAL(15,2)   DEFAULT NULL,
  stock           INT UNSIGNED    NOT NULL DEFAULT 0,
  category_id     INT UNSIGNED    DEFAULT NULL,
  thumbnail_url   VARCHAR(500)    DEFAULT NULL,
  rating_avg      DECIMAL(3,2)    NOT NULL DEFAULT 0.00,
  total_sold      INT UNSIGNED    NOT NULL DEFAULT 0,
  weight_gram     INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT 'gram, untuk hitung ongkir',
  length_cm       DECIMAL(8,2)    DEFAULT NULL,
  width_cm        DECIMAL(8,2)    DEFAULT NULL,
  height_cm       DECIMAL(8,2)    DEFAULT NULL,
  is_active       TINYINT(1)      NOT NULL DEFAULT 1,
  is_featured     TINYINT(1)      NOT NULL DEFAULT 0,
  is_flash_sale   TINYINT(1)      NOT NULL DEFAULT 0,
  flash_sale_end  DATETIME        DEFAULT NULL,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_slug (slug),
  INDEX idx_category (category_id),
  INDEX idx_featured (is_featured),
  INDEX idx_flash_sale (is_flash_sale),
  INDEX idx_active (is_active),
  FULLTEXT INDEX ft_search (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_images (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
  product_id  CHAR(36)      NOT NULL,
  image_url   VARCHAR(500)  NOT NULL,
  sort_order  INT UNSIGNED  NOT NULL DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_variants (
  id            CHAR(36)        NOT NULL PRIMARY KEY,
  product_id    CHAR(36)        NOT NULL,
  variant_name  VARCHAR(100)    NOT NULL COMMENT 'e.g. Merah/XL',
  sku           VARCHAR(120)    NOT NULL UNIQUE,
  price         DECIMAL(15,2)   DEFAULT NULL COMMENT 'NULL = pakai harga produk',
  stock         INT UNSIGNED    NOT NULL DEFAULT 0,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_reviews (
  id          CHAR(36)      NOT NULL PRIMARY KEY,
  product_id  CHAR(36)      NOT NULL,
  user_id     CHAR(36)      NOT NULL,
  rating      TINYINT       NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT          DEFAULT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_product (product_id),
  UNIQUE KEY uq_user_product (user_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Banners (untuk landing page / CMS sederhana)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS banners (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(200)  NOT NULL,
  image_url   VARCHAR(500)  NOT NULL,
  link_url    VARCHAR(500)  DEFAULT NULL,
  sort_order  INT UNSIGNED  NOT NULL DEFAULT 0,
  is_active   TINYINT(1)    NOT NULL DEFAULT 1,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Addresses
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS addresses (
  id              CHAR(36)      NOT NULL PRIMARY KEY,
  user_id         CHAR(36)      NOT NULL,
  recipient_name  VARCHAR(100)  NOT NULL,
  phone           VARCHAR(20)   NOT NULL,
  full_address    TEXT          NOT NULL,
  postal_code     VARCHAR(10)   NOT NULL,
  city            VARCHAR(100)  NOT NULL,
  province        VARCHAR(100)  NOT NULL,
  latitude        DECIMAL(10,8) DEFAULT NULL,
  longitude       DECIMAL(11,8) DEFAULT NULL,
  is_primary      TINYINT(1)    NOT NULL DEFAULT 0,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Cart
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS carts (
  id          CHAR(36)      NOT NULL PRIMARY KEY,
  user_id     CHAR(36)      NOT NULL UNIQUE,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cart_items (
  id              CHAR(36)        NOT NULL PRIMARY KEY,
  cart_id         CHAR(36)        NOT NULL,
  product_id      CHAR(36)        NOT NULL,
  variant_id      CHAR(36)        DEFAULT NULL,
  qty             INT UNSIGNED    NOT NULL DEFAULT 1,
  price_snapshot  DECIMAL(15,2)   NOT NULL COMMENT 'harga saat ditambahkan',
  is_selected     TINYINT(1)      NOT NULL DEFAULT 1 COMMENT 'untuk partial checkout',
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
  INDEX idx_cart (cart_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Vouchers
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vouchers (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code          VARCHAR(50)     NOT NULL UNIQUE,
  type          ENUM('percent','fixed') NOT NULL,
  value         DECIMAL(15,2)   NOT NULL,
  min_purchase  DECIMAL(15,2)   NOT NULL DEFAULT 0,
  max_discount  DECIMAL(15,2)   DEFAULT NULL COMMENT 'batas maksimal diskon (untuk tipe persen)',
  quota         INT UNSIGNED    DEFAULT NULL COMMENT 'NULL = unlimited',
  used_count    INT UNSIGNED    NOT NULL DEFAULT 0,
  expired_at    DATETIME        NOT NULL,
  is_active     TINYINT(1)      NOT NULL DEFAULT 1,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Orders
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id                CHAR(36)        NOT NULL PRIMARY KEY,
  order_number      VARCHAR(50)     NOT NULL UNIQUE,
  user_id           CHAR(36)        NOT NULL,
  address_id        CHAR(36)        DEFAULT NULL,
  voucher_id        INT UNSIGNED    DEFAULT NULL,
  courier_service   VARCHAR(100)    DEFAULT NULL,
  shipping_cost     DECIMAL(15,2)   NOT NULL DEFAULT 0,
  subtotal          DECIMAL(15,2)   NOT NULL,
  discount          DECIMAL(15,2)   NOT NULL DEFAULT 0,
  total             DECIMAL(15,2)   NOT NULL,
  status            ENUM('pending_payment','paid','processing','shipped','delivered','cancelled','refunded')
                    NOT NULL DEFAULT 'pending_payment',
  notes             TEXT            DEFAULT NULL,
  snap_token        VARCHAR(255)    DEFAULT NULL,
  idempotency_key   VARCHAR(100)    DEFAULT NULL UNIQUE,
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE SET NULL,
  FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_status (status),
  INDEX idx_order_number (order_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id          CHAR(36)        NOT NULL PRIMARY KEY,
  order_id    CHAR(36)        NOT NULL,
  product_id  CHAR(36)        NOT NULL,
  variant_id  CHAR(36)        DEFAULT NULL,
  qty         INT UNSIGNED    NOT NULL,
  price       DECIMAL(15,2)   NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Payments (Midtrans)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id                      CHAR(36)        NOT NULL PRIMARY KEY,
  order_id                CHAR(36)        NOT NULL UNIQUE,
  midtrans_transaction_id VARCHAR(100)    DEFAULT NULL,
  payment_type            VARCHAR(50)     DEFAULT NULL,
  gross_amount            DECIMAL(15,2)   NOT NULL,
  transaction_status      VARCHAR(50)     DEFAULT 'pending',
  fraud_status            VARCHAR(50)     DEFAULT NULL,
  paid_at                 DATETIME        DEFAULT NULL,
  expired_at              DATETIME        DEFAULT NULL,
  raw_response_json       JSON            DEFAULT NULL,
  created_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_transaction_id (midtrans_transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Shipments (BiteShip)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shipments (
  id                  CHAR(36)      NOT NULL PRIMARY KEY,
  order_id            CHAR(36)      NOT NULL UNIQUE,
  biteship_order_id   VARCHAR(100)  DEFAULT NULL,
  courier_name        VARCHAR(100)  DEFAULT NULL,
  courier_service     VARCHAR(100)  DEFAULT NULL,
  tracking_id         VARCHAR(100)  DEFAULT NULL,
  status              VARCHAR(50)   NOT NULL DEFAULT 'pending',
  waybill_url         VARCHAR(500)  DEFAULT NULL,
  last_status_at      DATETIME      DEFAULT NULL,
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_biteship_order_id (biteship_order_id),
  INDEX idx_tracking_id (tracking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Wishlists
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wishlists (
  id          CHAR(36)      NOT NULL PRIMARY KEY,
  user_id     CHAR(36)      NOT NULL,
  product_id  CHAR(36)      NOT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_product (user_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Seed Data (contoh)
-- ============================================================
INSERT IGNORE INTO categories (name, slug) VALUES
  ('Elektronik', 'elektronik'),
  ('Fashion', 'fashion'),
  ('Makanan & Minuman', 'makanan-minuman'),
  ('Kecantikan', 'kecantikan'),
  ('Olahraga', 'olahraga'),
  ('Rumah & Taman', 'rumah-taman');

INSERT IGNORE INTO banners (title, image_url, link_url, sort_order) VALUES
  ('Promo Spesial Juli', '/images/banner1.jpg', '/catalog', 1),
  ('Flash Sale Hari Ini', '/images/banner2.jpg', '/catalog?flash=true', 2),
  ('Gratis Ongkir', '/images/banner3.jpg', '/catalog', 3);

-- ============================================================
-- Jadikan akun admin
-- Ganti 'admin@seputihitu.com' dengan email yang sudah terdaftar
-- ============================================================
UPDATE users SET role = 'admin' WHERE email = 'admin@seputihitu.com';
