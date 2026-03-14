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

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
    <div className={`p-4 rounded-lg ${color} mr-4`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    </div>
  </div>
);

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.node.isRequired,
  color: PropTypes.string.isRequired
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

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-sm text-gray-500">Inventory overview and quick insights.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full sm:w-auto">
          <div className="relative w-full sm:w-[420px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search for products, orders, or warehouses..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="bg-violet-700 hover:bg-violet-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={18} /> New Transaction
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <StatCard 
          title="Total Products" 
          value={stats?.total_products || 0} 
          icon={<Package className="text-blue-600" />} 
          color="bg-blue-50"
        />
        <StatCard 
          title="Low Stock Items" 
          value={stats?.low_stock_items || 0} 
          icon={<AlertTriangle className="text-red-600" />} 
          color="bg-red-50"
        />
        <StatCard 
          title="Pending Receipts" 
          value={stats?.pending_receipts || 0} 
          icon={<ArrowDownCircle className="text-green-600" />} 
          color="bg-green-50"
        />
        <StatCard 
          title="Pending Deliveries" 
          value={stats?.pending_deliveries || 0} 
          icon={<ArrowUpCircle className="text-orange-600" />} 
          color="bg-orange-50"
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

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-4">Recent Movements</h3>
          <p className="text-gray-500 italic">Use “Stock Ledger” to view all movements.</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-4">Low Stock Alerts</h3>
          <p className="text-gray-500 italic">Everything is in stock.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
