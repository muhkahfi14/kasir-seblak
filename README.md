# Kasir Seblak Prasmanan 🌶️
> Responsive POS, Inventory & Recipe Management, Moving Average COGS (HPP), Integrated Financial Reporting, Excel Export, and manual CASH/QRIS payment recording.

Sistem kasir profesional berbasis web yang dibangun khusus untuk operasional usaha kuliner seblak prasmanan. Aplikasi mengintegrasikan transaksi penjualan, pemilihan topping dinamis per porsi, resep, pengurangan stok otomatis, kalkulasi HPP rata-rata bergerak, pencatatan beban operasional, modal pemilik, shift kasir, dan laporan laba rugi komprehensif.

Pembayaran hanya dicatat sebagai **CASH** atau **QRIS**. Keduanya adalah label metode pembayaran manual yang disimpan ke database. Aplikasi **tidak** terhubung ke payment gateway, tidak membuat QRIS dinamis, tidak menerima webhook, dan tidak menyimpan kredensial pembayaran.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, React Router, Recharts, Lucide React
- **Backend**: Node.js, Express.js (ES Modules), Prisma ORM, Zod, ExcelJS, Helmet, CORS, Express-Session, Bcrypt
- **Database**: PostgreSQL
- **Testing**: Vitest, Supertest

---

## 🚀 Panduan Menjalankan Aplikasi

### 1. Prasyarat
- Node.js (v18+) & npm
- PostgreSQL (aktif pada port `5433` atau `5432`)

### 2. Instalasi Dependensi
Jalankan di root folder:
```bash
cd kasir-seblak
npm install
```

### 3. Migrasi & Seeding Database Demo
```bash
cd apps/api
npx prisma db push
npm run db:seed
```

### 4. Menjalankan Backend API
```bash
cd apps/api
npm run dev
# Server berjalan di http://localhost:5000 (API: http://localhost:5000/api/v1)
```

### 5. Menjalankan Frontend Web
Buka terminal baru:
```bash
cd apps/web
npm run dev
# Aplikasi web kasir dapat diakses di http://localhost:5173
```

---

## 💳 Metode Pembayaran

### CASH
1. Kasir memilih **CASH**.
2. Sistem menampilkan total tagihan.
3. Kasir memasukkan nominal uang diterima.
4. Sistem menghitung **Kembalian = Uang diterima − Total tagihan**.
5. Tombol **Selesaikan Transaksi** nonaktif jika uang diterima kurang dari total.
6. Pembayaran disimpan dengan metode `CASH`, status `PAID`, nominal diterima, dan kembalian.

### QRIS
1. Kasir memilih **QRIS**.
2. Kasir memastikan pelanggan sudah membayar melalui aplikasi merchant/m-banking **di luar aplikasi**.
3. Kasir mencentang konfirmasi pemeriksaan manual.
4. Tombol **Selesaikan Transaksi** menyimpan pembayaran dengan metode `QRIS`, status `PAID`, tanpa input nominal diterima dan tanpa QR code.
5. Stok bahan baku langsung dikurangi berdasarkan resep.

Kedua metode menggunakan database transaction yang sama: transaksi, detail produk/topping, snapshot harga & HPP, pembayaran, pengurangan stok, inventory movement, dan audit log disimpan sekaligus.

---

## 🔑 Akun Demo Siap Pakai

| Role | Email | Password | Hak Akses |
| :--- | :--- | :--- | :--- |
| **Pemilik (OWNER)** | `owner@seblak.com` | `owner123` | Akses seluruh fitur: Dashboard, Menu, Topping, Inventaris, Pembelian, Keuangan, Laporan, & Pengaturan |
| **Kasir (CASHIER)** | `kasir@seblak.com` | `kasir123` | Akses kasir POS, riwayat transaksi penjualan, dan pembukaan/penutupan shift laci kasir |

---

## 📂 Struktur Monorepo

```text
kasir-seblak/
├── apps/
│   ├── web/                     # Frontend React + Vite + Tailwind
│   │   ├── src/
│   │   │   ├── app/             # Router & ProtectedRoute
│   │   │   ├── components/      # MainLayout & UI components
│   │   │   ├── features/        # Modul halaman (POS, Menu, Toppings, Reports, dll.)
│   │   │   ├── hooks/           # useAuth (Session management)
│   │   │   └── lib/             # api.js, currency.js, date.js
│   │   └── package.json
│   │
│   └── api/                     # Backend Express.js + Prisma ORM
│       ├── prisma/              # Schema & Seeding data demo
│       ├── src/
│       │   ├── config/          # Database & environment variables
│       │   ├── middleware/      # Auth, Role guard, Error handler
│       │   └── modules/         # Auth, Menu, Toppings, Sales, Purchases, Reports, dll.
│       ├── test/                # Test suite Vitest & Supertest
│       └── package.json
│
├── docs/                        # Dokumentasi teknis terperinci
│   ├── DATABASE.md              # Skema relasi database PostgreSQL
│   ├── ACCOUNTING_RULES.md      # Rumus HPP & aturan akuntansi laba rugi
│   ├── PAYMENT.md               # Alur pencatatan CASH & QRIS manual
│   └── TESTING.md               # Laporan hasil pengujian otomatis
├── docker-compose.yml
└── README.md
```

---

## 🧪 Menjalankan Pengujian Otomatis

Untuk menjalankan seluruh test suite:
```bash
cd apps/api
npm test
```

Pengujian mencakup penyimpanan CASH dan QRIS, perhitungan kembalian, validasi nominal kurang, QRIS tanpa nominal diterima, pengurangan stok sesuai resep, laporan dashboard yang terpisah per metode, pencegahan transaksi ganda, serta kolom metode pembayaran pada ekspor Excel.
