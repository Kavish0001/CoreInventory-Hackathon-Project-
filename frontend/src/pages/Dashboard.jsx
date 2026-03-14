import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { reportService } from '../services/api';
import { 
  Package, 
  AlertTriangle, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Repeat,
  Search,
  Plus
} from 'lucide-react';

const cx = (...parts) => parts.filter(Boolean).join(' ');

const StatCard = ({ title, value, icon, color, trend }) => (
  <div className="ci-card p-5 hover:shadow-md transition">
    <div className="flex items-start justify-between">
      <div className={cx('p-3', 'rounded-lg', color)}>
        {icon}
      </div>
      {trend && <span className="text-[11px] font-semibold px-2 py-1 rounded bg-emerald-50 text-emerald-700">{trend}</span>}
    </div>
    <div className="mt-4">
      <p className="text-sm text-slate-500">{title}</p>
      <h3 className="mt-1 text-3xl font-bold text-slate-900">{value}</h3>
    </div>
  </div>
);

StatCard.defaultProps = {
  trend: ''
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.node.isRequired,
  color: PropTypes.string.isRequired,
  trend: PropTypes.string
};

const QuickPanel = ({ title, subtitle, children }) => (
  <div className="ci-card p-5">
    <h3 className="font-semibold text-slate-800">{title}</h3>
    <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
    <div className="mt-4">{children}</div>
  </div>
);

QuickPanel.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await reportService.getDashboardStats();
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="text-slate-500">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="ci-page-title">Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">Inventory overview and quick insights.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full sm:w-auto">
          <div className="relative w-full sm:w-[420px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search for products, orders, or warehouses..."
              className="ci-input pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="ci-button-primary gap-2"
          >
            <Plus size={18} /> New Transaction
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Products"
          value={stats?.total_products || 0}
          icon={<Package className="text-blue-600" />}
          color="bg-blue-50"
          trend="+2.4%"
        />
        <StatCard
          title="Low Stock Items"
          value={stats?.low_stock_items || 0}
          icon={<AlertTriangle className="text-red-600" />}
          color="bg-red-50"
          trend="High Risk"
        />
        <StatCard
          title="Pending Receipts"
          value={stats?.pending_receipts || 0}
          icon={<ArrowDownCircle className="text-emerald-600" />}
          color="bg-emerald-50"
          trend="8 Today"
        />
        <StatCard
          title="Pending Deliveries"
          value={stats?.pending_deliveries || 0}
          icon={<ArrowUpCircle className="text-amber-600" />}
          color="bg-amber-50"
          trend="12 Ready"
        />
        <StatCard
          title="Transfers Today"
          value={stats?.transfers_today || 0}
          icon={<Repeat className="text-purple-600" />}
          color="bg-purple-50"
        />
        <StatCard
          title="Late / Waiting"
          value={`${stats?.late_operations || 0} / ${stats?.waiting_operations || 0}`}
          icon={<AlertTriangle className="text-violet-700" />}
          color="bg-violet-50"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 ci-card p-5 min-h-[300px]">
          <h3 className="font-semibold text-slate-800">Incoming vs Outgoing Stock</h3>
          <p className="text-xs text-slate-500 mt-1">Inventory movement trends for the last 7 days</p>
          <div className="h-[230px] mt-4 rounded-lg border border-slate-200 bg-slate-50/60" />
        </div>
        <QuickPanel title="Inventory Health" subtitle="Current warehouse performance">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Warehouse Capacity</span><span className="font-semibold text-slate-700">78%</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Order Fulfillment</span><span className="font-semibold text-emerald-600">94%</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Stock Turnover (Avg)</span><span className="font-semibold text-violet-700">12.5 days</span></div>
          </div>
        </QuickPanel>
      </div>

      <QuickPanel title="Recent Movements" subtitle="Real-time stock entry and exit logs">
        <p className="text-sm text-slate-500">Use Stock Ledger for complete movement list with source and destination tracking.</p>
      </QuickPanel>
    </div>
  );
};

export default Dashboard;
