# Dokumentasi Pengujian (Testing) Kasir Seblak Prasmanan

Pengujian otomatis mencakup pengujian integrasi backend menggunakan **Vitest** dan **Supertest**, dengan database PostgreSQL.

## 1. Menjalankan Pengujian

Jalankan perintah berikut di folder backend:

```bash
cd kasir-seblak/apps/api
npm test
```

Pastikan database sudah dimigrasikan dan di-seed terlebih dahulu:

```bash
npx prisma db push
npm run db:seed
```

## 2. Cakupan Pengujian

1. **`test/health.test.js`**:
   - Memastikan server API berjalan dan merespons `200 OK` pada endpoint `GET /api/v1/health`.
   - Memastikan penanganan rute tidak terdaftar mengembalikan status `404 Not Found`.

2. **`test/auth.test.js`**:
   - Menolak login dengan kredensial password salah (`401 Unauthorized`).
   - Berhasil autentikasi dengan akun demo pemilik (`owner@seblak.com`) dan menetapkan session cookie.
   - Mengambil profil pengguna aktif pada `GET /api/v1/auth/me`.
   - Mengakhiri sesi pengguna pada `POST /api/v1/auth/logout`.

3. **`test/pos.test.js`**:
   - Mengambil daftar topping aktif prasmanan dan menu aktif.
   - Menolak CASH jika uang diterima kurang dari total tagihan.
   - Menyimpan transaksi CASH dengan metode `CASH`, status pembayaran `PAID`, nominal diterima, dan kembalian yang benar.
   - Memastikan klik ganda dengan `clientRequestId` yang sama tidak membuat pembayaran/transaksi kedua.
   - Mewajibkan konfirmasi manual pada pembayaran QRIS.
   - Menyimpan transaksi QRIS dengan metode `QRIS`, status `PAID`, serta `amountReceived` dan `changeAmount` bernilai `NULL`.
   - Memastikan stok bahan baku berkurang sesuai resep dan `InventoryMovement` tercatat untuk CASH maupun QRIS.
   - Memastikan dashboard memisahkan total, jumlah transaksi, dan persentase CASH vs QRIS dengan akurat.
   - Memastikan filter metode pembayaran pada laporan laba rugi hanya menghitung pembayaran `PAID`.
   - Memastikan ekspor Excel memiliki kolom **Metode Pembayaran** dan isinya sesuai filter.
   - Memastikan pembatalan transaksi tidak menghapus data, mengubah status menjadi `CANCELLED`, mengembalikan stok, dan menulis audit log.

## 3. Hasil Pengujian Terverifikasi

```text
✓ test/health.test.js (2 tests)
✓ test/auth.test.js (4 tests)
✓ test/pos.test.js (9 tests)

Test Files  3 passed (3)
Tests       15 passed (15)
```

Semua 15 pengujian berhasil tanpa kegagalan.
