export const JWT_SECRET = process.env.JWT_SECRET || 'retail-pos-super-secret-jwt-key-2026';
export const ACCESS_TOKEN_EXPIRES_IN = 86400; // 24 hours
export const REFRESH_TOKEN_EXPIRES_IN = 7 * 86400; // 7 days

export interface ModuleDefinition {
  module: string;
  label: string;
  actions: { key: string; label: string }[];
}

export const SYSTEM_MODULES: ModuleDefinition[] = [
  {
    module: 'dashboard',
    label: 'Dashboard',
    actions: [{ key: 'view', label: 'View' }],
  },
  {
    module: 'pos',
    label: 'POS Terminal',
    actions: [{ key: 'access', label: 'Access' }],
  },
  {
    module: 'products',
    label: 'Products',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'create', label: 'Create' },
      { key: 'update', label: 'Update' },
      { key: 'delete', label: 'Delete' },
    ],
  },
  {
    module: 'inventory',
    label: 'Inventory',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'create', label: 'Create' },
      { key: 'update', label: 'Update' },
      { key: 'delete', label: 'Delete' },
    ],
  },
  {
    module: 'orders',
    label: 'Orders & Sales',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'create', label: 'Create' },
      { key: 'update', label: 'Update' },
      { key: 'delete', label: 'Delete' },
    ],
  },
  {
    module: 'counters',
    label: 'POS Counters',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'create', label: 'Create' },
      { key: 'update', label: 'Update' },
      { key: 'delete', label: 'Delete' },
    ],
  },
  {
    module: 'returns',
    label: 'Return Orders',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'create', label: 'Create' },
      { key: 'update', label: 'Update' },
      { key: 'delete', label: 'Delete' },
    ],
  },
  {
    module: 'customers',
    label: 'Customers',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'create', label: 'Create' },
      { key: 'update', label: 'Update' },
      { key: 'delete', label: 'Delete' },
    ],
  },
  {
    module: 'users',
    label: 'Admin Users',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'create', label: 'Create' },
      { key: 'update', label: 'Update' },
      { key: 'delete', label: 'Delete' },
    ],
  },
  {
    module: 'roles',
    label: 'Roles & Permissions',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'create', label: 'Create' },
      { key: 'update', label: 'Update' },
      { key: 'delete', label: 'Delete' },
    ],
  },
];

export const ALL_SYSTEM_PERMISSIONS = SYSTEM_MODULES.flatMap((m) =>
  m.actions.map((a) => `${m.module}:${a.key}`)
);
