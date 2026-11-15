import { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { formatRupiah } from '../../lib/currency.js';
import { formatDateTime } from '../../lib/date.js';
import { Plus, Trash2, Truck, Eye, X } from 'lucide-react';

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [detailModal, setDetailModal] = useState(null);

  // Form
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([
    { ingredientId: '', quantity: '', pricePerUnit: '', unit: 'gram' },
  ]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [purRes, supRes, ingRes] = await Promise.all([
        api.get('/purchases'),
        api.get('/purchases/suppliers'),
        api.get('/ingredients'),
      ]);
      setPurchases(purRes.data || []);
      setSuppliers(supRes.data || []);
      setIngredients(ingRes.data || []);
      if (supRes.data?.length) setSupplierId(supRes.data[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItemRow = () => {
    setItems([...items, { ingredientId: '', quantity: '', pricePerUnit: '', unit: 'gram' }]);
  };

  const handleRemoveItemRow = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, value) => {
    const updated = [...items];
    updated[idx][field] = value;

    if (field === 'ingredientId') {
      const ing = ingredients.find((i) => i.id === value);
      if (ing) {
        updated[idx].unit = ing.unit;
        if (!updated[idx].pricePerUnit) {
          updated[idx].pricePerUnit = ing.avgCost;
        }
      }
    }
    setItems(updated);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const q = parseFloat(item.quantity) || 0;
      const p = parseFloat(item.pricePerUnit) || 0;
      return sum + q * p;
    }, 0);
  };

  const handleSavePurchase = async (e) => {
    e.preventDefault();
    try {
      const validItems = items.filter(
        (i) => i.ingredientId && parseFloat(i.quantity) > 0 && parseFloat(i.pricePerUnit) >= 0
      );

      if (validItems.length === 0) {
        alert('Tambahkan setidaknya satu item bahan baku');
        return;
      }

      await api.post('/purchases', {
        supplierId: supplierId || null,
        notes,
        items: validItems,
      });

      setShowModal(false);
      setItems([{ ingredientId: '', quantity: '', pricePerUnit: '', unit: 'gram' }]);
      setNotes('');
      fetchData();
    } catch (err) {
      alert(err.message || 'Gagal menyimpan pembelian');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pembelian Bahan Baku</h1>
          <p className="text-xs text-slate-500">
            Catat belanja bahan baku dari supplier, otomatis perbarui stok dan HPP rata-rata
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600"
        >
          <Plus className="h-4 w-4" />
          <span>Catat Belanja Bahan</span>
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Memuat riwayat pembelian...</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 font-semibold text-slate-600">
              <tr>
                <th className="p-4">No. PO</th>
                <th className="p-4">Tanggal</th>
                <th className="p-4">Supplier</th>
                <th className="p-4">Jumlah Item</th>
                <th className="p-4">Total Biaya</th>
                <th className="p-4">Dicatat Oleh</th>
                <th className="p-4 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    Belum ada riwayat pembelian bahan baku
                  </td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="p-4 font-bold text-slate-900">{p.purchaseNumber}</td>
                    <td className="p-4 text-slate-500">{formatDateTime(p.createdAt)}</td>
                    <td className="p-4 font-medium text-slate-800">{p.supplier?.name || '-'}</td>
                    <td className="p-4 text-slate-600">{p.items?.length || 0} bahan</td>
                    <td className="p-4 font-extrabold text-slate-900">
                      {formatRupiah(p.totalAmount)}
                    </td>
                    <td className="p-4 text-slate-500">{p.creator?.name || 'Admin'}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setDetailModal(p)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Rincian</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-800 mb-1">Catat Pembelian Bahan Baku</h3>
            <p className="text-xs text-slate-500 mb-4">
              Stok bahan baku akan bertambah dan HPP rata-rata akan dihitung otomatis
            </p>

            <form onSubmit={handleSavePurchase} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Supplier</label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-500"
                  >
                    <option value="">Pilih Supplier...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Catatan / Keterangan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Belanja mingguan pasar induk"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-bold text-slate-800">Daftar Bahan yang Dibeli</label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 hover:bg-slate-200 font-semibold"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Tambah Baris</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-xl border border-slate-100 bg-slate-50"
                    >
                      <select
                        value={item.ingredientId}
                        onChange={(e) => handleItemChange(idx, 'ingredientId', e.target.value)}
                        required
                        className="flex-1 rounded-lg border border-slate-200 bg-white p-2 outline-none"
                      >
                        <option value="">Pilih Bahan Baku...</option>
                        {ingredients.map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} ({ing.unit})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        step="any"
                        placeholder="Jumlah (Qty)"
                        required
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-28 rounded-lg border border-slate-200 bg-white p-2 outline-none font-bold"
                      />

                      <input
                        type="number"
                        placeholder="Harga Satuan (Rp)"
                        required
                        value={item.pricePerUnit}
                        onChange={(e) => handleItemChange(idx, 'pricePerUnit', e.target.value)}
                        className="w-36 rounded-lg border border-slate-200 bg-white p-2 outline-none font-bold"
                      />

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total & Submit */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <div>
                  <span className="text-slate-500">Estimasi Total Belanja:</span>
                  <p className="text-lg font-black text-slate-900">
                    {formatRupiah(calculateTotal())}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-slate-600 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-orange-500 px-5 py-2 font-bold text-white hover:bg-orange-600"
                  >
                    Simpan & Tambah Stok
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Rincian Pembelian #{detailModal.purchaseNumber}
                </h3>
                <p className="text-xs text-slate-400">
                  {formatDateTime(detailModal.createdAt)} • {detailModal.supplier?.name}
                </p>
              </div>
              <button
                onClick={() => setDetailModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {detailModal.items?.map((i) => (
                <div
                  key={i.id}
                  className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-800">{i.ingredient?.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {i.quantity} {i.unit} @ {formatRupiah(i.pricePerUnit)}
                    </p>
                  </div>
                  <span className="font-extrabold text-slate-900">
                    {formatRupiah(i.totalPrice)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center border-t border-slate-100 pt-3">
              <span className="font-bold text-xs text-slate-600">Total Pembelian:</span>
              <span className="text-base font-black text-slate-900">
                {formatRupiah(detailModal.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
