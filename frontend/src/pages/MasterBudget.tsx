import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { formatINR, formatINRCompact } from '../utils/formatters';
import { BudgetHeadItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { AddBudgetModal } from '../components/AddBudgetModal';
import { Search, Download, Filter, ChevronLeft, ChevronRight, Layers, PieChart, ArrowUpDown, Edit3, Plus, Wallet } from 'lucide-react';
import * as XLSX from 'xlsx';

export const MasterBudget: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<BudgetHeadItem[]>([]);
  const [totals, setTotals] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedHead, setSelectedHead] = useState<any | null>(null);

  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [editingAllocId, setEditingAllocId] = useState<number | null>(null);
  const [editingAmount, setEditingAmount] = useState<string>('');

  useEffect(() => {
    fetchMasterBudget();
  }, [search, category, page, sortBy, sortOrder]);

  async function fetchMasterBudget() {
    try {
      setLoading(true);
      const res = await api.get('/budgets', {
        params: { search, category, page, limit: 15, sortBy, sortOrder }
      });
      if (res.data.success) {
        setItems(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
        setTotals(res.data.totals);
      }
    } catch (err) {
      console.error('Failed to load master budget:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const exportToExcel = () => {
    const exportData = items.map((item) => ({
      'Budget Code': item.code,
      'Budget Head Name': item.name,
      'Budget Type': item.category,
      'Total Allocated (₹)': item.totalAllocated,
      'Total Committed (₹)': item.totalCommitted,
      'Total Remaining (₹)': item.totalRemaining,
      'Utilization %': `${item.utilizationPct}%`,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Budget');
    XLSX.writeFile(workbook, `College_Master_Budget_Report_${new Date().toISOString().substring(0, 10)}.xlsx`);
  };

  const openHeadDetails = async (headId: number) => {
    try {
      const res = await api.get(`/budgets/${headId}`);
      if (res.data.success) {
        setSelectedHead(res.data);
      }
    } catch (err) {
      console.error('Failed to load head details:', err);
    }
  };

  const saveAllocationEdit = async (allocId: number) => {
    try {
      const numericVal = parseFloat(editingAmount);
      if (isNaN(numericVal) || numericVal < 0) {
        alert('Please enter a valid allocation amount.');
        return;
      }

      const res = await api.put('/budgets/allocation', {
        allocationId: allocId,
        allocatedAmount: numericVal
      });

      if (res.data.success) {
        setEditingAllocId(null);
        if (selectedHead) {
          openHeadDetails(selectedHead.budgetHead.id);
        }
        fetchMasterBudget();
      }
    } catch (err: any) {
      alert(`Update failed: ${err.response?.data?.message || 'Server error'}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Master College Budget</h1>
          <p className="text-xs text-slate-500 font-medium">Consolidated view of institutional budget heads & allocation totals</p>
        </div>
        <div className="flex items-center gap-2">
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => setIsAddBudgetOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Budget</span>
            </button>
          )}
          <button
            onClick={exportToExcel}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Master Excel</span>
          </button>
        </div>
      </div>

      {/* Overview Totals Summary Bar */}
      {totals && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-900 text-white p-4 rounded-xl shadow-lg">
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase">Master Allocated Budget</span>
            <p className="text-lg font-bold text-white mt-0.5">{formatINR(totals.totalAllocated)}</p>
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase">Total PR Committed</span>
            <p className="text-lg font-bold text-amber-400 mt-0.5">{formatINR(totals.totalCommitted)}</p>
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase">Total Remaining Budget</span>
            <p className="text-lg font-bold text-emerald-400 mt-0.5">{formatINR(totals.totalRemaining)}</p>
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase">Overall Utilization Rate</span>
            <p className="text-lg font-bold text-brand-300 mt-0.5">{totals.overallUtilizationPct}%</p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Code or Head Name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-brand-500 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg py-2 px-3 focus:outline-hidden focus:border-brand-500"
            >
              <option value="">All Categories / Types</option>
              <option value="Recurring">Recurring</option>
              <option value="Non-Recurring">Non-Recurring</option>
              <option value="Capital">Capital Expenditure</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Master Budget Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider select-none">
              <tr>
                <th onClick={() => handleSort('code')} className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-1">
                    <span>Budget Code</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th onClick={() => handleSort('name')} className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-1">
                    <span>Budget Head Item</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Type</th>
                <th onClick={() => handleSort('totalAllocated')} className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors">
                  <div className="flex items-center justify-end gap-1">
                    <span>Total Allocated</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th onClick={() => handleSort('totalCommitted')} className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors">
                  <div className="flex items-center justify-end gap-1">
                    <span>Total Utilized</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Remaining</th>
                <th onClick={() => handleSort('utilizationPct')} className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors">
                  <div className="flex items-center justify-end gap-1">
                    <span>Utilization %</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
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
              ) : items.length > 0 ? (
                items.map((item) => (
                  <tr
                    key={item.code}
                    onClick={() => openHeadDetails(item.id)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 font-mono">{item.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{item.name}</td>
                    <td className="py-3 px-4 text-slate-500">
                      <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(item.totalAllocated)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-amber-700">{formatINR(item.totalCommitted)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-700">{formatINR(item.totalRemaining)}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                        item.utilizationPct >= 85 ? 'bg-rose-100 text-rose-800' :
                        item.utilizationPct >= 70 ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.utilizationPct}%
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No budget heads matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              className="px-3 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-50 font-medium flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              className="px-3 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-50 font-medium flex items-center gap-1 cursor-pointer"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Budget Head Details Drawer/Modal */}
      {selectedHead && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 p-6 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedHead.budgetHead.code} - {selectedHead.budgetHead.name}
                </h3>
                <span className="text-xs text-slate-500">{selectedHead.budgetHead.category}</span>
              </div>
              <button
                onClick={() => setSelectedHead(null)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-semibold"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-center text-xs">
              <div>
                <span className="text-slate-500 font-medium">Allocated Budget</span>
                <p className="font-bold text-slate-900 mt-0.5">{formatINR(selectedHead.summary.totalAllocated)}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">PR Committed</span>
                <p className="font-bold text-amber-700 mt-0.5">{formatINR(selectedHead.summary.totalCommitted)}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Remaining</span>
                <p className="font-bold text-emerald-700 mt-0.5">{formatINR(selectedHead.summary.totalRemaining)}</p>
              </div>
            </div>

            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider pt-2">Department Allocations Breakdown</h4>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Department</th>
                    <th className="py-2 px-3 text-right">Allocated (₹)</th>
                    <th className="py-2 px-3 text-right">Committed</th>
                    <th className="py-2 px-3 text-right">Utilization %</th>
                    {(user?.role === 'ADMIN' || user?.role === 'FINANCE') && (
                      <th className="py-2 px-3 text-center">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedHead.departmentBreakdown.map((alloc: any) => (
                    <tr key={alloc.id}>
                      <td className="py-2 px-3 font-medium text-slate-800">{alloc.departmentName} ({alloc.departmentCode})</td>
                      <td className="py-2 px-3 text-right font-bold">
                        {editingAllocId === alloc.id ? (
                          <input
                            type="number"
                            value={editingAmount}
                            onChange={(e) => setEditingAmount(e.target.value)}
                            className="w-28 py-1 px-2 border border-brand-500 rounded text-right font-bold text-slate-900 bg-white"
                          />
                        ) : (
                          formatINR(alloc.allocatedAmount)
                        )}
                      </td>
                      <td className="py-2 px-3 text-right text-amber-700">{formatINR(alloc.committedAmount)}</td>
                      <td className="py-2 px-3 text-right font-semibold">{alloc.utilizationPercentage}%</td>
                      {(user?.role === 'ADMIN' || user?.role === 'FINANCE') && (
                        <td className="py-2 px-3 text-center">
                          {editingAllocId === alloc.id ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => saveAllocationEdit(alloc.id)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingAllocId(null)}
                                className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[11px] font-semibold cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingAllocId(alloc.id);
                                setEditingAmount(String(alloc.allocatedAmount));
                              }}
                              className="px-2 py-0.5 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded text-[11px] font-semibold cursor-pointer"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* Add New Budget Modal */}
      <AddBudgetModal
        isOpen={isAddBudgetOpen}
        onClose={() => setIsAddBudgetOpen(false)}
        onSuccess={fetchMasterBudget}
      />
    </div>
  );
};
