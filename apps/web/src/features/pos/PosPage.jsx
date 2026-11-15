import { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { formatRupiah } from '../../lib/currency.js';
import {
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  QrCode,
  Banknote,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Printer,
  X,
  Flame,
  Soup,
} from 'lucide-react';

const SPICE_LEVELS = [
  { level: 0, label: 'Level 0 (Tidak Pedas)', color: 'text-slate-600 bg-slate-100' },
  { level: 1, label: 'Level 1 (Sedang)', color: 'text-amber-600 bg-amber-50' },
  { level: 2, label: 'Level 2 (Pedas)', color: 'text-orange-600 bg-orange-50' },
  { level: 3, label: 'Level 3 (Ekstra Pedas)', color: 'text-red-500 bg-red-50' },
  { level: 4, label: 'Level 4 (Gila)', color: 'text-red-600 bg-red-100' },
  { level: 5, label: 'Level 5 (Mampus)', color: 'text-red-700 bg-red-200' },
];

const BROTH_TYPES = ['Original Kencur', 'Kencur Nendang', 'Jeletot Merah', 'Kuah Creamy'];

const createRequestId = () =>
  globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function PosPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [toppings, setToppings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Cart state
  // An item in the cart can be a Seblak Bowl (with toppings) or a Standalone Item (e.g. Minuman)
  const [cart, setCart] = useState([]);
  const [activePortionIndex, setActivePortionIndex] = useState(0);

  // Checkout modal
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // 'CASH' | 'QRIS'
  const [cashTendered, setCashTendered] = useState('');
  const [customerName, setCustomerName] = useState('Pelanggan');
  const [processing, setProcessing] = useState(false);
  const [qrisConfirmed, setQrisConfirmed] = useState(false);
  const [clientRequestId, setClientRequestId] = useState('');
  const [completedSale, setCompletedSale] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch Menu & Toppings
  const loadData = async () => {
    try {
      setLoading(true);
      const [menuRes, toppingsRes] = await Promise.all([
        api.get('/menu/items'),
        api.get('/toppings'),
      ]);
      setMenuItems(menuRes.data || []);
      setToppings(toppingsRes.data || []);

      // Extract unique topping categories
      const cats = Array.from(new Set((toppingsRes.data || []).map((t) => t.category)));
      setCategories(cats);
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal memuat daftar menu dan topping');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Initialize one empty seblak bowl in cart by default
    initNewBowl();
  }, []);

  const initNewBowl = () => {
    setCart((prev) => {
      const bowlNum = prev.filter((i) => i.type === 'SEBLAK').length + 1;
      const newBowl = {
        id: `bowl-${Date.now()}`,
        type: 'SEBLAK',
        name: `Porsi Seblak #${bowlNum}`,
        basePrice: 8000, // Base price for seblak prasmanan (bumbu + kuah + telur)
        spiceLevel: 2,
        broth: 'Original Kencur',
        toppings: [], // { topping, qty }
        notes: '',
      };
      const updated = [...prev, newBowl];
      setActivePortionIndex(updated.length - 1);
      return updated;
    });
  };

  const currentBowl = cart[activePortionIndex]?.type === 'SEBLAK' ? cart[activePortionIndex] : null;

  // Add topping to active seblak bowl
  const handleAddTopping = (topping) => {
    if (!currentBowl) {
      initNewBowl();
      return;
    }

    setCart((prev) => {
      const copy = [...prev];
      const bowl = { ...copy[activePortionIndex] };
      const existingIdx = bowl.toppings.findIndex((t) => t.id === topping.id);

      if (existingIdx >= 0) {
        bowl.toppings[existingIdx].qty += 1;
      } else {
        bowl.toppings.push({
          id: topping.id,
          name: topping.name,
          price: topping.price,
          qty: 1,
        });
      }

      copy[activePortionIndex] = bowl;
      return copy;
    });
  };

  // Modify topping quantity in current bowl
  const handleUpdateToppingQty = (toppingId, delta) => {
    if (!currentBowl) return;
    setCart((prev) => {
      const copy = [...prev];
      const bowl = { ...copy[activePortionIndex] };
      const idx = bowl.toppings.findIndex((t) => t.id === toppingId);
      if (idx >= 0) {
        const newQty = bowl.toppings[idx].qty + delta;
        if (newQty <= 0) {
          bowl.toppings.splice(idx, 1);
        } else {
          bowl.toppings[idx].qty = newQty;
        }
      }
      copy[activePortionIndex] = bowl;
      return copy;
    });
  };

  // Remove portion or drink
  const handleRemoveItem = (index) => {
    setCart((prev) => {
      const copy = prev.filter((_, i) => i !== index);
      if (activePortionIndex >= copy.length) {
        setActivePortionIndex(Math.max(0, copy.length - 1));
      }
      return copy;
    });
  };

  // Add non-seblak standalone item (e.g. Es Teh, Minuman)
  const handleAddMenuItem = (menuItem) => {
    setCart((prev) => [
      ...prev,
      {
        id: `menu-${menuItem.id}-${Date.now()}`,
        type: 'MENU_ITEM',
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.basePrice,
        qty: 1,
      },
    ]);
  };

  // Calculate bowl total
  const getBowlTotal = (bowl) => {
    if (!bowl || bowl.type !== 'SEBLAK') return 0;
    const toppingsTotal = bowl.toppings.reduce((acc, t) => acc + t.price * t.qty, 0);
    return bowl.basePrice + toppingsTotal;
  };

  // Calculate cart Grand Total
  const subtotal = cart.reduce((acc, item) => {
    if (item.type === 'SEBLAK') {
      return acc + getBowlTotal(item);
    }
    return acc + item.price * (item.qty || 1);
  }, 0);

  const parsedCash = parseFloat(cashTendered) || 0;
  const changeAmount = Math.max(0, parsedCash - subtotal);
  const cashIsInsufficient =
    paymentMethod === 'CASH' && cashTendered !== '' && parsedCash < subtotal;
  const canSubmitCheckout =
    !processing &&
    cart.length > 0 &&
    (paymentMethod === 'CASH' ? parsedCash >= subtotal : qrisConfirmed);

  const handleOpenCheckout = () => {
    setErrorMsg('');
    setCompletedSale(null);
    setQrisConfirmed(false);
    setClientRequestId(createRequestId());
    setShowCheckout(true);
  };

  const handleSelectPaymentMethod = (method) => {
    setPaymentMethod(method);
    setErrorMsg('');
    if (method === 'QRIS') setQrisConfirmed(false);
  };

  // Submit Sale
  const handleProcessCheckout = async () => {
    setErrorMsg('');
    if (cart.length === 0) {
      setErrorMsg('Keranjang masih kosong');
      return;
    }

    if (paymentMethod === 'CASH' && parsedCash < subtotal) {
      setErrorMsg('Uang yang diterima kurang dari total tagihan');
      return;
    }

    if (paymentMethod === 'QRIS' && !qrisConfirmed) {
      setErrorMsg('Centang konfirmasi bahwa pembayaran QRIS sudah diperiksa');
      return;
    }

    try {
      setProcessing(true);
      const requestId = clientRequestId || createRequestId();
      if (!clientRequestId) setClientRequestId(requestId);

      const payload = {
        customerName,
        paymentMethod,
        clientRequestId: requestId,
        cashTendered: paymentMethod === 'CASH' ? parsedCash : undefined,
        qrisConfirmed: paymentMethod === 'QRIS' ? qrisConfirmed : undefined,
        items: cart.map((item) => {
          if (item.type === 'SEBLAK') {
            return {
              type: 'SEBLAK',
              name: item.name,
              basePrice: item.basePrice,
              spiceLevel: item.spiceLevel,
              broth: item.broth,
              notes: item.notes,
              toppings: item.toppings.map((t) => ({
                toppingId: t.id,
                qty: t.qty,
                price: t.price,
              })),
            };
          } else {
            return {
              type: 'MENU_ITEM',
              menuItemId: item.menuItemId,
              name: item.name,
              qty: item.qty || 1,
              price: item.price,
            };
          }
        }),
      };

      const res = await api.post('/sales', payload);
      setCompletedSale(res.data);
      setClientRequestId('');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal memproses transaksi');
    } finally {
      setProcessing(false);
    }
  };

  // Reset after completed sale
  const handleResetPos = () => {
    setCart([]);
    setShowCheckout(false);
    setCompletedSale(null);
    setQrisConfirmed(false);
    setClientRequestId('');
    setCashTendered('');
    setCustomerName('Pelanggan');
    setPaymentMethod('CASH');
    setErrorMsg('');
    initNewBowl();
  };

  const receiptPayment = completedSale?.payment;
  const receiptMethod = receiptPayment?.paymentMethod || paymentMethod;
  const receiptCashReceived = receiptPayment?.amountReceived;
  const receiptChange = receiptPayment?.changeAmount;

  // Filter toppings
  const filteredToppings = toppings.filter((t) => {
    const matchCat = selectedCategory === 'ALL' || t.category === selectedCategory;
    const matchSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="flex h-[calc(100vh-65px)] flex-col lg:flex-row overflow-hidden bg-slate-100">
      {/* LEFT: Products & Toppings Selection */}
      <div className="flex flex-1 flex-col overflow-hidden border-r border-slate-200 bg-white">
        {/* Search & Categories Bar */}
        <div className="border-b border-slate-100 p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari topping prasmanan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>
            <button
              onClick={initNewBowl}
              className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-orange-600 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>+ Porsi Baru</span>
            </button>
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`rounded-lg px-3 py-1.5 font-bold shrink-0 transition-colors ${
                selectedCategory === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Topping
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`rounded-lg px-3 py-1.5 font-bold shrink-0 transition-colors ${
                  selectedCategory === c
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Topping Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {filteredToppings.map((t) => {
              const inBowl = currentBowl?.toppings.find((item) => item.id === t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => handleAddTopping(t)}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-3.5 text-left transition-all active:scale-95 ${
                    inBowl
                      ? 'border-orange-500 bg-orange-50/50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-orange-300 hover:shadow-md'
                  }`}
                >
                  {inBowl && (
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white shadow">
                      {inBowl.qty}
                    </span>
                  )}
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400">{t.category}</span>
                    <h3 className="line-clamp-2 text-xs font-bold text-slate-800">{t.name}</h3>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-orange-600">
                      {formatRupiah(t.price)}
                    </span>
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-100 text-orange-600 group-hover:bg-orange-500 group-hover:text-white">
                      <Plus className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Standalone Drinks / Menu Items */}
          {menuItems.length > 0 && (
            <div className="mt-6 border-t border-slate-200 pt-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Minuman & Menu Tambahan
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {menuItems.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleAddMenuItem(m)}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3 text-left hover:border-blue-400 hover:shadow-md"
                  >
                    <span className="text-[10px] text-slate-400">Minuman</span>
                    <p className="text-xs font-bold text-slate-800">{m.name}</p>
                    <p className="mt-2 text-xs font-extrabold text-blue-600">{formatRupiah(m.basePrice)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Active Portions & Cart */}
      <div className="flex w-full flex-col border-t border-slate-200 bg-white lg:w-96 lg:border-t-0">
        {/* Cart Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-orange-500" />
            <h2 className="font-bold text-slate-800">Pesanan Pelanggan</h2>
          </div>
          <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-600">
            {cart.length} Item
          </span>
        </div>

        {/* Portion Tabs */}
        <div className="flex gap-2 overflow-x-auto border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs">
          {cart.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setActivePortionIndex(idx)}
              className={`rounded-lg px-3 py-1.5 font-bold shrink-0 transition-all ${
                activePortionIndex === idx
                  ? 'bg-white text-orange-600 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {item.type === 'SEBLAK' ? `Porsi ${idx + 1}` : item.name}
            </button>
          ))}
        </div>

        {/* Selected Item Editor / Toppings list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {currentBowl ? (
            <div className="space-y-4">
              {/* Portion Options (Pedas & Kuah) */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">{currentBowl.name}</span>
                  <button
                    onClick={() => handleRemoveItem(activePortionIndex)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Level Pedas */}
                <div>
                  <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                    <Flame className="h-3.5 w-3.5 text-red-500" />
                    <span>Level Kepedasan:</span>
                  </div>
                  <div className="grid grid-cols-6 gap-1">
                    {SPICE_LEVELS.map((s) => (
                      <button
                        key={s.level}
                        onClick={() => {
                          setCart((prev) => {
                            const c = [...prev];
                            c[activePortionIndex].spiceLevel = s.level;
                            return c;
                          });
                        }}
                        className={`rounded-lg py-1 text-center text-xs font-extrabold transition-all ${
                          currentBowl.spiceLevel === s.level
                            ? 'bg-red-500 text-white shadow'
                            : 'bg-white text-slate-700 border border-slate-200'
                        }`}
                      >
                        {s.level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Kuah */}
                <div>
                  <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                    <Soup className="h-3.5 w-3.5 text-amber-500" />
                    <span>Pilihan Kuah:</span>
                  </div>
                  <select
                    value={currentBowl.broth}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCart((prev) => {
                        const c = [...prev];
                        c[activePortionIndex].broth = val;
                        return c;
                      });
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white py-1.5 px-2.5 text-xs font-medium outline-none"
                  >
                    {BROTH_TYPES.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Toppings in this bowl */}
              <div>
                <p className="mb-2 text-xs font-bold text-slate-700">
                  Topping Terpilih ({currentBowl.toppings.length})
                </p>
                {currentBowl.toppings.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-400">
                    Pilih topping di sebelah kiri untuk mengisi porsi ini
                  </p>
                ) : (
                  <div className="space-y-2">
                    {currentBowl.toppings.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-2.5 text-xs shadow-sm"
                      >
                        <div>
                          <p className="font-bold text-slate-800">{t.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {formatRupiah(t.price)} x {t.qty} = {formatRupiah(t.price * t.qty)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateToppingQty(t.id, -1)}
                            className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-5 text-center font-bold text-slate-800">{t.qty}</span>
                          <button
                            onClick={() => handleUpdateToppingQty(t.id, 1)}
                            className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-100 text-orange-600 hover:bg-orange-200"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-800">{item.name}</p>
                    <p className="text-slate-400">{formatRupiah(item.price)}</p>
                  </div>
                  <button onClick={() => handleRemoveItem(idx)} className="text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Checkout Summary */}
        <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Total Tagihan</span>
            <span className="text-lg font-black text-slate-900">{formatRupiah(subtotal)}</span>
          </div>

          <button
            disabled={cart.length === 0 || subtotal === 0}
            onClick={handleOpenCheckout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition-all hover:bg-orange-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>Bayar Sekarang</span>
            <span>({formatRupiah(subtotal)})</span>
          </button>
        </div>
      </div>

      {/* CHECKOUT MODAL */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Pembayaran Kasir</h3>
                <p className="text-xs text-slate-400">Total: {formatRupiah(subtotal)}</p>
              </div>
              <button
                onClick={() => setShowCheckout(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-100">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {!completedSale && (
              <div className="space-y-4">
                {/* Total tagihan */}
                <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-orange-700">Total Tagihan</span>
                    <span className="text-xl font-black text-slate-900">
                      {formatRupiah(subtotal)}
                    </span>
                  </div>
                </div>

                {/* Customer Name */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Nama Pelanggan / Nomor Meja
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>

                {/* Method selector */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleSelectPaymentMethod('CASH')}
                    className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border p-4 font-bold text-xs transition-all active:scale-95 ${
                      paymentMethod === 'CASH'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="h-6 w-6" />
                    <span>CASH</span>
                    <span className="text-[10px] font-medium">Uang tunai</span>
                  </button>
                  <button
                    onClick={() => handleSelectPaymentMethod('QRIS')}
                    className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border p-4 font-bold text-xs transition-all active:scale-95 ${
                      paymentMethod === 'QRIS'
                        ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <QrCode className="h-6 w-6" />
                    <span>QRIS</span>
                    <span className="text-[10px] font-medium">Scan manual</span>
                  </button>
                </div>

                {/* Cash Calculator */}
                {paymentMethod === 'CASH' && (
                  <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600">
                        Uang Tunai Diterima (Rp)
                      </label>
                      <input
                        type="number"
                        min="0"
                        inputMode="numeric"
                        placeholder="Contoh: 50000"
                        value={cashTendered}
                        onChange={(e) => setCashTendered(e.target.value)}
                        className={`w-full rounded-xl border px-3 py-2 text-sm font-bold text-slate-800 outline-none ${
                          cashIsInsufficient
                            ? 'border-red-300 bg-red-50'
                            : 'border-slate-200 bg-white focus:border-emerald-500'
                        }`}
                      />
                      {cashIsInsufficient && (
                        <p className="mt-1.5 text-[11px] font-semibold text-red-600">
                          Kurang {formatRupiah(subtotal - parsedCash)} dari total tagihan.
                        </p>
                      )}
                    </div>

                    {/* Quick Cash Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setCashTendered(subtotal.toString())}
                        className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-200"
                      >
                        Uang Pas
                      </button>
                      {[20000, 50000, 100000].map((amt) => (
                        <button
                          key={amt}
                          onClick={() => setCashTendered(amt.toString())}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                        >
                          {formatRupiah(amt)}
                        </button>
                      ))}
                    </div>

                    {/* Change Display */}
                    <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                      <span className="text-xs font-medium text-slate-500">Kembalian:</span>
                      <span
                        className={`text-base font-black ${
                          cashIsInsufficient ? 'text-red-500' : 'text-emerald-600'
                        }`}
                      >
                        {formatRupiah(changeAmount)}
                      </span>
                    </div>
                  </div>
                )}

                {/* QRIS manual confirmation */}
                {paymentMethod === 'QRIS' && (
                  <div className="space-y-3 rounded-2xl border border-purple-100 bg-purple-50 p-4">
                    <div className="flex items-start gap-2.5 text-[11px] leading-relaxed text-purple-800">
                      <QrCode className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>
                        Pastikan pelanggan sudah membayar melalui aplikasi merchant, m-banking,
                        atau e-wallet. Sistem ini hanya mencatat metode QRIS dan tidak membuat QR
                        code atau memverifikasi pembayaran secara otomatis.
                      </p>
                    </div>
                    <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-purple-200 bg-white p-3 text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={qrisConfirmed}
                        onChange={(e) => setQrisConfirmed(e.target.checked)}
                        className="mt-0.5 h-4 w-4 accent-purple-600"
                      />
                      <span>Pembayaran QRIS sudah saya periksa dan sesuai dengan total tagihan.</span>
                    </label>
                  </div>
                )}

                <button
                  onClick={handleProcessCheckout}
                  disabled={!canSubmitCheckout}
                  className="w-full rounded-2xl bg-orange-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processing ? 'Menyimpan Transaksi...' : 'Selesaikan Transaksi'}
                </button>
              </div>
            )}

            {/* Receipt Modal (Completed Sale) */}
            {completedSale && (
              <div className="space-y-4 py-2 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-800">Pembayaran Berhasil!</h4>
                  <p className="text-xs text-slate-400">
                    Invoice: #{completedSale.invoiceNumber || completedSale.sale?.invoiceNumber}
                  </p>
                </div>

                {/* Struk Preview */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left font-mono text-xs text-slate-700 space-y-2">
                  <div className="text-center border-b border-dashed border-slate-300 pb-2">
                    <p className="font-bold">SEBLAK PRASMANAN</p>
                    <p className="text-[10px] text-slate-500">Jl. Raya Seblak No. 123, Bandung</p>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Metode: {receiptMethod}</span>
                    <span>Total: {formatRupiah(completedSale.totalAmount ?? subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Status: {receiptPayment?.status || 'PAID'}</span>
                    <span>Kasir: {receiptPayment?.cashier?.name || '-'}</span>
                  </div>
                  {receiptMethod === 'CASH' && (
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Tunai: {formatRupiah(receiptCashReceived)}</span>
                      <span>Kembali: {formatRupiah(receiptChange)}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Cetak Struk</span>
                  </button>
                  <button
                    onClick={handleResetPos}
                    className="flex-1 rounded-xl bg-orange-500 py-2.5 text-xs font-bold text-white hover:bg-orange-600"
                  >
                    Transaksi Baru
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
