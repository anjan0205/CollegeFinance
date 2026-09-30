import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Bell, HelpCircle, LifeBuoy, ShieldCheck, Search, X } from 'lucide-react';
import api from '../services/api';

interface SearchResult {
  type: string;
  label: string;
  sublabel: string;
  route: string;
}

interface NotificationItem {
  kind: 'PR' | 'BUDGET';
  title: string;
  detail: string;
  route: string;
}

const TYPE_BADGE: Record<string, string> = {
  PR: 'bg-indigo-50 text-indigo-700',
  PO: 'bg-amber-50 text-amber-700',
  Vendor: 'bg-purple-50 text-purple-700',
  Invoice: 'bg-emerald-50 text-emerald-700'
};

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  // Debounced global search against the /search engine endpoint.
  useEffect(() => {
    const q = query.trim();
    if (!q) { setResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await api.get('/search', { params: { q } });
        setResults(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch {
        setResults([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  // Notifications: pending PR approvals + flagged budget allocations.
  useEffect(() => {
    (async () => {
      const items: NotificationItem[] = [];
      try {
        const summary = await api.get('/dashboard/summary');
        const pending = summary.data?.data?.pendingPRs || 0;
        if (pending > 0) {
          items.push({ kind: 'PR', title: `${pending} PR${pending > 1 ? 's' : ''} awaiting approval`, detail: 'Review the pending approval queue', route: '/prs/pending' });
        }
      } catch { /* ignore */ }
      try {
        const alerts = await api.get('/dashboard/budget-alerts');
        const s = alerts.data?.summary;
        if (s) {
          if (s.exceededCount > 0) items.push({ kind: 'BUDGET', title: `${s.exceededCount} budget head(s) exceeded`, detail: 'Allocations over 100% utilized', route: '/budget/utilization' });
          if (s.criticalCount > 0) items.push({ kind: 'BUDGET', title: `${s.criticalCount} budget head(s) critical`, detail: 'Allocations near their ceiling', route: '/budget/utilization' });
          if (s.warningCount > 0) items.push({ kind: 'BUDGET', title: `${s.warningCount} budget head(s) in warning`, detail: 'Utilization approaching limit', route: '/budget/utilization' });
        }
      } catch { /* ignore */ }
      setNotifications(items);
    })();
  }, []);

  // Close dropdowns on outside click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const goTo = (route: string) => {
    setSearchOpen(false);
    setBellOpen(false);
    setQuery('');
    navigate(route);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10 shadow-xs">
      {/* Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md" ref={searchRef}>
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search PRs, POs, vendors, invoices…"
            className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white transition"
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {searchOpen && query.trim() && (
            <div className="absolute mt-1.5 w-full bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden z-30 max-h-96 overflow-y-auto">
              {results.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-slate-400 font-medium">No matches found</div>
              ) : (
                results.map((r, i) => (
                  <button
                    key={`${r.type}-${r.label}-${i}`}
                    onClick={() => goTo(r.route)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left border-b border-slate-50 last:border-0"
                  >
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${TYPE_BADGE[r.type] || 'bg-slate-100 text-slate-600'}`}>{r.type}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-bold text-slate-700 truncate">{r.label}</span>
                      <span className="block text-xs text-slate-400 truncate">{r.sublabel}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Quick Help, Support & Legal Links pointing directly into Settings tabs */}
        <div className="flex items-center gap-1.5 border-r border-slate-200 pr-3">
          <Link to="/settings?tab=help" title="Help Center & FAQs" className="p-2 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition">
            <HelpCircle className="w-4 h-4" />
          </Link>
          <Link to="/settings?tab=support" title="Support Tickets" className="p-2 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition">
            <LifeBuoy className="w-4 h-4" />
          </Link>
          <Link to="/settings?tab=legal" title="Legal & Compliance Policies" className="p-2 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition">
            <ShieldCheck className="w-4 h-4" />
          </Link>
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setBellOpen(!bellOpen)}
            title="Notifications"
            className="relative p-2 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition"
          >
            <Bell className="w-4.5 h-4.5" />
            {notifications.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 mt-1.5 w-80 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden z-30">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-extrabold text-slate-800">Notifications</span>
                <span className="text-xs text-slate-400 font-semibold">{notifications.length} new</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-slate-400 font-medium">You're all caught up 🎉</div>
                ) : (
                  notifications.map((n, i) => (
                    <button
                      key={i}
                      onClick={() => goTo(n.route)}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 text-left border-b border-slate-50 last:border-0"
                    >
                      <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${n.kind === 'PR' ? 'bg-indigo-500' : 'bg-amber-500'}`} />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-bold text-slate-700">{n.title}</span>
                        <span className="block text-xs text-slate-400">{n.detail}</span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Info with link to Settings (Account Tab) */}
        <Link to="/settings?tab=account" className="flex items-center gap-2.5 text-right p-1.5 hover:bg-slate-50 rounded-xl transition group">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-bold text-slate-800 leading-tight group-hover:text-brand-600 transition">{user?.name || 'User'}</p>
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
