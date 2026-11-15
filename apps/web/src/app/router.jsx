import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';
import MainLayout from '../components/layout/MainLayout.jsx';
import LoginPage from '../features/auth/LoginPage.jsx';
import { useAuth } from '../hooks/useAuth.jsx';

// Feature Pages
import DashboardPage from '../features/dashboard/DashboardPage.jsx';
import PosPage from '../features/pos/PosPage.jsx';
import MenuPage from '../features/menu/MenuPage.jsx';
import ToppingsPage from '../features/toppings/ToppingsPage.jsx';
import IngredientsPage from '../features/ingredients/IngredientsPage.jsx';
import PurchasesPage from '../features/purchases/PurchasesPage.jsx';
import SalesPage from '../features/sales/SalesPage.jsx';
import ExpensesPage from '../features/expenses/ExpensesPage.jsx';
import CapitalPage from '../features/capital/CapitalPage.jsx';
import CashSessionsPage from '../features/cash-sessions/CashSessionsPage.jsx';
import ReportsPage from '../features/reports/ReportsPage.jsx';
import SettingsPage from '../features/settings/SettingsPage.jsx';

function IndexRoute() {
  const { user } = useAuth();
  if (user?.role === 'CASHIER') {
    return <Navigate to="/pos" replace />;
  }
  return <DashboardPage />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes inside MainLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Index: Dashboard for Owner, POS for Cashier */}
        <Route index element={<IndexRoute />} />

        {/* Accessible by Cashier & Owner */}
        <Route path="pos" element={<PosPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="cash-sessions" element={<CashSessionsPage />} />

        {/* Owner Only Routes */}
        <Route
          path="menu"
          element={
            <ProtectedRoute roles={['OWNER']}>
              <MenuPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="toppings"
          element={
            <ProtectedRoute roles={['OWNER']}>
              <ToppingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="ingredients"
          element={
            <ProtectedRoute roles={['OWNER']}>
              <IngredientsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="purchases"
          element={
            <ProtectedRoute roles={['OWNER']}>
              <PurchasesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="expenses"
          element={
            <ProtectedRoute roles={['OWNER']}>
              <ExpensesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="capital"
          element={
            <ProtectedRoute roles={['OWNER']}>
              <CapitalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports"
          element={
            <ProtectedRoute roles={['OWNER']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings"
          element={
            <ProtectedRoute roles={['OWNER']}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
