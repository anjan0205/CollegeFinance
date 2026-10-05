import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Bell, HelpCircle, LifeBuoy, ShieldCheck, Search, X, CheckCheck } from 'lucide-react';
import api from '../services/api';
import { fetchAuditLogs, AuditEntry } from '../services/auditService';

interface SearchResult {
  type: string;
  label: string;
  sublabel: string;
  route: string;
}

type NotifTone = 'PR' | 'BUDGET' | 'PO' | 'INVOICE' | 'PAYMENT' | 'MASTER' | 'REPORT' | 'INFO';

interface NotificationItem {
  id: string;          // stable id — used for read/dismiss tracking
  tone: NotifTone;
  title: string;
  detail: string;
  route: string;
  time?: string;       // ISO timestamp for ordering / display
}

const TYPE_BADGE: Record<string, string> = {
  PR: 'bg-indigo-50 text-indigo-700',
  PO: 'bg-amber-50 text-amber-700',
  Vendor: 'bg-purple-50 text-purple-700',
  Invoice: 'bg-emerald-50 text-emerald-700'
};

const TONE_DOT: Record<NotifTone, string> = {
  PR: 'bg-indigo-500',
  BUDGET: 'bg-amber-500',
  PO: 'bg-orange-500',
  INVOICE: 'bg-emerald-500',
  PAYMENT: 'bg-teal-500',
  MASTER: 'bg-purple-500',
  REPORT: 'bg-sky-500',
  INFO: 'bg-slate-400'
};

const READ_KEY = 'notif_read_ids';

function loadReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* ignore */ }
  return new Set();
}

function persistReadIds(ids: Set<string>) {
  try {
    // keep the list bounded so it can't grow forever
    localStorage.setItem(READ_KEY, JSON.stringify(Array.from(ids).slice(-500)));
  } catch { /* ignore */ }
}

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// Map an audited entity string to a destination route + notification tone so a
// change anywhere in the app becomes a clickable notification.
function routeForEntity(entity: string): { route: string; tone: NotifTone } {
  const e = entity.toLowerCase();
  if (e.startsWith('master')) return { route: '/erp/master-data', tone: 'MASTER' };
  if (e.startsWith('purchaseorder') || e === 'po') return { route: '/pos/my-pos', tone: 'PO' };
  if (e.startsWith('grn')) return { route: '/erp/grn-data', tone: 'INFO' };
  if (e.startsWith('erpinvoice') || e === 'invoice_erp') return { route: '/erp/invoice-data', tone: 'INVOICE' };
  if (e === 'invoice') return { route: '/invoices', tone: 'INVOICE' };
  if (e.startsWith('partpayment')) return { route: '/erp/part-payments', tone: 'PAYMENT' };
  if (e.startsWith('payment')) return { route: '/erp/payments', tone: 'PAYMENT' };
  if (e.startsWith('dcnote') || e === 'dc_note') return { route: '/erp/dc-notes', tone: 'INFO' };
  if (e.startsWith('project')) return { route: '/erp/projects', tone: 'REPORT' };
  if (e.startsWith('quotation')) return { route: '/erp/quotations', tone: 'INFO' };
  if (e.startsWith('inventory')) return { route: '/erp/inventory', tone: 'INFO' };
  if (e.startsWith('stockissue') || e === 'stock_issue') return { route: '/erp/stock-issue', tone: 'INFO' };
  if (e.startsWith('budgetallocation')) return { route: '/budget/utilization', tone: 'BUDGET' };
  if (e.startsWith('pr')) return { route: '/prs/all', tone: 'PR' };
  return { route: '/audit', tone: 'INFO' };
}

function auditToNotification(a: AuditEntry): NotificationItem {
  const { route, tone } = routeForEntity(a.entity || '');
  const verb = a.action ? a.action.charAt(0) + a.action.slice(1).toLowerCase() : 'Updated';
  return {
    id: a.id,
    tone,
    title: `${verb} ${a.entity}${a.entityId ? ` · ${a.entityId}` : ''}`,
    detail: `${a.actor || 'System'}${a.details ? ` — ${a.details}` : ''}`,
    route,
    time: a.timestamp
  };
}

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => loadReadIds());
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

  // Notifications aggregate every section: recent changes/reports from the audit
  // trail (which the client engine writes on every create/update/approve/delete
  // across PR, PO, GRN, invoices, payments, masters, projects, budgets …) plus
  // live actionable alerts (pending approvals, budget breaches). Refreshes on a
  // light poll so new activity surfaces without a reload.
  useEffect(() => {
    let cancelled = false;

    const build = async () => {
      const items: NotificationItem[] = [];

      // 1) Recent activity across all modules (audit trail = single feed).
      try {
        const logs = await fetchAuditLogs(); // already sorted newest-first
        logs.slice(0, 30).forEach(a => items.push(auditToNotification(a)));
      } catch { /* ignore */ }

      // 2) Live actionable alerts (ids embed the count so a re-breach re-notifies).
      try {
        const summary = await api.get('/dashboard/summary');
        const pending = summary.data?.data?.pendingPRs || 0;
        if (pending > 0) {
          items.unshift({ id: `sys-pending-${pending}`, tone: 'PR', title: `${pending} PR${pending > 1 ? 's' : ''} awaiting approval`, detail: 'Review the pending approval queue', route: '/prs/pending' });
        }
      } catch { /* ignore */ }
      try {
        const alerts = await api.get('/dashboard/budget-alerts');
        const s = alerts.data?.summary;
        if (s) {
          if (s.exceededCount > 0) items.unshift({ id: `sys-budget-exceeded-${s.exceededCount}`, tone: 'BUDGET', title: `${s.exceededCount} budget head(s) exceeded`, detail: 'Allocations over 100% utilized', route: '/budget/utilization' });
          if (s.criticalCount > 0) items.unshift({ id: `sys-budget-critical-${s.criticalCount}`, tone: 'BUDGET', title: `${s.criticalCount} budget head(s) critical`, detail: 'Allocations near their ceiling', route: '/budget/utilization' });
          if (s.warningCount > 0) items.unshift({ id: `sys-budget-warning-${s.warningCount}`, tone: 'BUDGET', title: `${s.warningCount} budget head(s) in warning`, detail: 'Utilization approaching limit', route: '/budget/utilization' });
        }
      } catch { /* ignore */ }

      if (!cancelled) setNotifications(items);
    };

    build();
    const poll = setInterval(build, 30000);
    return () => { cancelled = true; clearInterval(poll); };
  }, []);

  const visible = notifications.filter(n => !readIds.has(n.id));

  const markRead = (ids: string[]) => {
    setReadIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      persistReadIds(next);
      return next;
    });
  };

  const markAllRead = () => markRead(visible.map(n => n.id));

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

  const openNotification = (n: NotificationItem) => {
    markRead([n.id]);          // reactive: checking it removes it from the list
    goTo(n.route);
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
            {visible.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {visible.length > 99 ? '99+' : visible.length}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 mt-1.5 w-96 max-w-[90vw] bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden z-30">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-extrabold text-slate-800">Notifications</span>
                {visible.length > 0 && (
                  <button
                    onClick={markAllRead}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {visible.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-slate-400 font-medium">You're all caught up 🎉</div>
                ) : (
                  visible.map(n => (
                    <div
                      key={n.id}
                      className="group w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0"
                    >
                      <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${TONE_DOT[n.tone]}`} />
                      <button onClick={() => openNotification(n)} className="flex-1 min-w-0 text-left">
                        <span className="block text-sm font-bold text-slate-700 truncate">{n.title}</span>
                        <span className="block text-xs text-slate-400 truncate">{n.detail}</span>
                        {n.time && <span className="block text-[10px] text-slate-300 font-semibold mt-0.5">{timeAgo(n.time)}</span>}
                      </button>
                      <button
                        onClick={() => markRead([n.id])}
                        title="Mark as read"
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-slate-600 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
