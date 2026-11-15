import { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { formatRupiah } from '../../lib/currency.js';
import { Download, Banknote, QrCode } from 'lucide-react';

export default function ReportsPage() {
  const [pnlData, setPnlData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');

  const fetchPnl = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (paymentMethodFilter) params.append('paymentMethod', paymentMethodFilter);

      const res = await api.get(`/reports/pnl?${params.toString()}`);
      setPnlData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPnl();
  }, [startDate, endDate, paymentMethodFilter]);

  const handleExportSales = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (paymentMethodFilter) params.append('paymentMethod', paymentMethodFilter);

      const query = params.toString();
      await api.download(
        `/reports/export/sales${query ? `?${query}` : ''}`,
        'laporan-penjualan.xlsx'
      );
    } catch {
      alert('Gagal mengunduh laporan penjualan');
    }
  };

  const handleExportInventory = async () => {
    try {
      await api.download('/reports/export/inventory', 'laporan-stok-bahan.xlsx');
    } catch {
      alert('Gagal mengunduh laporan stok');
    }
  };

  const pnl = pnlData || {
    revenue: 0,
    cogs: 0,
    grossProfit: 0,
    totalExpenses: 0,
    netProfit: 0,
    expenseBreakdown: {},
  };

  const grossMarginPercent = pnl.revenue > 0 ? ((pnl.grossProfit / pnl.revenue) * 100).toFixed(1) : 0;
  const netMarginPercent = pnl.revenue > 0 ? ((pnl.netProfit / pnl.revenue) * 100).toFixed(1) : 0;
  const paymentMethods = pnl.paymentBreakdown?.methods || [
    { method: 'CASH', total: 0, count: 0, percentage: 0 },
    { method: 'QRIS', total: 0, count: 0, percentage: 0 },
  ];
  const cashPayment = paymentMethods.find((item) => item.method === 'CASH');
  const qrisPayment = paymentMethods.find((item) => item.method === 'QRIS');

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Laporan Keuangan & Laba Rugi</h1>
          <p className="text-xs text-slate-500">
            Laporan akuntansi terintegrasi: Pendapatan, HPP bahan baku riil, beban operasional, dan laba bersih
          </p>
        </div>

        {/* Excel Export Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportSales}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
          >
            <Download className="h-4 w-4" />
            <span>Excel Penjualan</span>
          </button>
          <button
            onClick={handleExportInventory}
            className="flex items-center gap-1.5 rounded-xl border border-blue-300 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100"
          >
            <Download className="h-4 w-4" />
            <span>Excel Valuasi Stok</span>
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm text-xs">
        <span className="font-semibold text-slate-600">Rentang Tanggal:</span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 p-2 outline-none font-medium"
        />
        <span className="text-slate-400">s/d</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 p-2 outline-none font-medium"
        />
        <span className="font-semibold text-slate-600">Metode:</span>
        <select
          value={paymentMethodFilter}
          onChange={(e) => setPaymentMethodFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 p-2 font-medium outline-none"
        >
          <option value="">Semua Metode</option>
          <option value="CASH">CASH</option>
          <option value="QRIS">QRIS</option>
        </select>
        {(startDate || endDate || paymentMethodFilter) && (
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setPaymentMethodFilter('');
            }}
            className="text-xs text-orange-600 hover:underline"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* Payment Method Breakdown */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Pemasukan CASH</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <Banknote className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl font-black text-slate-900">{formatRupiah(cashPayment?.total)}</p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>{cashPayment?.count || 0} transaksi</span>
            <span className="font-bold text-emerald-600">{cashPayment?.percentage || 0}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${Math.min(cashPayment?.percentage || 0, 100)}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Pemasukan QRIS</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
              <QrCode className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl font-black text-slate-900">{formatRupiah(qrisPayment?.total)}</p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>{qrisPayment?.count || 0} transaksi</span>
            <span className="font-bold text-purple-600">{qrisPayment?.percentage || 0}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-purple-500"
              style={{ width: `${Math.min(qrisPayment?.percentage || 0, 100)}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Total Pembayaran PAID</span>
          <p className="mt-2 text-xl font-black text-slate-900">
            {formatRupiah(pnl.paymentBreakdown?.total || 0)}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>{pnl.totalTransactions || 0} transaksi valid</span>
            <span className="font-bold text-slate-700">
              Filter: {paymentMethodFilter || 'SEMUA'}
            </span>
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-slate-400">
            Hanya pembayaran berstatus PAID yang masuk ke omzet dan laporan.
          </p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Total Omzet (Pendapatan)</span>
          <p className="mt-2 text-2xl font-black text-slate-900">{formatRupiah(pnl.revenue)}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Total HPP Bahan Baku</span>
          <p className="mt-2 text-2xl font-black text-slate-700">{formatRupiah(pnl.cogs)}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Laba Kotor (Gross Profit)</span>
          <p className="mt-2 text-2xl font-black text-emerald-600">{formatRupiah(pnl.grossProfit)}</p>
          <span className="text-[10px] text-slate-400">Margin: {grossMarginPercent}%</span>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Laba Bersih (Net Profit)</span>
          <p className="mt-2 text-2xl font-black text-blue-600">{formatRupiah(pnl.netProfit)}</p>
          <span className="text-[10px] text-slate-400">Net Margin: {netMarginPercent}%</span>
        </div>
      </div>

      {/* Profit & Loss Statement (Format Laporan Resmi) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="border-b border-slate-100 pb-4 mb-4">
            <h3 className="text-base font-bold text-slate-800">Laporan Laba Rugi Komprehensif</h3>
            <p className="text-xs text-slate-400">Standar Laba Rugi Kuliner Seblak Prasmanan</p>
          </div>

          <div className="space-y-3 text-xs">
            {/* Revenue */}
            <div className="flex justify-between py-2 border-b border-slate-100 font-bold text-slate-800">
              <span>(1) Pendapatan Penjualan Bersih</span>
              <span className="text-sm">{formatRupiah(pnl.revenue)}</span>
            </div>

            {/* COGS */}
            <div className="flex justify-between py-2 border-b border-slate-100 text-slate-600">
              <span className="pl-4">• Harga Pokok Penjualan (HPP Bahan Terpakai)</span>
              <span>({formatRupiah(pnl.cogs)})</span>
            </div>

            {/* Gross Profit */}
            <div className="flex justify-between py-2.5 border-b border-slate-200 font-extrabold text-emerald-700 bg-emerald-50/50 px-3 rounded-lg">
              <span>LABA KOTOR (1 - 2)</span>
              <span className="text-sm">{formatRupiah(pnl.grossProfit)}</span>
            </div>

            {/* Operating Expenses Breakdown */}
            <div className="py-2">
              <span className="font-bold text-slate-700 block mb-2">(3) Beban Operasional:</span>
              <div className="space-y-1.5 pl-4 text-slate-600">
                {Object.keys(pnl.expenseBreakdown).length === 0 ? (
                  <p className="text-slate-400 italic">Tidak ada pengeluaran operasional pada periode ini</p>
                ) : (
                  Object.entries(pnl.expenseBreakdown).map(([cat, amt]) => (
                    <div key={cat} className="flex justify-between">
                      <span>• {cat}</span>
                      <span>({formatRupiah(amt)})</span>
                    </div>
                  ))
                )}
                <div className="flex justify-between pt-2 border-t border-slate-100 font-bold text-red-600">
                  <span>Total Beban Operasional</span>
                  <span>({formatRupiah(pnl.totalExpenses)})</span>
                </div>
              </div>
            </div>

            {/* Net Profit */}
            <div className="flex justify-between py-3 border-t-2 border-slate-900 font-black text-slate-900 bg-slate-50 px-3 rounded-xl text-sm">
              <span>ESTIMASI LABA BERSIH BERJALAN</span>
              <span className="text-blue-600">{formatRupiah(pnl.netProfit)}</span>
            </div>
          </div>
        </div>

        {/* Expense Composition */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="border-b border-slate-100 pb-4 mb-4">
            <h3 className="text-base font-bold text-slate-800">Komposisi Beban</h3>
            <p className="text-xs text-slate-400">Rincian beban operasional</p>
          </div>

          <div className="space-y-3 text-xs">
            {Object.entries(pnl.expenseBreakdown).map(([cat, amt]) => {
              const pct = pnl.totalExpenses > 0 ? ((amt / pnl.totalExpenses) * 100).toFixed(0) : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span className="font-medium">{cat}</span>
                    <span className="font-bold">{formatRupiah(amt)} ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
