// Central role-to-module map for navigation and direct route protection.
// Backend authorization remains authoritative for all data and mutations.

export type Role =
  | 'ADMIN'
  | 'FINANCE'
  | 'HOD'
  | 'DEPARTMENT_USER'
  | 'PRINCIPAL'
  | 'CEO'
  | 'STORE';

export type ModuleKey =
  | 'dashboard'
  | 'prs'
  | 'budget'
  | 'po'
  | 'erp'
  | 'masters'
  | 'masterApproval'
  | 'quotations'
  | 'rfq'
  | 'grn'
  | 'inventory'
  | 'stockIssue'
  | 'erpInvoices'
  | 'payments'
  | 'projects'
  | 'erpReports'
  | 'invoices'
  | 'reports'
  | 'users'
  | 'audit'
  | 'settings';

const FINANCE_ERP: ModuleKey[] = [
  'erp', 'masters', 'masterApproval', 'quotations', 'rfq', 'grn', 'inventory',
  'stockIssue', 'erpInvoices', 'payments', 'projects', 'erpReports'
];
const ALL_MODULES: ModuleKey[] = [
  'dashboard', 'prs', 'budget', 'po', ...FINANCE_ERP, 'invoices', 'reports',
  'users', 'audit', 'settings'
];

const ROLE_MODULES: Record<Role, ModuleKey[]> = {
  ADMIN: ALL_MODULES,
  FINANCE: ['dashboard', 'prs', 'budget', 'po', ...FINANCE_ERP, 'invoices', 'reports', 'audit', 'settings'],
  HOD: ['dashboard', 'prs', 'budget', 'po', 'erp', 'masters', 'quotations', 'rfq', 'projects', 'invoices', 'settings'],
  DEPARTMENT_USER: ['dashboard', 'prs', 'erp', 'masters', 'quotations', 'rfq', 'projects', 'invoices', 'settings'],
  PRINCIPAL: ['dashboard', 'prs', 'masters', 'masterApproval'],
  CEO: ['dashboard', 'prs', 'masters', 'masterApproval'],
  STORE: ['dashboard', 'erp', 'grn', 'inventory', 'stockIssue', 'settings']
};

// Longest matching route prefix wins. ERP paths are listed explicitly so the
// menu and direct URL checks make the same decision for each operational area.
const ROUTE_MODULE: Array<[string, ModuleKey]> = [
  ['/dashboard', 'dashboard'], ['/prs', 'prs'], ['/budget', 'budget'],
  ['/pos', 'po'], ['/erp/po', 'po'],
  ['/erp/master-approval', 'masterApproval'], ['/erp/master-data', 'masters'],
  ['/erp/add-vendor', 'masters'], ['/erp/quotations', 'quotations'], ['/erp/rfq', 'rfq'],
  ['/erp/grn-data', 'grn'], ['/erp/inventory', 'inventory'], ['/erp/stock-issue', 'stockIssue'],
  ['/erp/invoice-data', 'erpInvoices'], ['/erp/payments', 'payments'],
  ['/erp/part-payments', 'payments'], ['/erp/dc-notes', 'payments'],
  ['/erp/projects', 'projects'], ['/erp/reports', 'erpReports'], ['/erp', 'erp'],
  ['/invoices', 'invoices'], ['/reports', 'reports'], ['/users', 'users'],
  ['/audit', 'audit'], ['/settings', 'settings']
];

function normalizeRole(role?: string): Role {
  const value = (role || 'DEPARTMENT_USER').toUpperCase();
  return value in ROLE_MODULES ? value as Role : 'DEPARTMENT_USER';
}

export function canAccess(role: string | undefined, moduleKey: ModuleKey): boolean {
  return ROLE_MODULES[normalizeRole(role)].includes(moduleKey);
}

export function canAccessRoute(role: string | undefined, pathname: string): boolean {
  let matched: ModuleKey | undefined;
  let matchedLength = -1;
  for (const [prefix, moduleKey] of ROUTE_MODULE) {
    if ((pathname === prefix || pathname.startsWith(`${prefix}/`)) && prefix.length > matchedLength) {
      matched = moduleKey;
      matchedLength = prefix.length;
    }
  }
  return matched ? canAccess(role, matched) : true;
}

export function isExecutiveRole(role: string | undefined): boolean {
  const normalized = normalizeRole(role);
  return normalized === 'PRINCIPAL' || normalized === 'CEO';
}

export function getHomeRoute(role?: string): string {
  return canAccess(role, 'dashboard') ? '/dashboard' : '/login';
}
