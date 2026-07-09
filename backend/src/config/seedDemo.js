/**
 * Seed data demo — dijalankan otomatis saat server start (SQLite mode)
 * Mengisi: categories, banners, products, 1 admin user, 1 customer user, voucher demo
 */
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function seedDemo(sqlite) {
  // Cek apakah sudah di-seed
  const existing = sqlite.prepare('SELECT COUNT(*) as cnt FROM categories').get();
  if (existing.cnt > 0) {
    console.log('✅ Demo data sudah ada, skip seed');
    return;
  }

  console.log('🌱 Seeding demo data...');

  // ── Categories ────────────────────────────────────────────
  const cats = [
    { name: 'Elektronik',         slug: 'elektronik' },
    { name: 'Fashion',            slug: 'fashion' },
    { name: 'Makanan & Minuman',  slug: 'makanan-minuman' },
    { name: 'Kecantikan',         slug: 'kecantikan' },
    { name: 'Olahraga',           slug: 'olahraga' },
    { name: 'Rumah & Taman',      slug: 'rumah-taman' },
  ];
  const insertCat = sqlite.prepare(
    'INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)'
  );
  cats.forEach(c => insertCat.run(c.name, c.slug));

  const catRows = sqlite.prepare('SELECT id, slug FROM categories').all();
  const catMap  = Object.fromEntries(catRows.map(r => [r.slug, r.id]));

  // ── Banners ───────────────────────────────────────────────
  const insertBanner = sqlite.prepare(
    'INSERT OR IGNORE INTO banners (title, image_url, link_url, sort_order) VALUES (?, ?, ?, ?)'
  );
  [
    ['Promo Spesial — Diskon s/d 50%', 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80', '/catalog', 1],
    ['Flash Sale Hari Ini!',            'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1200&q=80', '/catalog?flash_sale=true', 2],
    ['Gratis Ongkir Min. Rp50rb',       'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80', '/catalog', 3],
  ].forEach(b => insertBanner.run(...b));

  // ── Products ──────────────────────────────────────────────
  const insertProduct = sqlite.prepare(`
    INSERT OR IGNORE INTO products
      (id, sku, name, slug, description, specification, price, discount_price, stock,
       category_id, thumbnail_url, rating_avg, total_sold, weight_gram,
       is_active, is_featured, is_flash_sale, flash_sale_end)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?,?)
  `);

  const flashEnd = new Date(Date.now() + 8 * 3600 * 1000).toISOString(); // 8 jam dari sekarang

  const products = [
    // Elektronik — featured
    {
      id: uuidv4(), sku: 'SPH-EL-001', name: 'Wireless Earbuds Pro X1',
      slug: 'wireless-earbuds-pro-x1',
      desc: 'Earbuds nirkabel dengan suara jernih dan bass yang kuat. Baterai tahan 24 jam dengan case pengisi daya.',
      spec: 'Driver: 10mm Dynamic\nFrequensi: 20Hz - 20kHz\nBaterai: 6 jam + 18 jam case\nKonektivitas: Bluetooth 5.3\nBobot: 45g',
      price: 299000, disc: 199000, stock: 50,
      cat: catMap['elektronik'],
      img: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&q=80',
      rating: 4.7, sold: 234, weight: 200, featured: 1, flash: 1,
    },
    {
      id: uuidv4(), sku: 'SPH-EL-002', name: 'Smartwatch Active Series 3',
      slug: 'smartwatch-active-series-3',
      desc: 'Smartwatch dengan monitor detak jantung, GPS built-in, dan layar AMOLED 1.4 inch. Tahan air hingga 50 meter.',
      spec: 'Layar: 1.4" AMOLED\nBaterai: 7 hari\nWaterproof: 5ATM\nSensor: HR, SpO2, GPS\nBobot: 42g',
      price: 850000, disc: 650000, stock: 30,
      cat: catMap['elektronik'],
      img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80',
      rating: 4.5, sold: 127, weight: 150, featured: 1, flash: 0,
    },
    {
      id: uuidv4(), sku: 'SPH-EL-003', name: 'Power Bank Ultra 20000mAh',
      slug: 'power-bank-ultra-20000mah',
      desc: 'Power bank kapasitas besar dengan fast charging 65W. Bisa mengisi 3 perangkat sekaligus.',
      spec: 'Kapasitas: 20000mAh\nInput: USB-C 65W\nOutput: 3 port (2 USB-A + 1 USB-C)\nBobot: 450g',
      price: 350000, disc: null, stock: 75,
      cat: catMap['elektronik'],
      img: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500&q=80',
      rating: 4.8, sold: 312, weight: 500, featured: 0, flash: 1,
    },
    // Fashion — featured
    {
      id: uuidv4(), sku: 'SPH-FS-001', name: 'Kaos Oversize Premium Cotton',
      slug: 'kaos-oversize-premium-cotton',
      desc: 'Kaos oversize bahan cotton 100% combed 30s. Nyaman dipakai sehari-hari, tersedia berbagai warna.',
      spec: 'Bahan: Cotton Combed 30s\nUkuran: S, M, L, XL, XXL\nWarna: Hitam, Putih, Abu, Navy\nCare: Cuci suhu max 40°C',
      price: 120000, disc: 89000, stock: 200,
      cat: catMap['fashion'],
      img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80',
      rating: 4.6, sold: 891, weight: 250, featured: 1, flash: 0,
    },
    {
      id: uuidv4(), sku: 'SPH-FS-002', name: 'Sneakers Casual Everyday',
      slug: 'sneakers-casual-everyday',
      desc: 'Sneakers kasual dengan sol EVA ringan dan upper canvas breathable. Cocok untuk aktivitas sehari-hari.',
      spec: 'Upper: Canvas breathable\nSol: EVA rubber\nUkuran: 36-44\nBobot per pasang: 350g',
      price: 280000, disc: 220000, stock: 60,
      cat: catMap['fashion'],
      img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
      rating: 4.4, sold: 445, weight: 700, featured: 1, flash: 1,
    },
    // Makanan
    {
      id: uuidv4(), sku: 'SPH-MK-001', name: 'Kopi Arabica Single Origin 250g',
      slug: 'kopi-arabica-single-origin-250g',
      desc: 'Kopi arabica single origin dari dataran tinggi Gayo, Aceh. Proses natural, profil rasa fruity dan floral.',
      spec: 'Jenis: Arabica\nOrigin: Gayo, Aceh\nProcess: Natural\nRoast: Medium\nBerat: 250g',
      price: 95000, disc: null, stock: 100,
      cat: catMap['makanan-minuman'],
      img: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&q=80',
      rating: 4.9, sold: 567, weight: 300, featured: 1, flash: 0,
    },
    {
      id: uuidv4(), sku: 'SPH-MK-002', name: 'Coklat Premium Dark 72%',
      slug: 'coklat-premium-dark-72',
      desc: 'Dark chocolate premium dengan kandungan kakao 72%. Bebas gula tambahan, cocoa butter asli.',
      spec: 'Kakao: 72%\nBerat: 100g\nTanpa gula tambahan\nHalal certified\nExp: 12 bulan',
      price: 45000, disc: 38000, stock: 150,
      cat: catMap['makanan-minuman'],
      img: 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=500&q=80',
      rating: 4.7, sold: 203, weight: 150, featured: 0, flash: 1,
    },
    // Kecantikan
    {
      id: uuidv4(), sku: 'SPH-KC-001', name: 'Serum Vitamin C 20% Brightening',
      slug: 'serum-vitamin-c-20-brightening',
      desc: 'Serum vitamin C konsentrasi tinggi 20% untuk mencerahkan wajah dan meratakan warna kulit.',
      spec: 'Kandungan: Vit C 20%, Niacinamide 5%, Hyaluronic Acid\nVolume: 30ml\nSkin type: All skin types\nHalal: Ya',
      price: 175000, disc: 135000, stock: 80,
      cat: catMap['kecantikan'],
      img: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&q=80',
      rating: 4.8, sold: 334, weight: 100, featured: 1, flash: 1,
    },
    // Olahraga
    {
      id: uuidv4(), sku: 'SPH-OR-001', name: 'Yoga Mat Anti Slip 6mm',
      slug: 'yoga-mat-anti-slip-6mm',
      desc: 'Matras yoga tebal 6mm dengan bahan TPE ramah lingkungan. Anti slip di kedua sisi.',
      spec: 'Tebal: 6mm\nUkuran: 183 x 61 cm\nBahan: TPE\nBobot: 900g\nWaterproof: Ya',
      price: 180000, disc: 145000, stock: 45,
      cat: catMap['olahraga'],
      img: 'https://images.unsplash.com/photo-1601925228016-f3b29d7f7d8f?w=500&q=80',
      rating: 4.6, sold: 178, weight: 900, featured: 0, flash: 0,
    },
    // Rumah
    {
      id: uuidv4(), sku: 'SPH-RT-001', name: 'Lampu LED Aesthetic Warm 10W',
      slug: 'lampu-led-aesthetic-warm-10w',
      desc: 'Lampu LED aesthetic dengan cahaya warm white. Cocok untuk ruang tamu, kamar, atau kafe.',
      spec: 'Daya: 10W\nWarna: Warm White 3000K\nUmur: 25.000 jam\nVoltase: 220V\nFitting: E27',
      price: 55000, disc: 42000, stock: 120,
      cat: catMap['rumah-taman'],
      img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80',
      rating: 4.5, sold: 456, weight: 120, featured: 1, flash: 0,
    },
  ];

  products.forEach(p => {
    insertProduct.run(
      p.id, p.sku, p.name, p.slug, p.desc, p.spec,
      p.price, p.disc, p.stock, p.cat, p.img,
      p.rating, p.sold, p.weight,
      p.featured, p.flash, p.flash ? flashEnd : null
    );
  });

  // ── Users ─────────────────────────────────────────────────
  const adminId    = uuidv4();
  const customerId = uuidv4();
  const adminPwd   = bcrypt.hashSync('admin123', 12);
  const custPwd    = bcrypt.hashSync('demo123', 12);

  const insertUser = sqlite.prepare(
    'INSERT OR IGNORE INTO users (id, name, email, password, phone, role) VALUES (?,?,?,?,?,?)'
  );
  insertUser.run(adminId,    'Admin Seputihitu', 'admin@seputihitu.com',    adminPwd, '081200000001', 'admin');
  insertUser.run(customerId, 'Customer Demo',   'customer@seputihitu.com', custPwd,  '081200000002', 'customer');

  // Buat cart untuk customer
  const insertCart = sqlite.prepare('INSERT OR IGNORE INTO carts (id, user_id) VALUES (?,?)');
  insertCart.run(uuidv4(), customerId);

  // ── Voucher demo ──────────────────────────────────────────
  sqlite.prepare(`
    INSERT OR IGNORE INTO vouchers (code, type, value, min_purchase, quota, expired_at)
    VALUES (?,?,?,?,?,?)
  `).run('DEMO10', 'percent', 10, 50000, 100, new Date(Date.now() + 30 * 86400000).toISOString());

  sqlite.prepare(`
    INSERT OR IGNORE INTO vouchers (code, type, value, min_purchase, max_discount, quota, expired_at)
    VALUES (?,?,?,?,?,?,?)
  `).run('GRATIS20', 'fixed', 20000, 100000, null, 50, new Date(Date.now() + 30 * 86400000).toISOString());

  console.log('✅ Demo data seeded!');
  console.log('');
  console.log('  👤 Admin   : admin@seputihitu.com    / admin123');
  console.log('  👤 Customer: customer@seputihitu.com / demo123');
  console.log('  🎟️  Voucher : DEMO10 (10%) | GRATIS20 (Rp20rb)');
  console.log('');
}

module.exports = { seedDemo };
