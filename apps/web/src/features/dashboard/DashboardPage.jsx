import { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { formatRupiah } from '../../lib/currency.js';
import { formatDateTime } from '../../lib/date.js';
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Package,
  Layers,
  Receipt,
  Clock,
  Sparkles,
  Banknote,
  QrCode,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('today');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/dashboard?period=${period}`);
      setData(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Gagal memuat ringkasan dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <p className="text-sm text-slate-500">Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="font-bold">Terjadi Kesalahan</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const summary = data?.summary || {
    omzet: 0,
    totalTransactions: 0,
    totalPortions: 0,
    cogs: 0,
    grossProfit: 0,
    netProfit: 0,
    cashInDrawer: 0,
    stockValue: 0,
    cashRevenue: 0,
    qrisRevenue: 0,
    cashTransactions: 0,
    qrisTransactions: 0,
    cashPercentage: 0,
    qrisPercentage: 0,
  };

  const paymentMethods = data?.paymentBreakdown?.methods || [
    { method: 'CASH', total: 0, count: 0, percentage: 0 },
    { method: 'QRIS', total: 0, count: 0, percentage: 0 },
  ];
  const cashPayment = paymentMethods.find((item) => item.method === 'CASH');
  const qrisPayment = paymentMethods.find((item) => item.method === 'QRIS');

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard Bisnis Seblak</h1>
          <p className="text-sm text-slate-500">
            Ringkasan performa penjualan, HPP bahan baku, stok, dan keuntungan
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-white p-1 border border-slate-200 shadow-sm">
          {[
            { id: 'today', label: 'Hari Ini' },
            { id: 'week', label: 'Minggu Ini' },
            { id: 'month', label: 'Bulan Ini' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                period === item.id
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Omzet */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Omzet</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-800">{formatRupiah(summary.omzet)}</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <Receipt className="h-3.5 w-3.5 text-slate-400" />
            <span>{summary.totalTransactions} transaksi ({summary.totalPortions} porsi)</span>
          </div>
        </div>

        {/* Laba Kotor */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Laba Kotor</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-emerald-600">
            {formatRupiah(summary.grossProfit)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span>HPP: {formatRupiah(summary.cogs)}</span>
          </div>
        </div>

        {/* Laba Bersih Estimasi */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Estimasi Laba Bersih</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-blue-600">
            {formatRupiah(summary.netProfit)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span>Setelah beban operasional</span>
          </div>
        </div>

        {/* Uang di Laci / Nilai Stok */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Nilai Bahan Baku</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-amber-600">
            {formatRupiah(summary.stockValue)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>Kas Laci: {formatRupiah(summary.cashInDrawer)}</span>
          </div>
        </div>
      </div>

      {/* Payment Method Split */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-800">Pemisahan Metode Pembayaran</h2>
              <p className="text-xs text-slate-400">
                Hanya transaksi berstatus PAID yang dihitung
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
              {summary.totalTransactions} transaksi
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                <Banknote className="h-4 w-4" />
                <span>Total Pemasukan CASH</span>
              </div>
              <p className="mt-2 text-xl font-black text-slate-900">
                {formatRupiah(summary.cashRevenue)}
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px] text-emerald-700">
                <span>{summary.cashTransactions} transaksi</span>
                <span className="font-bold">{summary.cashPercentage}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.min(summary.cashPercentage, 100)}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-700">
                <QrCode className="h-4 w-4" />
                <span>Total Pemasukan QRIS</span>
              </div>
              <p className="mt-2 text-xl font-black text-slate-900">
                {formatRupiah(summary.qrisRevenue)}
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px] text-purple-700">
                <span>{summary.qrisTransactions} transaksi</span>
                <span className="font-bold">{summary.qrisPercentage}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-purple-100">
                <div
                  className="h-full rounded-full bg-purple-500"
                  style={{ width: `${Math.min(summary.qrisPercentage, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.chartData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `Rp${(val / 1000).toLocaleString('id-ID')}k`}
                />
                <Tooltip
                  formatter={(val) => formatRupiah(val)}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="cash" stackId="payment" fill="#10b981" name="CASH" radius={[0, 0, 0, 0]} />
                <Bar dataKey="qris" stackId="payment" fill="#8b5cf6" name="QRIS" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-2">
            <h2 className="font-bold text-slate-800">Komposisi Pembayaran</h2>
            <p className="text-xs text-slate-400">Perbandingan CASH vs QRIS</p>
          </div>
          <div className="h-56 w-full">
            {summary.omzet > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethods}
                    dataKey="total"
                    nameKey="method"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={82}
                    paddingAngle={4}
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#8b5cf6" />
                  </Pie>
                  <Tooltip formatter={(val) => formatRupiah(val)} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                Belum ada pembayaran pada periode ini
              </div>
            )}
          </div>
          <div className="mt-2 space-y-2 text-xs">
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2">
              <span className="font-semibold text-emerald-700">CASH</span>
              <span className="font-bold text-slate-800">
                {formatRupiah(cashPayment?.total)} ({cashPayment?.percentage || 0}%)
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-purple-50 px-3 py-2">
              <span className="font-semibold text-purple-700">QRIS</span>
              <span className="font-bold text-slate-800">
                {formatRupiah(qrisPayment?.total)} ({qrisPayment?.percentage || 0}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts & Insights */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sales Chart */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-800">Tren Omzet Penjualan</h2>
              <p className="text-xs text-slate-400">Grafik pergerakan penjualan dan HPP</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.chartData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(val) => `Rp${(val / 1000).toLocaleString('id-ID')}k`}
                />
                <Tooltip
                  formatter={(val) => [formatRupiah(val), '']}
                  labelStyle={{ color: '#334155', fontWeight: 'bold' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="omzet" fill="#f97316" radius={[6, 6, 0, 0]} name="Omzet" />
                <Bar dataKey="cogs" fill="#cbd5e1" radius={[6, 6, 0, 0]} name="HPP" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Toppings */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Topping Terlaris</h2>
            <Layers className="h-4 w-4 text-orange-500" />
          </div>
          <div className="space-y-3">
            {(data?.topToppings || []).length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">Belum ada data topping terjual</p>
            ) : (
              (data?.topToppings || []).map((t, idx) => (
                <div key={t.id || idx} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-100 text-xs font-bold text-orange-600">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{t.name}</p>
                      <p className="text-[10px] text-slate-400">{t.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-800">{t.soldQty}x</p>
                    <p className="text-[10px] text-emerald-600">{formatRupiah(t.totalSales)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Lower Row: Low Stock Alerts & Recent Transactions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Low Stock Alerts */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 text-red-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <h2 className="font-bold text-slate-800">Bahan Baku Hampir Habis</h2>
            </div>
            <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600">
              {(data?.lowStockIngredients || []).length} Perlu Belanja
            </span>
          </div>

          <div className="space-y-2">
            {(data?.lowStockIngredients || []).length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">Semua stok bahan baku aman</p>
            ) : (
              (data?.lowStockIngredients || []).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50/50 p-3"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-800">{item.name}</p>
                    <p className="text-[10px] text-slate-500">
                      Min: {item.minStock} {item.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-extrabold text-red-600">
                      {item.currentStock} {item.unit}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      HPP @{formatRupiah(item.averageCost)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Penjualan Terakhir</h2>
            <Receipt className="h-4 w-4 text-slate-400" />
          </div>
          <div className="space-y-2">
            {(data?.recentSales || []).length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">Belum ada transaksi</p>
            ) : (
              (data?.recentSales || []).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800">#{sale.invoiceNumber}</p>
                    <p className="text-[10px] text-slate-400">{formatDateTime(sale.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${
                        sale.paymentMethod === 'QRIS'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {sale.paymentMethod}
                    </span>
                    <span className="text-xs font-black text-slate-800">
                      {formatRupiah(sale.totalAmount)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
