import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  PieChart,
  Building2,
  FileText,
  BarChart3,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Receipt,
  PackageCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { canAccess, isExecutiveRole } from '../config/permissions';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const [budgetOpen, setBudgetOpen] = useState(location.pathname.startsWith('/budget'));
  const [prOpen, setPrOpen] = useState(location.pathname.startsWith('/prs'));
  const [poOpen, setPoOpen] = useState(location.pathname.startsWith('/erp/po') || location.pathname.startsWith('/pos'));
  const [erpOpen, setErpOpen] = useState(location.pathname.startsWith('/erp') && !location.pathname.startsWith('/erp/po'));

  const role = user?.role || 'DEPARTMENT_USER';
  const isExecutive = isExecutiveRole(role);

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col h-screen sticky top-0 border-r border-slate-800/80 flex-shrink-0 select-none shadow-2xl z-20 font-sans">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-800/80 bg-slate-950">
        <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center p-1.5">
          <img src="/logo.png" alt="VIIT Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="font-bold text-slate-100 text-sm tracking-tight leading-tight">VIIT Finance</h1>
          <p className="text-[11px] text-slate-400 font-medium">
            {isExecutive ? 'Executive Approval Portal' : 'Budget & ERP Platform'}
          </p>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 text-xs">
        {/* Dashboard */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `group flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-medium ${
              isActive
                ? 'bg-slate-800/90 text-white font-semibold border border-slate-700/60 shadow-xs'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <LayoutDashboard className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
              <span>Dashboard</span>
            </>
          )}
        </NavLink>

        {/* PR Management */}
        {canAccess(role, 'prs') && (
          <div>
            <button
              onClick={() => setPrOpen(!prOpen)}
              className={`group w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all font-medium ${
                location.pathname.startsWith('/prs')
                  ? 'bg-slate-800/90 text-white font-semibold border border-slate-700/60 shadow-xs'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className={`w-4 h-4 transition-colors ${location.pathname.startsWith('/prs') ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span>{isExecutive ? 'PR Approvals' : 'PR Management'}</span>
              </div>
              {prOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>

            {prOpen && (
              <div className="ml-4 pl-3 border-l border-slate-800/80 my-1 space-y-0.5 text-xs">
                <NavLink to="/prs/pending" className={({ isActive }) => `block px-2.5 py-1.5 rounded-md transition-all ${isActive ? 'text-white font-semibold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}>Pending Approvals ⚡</NavLink>
                <NavLink to="/prs/approved" className={({ isActive }) => `block px-2.5 py-1.5 rounded-md transition-all ${isActive ? 'text-white font-semibold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}>Approved PRs</NavLink>
                <NavLink to="/prs/rejected" className={({ isActive }) => `block px-2.5 py-1.5 rounded-md transition-all ${isActive ? 'text-white font-semibold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}>Rejected PRs</NavLink>
                <NavLink to="/prs/all" className={({ isActive }) => `block px-2.5 py-1.5 rounded-md transition-all ${isActive ? 'text-white font-semibold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}>All PRs</NavLink>
                <NavLink to="/prs/closed" className={({ isActive }) => `block px-2.5 py-1.5 rounded-md transition-all ${isActive ? 'text-white font-semibold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}>Closed PRs</NavLink>
                {!isExecutive && (
                  <NavLink to="/prs/analysis" className={({ isActive }) => `block px-2.5 py-1.5 rounded-md transition-all ${isActive ? 'text-white font-semibold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}>PR Analysis</NavLink>
                )}
              </div>
            )}
          </div>
        )}

        {/* Budget Collapsible Group */}
        {canAccess(role, 'budget') && (
          <div>
            <button
              onClick={() => setBudgetOpen(!budgetOpen)}
              className={`group w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all font-medium ${
                location.pathname.startsWith('/budget')
                  ? 'bg-slate-800/90 text-white font-semibold border border-slate-700/60 shadow-xs'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <PieChart className={`w-4 h-4 transition-colors ${location.pathname.startsWith('/budget') ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span>Budget</span>
              </div>
              {budgetOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>

            {budgetOpen && (
              <div className="ml-4 pl-3 border-l border-slate-800/80 my-1 space-y-0.5 text-xs">
                <NavLink to="/budget/master" className={({ isActive }) => `block px-2.5 py-1.5 rounded-md transition-all ${isActive ? 'text-white font-semibold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}>Master Budget</NavLink>
                <NavLink to="/budget/departments" className={({ isActive }) => `block px-2.5 py-1.5 rounded-md transition-all ${isActive ? 'text-white font-semibold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}>Departments</NavLink>
                <NavLink to="/budget/heads" className={({ isActive }) => `block px-2.5 py-1.5 rounded-md transition-all ${isActive ? 'text-white font-semibold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}>Budget Heads</NavLink>
                <NavLink to="/budget/utilization" className={({ isActive }) => `block px-2.5 py-1.5 rounded-md transition-all ${isActive ? 'text-white font-semibold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}>Budget Utilization</NavLink>
              </div>
            )}
          </div>
        )}

        {/* PO Management Collapsible Group */}
        {canAccess(role, 'po') && (
          <div>
            <button
              onClick={() => setPoOpen(!poOpen)}
              className={`group w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all font-medium ${
                location.pathname.startsWith('/erp/po') || location.pathname.startsWith('/pos')
                  ? 'bg-slate-800/90 text-white font-semibold border border-slate-700/60 shadow-xs'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <PackageCheck className={`w-4 h-4 transition-colors ${location.pathname.startsWith('/pos') || location.pathname.startsWith('/erp/po') ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span>PO Management</span>
              </div>
              {poOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>

            {poOpen && (
              <div className="ml-4 pl-3 border-l border-slate-800/80 my-1 space-y-0.5 text-xs">
                <NavLink to="/pos/raise" className={({ isActive }) => `block px-2.5 py-1.5 rounded-md transition-all ${isActive ? 'text-white font-semibold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}>Raise PO</NavLink>
                <NavLink to="/pos/direct" className={({ isActive }) => `block px-2.5 py-1.5 rounded-md transition-all ${isActive ? 'text-white font-semibold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}>Add Direct PO</NavLink>
                <NavLink to="/pos/my-pos" className={({ isActive }) => `block px-2.5 py-1.5 rounded-md transition-all ${isActive ? 'text-white font-semibold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}>My Purchase Orders</NavLink>
                <NavLink to="/pos/on-hold" className={({ isActive }) => `block px-2.5 py-1.5 rounded-md transition-all ${isActive ? 'text-white font-semibold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}>All Hold PO For Additional Info</NavLink>
                <NavLink to="/pos/rejected" className={({ isActive }) => `block px-2.5 py-1.5 rounded-md transition-all ${isActive ? 'text-white font-semibold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}>Rejected PO</NavLink>
                <NavLink to="/pos/close" className={({ isActive }) => `block px-2.5 py-1.5 rounded-md transition-all ${isActive ? 'text-white font-semibold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}>Close PO</NavLink>
                <NavLink to="/pos/import" className={({ isActive }) => `block px-2.5 py-1.5 rounded-md transition-all ${isActive ? 'text-white font-semibold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}>Direct Po Import</NavLink>
                <NavLink to="/pos/modify" className={({ isActive }) => `block px-2.5 py-1.5 rounded-md transition-all ${isActive ? 'text-white font-semibold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}>Modify PO</NavLink>
              </div>
            )}
          </div>
        )}

        {/* ERP Procure-to-Pay & Inventory Modules */}
        {canAccess(role, 'erp') && (
          <div>
            <button
              onClick={() => setErpOpen(!erpOpen)}
              className={`group w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all font-medium ${
                erpOpen || (location.pathname.startsWith('/erp') && !location.pathname.startsWith('/erp/po'))
                  ? 'bg-slate-800/90 text-white font-semibold border border-slate-700/60 shadow-xs'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Building2 className={`w-4 h-4 transition-colors ${location.pathname.startsWith('/erp') ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span>ERP P2P & Inventory</span>
              </div>
              {erpOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>

            {erpOpen && (
              <div className="ml-4 pl-3 border-l border-slate-800/80 my-1 space-y-0.5 text-xs">
                {canAccess(role, 'masters') && <NavLink to="/erp/master-data" className={({ isActive }) => `block px-2.5 py-1.5 rounded-md transition-all ${isActive ? 'text-white font-semibold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}>Master Data</NavLink>}
                {canAccess(role, 'masters') && <NavLink to="/erp/master-data/add-vendor" className={({ isActive }) => `block px-2.5 py-1.5 rounded-md transition-all ${isActive ? 'text-white font-semibold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}>+ Add Vendor Master</NavLink>}
                {canAccess(role, 'masterApproval') && <NavLink to="/erp/master-approval" className={({ isActive }) => `block px-2.5 py-1.5 rounded-md transition-all ${isActive ? 'text-white font-semibold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}>Master Approval</NavLink>}
                {canAccess(role, 'quotations') && <NavLink to="/erp/quotations" className={({ isActive }) => `block px-2.5 py-1.5 rounded-md transition-all ${isActive ? 'text-white font-semibold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}>Quotation Management</NavLink>}
                {canAccess(role, 'rfq') && <NavLink to="/erp/rfq" className={({ isActive }) => `block px-2.5 py-1.5 rounded-md transition-all ${isActive ? 'text-white font-semibold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}>RFQ Broadcast & Matrix</NavLink>}
                {canAccess(role, 'grn') && <NavLink to="/erp/grn-data" className={({ isActive }) => `block px-2.5 py-1.5 rounded-md transition-all ${isActive ? 'text-white font-semibold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}>GRN Data & Stock</NavLink>}
                {canAccess(role, 'inventory') && <NavLink to="/erp/inventory" className={({ isActive }) => `block px-2.5 py-1.5 rounded-md transition-all ${isActive ? 'text-white font-semibold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}>Inventory Register</NavLink>}
                {canAccess(role, 'stockIssue') && <NavLink to="/erp/stock-issue" className={({ isActive }) => `block px-2.5 py-1.5 rounded-md transition-all ${isActive ? 'text-white font-semibold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}>Stock Issue</NavLink>}
                {canAccess(role, 'erpInvoices') && <NavLink to="/erp/invoice-data" className={({ isActive }) => `block px-2.5 py-1.5 rounded-md transition-all ${isActive ? 'text-white font-semibold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}>Invoice Data (3-Way)</NavLink>}
                {canAccess(role, 'payments') && <><NavLink to="/erp/payments" className={({ isActive }) => `block px-2.5 py-1.5 rounded-md transition-all ${isActive ? 'text-white font-semibold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}>Invoice Payments</NavLink><NavLink to="/erp/part-payments" className={({ isActive }) => `block px-2.5 py-1.5 rounded-md transition-all ${isActive ? 'text-white font-semibold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}>Part Payments</NavLink><NavLink to="/erp/dc-notes" className={({ isActive }) => `block px-2.5 py-1.5 rounded-md transition-all ${isActive ? 'text-white font-semibold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}>D/C Note Ledger</NavLink></>}
                {canAccess(role, 'projects') && <NavLink to="/erp/projects" className={({ isActive }) => `block px-2.5 py-1.5 rounded-md transition-all ${isActive ? 'text-white font-semibold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}>Project Management</NavLink>}
                {canAccess(role, 'erpReports') && <NavLink to="/erp/reports" className={({ isActive }) => `block px-2.5 py-1.5 rounded-md transition-all ${isActive ? 'text-white font-semibold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}>ERP Reports</NavLink>}
              </div>
            )}
          </div>
        )}

        {/* Invoices */}
        {canAccess(role, 'invoices') && (
          <NavLink
            to="/invoices"
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-medium ${
                isActive
                  ? 'bg-slate-800/90 text-white font-semibold border border-slate-700/60 shadow-xs'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Receipt className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span>Invoices</span>
              </>
            )}
          </NavLink>
        )}

        {/* Audit Trail */}
        {canAccess(role, 'audit') && (
          <NavLink
            to="/audit"
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-medium ${
                isActive
                  ? 'bg-slate-800/90 text-white font-semibold border border-slate-700/60 shadow-xs'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <ShieldAlert className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span>Audit Trail</span>
              </>
            )}
          </NavLink>
        )}

        {/* Reports */}
        {canAccess(role, 'reports') && (
          <NavLink
            to="/reports"
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-medium ${
                isActive
                  ? 'bg-slate-800/90 text-white font-semibold border border-slate-700/60 shadow-xs'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <BarChart3 className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span>Reports</span>
              </>
            )}
          </NavLink>
        )}

        {/* Users */}
        {canAccess(role, 'users') && (
          <NavLink
            to="/users"
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-medium ${
                isActive
                  ? 'bg-slate-800/90 text-white font-semibold border border-slate-700/60 shadow-xs'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Users className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span>Users</span>
              </>
            )}
          </NavLink>
        )}

        {/* Settings */}
        {canAccess(role, 'settings') && (
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-medium ${
                isActive
                  ? 'bg-slate-800/90 text-white font-semibold border border-slate-700/60 shadow-xs'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Settings className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span>Settings</span>
              </>
            )}
          </NavLink>
        )}
      </div>

      {/* Role Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950">
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-800">
          <div className="w-7 h-7 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60 flex items-center justify-center font-semibold text-[11px] uppercase shrink-0">
            {user?.role ? user.role.substring(0, 2) : 'US'}
          </div>
          <div className="overflow-hidden min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'Faculty User'}</p>
            <p className="text-[10px] text-slate-400 uppercase font-medium truncate">{user?.role || 'DEPARTMENT_USER'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
