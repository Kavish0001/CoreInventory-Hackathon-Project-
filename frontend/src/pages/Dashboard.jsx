import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchDashboardStats, fetchLowStockAlerts, selectDashboard } from '../features/dashboard/dashboardSlice';
import { KpiCard, LoadingSpinner } from '../components/ui';
import {
  Package,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  Hourglass,
} from 'lucide-react';

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { stats, lowStockAlerts, loading } = useSelector(selectDashboard);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchLowStockAlerts());
  }, [dispatch]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-secondary mt-1">Inventory overview and quick insights</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <KpiCard
          title="Total Products"
          value={stats?.total_products ?? 0}
          icon={Package}
          color="primary"
          onClick={() => navigate('/products')}
        />
        <KpiCard
          title="Low Stock Items"
          value={stats?.low_stock_items ?? 0}
          icon={AlertTriangle}
          color="danger"
        />
        <KpiCard
          title="Pending Receipts"
          value={stats?.pending_receipts ?? 0}
          icon={ArrowDownCircle}
          color="success"
          onClick={() => navigate('/receipts')}
        />
        <KpiCard
          title="Pending Deliveries"
          value={stats?.pending_deliveries ?? 0}
          icon={ArrowUpCircle}
          color="warning"
          onClick={() => navigate('/deliveries')}
        />
        <KpiCard
          title="Late"
          value={stats?.late_operations ?? 0}
          icon={Clock}
          color="danger"
          subtitle="Past schedule date"
        />
        <KpiCard
          title="Waiting"
          value={stats?.waiting_operations ?? 0}
          icon={Hourglass}
          color="info"
          subtitle="Insufficient stock"
        />
      </div>

      {/* Bottom sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-text-primary">Recent Movements</h2>
            <button
              type="button"
              onClick={() => navigate('/move-history')}
              className="text-xs font-medium text-primary hover:text-primary-dark transition-colors"
            >
              View All Movements →
            </button>
          </div>
          <p className="text-sm text-text-muted italic">
            Check the Move History page for full details.
          </p>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-base font-semibold text-text-primary mb-4">Low Stock Alerts</h2>
          {lowStockAlerts.length === 0 ? (
            <p className="text-sm text-text-muted italic">All products are sufficiently stocked.</p>
          ) : (
            <div className="space-y-3">
              {lowStockAlerts.slice(0, 5).map((alert) => (
                <div key={alert.product_id || alert.id} className="flex items-center justify-between py-2 border-b border-border-light last:border-0">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{alert.name}</p>
                    <p className="text-xs text-text-muted">{alert.sku} · {alert.warehouse_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-danger">{alert.quantity}</p>
                    <p className="text-[10px] text-text-muted">Reorder: {alert.reorder_level}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
