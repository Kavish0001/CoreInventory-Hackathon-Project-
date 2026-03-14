import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import MoveHistory from './pages/MoveHistory';
import WarehousesPage from './pages/WarehousesPage';

// Protected Route
function ProtectedRoute({ children }) {
  const { user } = useSelector(selectAuth);
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected */}
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
      <Route path="/stock" element={<ProtectedRoute><StockPage /></ProtectedRoute>} />
      
      <Route path="/receipts" element={<ProtectedRoute><ReceiptsList /></ProtectedRoute>} />
      <Route path="/receipts/:id" element={<ProtectedRoute><ReceiptDetail /></ProtectedRoute>} />
      
      <Route path="/deliveries" element={<ProtectedRoute><DeliveriesList /></ProtectedRoute>} />
      <Route path="/deliveries/:id" element={<ProtectedRoute><DeliveryDetail /></ProtectedRoute>} />
      
      <Route path="/move-history" element={<ProtectedRoute><MoveHistory /></ProtectedRoute>} />
      <Route path="/warehouses" element={<ProtectedRoute><WarehousesPage /></ProtectedRoute>} />

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
