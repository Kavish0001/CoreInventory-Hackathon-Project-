import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ProductPage from './pages/ProductPage';
import OperationsPage from './pages/OperationsPage';
import StockLedger from './pages/StockLedger';
import WarehousesPage from './pages/WarehousesPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  return <Layout>{children}</Layout>;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/products" element={
            <ProtectedRoute>
              <ProductPage />
            </ProtectedRoute>
          } />
          <Route path="/operations" element={
            <ProtectedRoute>
              <OperationsPage />
            </ProtectedRoute>
          } />
          <Route path="/ledger" element={
            <ProtectedRoute>
              <StockLedger />
            </ProtectedRoute>
          } />
          <Route path="/warehouses" element={
            <ProtectedRoute>
              <WarehousesPage />
            </ProtectedRoute>
          } />
          {/* Fallback for other routes */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
