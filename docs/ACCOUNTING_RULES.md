# Aturan Akuntansi & Perhitungan HPP Kasir Seblak

## 1. Rumus HPP Rata-Rata Bergerak (Weighted Average Costing)

Ketika ada pembelian bahan baku baru melalui modul **Pembelian (Purchase)**, HPP rata-rata dihitung dengan rumus:

$$\text{NewAvgCost} = \frac{(\text{StokLama} \times \text{AvgCostLama}) + (\text{QtyBeli} \times \text{HargaBeli})}{\text{StokLama} + \text{QtyBeli}}$$

Stok bahan baku bertambah sebesar $\text{QtyBeli}$.

## 2. Perhitungan HPP Penjualan (COGS)

Setiap porsi seblak prasmanan terdiri dari:
1. **Resep Dasar Porsi Seblak** (Bumbu dasar kencur, kuah, telur, cabai sesuai level pedas):
   $$\text{HPP}_{\text{dasar}} = \sum (\text{QtyBahan}_i \times \text{AvgCost}_i)$$
2. **Topping Terpilih**:
   $$\text{HPP}_{\text{topping}} = \sum (\text{QtyTopping}_j \times \text{HPP}_{\text{resep topping}_j})$$

Total HPP Transaksi:
$$\text{Total HPP} = \text{HPP}_{\text{dasar}} + \text{HPP}_{\text{topping}}$$

## 3. Laporan Laba Rugi

1. **Pendapatan Bersih (Net Revenue)**:
   Total omzet dari penjualan berstatus `COMPLETED`.
2. **Laba Kotor (Gross Profit)**:
   $$\text{Laba Kotor} = \text{Pendapatan Bersih} - \text{Total HPP}$$
3. **Laba Bersih (Net Profit)**:
   $$\text{Laba Bersih} = \text{Laba Kotor} - \text{Total Beban Operasional}$$
   *Beban operasional meliputi: Gas LPG, Listrik & Air, Sewa, Gaji Staf, Plastik & Kemasan, Transportasi, Kebersihan, dll.*

## 4. Pengelolaan Shift Kasir & Rekonsiliasi Kas Fisik

- **Uang Seharusnya di Laci Kasir**:
  $$\text{ExpectedCash} = \text{ModalAwal} + \text{PenjualanTunai} - \text{PengeluaranKasTunai}$$
- **Selisih Uang Fisik Kasir**:
  $$\text{Selisih} = \text{UangAktualHitungan} - \text{ExpectedCash}$$
  - $\text{Selisih} = 0$: Pas.
  - $\text{Selisih} > 0$: Kas Lebih (Surplus).
  - $\text{Selisih} < 0$: Kas Kurang (Defisit/Discrepancy).
