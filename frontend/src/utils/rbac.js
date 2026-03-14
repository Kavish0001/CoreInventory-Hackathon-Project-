export const ROLES = {
  INVENTORY_MANAGER: 'manager',
  WAREHOUSE_STAFF: 'warehouse_staff',
};

export const ROLE_LABELS = {
  [ROLES.INVENTORY_MANAGER]: 'Inventory Manager',
  [ROLES.WAREHOUSE_STAFF]: 'Warehouse Staff',
};

export const PERMISSIONS = {
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_STOCK: 'view_stock',
  VIEW_MOVE_HISTORY: 'view_move_history',

  MANAGE_PRODUCTS: 'manage_products',
  MANAGE_RECEIPTS: 'manage_receipts',
  MANAGE_DELIVERIES: 'manage_deliveries',

  CREATE_TRANSFERS: 'create_transfers',

  MANAGE_WAREHOUSES: 'manage_warehouses',
  MANAGE_LOCATIONS: 'manage_locations',
  VIEW_SETTINGS: 'view_settings',
};

const ROLE_PERMISSIONS = {
  [ROLES.INVENTORY_MANAGER]: new Set([
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_STOCK,
    PERMISSIONS.VIEW_MOVE_HISTORY,
    PERMISSIONS.MANAGE_PRODUCTS,
    PERMISSIONS.MANAGE_RECEIPTS,
    PERMISSIONS.MANAGE_DELIVERIES,
    PERMISSIONS.CREATE_TRANSFERS,
    PERMISSIONS.MANAGE_WAREHOUSES,
    PERMISSIONS.MANAGE_LOCATIONS,
    PERMISSIONS.VIEW_SETTINGS,
  ]),
  [ROLES.WAREHOUSE_STAFF]: new Set([
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_STOCK,
    PERMISSIONS.VIEW_MOVE_HISTORY,
    PERMISSIONS.CREATE_TRANSFERS,
  ]),
};

export function getRoleLabel(role) {
  return ROLE_LABELS[role] || String(role || 'unknown');
}

export function hasPermission(user, permission) {
  const role = user?.role;
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.has(permission);
}

export function isRoleAllowed(user, allowedRoles) {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(user?.role);
}

