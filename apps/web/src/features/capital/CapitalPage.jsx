import { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { formatRupiah } from '../../lib/currency.js';
import { formatDateTime } from '../../lib/date.js';
import { Plus, Landmark, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

export default function CapitalPage() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalDeposited: 0, totalWithdrawn: 0, currentBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    type: 'DEPOSIT',
    amount: '',
    description: '',
    reference: '',
  });

  const fetchCapital = async () => {
    try {
      setLoading(true);
      const res = await api.get('/capital');
      setTransactions(res.data || []);
      if (res.summary) setSummary(res.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCapital();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/capital', {
        ...formData,
        amount: parseFloat(formData.amount),
      });
      setShowModal(false);
      setFormData({ type: 'DEPOSIT', amount: '', description: '', reference: '' });
      fetchCapital();
    } catch (err) {
      alert(err.message || 'Gagal menyimpan transaksi modal');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Modal & Prive Pemilik</h1>
          <p className="text-xs text-slate-500">
            Pencatatan setoran modal awal, penambahan dana, dan penarikan pribadi pemilik (prive)
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Transaksi Modal</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Modal Disetor</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <ArrowDownCircle className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-800">
            {formatRupiah(summary.totalDeposited)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Penarikan Pribadi (Prive)</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <ArrowUpCircle className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-amber-600">
            {formatRupiah(summary.totalWithdrawn)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Posisi Modal Bersih</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Landmark className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-blue-600">
            {formatRupiah(summary.currentBalance)}
          </p>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Memuat transaksi modal...</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 font-semibold text-slate-600">
              <tr>
                <th className="p-4">Tanggal</th>
                <th className="p-4">Jenis</th>
                <th className="p-4">Keterangan</th>
                <th className="p-4">Referensi Bank/Bukti</th>
                <th className="p-4">Nominal</th>
                <th className="p-4">Dicatat Oleh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">
                    Belum ada riwayat transaksi modal
                  </td>
                </tr>
              ) : (
                transactions.map((t) => {
                  const isDeposit = t.type === 'DEPOSIT' || t.type === 'CASH_ADDITION';
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80">
                      <td className="p-4 text-slate-500">{formatDateTime(t.createdAt)}</td>
                      <td className="p-4">
                        <span
                          className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${
                            isDeposit
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {isDeposit ? 'SETORAN MODAL' : 'PRIVE / PENARIKAN'}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-900">{t.description}</td>
                      <td className="p-4 text-slate-500">{t.reference || '-'}</td>
                      <td
                        className={`p-4 font-black ${
                          isDeposit ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {isDeposit ? '+' : '-'} {formatRupiah(t.amount)}
                      </td>
                      <td className="p-4 text-slate-500">{t.creator?.name || 'Owner'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-800 mb-4">Catat Transaksi Modal</h3>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jenis Transaksi</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-500"
                >
                  <option value="DEPOSIT">Setoran Modal Usaha (+)</option>
                  <option value="CASH_ADDITION">Tambahan Kas Laci (+)</option>
                  <option value="WITHDRAWAL">Prive / Penarikan Pemilik (-)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 1000000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan / Tujuan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tambahan modal belanja bahan awal bulan"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Referensi / Bukti Transfer</label>
                <input
                  type="text"
                  placeholder="BCA Trf #8912..."
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-orange-500 px-4 py-2 font-bold text-white hover:bg-orange-600"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
