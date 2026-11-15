import { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { formatRupiah } from '../../lib/currency.js';
import { formatDateTime } from '../../lib/date.js';
import { Plus, Trash2, Wallet, DollarSign } from 'lucide-react';

const CATEGORIES = [
  { id: 'GAS', label: 'Gas LPG' },
  { id: 'ELECTRICITY_WATER', label: 'Listrik & Air' },
  { id: 'RENT', label: 'Sewa Tempat' },
  { id: 'SALARY', label: 'Gaji Karyawan' },
  { id: 'PACKAGING', label: 'Kemasan & Plastik' },
  { id: 'TRANSPORT', label: 'Transport & Bensin' },
  { id: 'CLEANING', label: 'Kebersihan & Sabun' },
  { id: 'MAINTENANCE', label: 'Perbaikan Alat' },
  { id: 'OTHER', label: 'Lain-lain' },
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCat, setSelectedCat] = useState('');

  const [formData, setFormData] = useState({
    category: 'GAS',
    description: '',
    amount: '',
    paymentMethod: 'CASH',
    notes: '',
  });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const url = selectedCat ? `/expenses?category=${selectedCat}` : '/expenses';
      const res = await api.get(url);
      setExpenses(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [selectedCat]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenses', {
        ...formData,
        amount: parseFloat(formData.amount),
      });
      setShowModal(false);
      setFormData({
        category: 'GAS',
        description: '',
        amount: '',
        paymentMethod: 'CASH',
        notes: '',
      });
      fetchExpenses();
    } catch (err) {
      alert(err.message || 'Gagal menyimpan pengeluaran');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus pengeluaran ini?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      fetchExpenses();
    } catch (err) {
      alert(err.message || 'Gagal menghapus');
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Biaya & Pengeluaran Operasional</h1>
          <p className="text-xs text-slate-500">
            Catat semua beban operasional di luar belanja bahan baku (Gas LPG, listrik, sewa, gaji, kemasan)
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Pengeluaran</span>
        </button>
      </div>

      {/* KPI Card */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Total Pengeluaran Tercatat</p>
            <p className="text-2xl font-black text-slate-900">{formatRupiah(totalExpenses)}</p>
          </div>
        </div>
        <select
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
        >
          <option value="">Semua Kategori</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Memuat pengeluaran...</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 font-semibold text-slate-600">
              <tr>
                <th className="p-4">Tanggal</th>
                <th className="p-4">Kategori</th>
                <th className="p-4">Deskripsi</th>
                <th className="p-4">Metode Bayar</th>
                <th className="p-4">Nominal</th>
                <th className="p-4">Dicatat Oleh</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    Belum ada pengeluaran dicatat
                  </td>
                </tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/80">
                    <td className="p-4 text-slate-500">{formatDateTime(e.createdAt)}</td>
                    <td className="p-4">
                      <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                        {CATEGORIES.find((c) => c.id === e.category)?.label || e.category}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-900">{e.description}</td>
                    <td className="p-4 text-slate-600">{e.paymentMethod}</td>
                    <td className="p-4 font-black text-red-600">{formatRupiah(e.amount)}</td>
                    <td className="p-4 text-slate-500">{e.creator?.name || 'Admin'}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="p-1 rounded text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-800 mb-4">Catat Pengeluaran Baru</h3>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kategori Pengeluaran</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi Biaya</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Isi ulang 2 tabung gas 3kg"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jumlah Nominal (Rp)</label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 44000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sumber Pembayaran</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-500"
                >
                  <option value="CASH">Uang Kas Kasir (Tunai)</option>
                  <option value="QRIS">Rekening / Non-Tunai</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  placeholder="Keterangan bon / nota..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                  Simpan Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
