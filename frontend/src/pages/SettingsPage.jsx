import { Settings, Users, ShieldCheck, KeyRound } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectAuth } from '../features/auth/authSlice';
import { getRoleLabel, PERMISSIONS, ROLES } from '../utils/rbac';

export default function SettingsPage() {
  const { user } = useSelector(selectAuth);

  const ROLE_MATRIX = [
    {
      role: ROLES.INVENTORY_MANAGER,
      label: 'Inventory Managers',
      description: 'Manage incoming & outgoing stock, master data, and system configuration.',
      permissions: [
        PERMISSIONS.MANAGE_RECEIPTS,
        PERMISSIONS.MANAGE_DELIVERIES,
        PERMISSIONS.MANAGE_PRODUCTS,
        PERMISSIONS.MANAGE_WAREHOUSES,
        PERMISSIONS.MANAGE_LOCATIONS,
        PERMISSIONS.VIEW_SETTINGS,
      ],
    },
    {
      role: ROLES.WAREHOUSE_STAFF,
      label: 'Warehouse Staff',
      description: 'Perform transfers, picking, shelving, and counting (operational work).',
      permissions: [
        PERMISSIONS.CREATE_TRANSFERS,
        PERMISSIONS.VIEW_STOCK,
        PERMISSIONS.VIEW_MOVE_HISTORY,
      ],
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-primary-light rounded-lg text-primary">
          <Settings size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Configuration</h1>
          <p className="text-sm text-text-secondary mt-0.5">Manage system settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100 text-text-muted">
              <Users size={18} />
            </div>
            <div>
              <p className="text-xs text-text-muted">Signed in as</p>
              <p className="text-sm font-semibold text-text-primary">{user?.name || '—'}</p>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Email</span>
              <span className="text-text-primary font-medium">{user?.email || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Role</span>
              <span className="text-text-primary font-medium">{getRoleLabel(user?.role)}</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary-light text-primary">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Role-Based Access Control (RBAC)</h2>
              <p className="text-xs text-text-muted mt-0.5">Pages and actions are restricted by role.</p>
            </div>
          </div>

          <div className="space-y-3">
            {ROLE_MATRIX.map((r) => (
              <div key={r.role} className="border border-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{r.label}</p>
                    <p className="text-xs text-text-secondary mt-1">{r.description}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border ${user?.role === r.role ? 'bg-primary-light text-primary border-primary/20' : 'bg-gray-50 text-text-muted border-border'}`}>
                    {user?.role === r.role ? 'Current role' : getRoleLabel(r.role)}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {r.permissions.map((p) => (
                    <span key={p} className="text-[11px] px-2 py-1 rounded-lg bg-gray-50 border border-border text-text-secondary">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 bg-card rounded-xl border border-border shadow-[var(--shadow-card)] p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-gray-100 text-text-muted">
            <KeyRound size={18} />
          </div>
          <h2 className="text-base font-semibold text-text-primary">Security Notes</h2>
        </div>
        <ul className="text-sm text-text-secondary list-disc pl-5 space-y-1.5">
          <li>Front-end navigation and routes are protected by role.</li>
          <li>For full security, enforce the same role checks in the API (recommended for production).</li>
        </ul>
      </div>
    </div>
  );
}
