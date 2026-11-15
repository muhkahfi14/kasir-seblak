import { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { formatRupiah } from '../../lib/currency.js';
import { formatDateTime } from '../../lib/date.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import { Download, Eye, X, RotateCcw, Ban } from 'lucide-react';

export default function SalesPage() {
  const { isOwner } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detailSale, setDetailSale] = useState(null);
  const [actionProcessing, setActionProcessing] = useState(false);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (methodFilter) params.append('paymentMethod', methodFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/sales?${params.toString()}`);
      setSales(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [methodFilter, statusFilter]);

  const handleExportExcel = async () => {
    try {
      await api.download('/reports/export/sales', 'laporan-penjualan.xlsx');
    } catch (err) {
      alert('Gagal mengunduh file Excel');
    }
  };

  const handleSaleAction = async (sale, action) => {
    const label = action === 'cancel' ? 'membatalkan' : 'mengembalikan (refund)';
    if (!confirm(`Yakin ingin ${label} transaksi #${sale.saleNumber}? Stok bahan akan dikembalikan dan aksi tercatat di audit log.`)) {
      return;
    }

    try {
      setActionProcessing(true);
      await api.post(`/sales/${sale.id}/${action}`);
      setDetailSale(null);
      await fetchSales();
    } catch (err) {
      alert(err.message || 'Gagal memproses transaksi');
    } finally {
      setActionProcessing(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Riwayat Transaksi Penjualan</h1>
          <p className="text-xs text-slate-500">
            Daftar seluruh transaksi kasir, metode pembayaran, HPP riil, dan margin laba kotor
          </p>
        </div>
        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Export Excel (.xlsx)</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-3">
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
        >
          <option value="">Semua Metode Pembayaran</option>
          <option value="CASH">Tunai (Cash)</option>
          <option value="QRIS">QRIS</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
        >
          <option value="">Semua Status</option>
          <option value="COMPLETED">Berhasil (Completed)</option>
          <option value="CANCELLED">Dibatalkan</option>
          <option value="REFUNDED">Dikembalikan (Refund)</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Memuat transaksi penjualan...</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 font-semibold text-slate-600">
              <tr>
                <th className="p-4">No. Invoice</th>
                <th className="p-4">Tanggal & Jam</th>
                <th className="p-4">Kasir</th>
                <th className="p-4">Metode</th>
                <th className="p-4">Total Penjualan</th>
                <th className="p-4">Total HPP</th>
                <th className="p-4">Laba Kotor</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-slate-400">
                    Tidak ada transaksi ditemukan
                  </td>
                </tr>
              ) : (
                sales.map((sale) => {
                  const omzet = parseFloat(sale.totalAmount);
                  const hpp = parseFloat(sale.totalHpp);
                  const grossProfit = omzet - hpp;

                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/80">
                      <td className="p-4 font-bold text-slate-900">{sale.saleNumber}</td>
                      <td className="p-4 text-slate-500">{formatDateTime(sale.createdAt)}</td>
                      <td className="p-4 text-slate-700">{sale.creator?.name || 'Kasir'}</td>
                      <td className="p-4">
                        <span
                          className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${
                            sale.payment?.paymentMethod === 'QRIS'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {sale.payment?.paymentMethod || '-'}
                        </span>
                      </td>
                      <td className="p-4 font-black text-slate-900">{formatRupiah(omzet)}</td>
                      <td className="p-4 font-medium text-slate-500">{formatRupiah(hpp)}</td>
                      <td className="p-4 font-bold text-emerald-600">
                        {formatRupiah(grossProfit)}
                      </td>
                      <td className="p-4">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            sale.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-700'
                              : sale.status === 'REFUNDED'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {sale.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setDetailSale(sale)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Rincian</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {detailSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Rincian Penjualan #{detailSale.saleNumber}
                </h3>
                <p className="text-xs text-slate-400">
                  {formatDateTime(detailSale.createdAt)} • Kasir: {detailSale.creator?.name}
                </p>
              </div>
              <button
                onClick={() => setDetailSale(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 mb-4 text-xs">
              <h4 className="font-bold text-slate-700">Daftar Porsi & Topping:</h4>
              {detailSale.items?.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex justify-between font-bold text-slate-900 mb-1">
                    <span>{item.menuName}</span>
                    <span>{formatRupiah(item.subtotal)}</span>
                  </div>
                  {item.toppings?.length > 0 && (
                    <div className="mt-2 space-y-1 pl-3 border-l-2 border-orange-200 text-slate-600 text-[11px]">
                      {item.toppings.map((top) => (
                        <div key={top.id} className="flex justify-between">
                          <span>
                            • {top.toppingName} ({top.quantity}x)
                          </span>
                          <span>{formatRupiah(top.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 flex justify-between text-[10px] text-slate-400 border-t border-slate-200 pt-1">
                    <span>HPP Porsi: {formatRupiah(item.hpp)}</span>
                    <span className="text-emerald-600 font-semibold">
                      Margin: {formatRupiah(item.subtotal - item.hpp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="rounded-xl bg-slate-100 p-3 text-xs space-y-1.5 font-medium">
              <div className="flex justify-between text-slate-600">
                <span>Metode Pembayaran:</span>
                <span className="font-bold">{detailSale.payment?.paymentMethod || '-'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Status Pembayaran:</span>
                <span className="font-bold">{detailSale.payment?.status || '-'}</span>
              </div>
              {detailSale.payment?.paymentMethod === 'CASH' && (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Uang Diterima:</span>
                    <span className="font-bold">
                      {formatRupiah(detailSale.payment?.amountReceived)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Kembalian:</span>
                    <span className="font-bold">
                      {formatRupiah(detailSale.payment?.changeAmount)}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Total Omzet:</span>
                <span className="font-bold text-slate-900">{formatRupiah(detailSale.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total HPP Bahan:</span>
                <span className="font-bold text-slate-700">{formatRupiah(detailSale.totalHpp)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 text-emerald-700 font-black">
                <span>Laba Kotor Transaksi:</span>
                <span>{formatRupiah(detailSale.totalAmount - detailSale.totalHpp)}</span>
              </div>
            </div>

            {isOwner && detailSale.status === 'COMPLETED' && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleSaleAction(detailSale, 'refund')}
                  disabled={actionProcessing}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Refund</span>
                </button>
                <button
                  onClick={() => handleSaleAction(detailSale, 'cancel')}
                  disabled={actionProcessing}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-300 bg-red-50 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  <Ban className="h-4 w-4" />
                  <span>Batalkan</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
