-- ============================================================
-- Seed Demo Data — PostgreSQL / Supabase
-- Jalankan setelah schema-postgres.sql
-- ============================================================

-- Admin user (password: admin123)
INSERT INTO users (id, name, email, password, phone, role) VALUES
  (uuid_generate_v4(), 'Admin Seputihitu', 'admin@seputihitu.com',
   '$2a$12$LJ3G9X6iqB3K5z9fq7L4Gu3TqJQ3G8Z5I5GzW9KvC3X5R4H2Y6Oue',
   '081200000001', 'admin'),
  (uuid_generate_v4(), 'Customer Demo', 'customer@seputihitu.com',
   '$2a$12$LJ3G9X6iqB3K5z9fq7L4Gu3TqJQ3G8Z5I5GzW9KvC3X5R4H2Y6Oue',
   '081200000002', 'customer')
ON CONFLICT (email) DO NOTHING;

-- Products
INSERT INTO products (sku, name, slug, description, specification, price, discount_price, stock, category_id, thumbnail_url, rating_avg, total_sold, weight_gram, is_active, is_featured, is_flash_sale, flash_sale_end) VALUES
  ('SPH-EL-001', 'Wireless Earbuds Pro X1', 'wireless-earbuds-pro-x1',
   'Earbuds nirkabel dengan suara jernih dan bass yang kuat. Baterai tahan 24 jam.',
   'Driver: 10mm Dynamic\nBluetooth 5.3\nBaterai: 6h + 18h case',
   299000, 199000, 50, 1, 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&q=80',
   4.7, 234, 200, true, true, true, NOW() + interval '48 hours'),

  ('SPH-EL-002', 'Smartwatch Active Series 3', 'smartwatch-active-series-3',
   'Smartwatch dengan monitor detak jantung, GPS, layar AMOLED 1.4 inch.',
   'Layar: 1.4" AMOLED\nBaterai: 7 hari\n5ATM waterproof',
   850000, 650000, 30, 1, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80',
   4.5, 127, 150, true, true, false, NULL),

  ('SPH-EL-003', 'Power Bank Ultra 20000mAh', 'power-bank-ultra-20000mah',
   'Power bank kapasitas besar dengan fast charging 65W.',
   'Kapasitas: 20000mAh\n3 port output\n65W USB-C',
   350000, NULL, 75, 1, 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500&q=80',
   4.8, 312, 500, true, false, true, NOW() + interval '48 hours'),

  ('SPH-FS-001', 'Kaos Oversize Premium Cotton', 'kaos-oversize-premium-cotton',
   'Kaos oversize bahan cotton 100% combed 30s. Nyaman untuk sehari-hari.',
   'Bahan: Cotton Combed 30s\nUkuran: S-XXL\nWarna: 4 pilihan',
   120000, 89000, 200, 2, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80',
   4.6, 891, 250, true, true, false, NULL),

  ('SPH-FS-002', 'Sneakers Casual Everyday', 'sneakers-casual-everyday',
   'Sneakers kasual dengan sol EVA ringan dan upper canvas breathable.',
   'Upper: Canvas\nSol: EVA rubber\nUkuran: 36-44',
   280000, 220000, 60, 2, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
   4.4, 445, 700, true, true, true, NOW() + interval '48 hours'),

  ('SPH-MK-001', 'Kopi Arabica Single Origin 250g', 'kopi-arabica-single-origin-250g',
   'Kopi arabica single origin dari Gayo, Aceh. Profil rasa fruity dan floral.',
   'Jenis: Arabica\nOrigin: Gayo\nProcess: Natural\n250g',
   95000, NULL, 100, 3, 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&q=80',
   4.9, 567, 300, true, true, false, NULL),

  ('SPH-MK-002', 'Coklat Premium Dark 72%', 'coklat-premium-dark-72',
   'Dark chocolate premium kakao 72%. Bebas gula tambahan.',
   'Kakao: 72%\nBerat: 100g\nHalal certified',
   45000, 38000, 150, 3, 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=500&q=80',
   4.7, 203, 150, true, false, true, NOW() + interval '48 hours'),

  ('SPH-KC-001', 'Serum Vitamin C 20% Brightening', 'serum-vitamin-c-20-brightening',
   'Serum vitamin C 20% untuk mencerahkan dan meratakan warna kulit.',
   'Vit C 20%, Niacinamide 5%\n30ml\nAll skin types',
   175000, 135000, 80, 4, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&q=80',
   4.8, 334, 100, true, true, true, NOW() + interval '48 hours'),

  ('SPH-OR-001', 'Yoga Mat Anti Slip 6mm', 'yoga-mat-anti-slip-6mm',
   'Matras yoga TPE 6mm, anti slip di kedua sisi.',
   'Tebal: 6mm\n183 x 61 cm\nBahan: TPE\n900g',
   180000, 145000, 45, 5, 'https://images.unsplash.com/photo-1601925228016-f3b29d7f7d8f?w=500&q=80',
   4.6, 178, 900, true, false, false, NULL),

  ('SPH-RT-001', 'Lampu LED Aesthetic Warm 10W', 'lampu-led-aesthetic-warm-10w',
   'Lampu LED warm white 3000K. Cocok untuk ruang tamu/kamar.',
   '10W\n3000K Warm White\n25.000 jam\nE27',
   55000, 42000, 120, 6, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80',
   4.5, 456, 120, true, true, false, NULL)
ON CONFLICT (sku) DO NOTHING;

-- Voucher demo
INSERT INTO vouchers (code, type, value, min_purchase, quota, expired_at) VALUES
  ('DEMO10', 'percent', 10, 50000, 100, NOW() + interval '30 days'),
  ('GRATIS20', 'fixed', 20000, 100000, 50, NOW() + interval '30 days')
ON CONFLICT (code) DO NOTHING;
