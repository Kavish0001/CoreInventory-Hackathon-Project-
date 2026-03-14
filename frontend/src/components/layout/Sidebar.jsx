import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, selectAuth } from '../../features/auth/authSlice';
import Avatar from '../ui/Avatar';
import {
  LayoutDashboard,
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  Repeat,
  Warehouse,
  MapPin,
  BarChart3,
  Settings,
  LogOut,
  Boxes,
  Menu,
  X,
} from 'lucide-react';
import { ROLES } from '../../utils/rbac';

const NAV_SECTIONS = [
  {
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, to: '/' },
    ],
  },
  {
    title: 'INVENTORY',
    items: [
      { label: 'Receipts', icon: ArrowDownCircle, to: '/receipts', roles: [ROLES.INVENTORY_MANAGER] },
      { label: 'Delivery Orders', icon: ArrowUpCircle, to: '/deliveries', roles: [ROLES.INVENTORY_MANAGER] },
      { label: 'Internal Transfers', icon: Repeat, to: '/transfers', roles: [ROLES.INVENTORY_MANAGER, ROLES.WAREHOUSE_STAFF] },
    ],
  },
  {
    title: 'MASTER DATA',
    items: [
      { label: 'Products', icon: Package, to: '/products', roles: [ROLES.INVENTORY_MANAGER] },
      { label: 'Stock', icon: Boxes, to: '/stock', roles: [ROLES.INVENTORY_MANAGER, ROLES.WAREHOUSE_STAFF] },
    ],
  },
  {
    title: 'REPORTING',
    items: [
      { label: 'Move History', icon: BarChart3, to: '/move-history', roles: [ROLES.INVENTORY_MANAGER, ROLES.WAREHOUSE_STAFF] },
    ],
  },
  {
    title: 'SETTINGS',
    items: [
      { label: 'Warehouses', icon: Warehouse, to: '/warehouses', roles: [ROLES.INVENTORY_MANAGER] },
      { label: 'Locations', icon: MapPin, to: '/locations', roles: [ROLES.INVENTORY_MANAGER] },
      { label: 'Configuration', icon: Settings, to: '/settings', roles: [ROLES.INVENTORY_MANAGER] },
    ],
  },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(selectAuth);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center border-b border-white/10 py-4 h-[69px] ${collapsed ? 'justify-center' : 'justify-between px-4'}`}>
        {!collapsed && (
          <div className="flex items-center gap-3 fade-in">
            <img src="/image.png" alt="Logo" className="h-9 w-9 rounded-lg drop-shadow-sm flex-shrink-0" />
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold text-white tracking-tight truncate">CoreInventory</h1>
              <p className="text-[10px] text-sidebar-text opacity-60">Enterprise Edition</p>
            </div>
          </div>
        )}
        <button
          onClick={() => { setCollapsed(!collapsed); setMobileOpen(false); }}
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          className={`p-1.5 rounded-lg hover:bg-sidebar-active transition-colors hidden lg:flex items-center justify-center shrink-0 ${collapsed ? 'text-white' : 'text-sidebar-text hover:text-white ml-2'}`}
        >
          {collapsed ? <Menu size={22} /> : <X size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) => !item.roles || item.roles.includes(user?.role));
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title || 'Dashboard'}>
              {section.title && !collapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold text-sidebar-text/50 uppercase tracking-widest">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-sidebar-active text-sidebar-text-active'
                          : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active'
                      } ${collapsed ? 'justify-center' : ''}`
                    }
                  >
                    <item.icon size={18} className="shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-white/10 p-3">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <Avatar name={user?.name} size="sm" />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-[11px] text-sidebar-text/60 truncate capitalize">{user?.role}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-sidebar-active text-sidebar-text transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-40 p-2 rounded-lg bg-primary text-white shadow-lg"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden w-full h-full cursor-default border-none outline-none appearance-none"
          onClick={() => setMobileOpen(false)}
          aria-label="Close sidebar overlay"
          tabIndex={-1}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen bg-sidebar transition-sidebar flex-shrink-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static ${
          collapsed ? 'w-[var(--sidebar-collapsed-width)]' : 'w-[var(--sidebar-width)]'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
