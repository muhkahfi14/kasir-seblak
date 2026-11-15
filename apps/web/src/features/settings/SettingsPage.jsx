import { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { Store, Users, QrCode, Plus, CheckCircle, ShieldCheck } from 'lucide-react';

export default function SettingsPage() {
  const [storeData, setStoreData] = useState({ name: '', address: '', phone: '' });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New user form
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CASHIER',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [storeRes, usersRes] = await Promise.all([
        api.get('/settings/store'),
        api.get('/settings/users'),
      ]);
      setStoreData(storeRes.data || { name: '', address: '', phone: '' });
      setUsers(usersRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveStore = async (e) => {
    e.preventDefault();
    try {
      await api.put('/settings/store', storeData);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert(err.message || 'Gagal menyimpan pengaturan toko');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/settings/users', newUser);
      setShowAddUserModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'CASHIER' });
      fetchData();
    } catch (err) {
      alert(err.message || 'Gagal membuat pengguna');
    }
  };

  const handleToggleUser = async (id) => {
    try {
      await api.patch(`/settings/users/${id}/toggle`);
      fetchData();
    } catch (err) {
      alert(err.message || 'Gagal mengubah status');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Pengaturan Sistem</h1>
        <p className="text-xs text-slate-500">
          Kelola identitas usaha seblak, informasi struk, staf kasir, dan pembayaran QRIS
        </p>
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-700 border border-emerald-100">
          <CheckCircle className="h-4 w-4" />
          <span>Pengaturan toko berhasil diperbarui!</span>
        </div>
      )}

      {/* Profil Toko */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-4">
          <Store className="h-5 w-5 text-orange-500" />
          <h2 className="text-base font-bold text-slate-800">Informasi Usaha & Struk Kasir</h2>
        </div>

        <form onSubmit={handleSaveStore} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Usaha Kuliner</label>
            <input
              type="text"
              required
              value={storeData.name}
              onChange={(e) => setStoreData({ ...storeData, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-500 font-bold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon / WhatsApp</label>
              <input
                type="text"
                value={storeData.phone || ''}
                onChange={(e) => setStoreData({ ...storeData, phone: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Alamat Outlet / Warung</label>
              <input
                type="text"
                value={storeData.address || ''}
                onChange={(e) => setStoreData({ ...storeData, address: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="rounded-xl bg-orange-500 px-5 py-2.5 font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600"
          >
            Simpan Perubahan Toko
          </button>
        </form>
      </div>

      {/* Kelola Pengguna / Kasir */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <Users className="h-5 w-5 text-orange-500" />
            <h2 className="text-base font-bold text-slate-800">Manajemen Pengguna & Staf Kasir</h2>
          </div>
          <button
            onClick={() => setShowAddUserModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Kasir</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 font-semibold text-slate-600">
              <tr>
                <th className="p-3">Nama Pegawai</th>
                <th className="p-3">Email Akun</th>
                <th className="p-3">Peran (Role)</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="p-3 font-bold text-slate-800">{u.name}</td>
                  <td className="p-3 text-slate-500">{u.email}</td>
                  <td className="p-3">
                    <span
                      className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${
                        u.role === 'OWNER'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {u.role === 'OWNER' ? 'PEMILIK' : 'KASIR'}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        u.isActive ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'
                      }`}
                    >
                      {u.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {u.role !== 'OWNER' && (
                      <button
                        onClick={() => handleToggleUser(u.id)}
                        className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 underline"
                      >
                        {u.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Payment Methods */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-3">
          <QrCode className="h-5 w-5 text-purple-600" />
          <h2 className="text-base font-bold text-slate-800">Metode Pembayaran</h2>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-700 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="font-bold text-emerald-700">CASH</p>
              <p className="mt-1 text-[11px] text-emerald-700">
                Kasir memasukkan uang diterima, sistem menghitung kembalian.
              </p>
            </div>
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-3">
              <p className="font-bold text-purple-700">QRIS</p>
              <p className="mt-1 text-[11px] text-purple-700">
                Pembayaran diperiksa manual oleh kasir, lalu dicatat sebagai QRIS.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-xl bg-white p-3 text-[11px] text-slate-600">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <p>
              Aplikasi hanya mencatat metode pembayaran ke database. Tidak ada payment gateway,
              webhook, QRIS dinamis, API key, atau verifikasi pembayaran otomatis.
            </p>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-800 mb-4">Tambah Pegawai Kasir</h3>
            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Siti Nurhaliza"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Login</label>
                <input
                  type="email"
                  required
                  placeholder="kasir2@seblak.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-orange-500 px-4 py-2 font-bold text-white hover:bg-orange-600"
                >
                  Simpan Kasir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
