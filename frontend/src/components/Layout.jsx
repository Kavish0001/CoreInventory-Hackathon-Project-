import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, 
  Package, 
  ArrowLeftRight, 
  Warehouse, 
  LogOut, 
  BarChart3,
  Boxes,
  Truck,
  Inbox,
  Menu,
  X
} from 'lucide-react';

const cx = (...parts) => parts.filter(Boolean).join(' ');

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
    { name: 'Products', icon: <Package size={20} />, path: '/products' },
    { name: 'Operations', icon: <ArrowLeftRight size={20} />, path: '/operations' },
    { name: 'Receipts', icon: <Inbox size={20} />, path: '/receipts' },
    { name: 'Deliveries', icon: <Truck size={20} />, path: '/deliveries' },
    { name: 'Warehouses', icon: <Warehouse size={20} />, path: '/warehouses' },
    { name: 'Stock', icon: <Boxes size={20} />, path: '/stock' },
    { name: 'Stock Ledger', icon: <BarChart3 size={20} />, path: '/ledger' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cx(
          'bg-white',
          'text-gray-900',
          'border-r',
          'border-gray-200',
          'transition-all',
          'duration-300',
          isSidebarOpen ? 'w-64' : 'w-20',
          'flex',
          'flex-col'
        )}
      >
        <div className="p-4 flex items-center justify-between">
          <h1 className={cx('font-bold', 'text-xl', 'truncate', !isSidebarOpen && 'hidden')}>CoreInventory</h1>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-gray-100 rounded">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 mt-4 px-2 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={cx(
                'flex',
                'items-center',
                'p-3',
                'rounded-lg',
                'transition-colors',
                location.pathname === item.path
                  ? 'bg-violet-50 text-violet-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <span className="min-w-[24px]">{item.icon}</span>
              <span
                className={cx(
                  'ml-3',
                  'whitespace-nowrap',
                  'overflow-hidden',
                  'transition-all',
                  'duration-300',
                  isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'
                )}
              >
                {item.name}
              </span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center text-sm font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className={cx('ml-3', 'overflow-hidden', !isSidebarOpen && 'hidden')}>
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center p-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className={cx('ml-3', !isSidebarOpen && 'hidden')}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired
};

export default Layout;
