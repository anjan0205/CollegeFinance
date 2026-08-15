import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { formatINR, formatDate } from '../utils/formatters';
import { PRRecord } from '../types';
import { PRDetailsModal } from '../components/PRDetailsModal';
import { CreatePRModal } from '../components/CreatePRModal';
import { Search, Filter, Download, ChevronLeft, ChevronRight, ArrowUpDown, FileText, Calendar, DollarSign, RefreshCw, Plus, CheckCircle2, XCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

export const PRManagement: React.FC = () => {
  const location = useLocation();

  const [prs, setPrs] = useState<PRRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPR, setSelectedPR] = useState<PRRecord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Filter States
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('ALL');
  const [budgetCode, setBudgetCode] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [approvalStatus, setApprovalStatus] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  // Pagination & Sorting
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalFilteredAmount, setTotalFilteredAmount] = useState(0);
  const [sortBy, setSortBy] = useState('prDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Options for dropdowns
  const [deptList, setDeptList] = useState<any[]>([]);
  const [budgetHeadList, setBudgetHeadList] = useState<any[]>([]);

  useEffect(() => {
    // Preset sub-route filters based on active route
    if (location.pathname.endsWith('/approved')) {
      setApprovalStatus('Approved');
    } else if (location.pathname.endsWith('/pending')) {
      setApprovalStatus('Pending');
    } else if (location.pathname.endsWith('/rejected')) {
      setApprovalStatus('Rejected');
    } else if (location.pathname.endsWith('/analysis')) {
      setStatus('ALL');
      setApprovalStatus('ALL');
    }
  }, [location.pathname]);

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchPRs();
  }, [search, department, budgetCode, status, approvalStatus, startDate, endDate, minAmount, maxAmount, page, sortBy, sortOrder]);

  async function fetchMetadata() {
    try {
      const [dRes, bhRes] = await Promise.all([
        api.get('/departments'),
        api.get('/budget-heads')
      ]);
      if (dRes.data.success) setDeptList(dRes.data.data);
      if (bhRes.data.success) setBudgetHeadList(bhRes.data.data);
    } catch (e) {
      console.error('Failed to load filter metadata:', e);
    }
  }

  async function fetchPRs() {
    try {
      setLoading(true);
      const res = await api.get('/prs', {
        params: {
          search,
          department,
          budgetCode,
          status,
          approvalStatus,
          startDate,
          endDate,
          minAmount,
          maxAmount,
          page,
          limit: 15,
          sortBy,
          sortOrder
        }
      });

      if (res.data.success) {
        setPrs(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
        setTotalCount(res.data.pagination.total);
        setTotalFilteredAmount(res.data.summary?.totalAmount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch PR records:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setDepartment('ALL');
    setBudgetCode('ALL');
    setStatus('ALL');
    setApprovalStatus('ALL');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setPage(1);
  };

  const exportPRsExcel = () => {
    const exportData = prs.map((p) => ({
      'PR Number': p.prNumber,
      'PR Date': p.prDate,
      Department: `${p.departmentName} (${p.departmentCode})`,
      'Budget Code': p.budgetHeadCode,
      'Budget Head': p.budgetHeadName,
      'Requested By': p.requestedBy,
      'Total Amount (₹)': p.totalAmount,
      'PR Status': p.status,
      'Approval Status': p.approvalStatus,
      'PR-PO Status': p.prPoStatus,
      'Purpose / Remarks': p.purpose || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PR Records');
    XLSX.writeFile(workbook, `College_PR_Export_${new Date().toISOString().substring(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Purchase Requisition (PR) Management</h1>
          <p className="text-xs text-slate-500 font-medium">Admin PR approval, manual PR entry per department & budget commitment tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Apply New PR</span>
          </button>
          <button
            onClick={exportPRsExcel}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export PR Table</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar Container */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        {/* Row 1: Global Search & Core Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search PR Number, Requested By, Product Name, Purpose..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-brand-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <select
              value={department}
              onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg py-2 px-3 focus:outline-hidden focus:border-brand-500"
            >
              <option value="ALL">All Departments</option>
              {deptList.map((d) => (
                <option key={d.id} value={d.code}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={budgetCode}
              onChange={(e) => { setBudgetCode(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg py-2 px-3 focus:outline-hidden focus:border-brand-500"
            >
              <option value="ALL">All Budget Codes</option>
              {budgetHeadList.map((bh) => (
                <option key={bh.id} value={bh.code}>{bh.code} - {bh.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Status, Approval Status, Dates, Amounts & Reset */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">PR Status</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg py-1.5 px-2 focus:outline-hidden focus:border-brand-500"
            >
              <option value="ALL">All PR Status</option>
              <option value="Open">Open</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Approval Status</label>
            <select
              value={approvalStatus}
              onChange={(e) => { setApprovalStatus(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg py-1.5 px-2 focus:outline-hidden focus:border-brand-500"
            >
              <option value="ALL">All Approval Status</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg py-1.5 px-2 focus:outline-hidden focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg py-1.5 px-2 focus:outline-hidden focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Min Amount (₹)</label>
            <input
              type="number"
              placeholder="0"
              value={minAmount}
              onChange={(e) => { setMinAmount(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg py-1.5 px-2 focus:outline-hidden focus:border-brand-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Filter Banner */}
      <div className="flex justify-between items-center text-xs text-slate-600 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xs">
        <span>Showing <strong className="text-white">{totalCount}</strong> PR Records matching criteria</span>
        <span>Total Filtered PR Amount: <strong className="text-emerald-400 font-bold">{formatINR(totalFilteredAmount)}</strong></span>
      </div>

      {/* Main PR Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider select-none">
              <tr>
                <th onClick={() => handleSort('prNumber')} className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-1">
                    <span>PR Number</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th onClick={() => handleSort('prDate')} className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-1">
                    <span>PR Date</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Budget Code & Head</th>
                <th className="py-3 px-4">Requested By</th>
                <th onClick={() => handleSort('totalAmount')} className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors">
                  <div className="flex items-center justify-end gap-1">
                    <span>Amount</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">PR Status</th>
                <th className="py-3 px-4">Approval Status</th>
                <th className="py-3 px-4">PR-PO Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                    <td className="py-3 px-4"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                    <td className="py-3 px-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                    <td className="py-3 px-4"><div className="h-4 bg-slate-200 rounded w-36"></div></td>
                    <td className="py-3 px-4"><div className="h-4 bg-slate-200 rounded w-28"></div></td>
                    <td className="py-3 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-20 ml-auto"></div></td>
                    <td className="py-3 px-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                    <td className="py-3 px-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                    <td className="py-3 px-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                  </tr>
                ))
              ) : prs.length > 0 ? (
                prs.map((pr) => (
                  <tr
                    key={pr.id}
                    onClick={() => setSelectedPR(pr)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-brand-600">{pr.prNumber}</td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(pr.prDate)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{pr.departmentCode}</td>
                    <td className="py-3 px-4 text-slate-800">
                      <span className="font-mono font-semibold text-slate-900">{pr.budgetHeadCode}</span> - {pr.budgetHeadName}
                    </td>
                    <td className="py-3 px-4 text-slate-700 truncate max-w-xs">{pr.requestedBy}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(pr.totalAmount)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                        pr.status === 'Closed' ? 'bg-slate-100 text-slate-700' :
                        pr.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {pr.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                        pr.approvalStatus === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                        pr.approvalStatus === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {pr.approvalStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{pr.prPoStatus}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    No purchase requisitions match your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
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

      {/* PR Detail Modal */}
      {selectedPR && (
        <PRDetailsModal
          pr={selectedPR}
          onClose={() => setSelectedPR(null)}
          onStatusUpdate={fetchPRs}
        />
      )}

      {/* Create / Apply PR Modal */}
      <CreatePRModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchPRs}
      />
    </div>
  );
};
