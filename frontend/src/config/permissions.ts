// Role-based access control map. Single source of truth for which modules and
// routes each role may reach — consumed by Sidebar (menu visibility) and the
// RoleRoute guard in App.tsx (direct-URL protection). See docs/architecture.md
// §5.1 Security Model & RBAC.

export type Role =
  | 'ADMIN'
  | 'FINANCE'
  | 'HOD'
  | 'DEPARTMENT_USER'
  | 'PRINCIPAL'
  | 'CEO'
  | 'STORE';

// Logical modules used for both menu grouping and route gating.
export type ModuleKey =
  | 'dashboard'
  | 'prs'
  | 'budget'
  | 'po'
  | 'erp'
  | 'invoices'
  | 'reports'
  | 'users'
  | 'audit'
  | 'settings';

const ALL_MODULES: ModuleKey[] = [
  'dashboard', 'prs', 'budget', 'po', 'erp', 'invoices', 'reports', 'users', 'audit', 'settings'
];

// Module access per role. Executives (Principal/CEO) are intentionally limited to
// dashboard + PR approval queues; Store managers see only inventory-side ERP.
const ROLE_MODULES: Record<Role, ModuleKey[]> = {
  ADMIN: ALL_MODULES,
  FINANCE: ['dashboard', 'prs', 'budget', 'po', 'erp', 'invoices', 'reports', 'audit', 'settings'],
  HOD: ['dashboard', 'prs', 'budget', 'po', 'erp', 'invoices', 'settings'],
  DEPARTMENT_USER: ['dashboard', 'prs', 'erp', 'invoices', 'settings'],
  PRINCIPAL: ['dashboard', 'prs'],
  CEO: ['dashboard', 'prs'],
  STORE: ['dashboard', 'erp', 'settings']
};

// Route prefix -> required module. Longest-prefix match wins. Anything not listed
// is treated as always-allowed (auth-only), so utility/error routes stay reachable.
const ROUTE_MODULE: Array<[string, ModuleKey]> = [
  ['/dashboard', 'dashboard'],
  ['/prs', 'prs'],
  ['/budget', 'budget'],
  ['/pos', 'po'],
  ['/erp/po', 'po'],
  ['/erp', 'erp'],
  ['/invoices', 'invoices'],
  ['/reports', 'reports'],
  ['/users', 'users'],
  ['/audit', 'audit'],
  ['/settings', 'settings']
];

function normalizeRole(role?: string): Role {
  const r = (role || 'DEPARTMENT_USER').toUpperCase();
  if (r in ROLE_MODULES) return r as Role;
  return 'DEPARTMENT_USER';
}

export function canAccess(role: string | undefined, moduleKey: ModuleKey): boolean {
  return ROLE_MODULES[normalizeRole(role)].includes(moduleKey);
}

// Resolve the module a path belongs to, then check role access. Unmapped paths
// (e.g. /profile, /403) are allowed for any authenticated user.
export function canAccessRoute(role: string | undefined, pathname: string): boolean {
  let matched: ModuleKey | null = null;
  let matchedLen = -1;
  for (const [prefix, moduleKey] of ROUTE_MODULE) {
    if ((pathname === prefix || pathname.startsWith(prefix + '/')) && prefix.length > matchedLen) {
      matched = moduleKey;
      matchedLen = prefix.length;
    }
  }
  if (!matched) return true;
  return canAccess(role, matched);
}

export function isExecutiveRole(role: string | undefined): boolean {
  const r = normalizeRole(role);
  return r === 'PRINCIPAL' || r === 'CEO';
}
