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
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const [budgetOpen, setBudgetOpen] = useState(
    location.pathname.startsWith('/budget')
  );
  const [prOpen, setPrOpen] = useState(
    location.pathname.startsWith('/prs')
  );

  const role = user?.role || 'DEPARTMENT_USER';

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 border-r border-slate-800 flex-shrink-0 select-none shadow-xl z-20">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-800 bg-slate-950/60">
        <div className="w-10 h-10 rounded-lg p-1 bg-white flex items-center justify-center shadow-md shadow-brand-500/20">
          <img src="/logo.png" alt="VIIT Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="font-bold text-white text-sm tracking-wide leading-tight">VIIT College</h1>
          <p className="text-[11px] text-slate-400 font-medium">Budget & PR System</p>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 text-sm font-medium">
        {/* Dashboard */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              isActive
                ? 'bg-brand-600 text-white font-semibold shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`
          }
        >
          <LayoutDashboard className="w-4 h-4 text-brand-400" />
          <span>Dashboard</span>
        </NavLink>

        {/* Budget Collapsible Group */}
        <div>
          <button
            onClick={() => setBudgetOpen(!budgetOpen)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
              location.pathname.startsWith('/budget')
                ? 'text-white font-semibold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <PieChart className="w-4 h-4 text-emerald-400" />
              <span>Budget</span>
            </div>
            {budgetOpen ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {budgetOpen && (
            <div className="ml-4 pl-3 border-l border-slate-700/60 my-1 space-y-1 text-xs">
              <NavLink
                to="/budget/master"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md transition-colors ${
                    isActive ? 'bg-slate-800 text-brand-400 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                Master Budget
              </NavLink>
              <NavLink
                to="/budget/departments"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md transition-colors ${
                    isActive ? 'bg-slate-800 text-brand-400 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                Departments
              </NavLink>
              <NavLink
                to="/budget/heads"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md transition-colors ${
                    isActive ? 'bg-slate-800 text-brand-400 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                Budget Heads
              </NavLink>
              <NavLink
                to="/budget/utilization"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md transition-colors ${
                    isActive ? 'bg-slate-800 text-brand-400 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                Budget Utilization
              </NavLink>
            </div>
          )}
        </div>

        {/* PR Management Collapsible Group */}
        <div>
          <button
            onClick={() => setPrOpen(!prOpen)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
              location.pathname.startsWith('/prs')
                ? 'text-white font-semibold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>PR Management</span>
            </div>
            {prOpen ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {prOpen && (
            <div className="ml-4 pl-3 border-l border-slate-700/60 my-1 space-y-1 text-xs">
              <NavLink
                to="/prs/all"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md transition-colors ${
                    isActive ? 'bg-slate-800 text-brand-400 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                All PRs
              </NavLink>
              <NavLink
                to="/prs/approved"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md transition-colors ${
                    isActive ? 'bg-slate-800 text-brand-400 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                Approved PRs
              </NavLink>
              <NavLink
                to="/prs/pending"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md transition-colors ${
                    isActive ? 'bg-slate-800 text-brand-400 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                Pending PRs
              </NavLink>
              <NavLink
                to="/prs/rejected"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md transition-colors ${
                    isActive ? 'bg-slate-800 text-brand-400 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                Rejected PRs
              </NavLink>
              <NavLink
                to="/prs/analysis"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md transition-colors ${
                    isActive ? 'bg-slate-800 text-brand-400 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                PR Analysis
              </NavLink>
            </div>
          )}
        </div>

        {/* Reports */}
        <NavLink
          to="/reports"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              isActive
                ? 'bg-brand-600 text-white font-semibold shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`
          }
        >
          <BarChart3 className="w-4 h-4 text-amber-400" />
          <span>Reports</span>
        </NavLink>

        {/* Data Import (Admin & Finance) */}
        {(role === 'ADMIN' || role === 'FINANCE') && (
          <NavLink
            to="/data-import"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Data Import</span>
          </NavLink>
        )}

        {/* User Management (Admin only) */}
        {role === 'ADMIN' && (
          <NavLink
            to="/users"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Users className="w-4 h-4 text-violet-400" />
            <span>Users</span>
          </NavLink>
        )}

        {/* Settings */}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              isActive
                ? 'bg-brand-600 text-white font-semibold shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`
          }
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Settings</span>
        </NavLink>
      </div>

      {/* Role Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
          <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center font-bold text-xs uppercase">
            {user?.role ? user.role.substring(0, 2) : 'US'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</p>
            <p className="text-[10px] text-slate-400 uppercase font-medium">{user?.role || 'Guest'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
