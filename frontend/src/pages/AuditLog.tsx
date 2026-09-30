import React, { useEffect, useMemo, useState } from 'react';
import { ShieldAlert, RefreshCw, Search, Filter } from 'lucide-react';
import { fetchAuditLogs, AuditEntry } from '../services/auditService';

const CHANNEL_STYLES: Record<string, string> = {
  PORTAL: 'bg-blue-50 text-blue-700 border-blue-200',
  EMAIL: 'bg-purple-50 text-purple-700 border-purple-200',
  SYSTEM: 'bg-slate-100 text-slate-600 border-slate-200'
};

const ACTION_STYLES: Record<string, string> = {
  CREATE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  UPDATE: 'bg-amber-50 text-amber-700 border-amber-200',
  DELETE: 'bg-rose-50 text-rose-700 border-rose-200',
  APPROVE: 'bg-green-50 text-green-700 border-green-200',
  REJECT: 'bg-red-50 text-red-700 border-red-200'
};

export const AuditLog: React.FC = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');

  const load = async () => {
    setLoading(true);
    const data = await fetchAuditLogs();
    setEntries(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const actions = useMemo(() => Array.from(new Set(entries.map(e => e.action))).sort(), [entries]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return entries.filter(e => {
      if (actionFilter && e.action !== actionFilter) return false;
      if (channelFilter && e.channel !== channelFilter) return false;
      if (!q) return true;
      return (
        (e.actor || '').toLowerCase().includes(q) ||
        (e.entity || '').toLowerCase().includes(q) ||
        (e.entityId || '').toLowerCase().includes(q) ||
        (e.details || '').toLowerCase().includes(q)
      );
    });
  }, [entries, query, actionFilter, channelFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800">Audit Trail</h1>
            <p className="text-sm text-slate-500 font-medium">Immutable, timestamped record of every financial & master action.</p>
          </div>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-bold hover:bg-slate-700 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search actor, entity, details…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="py-2 px-3 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700"
          >
            <option value="">All actions</option>
            {actions.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select
            value={channelFilter}
            onChange={e => setChannelFilter(e.target.value)}
            className="py-2 px-3 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700"
          >
            <option value="">All channels</option>
            <option value="PORTAL">Portal</option>
            <option value="EMAIL">Email</option>
            <option value="SYSTEM">System</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 font-bold">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400 font-semibold">Loading audit entries…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400 font-semibold">No audit entries match the current filters.</td></tr>
              ) : (
                filtered.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap font-mono text-xs">{new Date(e.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-700">{e.actor}</div>
                      {e.actorRole && <div className="text-[11px] text-slate-400 uppercase font-semibold">{e.actorRole}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-md border text-xs font-bold ${ACTION_STYLES[e.action] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>{e.action}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{e.entity}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{e.entityId}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-md border text-xs font-bold ${CHANNEL_STYLES[e.channel] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>{e.channel}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs">{e.details || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-400 font-medium">
        Showing {filtered.length} of {entries.length} entries · Audit records are append-only and cannot be edited or deleted.
      </p>
    </div>
  );
};

export default AuditLog;
