import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  PieChart,
  Building2,
  ListTree,
  TrendingUp,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  BarChart3,
  FileSpreadsheet,
  Upload,
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
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 border-r border-slate-800 flex-shrink-0 select-none shadow-xl z-20">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-800 bg-slate-950/60">
        <div className="w-10 h-10 rounded-lg p-1 bg-white flex items-center justify-center shadow-md shadow-brand-500/20">
          <img src="/logo.png" alt="VIIT Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="font-extrabold text-white text-base tracking-wide leading-tight">VIIT Finance</h1>
          <p className="text-[11px] text-slate-400 font-bold">
            {isExecutive ? 'Executive Approval Portal' : 'Budget & ERP Portal'}
          </p>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 text-sm font-bold">
        {/* Dashboard */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              isActive
                ? 'bg-brand-600 text-white font-bold shadow-sm'
                : 'text-slate-200 hover:bg-slate-800 hover:text-white font-bold'
            }`
          }
        >
          <LayoutDashboard className="w-4.5 h-4.5 text-brand-400" />
          <span className="font-bold">Dashboard</span>
        </NavLink>

        {/* PR Management Collapsible Group (Always visible for Principal & CEO) */}
        <div>
          <button
            onClick={() => setPrOpen(!prOpen)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors font-bold ${
              location.pathname.startsWith('/prs')
                ? 'text-white font-bold bg-slate-800/80'
                : 'text-slate-200 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4.5 h-4.5 text-indigo-400" />
              <span className="font-bold">{isExecutive ? 'PR Approvals' : 'PR Management'}</span>
            </div>
            {prOpen ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {prOpen && (
            <div className="ml-4 pl-3 border-l border-slate-700/60 my-1 space-y-1 text-xs font-bold">
              <NavLink
                to="/prs/pending"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md transition-colors font-bold ${
                    isActive ? 'bg-slate-800 text-brand-400 font-bold' : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/50'
                  }`
                }
              >
                Pending Approvals ⚡
              </NavLink>
              <NavLink
                to="/prs/approved"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md transition-colors font-bold ${
                    isActive ? 'bg-slate-800 text-brand-400 font-bold' : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/50'
                  }`
                }
              >
                Approved PRs
              </NavLink>
              <NavLink
                to="/prs/rejected"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md transition-colors font-bold ${
                    isActive ? 'bg-slate-800 text-brand-400 font-bold' : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/50'
                  }`
                }
              >
                Rejected PRs
              </NavLink>
              <NavLink
                to="/prs/all"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md transition-colors font-bold ${
                    isActive ? 'bg-slate-800 text-brand-400 font-bold' : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/50'
                  }`
                }
              >
                All PRs
              </NavLink>
              <NavLink
                to="/prs/closed"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md transition-colors font-bold ${
                    isActive ? 'bg-slate-800 text-brand-400 font-bold' : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/50'
                  }`
                }
              >
                Closed PRs
              </NavLink>
              {!isExecutive && (
                <NavLink
                  to="/prs/analysis"
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md transition-colors font-bold ${
                      isActive ? 'bg-slate-800 text-brand-400 font-bold' : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/50'
                    }`
                  }
                >
                  PR Analysis
                </NavLink>
              )}
            </div>
          )}
        </div>

        {/* Budget Collapsible Group */}
        {canAccess(role, 'budget') && (
            <div>
              <button
                onClick={() => setBudgetOpen(!budgetOpen)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors font-bold ${
                  location.pathname.startsWith('/budget')
                    ? 'text-white font-bold bg-slate-800/80'
                    : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <PieChart className="w-4.5 h-4.5 text-emerald-400" />
                  <span className="font-bold">Budget</span>
                </div>
                {budgetOpen ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {budgetOpen && (
                <div className="ml-4 pl-3 border-l border-slate-700/60 my-1 space-y-1 text-xs font-bold">
                  <NavLink
                    to="/budget/master"
                    className={({ isActive }) =>
                      `block px-3 py-2 rounded-md transition-colors font-bold ${
                        isActive ? 'bg-slate-800 text-brand-400 font-bold' : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/50'
                      }`
                    }
                  >
                    Master Budget
                  </NavLink>
                  <NavLink
                    to="/budget/departments"
                    className={({ isActive }) =>
                      `block px-3 py-2 rounded-md transition-colors font-bold ${
                        isActive ? 'bg-slate-800 text-brand-400 font-bold' : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/50'
                      }`
                    }
                  >
                    Departments
                  </NavLink>
                  <NavLink
                    to="/budget/heads"
                    className={({ isActive }) =>
                      `block px-3 py-2 rounded-md transition-colors font-bold ${
                        isActive ? 'bg-slate-800 text-brand-400 font-bold' : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/50'
                      }`
                    }
                  >
                    Budget Heads
                  </NavLink>
                  <NavLink
                    to="/budget/utilization"
                    className={({ isActive }) =>
                      `block px-3 py-2 rounded-md transition-colors font-bold ${
                        isActive ? 'bg-slate-800 text-brand-400 font-bold' : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/50'
                      }`
                    }
                  >
                    Budget Utilization
                  </NavLink>
                </div>
              )}
            </div>
        )}

            {/* PO Management Collapsible Group */}
            {canAccess(role, 'po') && (
            <div>
              <button
                onClick={() => setPoOpen(!poOpen)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors font-bold ${
                  location.pathname.startsWith('/erp/po') || location.pathname.startsWith('/pos')
                    ? 'text-white font-bold bg-slate-800/80'
                    : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <PackageCheck className="w-4.5 h-4.5 text-amber-400" />
                  <span className="font-bold">PO Management</span>
                </div>
                {poOpen ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {poOpen && (
                <div className="ml-4 pl-3 border-l border-slate-700/60 my-1 space-y-1 text-xs font-bold">
                  <NavLink to="/pos/raise" className={({ isActive }) => `block px-3 py-1.5 rounded-md font-bold ${isActive ? 'bg-slate-800 text-brand-400 font-bold' : 'text-slate-300 hover:text-slate-100'}`}>Raise PO</NavLink>
                  <NavLink to="/pos/direct" className={({ isActive }) => `block px-3 py-1.5 rounded-md font-bold ${isActive ? 'bg-slate-800 text-brand-400 font-bold' : 'text-slate-300 hover:text-slate-100'}`}>Add Direct PO</NavLink>
                  <NavLink to="/pos/my-pos" className={({ isActive }) => `block px-3 py-1.5 rounded-md font-bold ${isActive ? 'bg-slate-800 text-brand-400 font-bold' : 'text-slate-300 hover:text-slate-100'}`}>My Purchase Orders</NavLink>
                  <NavLink to="/pos/on-hold" className={({ isActive }) => `block px-3 py-1.5 rounded-md font-bold ${isActive ? 'bg-slate-800 text-brand-400 font-bold' : 'text-slate-300 hover:text-slate-100'}`}>All Hold PO For Additional Info</NavLink>
                  <NavLink to="/pos/rejected" className={({ isActive }) => `block px-3 py-1.5 rounded-md font-bold ${isActive ? 'bg-slate-800 text-brand-400 font-bold' : 'text-slate-300 hover:text-slate-100'}`}>Rejected PO</NavLink>
                  <NavLink to="/pos/close" className={({ isActive }) => `block px-3 py-1.5 rounded-md font-bold ${isActive ? 'bg-slate-800 text-brand-400 font-bold' : 'text-slate-300 hover:text-slate-100'}`}>Close PO</NavLink>
                  <NavLink to="/pos/import" className={({ isActive }) => `block px-3 py-1.5 rounded-md font-bold ${isActive ? 'bg-slate-800 text-brand-400 font-bold' : 'text-slate-300 hover:text-slate-100'}`}>Direct Po Import</NavLink>
                  <NavLink to="/pos/modify" className={({ isActive }) => `block px-3 py-1.5 rounded-md font-bold ${isActive ? 'bg-slate-800 text-brand-400 font-bold' : 'text-slate-300 hover:text-slate-100'}`}>Modify PO</NavLink>
                </div>
              )}
            </div>
            )}

            {/* ERP Procure-to-Pay & Inventory Modules */}
            {canAccess(role, 'erp') && (
            <div>
              <button
                onClick={() => setErpOpen(!erpOpen)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors font-bold ${
                  erpOpen || (location.pathname.startsWith('/erp') && !location.pathname.startsWith('/erp/po'))
                    ? 'text-white font-bold bg-indigo-950/60 border border-indigo-800/40'
                    : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Building2 className="w-4.5 h-4.5 text-purple-400" />
                  <span className="font-bold text-white">ERP P2P & Inventory</span>
                </div>
                {erpOpen ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {erpOpen && (
                <div className="ml-4 pl-3 border-l border-indigo-700/60 my-1 space-y-1 text-xs font-bold">
                  <NavLink to="/erp/master-data" className={({ isActive }) => `block px-3 py-1.5 rounded-md font-bold ${isActive ? 'bg-slate-800 text-brand-400 font-extrabold' : 'text-slate-300 hover:text-white'}`}>Master Data</NavLink>
                  <NavLink to="/erp/master-data/add-vendor" className={({ isActive }) => `block px-3 py-1.5 rounded-md font-bold ${isActive ? 'bg-slate-800 text-purple-400 font-extrabold' : 'text-slate-300 hover:text-white'}`}>+ Add Vendor Master</NavLink>
                  <NavLink to="/erp/master-approval" className={({ isActive }) => `block px-3 py-1.5 rounded-md font-bold ${isActive ? 'bg-slate-800 text-brand-400 font-extrabold' : 'text-slate-300 hover:text-white'}`}>Master Approval</NavLink>
                  <NavLink to="/erp/quotations" className={({ isActive }) => `block px-3 py-1.5 rounded-md font-bold ${isActive ? 'bg-slate-800 text-brand-400 font-extrabold' : 'text-slate-300 hover:text-white'}`}>Quotation Management</NavLink>
                  <NavLink to="/erp/rfq" className={({ isActive }) => `block px-3 py-1.5 rounded-md font-bold ${isActive ? 'bg-slate-800 text-indigo-400 font-extrabold' : 'text-slate-300 hover:text-white'}`}>RFQ Broadcast & Matrix</NavLink>
                  <NavLink to="/erp/grn-data" className={({ isActive }) => `block px-3 py-1.5 rounded-md font-bold ${isActive ? 'bg-slate-800 text-brand-400 font-extrabold' : 'text-slate-300 hover:text-white'}`}>GRN Data & Stock</NavLink>
                  <NavLink to="/erp/inventory" className={({ isActive }) => `block px-3 py-1.5 rounded-md font-bold ${isActive ? 'bg-slate-800 text-brand-400 font-extrabold' : 'text-slate-300 hover:text-white'}`}>Inventory Register</NavLink>
                  <NavLink to="/erp/stock-issue" className={({ isActive }) => `block px-3 py-1.5 rounded-md font-bold ${isActive ? 'bg-slate-800 text-brand-400 font-extrabold' : 'text-slate-300 hover:text-white'}`}>Stock Issue</NavLink>
                  <NavLink to="/erp/invoice-data" className={({ isActive }) => `block px-3 py-1.5 rounded-md font-bold ${isActive ? 'bg-slate-800 text-brand-400 font-extrabold' : 'text-slate-300 hover:text-white'}`}>Invoice Data (3-Way)</NavLink>
                  <NavLink to="/erp/payments" className={({ isActive }) => `block px-3 py-1.5 rounded-md font-bold ${isActive ? 'bg-slate-800 text-brand-400 font-extrabold' : 'text-slate-300 hover:text-white'}`}>Invoice Payments</NavLink>
                  <NavLink to="/erp/part-payments" className={({ isActive }) => `block px-3 py-1.5 rounded-md font-bold ${isActive ? 'bg-slate-800 text-brand-400 font-extrabold' : 'text-slate-300 hover:text-white'}`}>Part Payments</NavLink>
                  <NavLink to="/erp/dc-notes" className={({ isActive }) => `block px-3 py-1.5 rounded-md font-bold ${isActive ? 'bg-slate-800 text-brand-400 font-extrabold' : 'text-slate-300 hover:text-white'}`}>D/C Note Ledger</NavLink>
                  <NavLink to="/erp/projects" className={({ isActive }) => `block px-3 py-1.5 rounded-md font-bold ${isActive ? 'bg-slate-800 text-brand-400 font-extrabold' : 'text-slate-300 hover:text-white'}`}>Project Management</NavLink>
                  <NavLink to="/erp/reports" className={({ isActive }) => `block px-3 py-1.5 rounded-md font-bold ${isActive ? 'bg-slate-800 text-brand-400 font-extrabold' : 'text-slate-300 hover:text-white'}`}>ERP Reports</NavLink>
                </div>
              )}
            </div>
            )}

            {/* Invoices */}
            {canAccess(role, 'invoices') && (
            <NavLink
              to="/invoices"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white font-bold shadow-sm'
                    : 'text-slate-200 hover:bg-slate-800 hover:text-white font-bold'
                }`
              }
            >
              <Receipt className="w-4.5 h-4.5 text-emerald-400" />
              <span className="font-bold">Invoices</span>
            </NavLink>
            )}

            {/* Audit Trail (Admin & Finance) */}
            {canAccess(role, 'audit') && (
              <NavLink
                to="/audit"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-brand-600 text-white font-bold shadow-sm'
                      : 'text-slate-200 hover:bg-slate-800 hover:text-white font-bold'
                  }`
                }
              >
                <ShieldAlert className="w-4.5 h-4.5 text-rose-400" />
                <span className="font-bold">Audit Trail</span>
              </NavLink>
            )}

            {/* Reports (role-gated) */}
            {canAccess(role, 'reports') && (
              <NavLink
                to="/reports"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-brand-600 text-white font-bold shadow-sm'
                      : 'text-slate-200 hover:bg-slate-800 hover:text-white font-bold'
                  }`
                }
              >
                <BarChart3 className="w-4.5 h-4.5 text-amber-400" />
                <span className="font-bold">Reports</span>
              </NavLink>
            )}

            {/* User Management (role-gated) */}
            {canAccess(role, 'users') && (
              <NavLink
                to="/users"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-brand-600 text-white font-bold shadow-sm'
                      : 'text-slate-200 hover:bg-slate-800 hover:text-white font-bold'
                  }`
                }
              >
                <Users className="w-4.5 h-4.5 text-violet-400" />
                <span className="font-bold">Users</span>
              </NavLink>
            )}

            {/* Unified Settings Menu */}
            {canAccess(role, 'settings') && (
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white font-bold shadow-sm'
                    : 'text-slate-200 hover:bg-slate-800 hover:text-white font-bold'
                }`
              }
            >
              <Settings className="w-4.5 h-4.5 text-slate-400" />
              <span className="font-bold">Settings</span>
            </NavLink>
            )}
      </div>

      {/* Role Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
          <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center font-bold text-xs uppercase">
            {user?.role ? user.role.substring(0, 2) : 'US'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">{user?.name || 'Faculty User'}</p>
            <p className="text-[10px] text-slate-400 uppercase font-medium">{user?.role || 'DEPARTMENT_USER'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
