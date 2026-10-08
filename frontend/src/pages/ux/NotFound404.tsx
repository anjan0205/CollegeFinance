import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search, Compass, FileQuestion, LifeBuoy } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { canAccessRoute, getHomeRoute } from '../../config/permissions';

export const NotFound404: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const quickLinks = [
    { name: 'Dashboard Overview', path: '/dashboard' },
    { name: 'Master Budget', path: '/budget/master' },
    { name: 'All Purchase Requisitions', path: '/prs/all' },
    { name: 'Invoices & Ledger', path: '/invoices' },
    { name: 'Help Center', path: '/help' },
    { name: 'Legal Policies', path: '/legal' }
  ].filter(link => !isAuthenticated || canAccessRoute(user?.role, link.path));
  const homeRoute = isAuthenticated ? getHomeRoute(user?.role) : '/login';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/help?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden text-center animate-fadeIn">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl mx-auto w-full z-10 space-y-6">
        {/* 404 Badge & Number */}
        <div className="relative">
          <span className="text-8xl sm:text-9xl font-black text-slate-800 select-none tracking-tighter">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-tr from-brand-600 to-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-brand-500/30">
              <FileQuestion className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-400 bg-brand-500/10 border border-brand-500/20 px-3 py-1 rounded-full">
            Page Not Found
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
            We couldn't find the page you're looking for
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            The link you followed may be broken, or the departmental budget record might have moved.
          </p>
        </div>

        {/* Quick Search */}
        <form onSubmit={handleSearch} className="max-w-md mx-auto relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3" />
          <input
            type="text"
            placeholder="Search portal pages or documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-24 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-[11px] font-bold transition"
          >
            Search
          </button>
        </form>

        {/* Quick links */}
        <div className="p-5 bg-slate-900/80 border border-slate-800/80 rounded-3xl max-w-lg mx-auto text-left space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-brand-400" />
            <span>Popular Destinations</span>
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {quickLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/50 transition font-medium truncate"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Navigation Action */}
        <div className="pt-2 flex items-center justify-center gap-4 text-xs">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold border border-slate-700 flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
          <Link
            to={homeRoute}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-lg shadow-brand-500/20 transition"
          >
            <Home className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
