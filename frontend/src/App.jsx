import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Provider, useSelector } from 'react-redux';
import store from './app/store';
import { selectAuth } from './features/auth/authSlice';
import AppLayout from './components/layout/AppLayout';

// Pages
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import Dashboard from './pages/Dashboard';
import ProductsPage from './pages/ProductsPage';
import StockPage from './pages/StockPage';
import ReceiptsList from './pages/ReceiptsList';
import ReceiptDetail from './pages/ReceiptDetail';
import DeliveriesList from './pages/DeliveriesList';
import DeliveryDetail from './pages/DeliveryDetail';
import TransfersList from './pages/TransfersList';
import MoveHistory from './pages/MoveHistory';
import WarehousesPage from './pages/WarehousesPage';
import LocationsPage from './pages/LocationsPage';
import SettingsPage from './pages/SettingsPage';
import NotAuthorized from './pages/NotAuthorized';
import { ROLES } from './utils/rbac';

// Protected Route
// eslint-disable-next-line react/prop-types
function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useSelector(selectAuth);
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles?.length && !allowedRoles.includes(user?.role)) {
    return <AppLayout><NotAuthorized /></AppLayout>;
  }
  return <AppLayout>{children}</AppLayout>;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected */}
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute allowedRoles={[ROLES.INVENTORY_MANAGER]}><ProductsPage /></ProtectedRoute>} />
      <Route path="/stock" element={<ProtectedRoute><StockPage /></ProtectedRoute>} />
      
      <Route path="/receipts" element={<ProtectedRoute allowedRoles={[ROLES.INVENTORY_MANAGER]}><ReceiptsList /></ProtectedRoute>} />
      <Route path="/receipts/:id" element={<ProtectedRoute allowedRoles={[ROLES.INVENTORY_MANAGER]}><ReceiptDetail /></ProtectedRoute>} />
      
      <Route path="/deliveries" element={<ProtectedRoute allowedRoles={[ROLES.INVENTORY_MANAGER]}><DeliveriesList /></ProtectedRoute>} />
      <Route path="/deliveries/:id" element={<ProtectedRoute allowedRoles={[ROLES.INVENTORY_MANAGER]}><DeliveryDetail /></ProtectedRoute>} />
      
      <Route path="/transfers" element={<ProtectedRoute><TransfersList /></ProtectedRoute>} />
      <Route path="/move-history" element={<ProtectedRoute><MoveHistory /></ProtectedRoute>} />
      <Route path="/warehouses" element={<ProtectedRoute allowedRoles={[ROLES.INVENTORY_MANAGER]}><WarehousesPage /></ProtectedRoute>} />
      <Route path="/locations" element={<ProtectedRoute allowedRoles={[ROLES.INVENTORY_MANAGER]}><LocationsPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute allowedRoles={[ROLES.INVENTORY_MANAGER]}><SettingsPage /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <Router>
        <AppRoutes />
      </Router>
    </Provider>
  );
}
