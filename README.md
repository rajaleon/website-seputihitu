# Seputihitu E-Commerce

Website e-commerce full-stack dengan Next.js (frontend) dan Node.js/Express (backend), MySQL, integrasi Midtrans (payment) dan BiteShip (logistik).

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 14, Tailwind CSS, TypeScript |
| Backend | Node.js, Express, JWT |
| Database | MySQL (via Supabase atau lokal) |
| Payment | Midtrans Snap |
| Logistik | BiteShip API |
| State | Zustand |

---

## Struktur Project

```
website_seputihitu/
├── backend/
│   ├── database/
│   │   └── schema.sql          # Skema semua tabel + seed data
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js     # MySQL connection pool
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT authenticate + requireAdmin
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── auth.js         # Register, Login, Profile
│   │   │   ├── products.js     # Catalog, Detail, Admin CRUD
│   │   │   ├── categories.js
│   │   │   ├── banners.js
│   │   │   ├── cart.js         # Cart items + voucher
│   │   │   ├── wishlist.js
│   │   │   ├── orders.js       # Create, List, Detail, Cancel
│   │   │   ├── addresses.js
│   │   │   ├── shipping.js     # BiteShip estimate + create
│   │   │   ├── payment.js      # Midtrans Snap token
│   │   │   ├── reviews.js
│   │   │   └── webhooks.js     # Midtrans + BiteShip callbacks
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx              # Landing Page
    │   │   ├── catalog/page.tsx      # Product Catalog
    │   │   ├── products/[slug]/      # Product Detail
    │   │   ├── cart/page.tsx         # Shopping Cart
    │   │   ├── checkout/page.tsx     # Checkout
    │   │   ├── thank-you/[order]/    # Thank You Page
    │   │   ├── orders/page.tsx       # Order History
    │   │   ├── login/page.tsx
    │   │   └── register/page.tsx
    │   ├── components/
    │   │   ├── Navbar.tsx
    │   │   ├── Footer.tsx
    │   │   ├── ProductCard.tsx
    │   │   ├── SkeletonCard.tsx
    │   │   └── CountdownTimer.tsx
    │   ├── lib/
    │   │   ├── api.ts              # Axios instance + interceptors
    │   │   └── utils.ts            # formatRupiah, formatDate, dll
    │   └── store/
    │       ├── authStore.ts        # Zustand auth state
    │       └── cartStore.ts        # Zustand cart state
    ├── .env.example
    └── package.json
```

---

## Setup & Instalasi

### Prasyarat

- Node.js >= 18
- MySQL 8.0+ (atau akun Supabase)
- Akun [Midtrans](https://dashboard.midtrans.com) (Sandbox gratis)
- Akun [BiteShip](https://biteship.com) (API key gratis untuk testing)

---

### 1. Clone & Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### 2. Setup Database

```bash
# Buat database MySQL
mysql -u root -p -e "CREATE DATABASE seputihitu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Jalankan schema (buat semua tabel + seed data awal)
mysql -u root -p seputihitu < backend/database/schema.sql
```

---

### 3. Konfigurasi Environment

**Backend:**
```bash
cd backend
cp .env.example .env
# Edit .env dengan nilai yang sesuai
```

Variabel wajib di `.env`:
```
DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
JWT_SECRET         # string acak panjang
MIDTRANS_SERVER_KEY
MIDTRANS_CLIENT_KEY
BITESHIP_API_KEY
BITESHIP_ORIGIN_POSTAL_CODE
```

**Frontend:**
```bash
cd frontend
cp .env.example .env.local
# Isi NEXT_PUBLIC_API_URL dan NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
```

---

### 4. Jalankan Development

```bash
# Terminal 1 — Backend
cd backend
npm run dev
# Server berjalan di http://localhost:5000

# Terminal 2 — Frontend
cd frontend
npm run dev
# Buka http://localhost:3000
```

---

## API Endpoints

### Auth
| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/api/auth/register` | Daftar akun baru |
| POST | `/api/auth/login` | Login, dapat JWT token |
| GET | `/api/auth/me` | Profil user (auth required) |
| PATCH | `/api/auth/me` | Update profil |
| POST | `/api/auth/change-password` | Ganti password |

### Produk & Katalog
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/products` | List produk (filter, sort, pagination) |
| GET | `/api/products/featured` | Produk unggulan |
| GET | `/api/products/flash-sale` | Produk flash sale |
| GET | `/api/products/:slug` | Detail produk |
| GET | `/api/products/:id/reviews` | Ulasan produk |
| POST | `/api/products` | Tambah produk (admin) |
| GET | `/api/categories` | List kategori |
| GET | `/api/banners` | List banner aktif |

### Cart
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/cart` | Lihat isi keranjang |
| POST | `/api/cart/items` | Tambah item |
| PATCH | `/api/cart/items/:id` | Update qty / is_selected |
| DELETE | `/api/cart/items/:id` | Hapus item |
| POST | `/api/cart/apply-voucher` | Validasi & hitung diskon voucher |

### Orders & Checkout
| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/api/orders` | Buat order baru |
| GET | `/api/orders` | List order user |
| GET | `/api/orders/:order_number` | Detail order |
| PATCH | `/api/orders/:id/cancel` | Batalkan order |

### Shipping
| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/api/shipping/estimate` | Cek ongkir (BiteShip) |
| POST | `/api/shipping/create` | Buat pengiriman (setelah bayar) |

### Payment
| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/api/payment/token` | Generate Midtrans Snap token |
| GET | `/api/payment/status/:order_number` | Status pembayaran |

### Webhooks
| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/api/webhooks/midtrans` | Callback notifikasi Midtrans |
| POST | `/api/webhooks/biteship` | Callback tracking BiteShip |

---

## Alur Pembayaran (End-to-End)

```
1. User tambah produk ke keranjang
2. User ke halaman Checkout — pilih alamat + kurir
3. POST /api/orders → buat order (status: pending_payment)
4. POST /api/payment/token → dapat Snap token dari Midtrans
5. Frontend load Snap.js popup → user bayar
6. Midtrans kirim webhook ke POST /api/webhooks/midtrans
7. Backend verifikasi signature → update status order ke "paid"
8. Backend otomatis create shipment ke BiteShip
9. BiteShip kirim webhook tracking ke POST /api/webhooks/biteship
10. Order status update: processing → shipped → delivered
```

---

## Setup Webhook (Production)

Untuk menerima webhook dari Midtrans dan BiteShip, backend harus bisa diakses publik. Gunakan salah satu cara:

**Development (ngrok):**
```bash
ngrok http 5000
# Dapat URL seperti https://xxxx.ngrok.io

# Daftarkan di Midtrans Dashboard:
# Notification URL: https://xxxx.ngrok.io/api/webhooks/midtrans

# Daftarkan di BiteShip Dashboard:
# Webhook URL: https://xxxx.ngrok.io/api/webhooks/biteship
```

**Production:** Deploy backend ke Railway/Render/VPS, gunakan URL backend asli.

---

## Membuat Akun Admin

Setelah registrasi, update role user di database:
```sql
UPDATE users SET role = 'admin' WHERE email = 'email@kamu.com';
```

---

## Deploy

### Backend (Railway / Render)
1. Push kode ke GitHub
2. Connect repo di Railway/Render
3. Set environment variables di dashboard
4. Set start command: `npm start`

### Frontend (Vercel)
1. Push kode ke GitHub
2. Import project di Vercel
3. Set environment variables (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`)
4. Deploy otomatis

---

## Keamanan

- Semua endpoint sensitif menggunakan HTTPS di production
- JWT token disimpan di localStorage (pertimbangkan httpOnly cookie untuk production)
- Webhook Midtrans divalidasi dengan SHA512 signature
- Rate limiting aktif di semua `/api/` routes (200 req/15 menit)
- Auth routes dibatasi 20 req/15 menit
- Helmet.js aktif untuk HTTP security headers
- CORS dikonfigurasi hanya untuk domain frontend
