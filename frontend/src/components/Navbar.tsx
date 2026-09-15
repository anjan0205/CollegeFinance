import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User as UserIcon, Bell, Database, HelpCircle, LifeBuoy, Settings, ShieldCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10 shadow-xs">
      <div className="flex items-center gap-3">
        <span className="font-extrabold text-slate-800 text-sm tracking-wide bg-slate-100 text-slate-800 px-3 py-1 rounded-lg border border-slate-200">
          Lavu Educational Society
        </span>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Quick Help, Support & Legal Links pointing directly into Settings tabs */}
        <div className="flex items-center gap-1.5 border-r border-slate-200 pr-3">
          <Link
            to="/settings?tab=help"
            title="Help Center & FAQs"
            className="p-2 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition"
          >
            <HelpCircle className="w-4 h-4" />
          </Link>
          <Link
            to="/settings?tab=support"
            title="Support Tickets"
            className="p-2 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition"
          >
            <LifeBuoy className="w-4 h-4" />
          </Link>
          <Link
            to="/settings?tab=legal"
            title="Legal & Compliance Policies"
            className="p-2 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition"
          >
            <ShieldCheck className="w-4 h-4" />
          </Link>
        </div>

        {/* User Info with link to Settings (Account Tab) */}
        <Link
          to="/settings?tab=account"
          className="flex items-center gap-2.5 text-right p-1.5 hover:bg-slate-50 rounded-xl transition group"
        >
          <div className="hidden sm:block text-right">
            <p className="text-xs font-bold text-slate-800 leading-tight group-hover:text-brand-600 transition">
              {user?.name || 'User'}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">{user?.role || 'Faculty'}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center font-bold text-xs">
            {user?.name ? user.name.substring(0, 2).toUpperCase() : 'US'}
          </div>
        </Link>

        {/* Logout Button */}
        <button
          onClick={logout}
          title="Sign Out"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
