# Spesifikasi Teknis Website E-Commerce

**Versi:** 1.0
**Tanggal:** Juli 2026

---

## 1. Overview & Tech Stack

| Komponen | Teknologi |
|---|---|
| Frontend | Tailwind CSS (+ HTML/JS atau framework pilihan seperti Next.js/React) |
| Backend | Node.js (Express/Fastify) |
| Database | MySQL — hosting via Supabase |
| Payment Gateway | Midtrans (Snap / Core API) |
| Logistik & Kurir | BiteShip API |
| Auth | JWT / Supabase Auth |
| File Storage | Supabase Storage (gambar produk) |
| Hosting | VPS / Vercel (FE) + Railway/Render (BE) — sesuaikan budget |

### Arsitektur Umum
```
[Client - Tailwind UI]
        |
        v
[Node.js REST API] --- [MySQL/Supabase]
        |
        +--> [Midtrans API] (payment)
        +--> [BiteShip API] (ongkir & tracking)
```

---

## 2. Modul & Halaman

### 04. Landing Page

**Tujuan:** First impression, funnel user ke katalog produk.

**Komponen:**
- Hero banner (carousel promo, bisa di-manage dari admin CMS sederhana)
- Kategori unggulan (grid icon/kategori)
- Produk best seller / rekomendasi (card slider)
- Flash sale section (dengan countdown timer)
- Testimoni / trust badge (rating, jumlah transaksi)
- Footer: info toko, kontak, kebijakan, sosial media

**Data yang dibutuhkan dari backend:**
- `GET /api/banners`
- `GET /api/products/featured`
- `GET /api/products/flash-sale`
- `GET /api/categories`

**Catatan UX:** perhatikan loading state (skeleton loader) karena banyak section fetch data async.

---

### 05. Product Catalog

**Tujuan:** Menampilkan daftar produk dengan filter & pencarian.

**Fitur:**
- Filter: kategori, harga (range slider), rating, brand
- Sort: termurah, termahal, terlaris, terbaru
- Search bar (dengan debounce, autocomplete opsional)
- Pagination / infinite scroll
- Grid/List view toggle
- Badge produk (diskon, baru, stok terbatas)

**Endpoint:**
- `GET /api/products?category=&min_price=&max_price=&sort=&page=&search=`
- `GET /api/categories`

**Skema tabel terkait (MySQL):**
```sql
products (
  id, sku, name, slug, description,
  price, discount_price, stock,
  category_id, thumbnail_url, rating_avg,
  is_active, created_at, updated_at
)
categories (id, name, slug, parent_id)
product_images (id, product_id, image_url, sort_order)
```

---

### 06. Product Detail (PDP)

**Tujuan:** Informasi lengkap produk + call-to-action beli.

**Komponen:**
- Galeri gambar produk (thumbnail + zoom)
- Nama, harga, diskon, rating, jumlah terjual
- Pilihan varian (ukuran, warna) — jika ada
- Quantity selector + stok tersedia
- Tombol "Tambah ke Keranjang" & "Beli Sekarang"
- Deskripsi produk (tab: deskripsi, spesifikasi, ulasan)
- Estimasi ongkir (integrasi awal BiteShip — cek ongkir cepat by kode pos)
- Produk terkait / rekomendasi

**Endpoint:**
- `GET /api/products/:slug`
- `GET /api/products/:id/reviews`
- `POST /api/shipping/estimate` (preview ongkir sebelum checkout, panggil BiteShip)

**Skema tambahan:**
```sql
product_variants (id, product_id, variant_name, sku, price, stock)
product_reviews (id, product_id, user_id, rating, comment, created_at)
```

---

### 07. Shopping Cart

**Tujuan:** Kelola item sebelum checkout.

**Fitur:**
- List item + gambar, nama, varian, qty (edit qty), subtotal
- Hapus item / simpan untuk nanti (wishlist)
- Checkbox pilih item yang mau di-checkout (partial checkout)
- Ringkasan total (subtotal, estimasi diskon voucher)
- Input kode voucher/promo
- Validasi stok real-time sebelum lanjut ke checkout

**Endpoint:**
- `GET /api/cart`
- `POST /api/cart/items`
- `PATCH /api/cart/items/:id`
- `DELETE /api/cart/items/:id`
- `POST /api/cart/apply-voucher`

**Skema:**
```sql
carts (id, user_id, created_at)
cart_items (id, cart_id, product_id, variant_id, qty, price_snapshot)
vouchers (id, code, type, value, min_purchase, expired_at, quota)
```

**State management (FE):** simpan state cart lokal (Zustand/Context) sinkron dengan backend agar konsisten antar device saat login.

---

### 08. Checkout

**Tujuan:** Konfirmasi pesanan, alamat, dan metode pengiriman sebelum bayar.

**Fitur:**
- Pilih/tambah alamat pengiriman (integrasi dengan alamat tersimpan user)
- Ringkasan produk yang dibeli
- Pilihan kurir & estimasi ongkir (lihat modul 09 — BiteShip)
- Catatan untuk penjual (opsional)
- Ringkasan total: subtotal + ongkir - diskon = total bayar
- Tombol lanjut ke pembayaran (trigger Midtrans)

**Endpoint:**
- `GET /api/addresses`
- `POST /api/addresses`
- `POST /api/orders` (create order, status: `pending_payment`)

**Skema:**
```sql
orders (
  id, order_number, user_id, address_id,
  courier_service, shipping_cost, subtotal,
  discount, total, status, created_at
)
order_items (id, order_id, product_id, variant_id, qty, price)
addresses (id, user_id, recipient_name, phone, full_address,
  postal_code, city, province, latitude, longitude, is_primary)
```

**Alur status order:** `pending_payment` → `paid` → `processing` → `shipped` → `delivered` / `cancelled`

---

### 09. Shipping (BiteShip Integration)

**Tujuan:** Hitung ongkir, pilih kurir, buat pengiriman, tracking.

**Alur integrasi:**
1. **Cek ongkir** — saat checkout, panggil BiteShip Rates API dengan origin (gudang), destination (alamat user), berat/dimensi paket.
   - `POST https://api.biteship.com/v1/rates/couriers`
2. **Pilih kurir** — tampilkan list opsi (JNE, SiCepat, GoSend, dll) beserta estimasi harga & waktu.
3. **Buat order pengiriman** — setelah pembayaran sukses, backend memanggil BiteShip Create Order API untuk generate resi.
   - `POST https://api.biteship.com/v1/orders`
4. **Tracking** — webhook BiteShip untuk update status (picked up, in transit, delivered) disimpan ke tabel `shipments`.
   - `POST /api/webhooks/biteship` (endpoint milik kita, menerima callback)

**Skema:**
```sql
shipments (
  id, order_id, biteship_order_id, courier_name,
  courier_service, tracking_id, status,
  waybill_url, last_status_at
)
```

**Environment variables backend:**
```
BITESHIP_API_KEY=
BITESHIP_ORIGIN_LOCATION_ID=
```

**Catatan penting:**
- Simpan `biteship_order_id` untuk referensi tracking.
- Siapkan retry mechanism jika API BiteShip timeout.
- Berat & dimensi produk wajib diisi di data produk agar hitung ongkir akurat.

---

### 10. Payment (Midtrans Integration)

**Tujuan:** Proses pembayaran aman dengan berbagai metode (VA, e-wallet, QRIS, kartu kredit).

**Alur integrasi (rekomendasi pakai Snap):**
1. Backend generate **Snap Token** setelah order dibuat (status `pending_payment`).
   - `POST https://app.midtrans.com/snap/v1/transactions`
2. Frontend load Snap.js popup menggunakan token tsb.
3. User pilih metode bayar & selesaikan pembayaran di UI Midtrans.
4. Midtrans kirim **webhook/notification** ke backend saat status berubah.
   - `POST /api/webhooks/midtrans`
5. Backend verifikasi signature notifikasi, update status order (`paid`/`failed`/`expired`), lalu trigger pembuatan shipment order ke BiteShip.

**Skema:**
```sql
payments (
  id, order_id, midtrans_transaction_id, payment_type,
  gross_amount, transaction_status, fraud_status,
  paid_at, raw_response_json
)
```

**Environment variables backend:**
```
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_IS_PRODUCTION=false
```

**Catatan keamanan:**
- Selalu validasi `signature_key` dari notifikasi Midtrans (SHA512 dari order_id+status_code+gross_amount+server_key).
- Jangan percaya status dari response client — sumber kebenaran status pembayaran adalah webhook server-to-server.
- Set expiry time transaksi (misal 24 jam) agar stok tidak "nyangkut" di order yang tidak dibayar.

---

### 11. Thank You Page

**Tujuan:** Konfirmasi order berhasil + info lanjutan.

**Komponen:**
- Status sukses (icon check) + nomor order
- Ringkasan order (produk, total, metode bayar, estimasi pengiriman)
- Tombol "Lihat Detail Pesanan" → halaman order tracking
- Tombol "Lanjut Belanja"
- Opsional: rekomendasi produk lain, ajakan follow sosial media / subscribe newsletter

**Endpoint:**
- `GET /api/orders/:order_number`

**Catatan:** Halaman ini juga jadi tempat baik untuk trigger event tracking (GA4/Meta Pixel) untuk "purchase" conversion.

---

## 3. Ringkasan Alur End-to-End

```
Landing Page → Catalog → PDP → Add to Cart → Cart
      → Checkout (pilih alamat)
      → Shipping (cek ongkir BiteShip, pilih kurir)
      → Order dibuat (status: pending_payment)
      → Payment (Midtrans Snap)
      → Webhook Midtrans → status: paid
      → Trigger create shipment ke BiteShip → dapat resi
      → Thank You Page
      → (kurir update status via webhook BiteShip) → delivered
```

## 4. Daftar Environment Variables (Backend)

```
DATABASE_URL=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_IS_PRODUCTION=
BITESHIP_API_KEY=
BITESHIP_ORIGIN_LOCATION_ID=
JWT_SECRET=
```

## 5. Rekomendasi Tahapan Development (untuk tracking di Jira)

| Sprint | Scope |
|---|---|
| Sprint 1 | Setup project, DB schema, auth, Landing Page, Catalog |
| Sprint 2 | PDP, Cart, Wishlist |
| Sprint 3 | Checkout, integrasi BiteShip (rates + create order) |
| Sprint 4 | Integrasi Midtrans (Snap + webhook), Thank You Page |
| Sprint 5 | Order tracking, notifikasi (email/WA), QA & UAT |

## 6. Catatan Tambahan

- Semua endpoint publik yang menyentuh data sensitif (order, payment) wajib pakai HTTPS & rate limiting.
- Idempotency key disarankan untuk endpoint create order & create payment, mencegah duplikasi akibat double-click atau retry.
- Untuk skala kecil-menengah, MySQL via Supabase cukup; kalau traffic besar, pertimbangkan read-replica atau caching (Redis) untuk katalog produk.
