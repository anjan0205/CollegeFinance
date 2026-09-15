import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { formatINR } from '../utils/formatters';
import { BudgetHeadItem } from '../types';
import { ListTree, Search, Filter } from 'lucide-react';

export const BudgetHeads: React.FC = () => {
  const [heads, setHeads] = useState<BudgetHeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetchBudgetHeads();
  }, []);

  async function fetchBudgetHeads() {
    try {
      setLoading(true);
      const res = await api.get('/budgets', { params: { limit: 150 } });
      if (res.data.success) {
        setHeads(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch budget heads:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredHeads = heads.filter((h) => {
    const matchesSearch =
      String(h.code).includes(search) ||
      h.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category ? h.category === category : true;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Budget Heads Catalog</h1>
          <p className="text-xs text-slate-500 font-medium">122 standardized institutional budget account codes</p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg">
          {heads.length} Master Budget Codes
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search Code or Account Head Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-brand-500 focus:bg-white transition-colors"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg py-2 px-3 focus:outline-hidden focus:border-brand-500"
        >
          <option value="">All Categories</option>
          <option value="Recurring">Recurring</option>
          <option value="Non-Recurring">Non-Recurring</option>
          <option value="Capital">Capital Expenditure</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Head of Account Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Allocated</th>
                <th className="py-3 px-4 text-right">PR Committed</th>
                <th className="py-3 px-4 text-right">Remaining</th>
                <th className="py-3 px-4 text-right">Utilization %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-4"><div className="h-4 bg-slate-200 rounded w-12"></div></td>
                    <td className="py-3 px-4"><div className="h-4 bg-slate-200 rounded w-48"></div></td>
                    <td className="py-3 px-4"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                    <td className="py-3 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-24 ml-auto"></div></td>
                    <td className="py-3 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-24 ml-auto"></div></td>
                    <td className="py-3 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-24 ml-auto"></div></td>
                    <td className="py-3 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredHeads.length > 0 ? (
                filteredHeads.map((item) => (
                  <tr key={item.code} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{item.code}</td>
                    <td className="py-3 px-4 text-slate-900 font-semibold">{item.name}</td>
                    <td className="py-3 px-4 text-slate-500">
                      <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(item.totalAllocated)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-amber-700">{formatINR(item.totalCommitted)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-700">{formatINR(item.totalRemaining)}</td>
                    <td className="py-3 px-4 text-right font-bold">{item.utilizationPct}%</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No budget heads found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
