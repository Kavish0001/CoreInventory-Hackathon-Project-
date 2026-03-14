import { useState } from 'react';
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
  X,
  Search,
  Bell,
  Plus
} from 'lucide-react';

const cx = (...parts) => parts.filter(Boolean).join(' ');

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
    <div className="min-h-screen p-4 md:p-6">
      <div className="ci-shell mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1400px] overflow-hidden bg-white">
      <aside
        className={cx(
          'bg-white',
          'text-slate-800',
          'border-r',
          'border-slate-200',
          'transition-all',
          'duration-300',
          isSidebarOpen ? 'w-72' : 'w-20',
          'flex',
          'flex-col'
        )}
      >
        <div className="p-4 flex items-center justify-between">
          <div className={cx('flex items-center gap-3', !isSidebarOpen && 'hidden')}>
            <div className="h-9 w-9 rounded-lg bg-violet-700 text-white grid place-items-center font-semibold">C</div>
            <div>
              <h1 className="font-bold text-base leading-tight">CoreInventory</h1>
              <p className="text-[11px] uppercase tracking-wider text-slate-400">Enterprise Edition</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1.5 hover:bg-slate-100 rounded-md">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 mt-2 px-3 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={cx(
                'flex',
                'items-center',
                'p-3',
                'rounded-md',
                'transition-colors',
                location.pathname === item.path
                  ? 'bg-violet-100 text-violet-800'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
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

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center text-sm font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className={cx('ml-3', 'overflow-hidden', !isSidebarOpen && 'hidden')}>
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center p-3 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-md transition-colors"
          >
            <LogOut size={20} />
            <span className={cx('ml-3', !isSidebarOpen && 'hidden')}>Logout</span>
          </button>
        </div>
      </aside>

        <main className="flex-1 overflow-y-auto bg-slate-50/50">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="ci-input pl-9" placeholder="Search for products, orders or warehouses..." />
              </div>
              <button className="ci-button-ghost px-2.5"><Bell size={16} /></button>
              <button className="ci-button-primary gap-2"><Plus size={14} />New Transaction</button>
            </div>
          </header>
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired
};

export default Layout;
