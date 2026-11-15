import { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { formatRupiah } from '../../lib/currency.js';
import { formatDateTime } from '../../lib/date.js';
import { Clock, Lock, Unlock, AlertCircle, CheckCircle2, DollarSign } from 'lucide-react';

export default function CashSessionsPage() {
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionsHistory, setSessionsHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [openModal, setOpenModal] = useState(false);
  const [openingCash, setOpeningCash] = useState('100000');
  const [openNotes, setOpenNotes] = useState('');

  const [closeModal, setCloseModal] = useState(false);
  const [actualCash, setActualCash] = useState('');
  const [closeNotes, setCloseNotes] = useState('');

  const fetchSessionData = async () => {
    try {
      setLoading(true);
      const [currRes, histRes] = await Promise.all([
        api.get('/cash-sessions/current'),
        api.get('/cash-sessions'),
      ]);
      setCurrentSession(currRes.data || null);
      setSessionsHistory(histRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionData();
  }, []);

  const handleOpenShift = async (e) => {
    e.preventDefault();
    try {
      await api.post('/cash-sessions/open', {
        openingCash: parseFloat(openingCash),
        notes: openNotes,
      });
      setOpenModal(false);
      fetchSessionData();
    } catch (err) {
      alert(err.message || 'Gagal membuka shift kasir');
    }
  };

  const handleCloseShift = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/cash-sessions/${currentSession.id}/close`, {
        actualCash: parseFloat(actualCash),
        notes: closeNotes,
      });
      setCloseModal(false);
      fetchSessionData();
    } catch (err) {
      alert(err.message || 'Gagal menutup shift kasir');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Shift & Laci Kasir</h1>
          <p className="text-xs text-slate-500">
            Kontrol uang kas masuk, modal kembalian awal, dan verifikasi fisik uang laci saat tutup kasir
          </p>
        </div>

        {currentSession ? (
          <button
            onClick={() => {
              setActualCash(currentSession.expectedCash.toString());
              setCloseModal(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-red-600/20 hover:bg-red-700"
          >
            <Lock className="h-4 w-4" />
            <span>Tutup Shift Kasir</span>
          </button>
        ) : (
          <button
            onClick={() => setOpenModal(true)}
            className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600"
          >
            <Unlock className="h-4 w-4" />
            <span>Buka Shift Kasir Baru</span>
          </button>
        )}
      </div>

      {/* Current Session Card */}
      {currentSession ? (
        <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/30">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-800">Shift Kasir Sedang Aktif</h3>
                  <span className="animate-pulse rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    ONLINE
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Dibuka: {formatDateTime(currentSession.openedAt)} • Kasir:{' '}
                  {currentSession.cashier?.name}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="rounded-2xl bg-white p-4 border border-emerald-100">
              <span className="text-slate-400 font-medium">Modal Awal di Laci:</span>
              <p className="mt-1 text-lg font-black text-slate-800">
                {formatRupiah(currentSession.openingCash)}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 border border-emerald-100">
              <span className="text-slate-400 font-medium">Penjualan Tunai:</span>
              <p className="mt-1 text-lg font-black text-emerald-600">
                +{formatRupiah(currentSession.totalCashSales)}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 border border-emerald-100">
              <span className="text-slate-400 font-medium">Pengeluaran Tunai Laci:</span>
              <p className="mt-1 text-lg font-black text-red-600">
                -{formatRupiah(currentSession.totalCashExpenses)}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 border border-emerald-200 shadow-sm">
              <span className="text-slate-400 font-medium">Uang Seharusnya di Laci:</span>
              <p className="mt-1 text-lg font-black text-slate-900">
                {formatRupiah(currentSession.expectedCash)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Lock className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Tidak Ada Shift Kasir Aktif</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Buka shift kasir dan masukkan modal awal uang kembalian untuk mulai melayani transaksi di kasir.
          </p>
          <button
            onClick={() => setOpenModal(true)}
            className="mt-4 rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600"
          >
            Buka Shift Sekarang
          </button>
        </div>
      )}

      {/* History Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800">Riwayat Shift Sebelumnya</h3>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 font-semibold text-slate-600">
              <tr>
                <th className="p-4">Waktu Buka</th>
                <th className="p-4">Waktu Tutup</th>
                <th className="p-4">Kasir</th>
                <th className="p-4">Modal Awal</th>
                <th className="p-4">Uang Seharusnya</th>
                <th className="p-4">Uang Dihitung</th>
                <th className="p-4">Selisih</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sessionsHistory.map((s) => {
                const diff = parseFloat(s.difference) || 0;
                return (
                  <tr key={s.id} className="hover:bg-slate-50/80">
                    <td className="p-4 text-slate-500">{formatDateTime(s.openedAt)}</td>
                    <td className="p-4 text-slate-500">
                      {s.closedAt ? formatDateTime(s.closedAt) : '-'}
                    </td>
                    <td className="p-4 font-medium text-slate-800">{s.cashier?.name}</td>
                    <td className="p-4 font-medium">{formatRupiah(s.openingCash)}</td>
                    <td className="p-4 font-bold text-slate-900">{formatRupiah(s.expectedCash)}</td>
                    <td className="p-4 font-bold text-slate-900">
                      {s.actualCash ? formatRupiah(s.actualCash) : '-'}
                    </td>
                    <td className="p-4">
                      {s.isClosed ? (
                        diff === 0 ? (
                          <span className="font-bold text-emerald-600">Pas (0)</span>
                        ) : diff > 0 ? (
                          <span className="font-bold text-blue-600">+{formatRupiah(diff)} (Lebih)</span>
                        ) : (
                          <span className="font-bold text-red-600">{formatRupiah(diff)} (Kurang)</span>
                        )
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          s.isClosed
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {s.isClosed ? 'Ditutup' : 'Aktif'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Open Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-800 mb-1">Buka Shift Kasir Baru</h3>
            <p className="text-xs text-slate-500 mb-4">
              Masukkan jumlah uang tunai yang disiapkan di laci sebagai uang kembalian
            </p>
            <form onSubmit={handleOpenShift} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Modal Awal di Laci (Rp)
                </label>
                <input
                  type="number"
                  required
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-bold outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan</label>
                <input
                  type="text"
                  placeholder="Shift pagi / shift malam..."
                  value={openNotes}
                  onChange={(e) => setOpenNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-orange-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-orange-500 px-4 py-2 font-bold text-white hover:bg-orange-600"
                >
                  Mulai Shift Kasir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Modal */}
      {closeModal && currentSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-800 mb-1">Tutup Shift Kasir</h3>
            <p className="text-xs text-slate-500 mb-4">
              Hitung uang fisik yang ada di laci kasir saat ini
            </p>

            <div className="rounded-xl bg-slate-50 p-3 mb-4 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Modal Awal:</span>
                <span>{formatRupiah(currentSession.openingCash)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Penjualan Tunai:</span>
                <span className="text-emerald-600">+{formatRupiah(currentSession.totalCashSales)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Pengeluaran Kas:</span>
                <span className="text-red-600">-{formatRupiah(currentSession.totalCashExpenses)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-slate-900">
                <span>Uang Seharusnya di Laci:</span>
                <span>{formatRupiah(currentSession.expectedCash)}</span>
              </div>
            </div>

            <form onSubmit={handleCloseShift} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Uang Fisik Dihitung (Rp)
                </label>
                <input
                  type="number"
                  required
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-bold outline-none focus:border-red-500"
                />
              </div>

              {actualCash && (
                <div className="rounded-xl p-2.5 text-xs font-bold text-center border">
                  Selisih:{' '}
                  {parseFloat(actualCash) - parseFloat(currentSession.expectedCash) === 0 ? (
                    <span className="text-emerald-600">Pas (Tidak Ada Selisih)</span>
                  ) : parseFloat(actualCash) - parseFloat(currentSession.expectedCash) > 0 ? (
                    <span className="text-blue-600">
                      Lebih {formatRupiah(parseFloat(actualCash) - parseFloat(currentSession.expectedCash))}
                    </span>
                  ) : (
                    <span className="text-red-600">
                      Kurang {formatRupiah(parseFloat(actualCash) - parseFloat(currentSession.expectedCash))}
                    </span>
                  )}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Serah Terima</label>
                <textarea
                  rows="2"
                  placeholder="Keterangan penutupan shift..."
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCloseModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700"
                >
                  Konfirmasi Tutup Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
