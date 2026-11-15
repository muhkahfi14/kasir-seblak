import { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { formatRupiah } from '../../lib/currency.js';
import { Plus, Edit2, Trash2, Search, Layers } from 'lucide-react';

const TOPPING_CATEGORIES = [
  'Kerupuk',
  'Mie & Pasta',
  'Bakso & Sosis',
  'Frozen Food & Seafood',
  'Sayuran & Jamur',
  'Lainnya',
];

export default function ToppingsPage() {
  const [toppings, setToppings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: TOPPING_CATEGORIES[0],
    price: '',
    isAvailable: true,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/toppings');
      setToppings(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        category: item.category || TOPPING_CATEGORIES[0],
        price: item.price,
        isAvailable: item.isAvailable,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        category: TOPPING_CATEGORIES[0],
        price: '',
        isAvailable: true,
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
      };
      if (editingItem) {
        await api.put(`/toppings/${editingItem.id}`, payload);
      } else {
        await api.post('/toppings', payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Gagal menyimpan topping');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus topping ini?')) return;
    try {
      await api.delete(`/toppings/${id}`);
      fetchData();
    } catch (err) {
      alert(err.message || 'Gagal menghapus');
    }
  };

  const filtered = toppings.filter((t) => {
    const matchCat = selectedCat === 'ALL' || t.category === selectedCat;
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Master Topping Prasmanan</h1>
          <p className="text-xs text-slate-500">Kelola harga satuan dan status ketersediaan topping seblak</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Topping</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2">
          <Search className="h-4 w-4 text-slate-400 ml-2" />
          <input
            type="text"
            placeholder="Cari topping seblak..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs outline-none bg-transparent"
          />
        </div>
        <select
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
        >
          <option value="ALL">Semua Kategori</option>
          {TOPPING_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Memuat topping...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-semibold text-slate-400">{item.category}</span>
                <h3 className="font-bold text-slate-800 text-xs mt-0.5 line-clamp-2">{item.name}</h3>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-orange-600">
                    {formatRupiah(item.price)}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenModal(item)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-600"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 hover:bg-red-50 rounded text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-800 mb-4">
              {editingItem ? 'Edit Topping' : 'Tambah Topping'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Topping</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kerupuk Bintang"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-500"
                >
                  {TOPPING_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Harga per Porsi (Rp)</label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 2500"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
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
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
