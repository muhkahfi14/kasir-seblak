import { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { formatRupiah } from '../../lib/currency.js';
import { Plus, SlidersHorizontal, AlertTriangle, Search, PackageCheck } from 'lucide-react';

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);

  // Form states
  const [addForm, setAddForm] = useState({
    name: '',
    category: 'Bahan Seblak',
    unit: 'gram',
    minStock: '',
    stock: '',
    avgCost: '',
  });

  const [adjustForm, setAdjustForm] = useState({
    actualStock: '',
    reason: 'OPNAME', // 'OPNAME' | 'WASTE' | 'CORRECTION'
    notes: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ingredients');
      setIngredients(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/ingredients', {
        ...addForm,
        minStock: parseFloat(addForm.minStock) || 0,
        stock: parseFloat(addForm.stock) || 0,
        avgCost: parseFloat(addForm.avgCost) || 0,
      });
      setShowAddModal(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Gagal menambahkan bahan baku');
    }
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/ingredients/${selectedIngredient.id}/adjust`, {
        actualStock: parseFloat(adjustForm.actualStock),
        reason: adjustForm.reason,
        notes: adjustForm.notes,
      });
      setShowAdjustModal(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Gagal menyesuaikan stok');
    }
  };

  const filtered = ingredients.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventaris & Bahan Baku</h1>
          <p className="text-xs text-slate-500">
            Monitoring stok riil, peringatan bahan menipis, HPP rata-rata bergerak, & stock opname
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Bahan Baku</span>
        </button>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2">
        <Search className="h-4 w-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Cari bahan baku (contoh: Kerupuk, Cabai, Telur)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs outline-none bg-transparent"
        />
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Memuat stok bahan baku...</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 font-semibold text-slate-600">
              <tr>
                <th className="p-4">Nama Bahan</th>
                <th className="p-4">Kategori</th>
                <th className="p-4">Stok Saat Ini</th>
                <th className="p-4">Batas Minimum</th>
                <th className="p-4">HPP Rata-rata</th>
                <th className="p-4">Total Nilai Stok</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((item) => {
                const stock = parseFloat(item.stock);
                const min = parseFloat(item.minStock);
                const avg = parseFloat(item.avgCost);
                const isLow = stock <= min;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80">
                    <td className="p-4 font-bold text-slate-900">{item.name}</td>
                    <td className="p-4 text-slate-500">{item.category}</td>
                    <td className="p-4 font-extrabold text-slate-800">
                      {stock.toLocaleString('id-ID')} {item.unit}
                    </td>
                    <td className="p-4 text-slate-500">
                      {min.toLocaleString('id-ID')} {item.unit}
                    </td>
                    <td className="p-4 font-medium text-slate-800">{formatRupiah(avg)}</td>
                    <td className="p-4 font-bold text-emerald-600">{formatRupiah(stock * avg)}</td>
                    <td className="p-4">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-700">
                          <AlertTriangle className="h-3 w-3" />
                          Menipis
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                          <PackageCheck className="h-3 w-3" />
                          Aman
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedIngredient(item);
                          setAdjustForm({
                            actualStock: stock.toString(),
                            reason: 'OPNAME',
                            notes: '',
                          });
                          setShowAdjustModal(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <SlidersHorizontal className="h-3 w-3" />
                        <span>Opname</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Adjust Modal */}
      {showAdjustModal && selectedIngredient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-800 mb-1">Stock Opname</h3>
            <p className="text-xs text-slate-500 mb-4">
              Bahan: <span className="font-bold">{selectedIngredient.name}</span> (Stok Sistem:{' '}
              {selectedIngredient.stock} {selectedIngredient.unit})
            </p>

            <form onSubmit={handleAdjust} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Stok Fisik Sebenarnya ({selectedIngredient.unit})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={adjustForm.actualStock}
                  onChange={(e) => setAdjustForm({ ...adjustForm, actualStock: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alasan Penyesuaian</label>
                <select
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-500"
                >
                  <option value="OPNAME">Stock Opname Berkala</option>
                  <option value="WASTE">Bahan Rusak / Basi / Terbuang</option>
                  <option value="CORRECTION">Koreksi Salah Input</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
                <textarea
                  rows="2"
                  placeholder="Keterangan..."
                  value={adjustForm.notes}
                  onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-orange-500 px-4 py-2 font-bold text-white hover:bg-orange-600"
                >
                  Simpan Penyesuaian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-800 mb-4">Tambah Bahan Baku Baru</h3>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Bahan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kerupuk Bawang"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    required
                    placeholder="gram / buah / kg"
                    value={addForm.unit}
                    onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                  <input
                    type="text"
                    placeholder="Bahan Seblak"
                    value={addForm.category}
                    onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    step="any"
                    value={addForm.stock}
                    onChange={(e) => setAddForm({ ...addForm, stock: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min. Stok Alert</label>
                  <input
                    type="number"
                    step="any"
                    value={addForm.minStock}
                    onChange={(e) => setAddForm({ ...addForm, minStock: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">HPP Awal (Rp)</label>
                  <input
                    type="number"
                    step="any"
                    value={addForm.avgCost}
                    onChange={(e) => setAddForm({ ...addForm, avgCost: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-orange-500 px-4 py-2 font-bold text-white hover:bg-orange-600"
                >
                  Tambah Bahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
