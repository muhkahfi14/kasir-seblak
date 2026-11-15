import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import {
  LayoutDashboard,
  ShoppingCart,
  UtensilsCrossed,
  Cherry,
  Package,
  Truck,
  Receipt,
  Wallet,
  Landmark,
  Clock,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';

const ownerNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pos', icon: ShoppingCart, label: 'Kasir' },
  { to: '/menu', icon: UtensilsCrossed, label: 'Menu' },
  { to: '/toppings', icon: Cherry, label: 'Topping' },
  { to: '/ingredients', icon: Package, label: 'Bahan Baku' },
  { to: '/purchases', icon: Truck, label: 'Pembelian' },
  { to: '/sales', icon: Receipt, label: 'Penjualan' },
  { to: '/expenses', icon: Wallet, label: 'Pengeluaran' },
  { to: '/capital', icon: Landmark, label: 'Modal' },
  { to: '/cash-sessions', icon: Clock, label: 'Shift Kasir' },
  { to: '/reports', icon: BarChart3, label: 'Laporan' },
  { to: '/settings', icon: Settings, label: 'Pengaturan' },
];

const cashierNavItems = [
  { to: '/pos', icon: ShoppingCart, label: 'Kasir' },
  { to: '/sales', icon: Receipt, label: 'Penjualan' },
  { to: '/cash-sessions', icon: Clock, label: 'Shift Kasir' },
];

export default function MainLayout() {
  const { user, logout, isOwner } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = isOwner ? ownerNavItems : cashierNavItems;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const NavItem = ({ item }) => (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={() => setMobileOpen(false)}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-orange-50 text-orange-600'
            : 'text-slate-600 hover:bg-slate-50 hover:text-orange-600'
        }`
      }
    >
      <item.icon className="h-5 w-5 shrink-0" />
      <span className="truncate">{item.label}</span>
    </NavLink>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-lg font-bold text-white shadow-lg shadow-orange-500/30">
            🌶️
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Seblak Prasmanan</h1>
            <p className="text-xs text-slate-400">Sistem Kasir</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavItem key={item.to} item={item} />
          ))}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="mb-3 flex items-center gap-3 px-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-slate-800">{user?.name}</p>
              <p className="text-xs text-slate-400">{user?.role === 'OWNER' ? 'Pemilik' : 'Kasir'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-5 w-5" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header + Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex md:hidden items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            >
              <Menu className="h-6 w-6" />
            </button>
            <span className="text-lg font-bold text-slate-800">🌶️ Seblak</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-lg font-bold text-white">
                    🌶️
                  </div>
                  <h1 className="text-lg font-bold text-slate-900">Seblak</h1>
                </div>
                <button onClick={() => setMobileOpen(false)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {navItems.map((item) => (
                  <NavItem key={item.to} item={item} />
                ))}
              </nav>

              <div className="border-t border-slate-100 p-4">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Keluar</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
