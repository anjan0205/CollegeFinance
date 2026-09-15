import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { formatINR, formatINRCompact } from '../utils/formatters';
import { BudgetHeadItem, PRRecord, DepartmentSummary } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { AddBudgetModal } from '../components/AddBudgetModal';
import { CreateInvoiceModal } from '../components/CreateInvoiceModal';
import { 
  Search, Download, Filter, ChevronLeft, ChevronRight, Layers, 
  ArrowUpDown, Plus, Receipt, History, Building2, CheckCircle2, 
  AlertCircle, TrendingUp, DollarSign, Eye, ShieldAlert, Sparkles, ExternalLink
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const MasterBudget: React.FC = () => {
  const { user } = useAuth();
  
  // Navigation Active Tab: 'heads' | 'prs' | 'departments'
  const [activeTab, setActiveTab] = useState<'heads' | 'prs' | 'departments'>('heads');

  // Master Budget Heads State
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

  // Accepted PRs Tab State
  const [acceptedPRs, setAcceptedPRs] = useState<PRRecord[]>([]);
  const [loadingPRs, setLoadingPRs] = useState(false);
  const [prSearch, setPrSearch] = useState('');
  const [prDeptFilter, setPrDeptFilter] = useState('ALL');
  const [prInvoiceStatusFilter, setPrInvoiceStatusFilter] = useState('ALL');
  const [prPage, setPrPage] = useState(1);
  const [selectedPRForInvoice, setSelectedPRForInvoice] = useState<PRRecord | null>(null);
  const [viewingPRInvoices, setViewingPRInvoices] = useState<PRRecord | null>(null);

  // Department Summaries State
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [deptSearch, setDeptSearch] = useState('');

  // Modals State
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [invoiceTargetPRId, setInvoiceTargetPRId] = useState<string | number | undefined>(undefined);
  const [editingAllocId, setEditingAllocId] = useState<number | null>(null);
  const [editingAmount, setEditingAmount] = useState<string>('');

  useEffect(() => {
    fetchMasterBudget();
  }, [search, category, page, sortBy, sortOrder]);

  useEffect(() => {
    if (activeTab === 'prs') {
      fetchAcceptedPRs();
    } else if (activeTab === 'departments') {
      fetchDepartments();
    }
  }, [activeTab]);

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

  async function fetchAcceptedPRs() {
    try {
      setLoadingPRs(true);
      const res = await api.get('/prs', { params: { limit: 5000 } });
      if (res.data.success) {
        setAcceptedPRs(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load accepted PRs:', err);
    } finally {
      setLoadingPRs(false);
    }
  }

  async function fetchDepartments() {
    try {
      setLoadingDepts(true);
      const res = await api.get('/departments');
      if (res.data.success) {
        setDepartments(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load departments:', err);
    } finally {
      setLoadingDepts(false);
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

  const handleOpenAddInvoiceForPR = (pr: PRRecord) => {
    setInvoiceTargetPRId(pr.id);
    setIsCreateInvoiceOpen(true);
  };

  const handleInvoiceSuccess = () => {
    fetchMasterBudget();
    fetchAcceptedPRs();
    if (activeTab === 'departments') {
      fetchDepartments();
    }
  };

  // Filter Accepted PRs
  const filteredAcceptedPRs = acceptedPRs.filter(pr => {
    // Search query
    if (prSearch.trim()) {
      const q = prSearch.toLowerCase();
      const matchSearch = 
        pr.prNumber.toLowerCase().includes(q) ||
        pr.departmentCode.toLowerCase().includes(q) ||
        pr.departmentName.toLowerCase().includes(q) ||
        pr.requestedBy.toLowerCase().includes(q) ||
        (pr.purpose && pr.purpose.toLowerCase().includes(q)) ||
        (pr.budgetHeadName && pr.budgetHeadName.toLowerCase().includes(q)) ||
        (pr.budgetHeadCode && String(pr.budgetHeadCode).includes(q));
      if (!matchSearch) return false;
    }

    // Department Filter
    if (prDeptFilter !== 'ALL') {
      if (pr.departmentCode.toUpperCase() !== prDeptFilter.toUpperCase()) return false;
    }

    // Invoicing Status Filter
    if (prInvoiceStatusFilter === 'FULLY_INVOICED') {
      const util = pr.utilizedAmount || 0;
      if (util < pr.totalAmount) return false;
    } else if (prInvoiceStatusFilter === 'PARTIAL') {
      const util = pr.utilizedAmount || 0;
      if (util <= 0 || util >= pr.totalAmount) return false;
    } else if (prInvoiceStatusFilter === 'UNINVOICED') {
      const util = pr.utilizedAmount || 0;
      if (util > 0) return false;
    }

    return true;
  });

  const prLimit = 15;
  const prTotalPages = Math.ceil(filteredAcceptedPRs.length / prLimit) || 1;
  const paginatedPRs = filteredAcceptedPRs.slice((prPage - 1) * prLimit, prPage * prLimit);

  // Accepted PRs Aggregate Metrics
  const prTotalApprovedSum = filteredAcceptedPRs.reduce((sum, pr) => sum + pr.totalAmount, 0);
  const prTotalUtilizedSum = filteredAcceptedPRs.reduce((sum, pr) => sum + (pr.utilizedAmount || 0), 0);
  const prTotalRemainingSum = filteredAcceptedPRs.reduce((sum, pr) => sum + (pr.remainingPRAmount !== undefined ? pr.remainingPRAmount : (pr.totalAmount - (pr.utilizedAmount || 0))), 0);
  const prTotalInvoicesCount = filteredAcceptedPRs.reduce((sum, pr) => sum + (pr.invoices ? pr.invoices.length : 0), 0);

  // Department List Filter
  const filteredDepts = departments.filter(d => {
    if (!deptSearch.trim()) return true;
    const q = deptSearch.toLowerCase();
    return d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q);
  });

  const exportToExcel = () => {
    if (activeTab === 'heads') {
      const exportData = items.map((item) => ({
        'Budget Code': item.code,
        'Budget Head Name': item.name,
        'Budget Type': item.category,
        'Total Allocated (₹)': item.totalAllocated,
        'PRs Committed (₹)': item.totalCommitted,
        'Utilized PR Amount (₹)': item.totalActualUtilized,
        'Total Remaining (₹)': item.totalRemaining,
        'Utilization %': `${item.utilizationPct}%`,
      }));
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Budget Heads');
      XLSX.writeFile(workbook, `Master_Budget_Heads_${new Date().toISOString().substring(0, 10)}.xlsx`);
    } else if (activeTab === 'prs') {
      const exportData = filteredAcceptedPRs.map((pr) => ({
        'PR Number': pr.prNumber,
        'PR Date': pr.prDate,
        'Department': `${pr.departmentName} (${pr.departmentCode})`,
        'Budget Head': `${pr.budgetHeadCode} - ${pr.budgetHeadName}`,
        'Requested By': pr.requestedBy,
        'Approved PR Amount (₹)': pr.totalAmount,
        'Utilized via Invoices (₹)': pr.utilizedAmount || 0,
        'Remaining PR Budget (₹)': pr.remainingPRAmount !== undefined ? pr.remainingPRAmount : (pr.totalAmount - (pr.utilizedAmount || 0)),
        'Invoices Count': pr.invoices ? pr.invoices.length : 0,
        'Approval Status': pr.approvalStatus || 'Approved',
        'Purpose': pr.purpose || ''
      }));
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Accepted PRs & Utilization');
      XLSX.writeFile(workbook, `Accepted_PRs_Utilization_${new Date().toISOString().substring(0, 10)}.xlsx`);
    } else {
      const exportData = filteredDepts.map((d) => ({
        'Department Code': d.code,
        'Department Name': d.name,
        'Allocated Budget (₹)': d.allocatedBudget,
        'PRs Committed (₹)': d.prCommittedAmount,
        'Utilized PR Amount (₹)': d.actualUtilized,
        'Remaining Budget (₹)': d.remainingBudget,
        'Utilization %': `${d.utilizationPct}%`
      }));
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Department PR Utilization');
      XLSX.writeFile(workbook, `Department_PR_Utilization_${new Date().toISOString().substring(0, 10)}.xlsx`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Master Budget & PR Utilization</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
              FY 2026-27
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {user?.role === 'ADMIN' || user?.role === 'FINANCE'
              ? 'Institution-wide Master Budget, accepted PR commitments, and invoice utilization tracking'
              : `Departmental Master Budget and accepted PR utilization for ${user?.departmentName || user?.departmentCode || 'your department'}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(user?.role === 'ADMIN' || user?.role === 'FINANCE') && (
            <>
              <button
                onClick={() => {
                  setInvoiceTargetPRId(undefined);
                  setIsCreateInvoiceOpen(true);
                }}
                className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Receipt className="w-4 h-4" />
                <span>Add PR Invoice</span>
              </button>
              <button
                onClick={() => setIsAddBudgetOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Budget Head</span>
              </button>
            </>
          )}
          <button
            onClick={exportToExcel}
            className="flex items-center justify-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Overview Totals Summary Bar */}
      {totals && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-900 text-white p-4 rounded-xl shadow-lg">
          <div className="p-2 border-r border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Master Allocated</span>
            <p className="text-base font-bold text-white mt-0.5">{formatINR(totals.totalAllocated)}</p>
          </div>
          <div className="p-2 border-r border-slate-800">
            <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider block">PRs Committed (Uninvoiced)</span>
            <p className="text-base font-bold text-amber-400 mt-0.5">{formatINR(totals.totalCommitted)}</p>
          </div>
          <div className="p-2 border-r border-slate-800">
            <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider block">Utilized PR Amount (Invoiced)</span>
            <p className="text-base font-bold text-blue-300 mt-0.5">{formatINR(totals.totalActualUtilized || 0)}</p>
          </div>
          <div className="p-2 border-r border-slate-800">
            <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block">Remaining Total Budget</span>
            <p className="text-base font-bold text-emerald-400 mt-0.5">{formatINR(totals.totalRemaining)}</p>
          </div>
          <div className="p-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Overall Utilization Rate</span>
            <p className="text-base font-bold text-brand-300 mt-0.5">{totals.overallUtilizationPct}%</p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 pt-2 rounded-t-xl gap-2">
        <button
          onClick={() => setActiveTab('heads')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'heads'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Master Budget Heads ({totals ? items.length : '122'})</span>
        </button>

        <button
          onClick={() => setActiveTab('prs')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'prs'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Accepted PRs & Invoicing Tracker ({acceptedPRs.length || '588'})</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            Live
          </span>
        </button>

        <button
          onClick={() => setActiveTab('departments')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'departments'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Department PR Utilization ({departments.length || '33'})</span>
        </button>
      </div>

      {/* TAB 1: Master Budget Heads Table */}
      {activeTab === 'heads' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Code or Head Name..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-brand-500 focus:bg-white transition-colors font-medium"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg py-2 px-3 focus:outline-hidden focus:border-brand-500 font-medium"
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
                        <span>Code</span>
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
                        <span>Allocated</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th onClick={() => handleSort('totalCommitted')} className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors">
                      <div className="flex items-center justify-end gap-1">
                        <span>PR Committed</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-4 text-right text-blue-700">Utilized PR (Invoiced)</th>
                    <th className="py-3 px-4 text-right text-emerald-700">Remaining</th>
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
                        <td className="py-3 px-4 text-right font-semibold text-blue-700">{formatINR(item.totalActualUtilized || 0)}</td>
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
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        <p className="font-semibold text-slate-700">No matching Budget Heads found.</p>
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
        </div>
      )}

      {/* TAB 2: Accepted PRs & Invoicing Tracker (New Dedicated View) */}
      {activeTab === 'prs' && (
        <div className="space-y-4">
          {/* PR Utilization Overview Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Approved PRs</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-lg font-bold text-slate-900">{formatINR(prTotalApprovedSum)}</span>
                <span className="text-xs font-bold text-slate-600">{filteredAcceptedPRs.length} PRs</span>
              </div>
            </div>
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200">
              <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">Utilized PR Amount (Invoiced)</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-lg font-bold text-blue-800">{formatINR(prTotalUtilizedSum)}</span>
                <span className="text-xs font-bold text-blue-600">{prTotalInvoicesCount} Invoices</span>
              </div>
            </div>
            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">Remaining PR Budget</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-lg font-bold text-emerald-800">{formatINR(prTotalRemainingSum)}</span>
                <span className="text-xs font-bold text-emerald-600">Uninvoiced</span>
              </div>
            </div>
            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200">
              <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">PR Invoicing Completion</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-lg font-bold text-amber-800">
                  {prTotalApprovedSum > 0 ? ((prTotalUtilizedSum / prTotalApprovedSum) * 100).toFixed(1) : 0}%
                </span>
                <span className="text-xs font-bold text-amber-700">Utilized</span>
              </div>
            </div>
          </div>

          {/* Filter and Search Bar for PRs */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search PR #, Requestor, Purpose, Budget Head..."
                value={prSearch}
                onChange={(e) => { setPrSearch(e.target.value); setPrPage(1); }}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-brand-500 font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {(user?.role === 'ADMIN' || user?.role === 'FINANCE') && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-500">Dept:</span>
                  <select
                    value={prDeptFilter}
                    onChange={(e) => { setPrDeptFilter(e.target.value); setPrPage(1); }}
                    className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg py-1.5 px-2.5 focus:outline-hidden focus:border-brand-500 font-medium"
                  >
                    <option value="ALL">All Departments</option>
                    {Array.from(new Set(acceptedPRs.map(p => p.departmentCode))).filter(Boolean).sort().map(code => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500">Invoicing:</span>
                <select
                  value={prInvoiceStatusFilter}
                  onChange={(e) => { setPrInvoiceStatusFilter(e.target.value); setPrPage(1); }}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg py-1.5 px-2.5 focus:outline-hidden focus:border-brand-500 font-medium"
                >
                  <option value="ALL">All Invoicing States</option>
                  <option value="UNINVOICED">Uninvoiced (0% Utilized)</option>
                  <option value="PARTIAL">Partially Invoiced</option>
                  <option value="FULLY_INVOICED">Fully Invoiced (100%)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Accepted PRs Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider select-none">
                  <tr>
                    <th className="py-3 px-4">PR Number & Date</th>
                    <th className="py-3 px-4">Department & Budget Head</th>
                    <th className="py-3 px-4">Requested By / Purpose</th>
                    <th className="py-3 px-4 text-right">Approved PR Value</th>
                    <th className="py-3 px-4 text-right text-blue-700">Utilized (Invoiced)</th>
                    <th className="py-3 px-4 text-right text-emerald-700">Remaining PR Budget</th>
                    <th className="py-3 px-4 text-center">Invoices</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loadingPRs ? (
                    [...Array(8)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-3 px-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                        <td className="py-3 px-4"><div className="h-4 bg-slate-200 rounded w-36"></div></td>
                        <td className="py-3 px-4"><div className="h-4 bg-slate-200 rounded w-48"></div></td>
                        <td className="py-3 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-20 ml-auto"></div></td>
                        <td className="py-3 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-20 ml-auto"></div></td>
                        <td className="py-3 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-20 ml-auto"></div></td>
                        <td className="py-3 px-4 text-center"><div className="h-4 bg-slate-200 rounded w-12 mx-auto"></div></td>
                        <td className="py-3 px-4 text-center"><div className="h-6 bg-slate-200 rounded w-16 mx-auto"></div></td>
                      </tr>
                    ))
                  ) : paginatedPRs.length > 0 ? (
                    paginatedPRs.map((pr) => {
                      const utilized = pr.utilizedAmount || 0;
                      const remaining = pr.remainingPRAmount !== undefined ? pr.remainingPRAmount : (pr.totalAmount - utilized);
                      const pct = pr.totalAmount > 0 ? Math.min(100, Math.round((utilized / pr.totalAmount) * 100)) : 0;
                      const invoiceCount = pr.invoices ? pr.invoices.length : 0;

                      return (
                        <tr key={pr.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 font-mono block">{pr.prNumber}</span>
                            <span className="text-[11px] text-slate-400">{pr.prDate}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-800 block">
                              {pr.departmentCode} - {pr.departmentName}
                            </span>
                            <span className="text-[11px] text-slate-500 truncate max-w-[200px] block">
                              Code {pr.budgetHeadCode}: {pr.budgetHeadName}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-slate-800 font-medium block">{pr.requestedBy}</span>
                            <span className="text-[11px] text-slate-500 line-clamp-1 max-w-[220px]">
                              {pr.purpose || 'Purchase Request'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">
                            {formatINR(pr.totalAmount)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-bold text-blue-700 block">{formatINR(utilized)}</span>
                            <div className="w-20 ml-auto bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                              <div
                                className={`h-full ${pct === 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-blue-500' : 'bg-transparent'}`}
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                            <span className="text-[10px] text-slate-400 block">{pct}% Invoiced</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className={`font-bold block ${remaining === 0 ? 'text-slate-400' : 'text-emerald-700'}`}>
                              {formatINR(remaining)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {invoiceCount > 0 ? (
                              <button
                                onClick={() => setViewingPRInvoices(pr)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 cursor-pointer"
                              >
                                <History className="w-3 h-3" />
                                <span>{invoiceCount} {invoiceCount === 1 ? 'Inv' : 'Invs'}</span>
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[11px] font-medium">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {(user?.role === 'ADMIN' || user?.role === 'FINANCE') ? (
                              <button
                                onClick={() => handleOpenAddInvoiceForPR(pr)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                <span>Add Invoice</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setViewingPRInvoices(pr)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        <p className="font-semibold text-slate-700">No matching Accepted PR records found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span>Showing {((prPage - 1) * prLimit) + 1} - {Math.min(prPage * prLimit, filteredAcceptedPRs.length)} of {filteredAcceptedPRs.length} PRs</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={prPage === 1}
                  onClick={() => setPrPage(p => Math.max(p - 1, 1))}
                  className="px-3 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-50 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </button>
                <button
                  disabled={prPage >= prTotalPages}
                  onClick={() => setPrPage(p => Math.min(p + 1, prTotalPages))}
                  className="px-3 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-50 font-medium flex items-center gap-1 cursor-pointer"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Department-wise PR Utilization Matrix */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search department..."
                value={deptSearch}
                onChange={(e) => setDeptSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-brand-500 font-medium"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider select-none">
                  <tr>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Master Allocated (₹)</th>
                    <th className="py-3 px-4 text-right text-amber-700">PRs Committed</th>
                    <th className="py-3 px-4 text-right text-blue-700">Utilized (Invoiced)</th>
                    <th className="py-3 px-4 text-right text-emerald-700">Remaining Budget</th>
                    <th className="py-3 px-4 text-right">Utilization %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loadingDepts ? (
                    [...Array(10)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-3 px-4"><div className="h-4 bg-slate-200 rounded w-36"></div></td>
                        <td className="py-3 px-4"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                        <td className="py-3 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-24 ml-auto"></div></td>
                        <td className="py-3 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-24 ml-auto"></div></td>
                        <td className="py-3 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-24 ml-auto"></div></td>
                        <td className="py-3 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-24 ml-auto"></div></td>
                        <td className="py-3 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-16 ml-auto"></div></td>
                      </tr>
                    ))
                  ) : filteredDepts.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{d.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{d.code}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{d.category}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(d.allocatedBudget)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-amber-700">{formatINR(d.prCommittedAmount)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-blue-700">{formatINR(d.actualUtilized || 0)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-700">{formatINR(d.remainingBudget)}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                          d.utilizationPct >= 85 ? 'bg-rose-100 text-rose-800' :
                          d.utilizationPct >= 70 ? 'bg-amber-100 text-amber-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {d.utilizationPct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Budget Head Details Drawer/Modal */}
      {selectedHead && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-slate-200 p-6 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedHead.budgetHead.code} - {selectedHead.budgetHead.name}
                </h3>
                <span className="text-xs text-slate-500">{selectedHead.budgetHead.category}</span>
              </div>
              <button
                onClick={() => setSelectedHead(null)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-center text-xs">
              <div>
                <span className="text-slate-500 font-medium">Allocated Budget</span>
                <p className="font-bold text-slate-900 mt-0.5">{formatINR(selectedHead.summary.totalAllocated)}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">PR Committed</span>
                <p className="font-bold text-amber-700 mt-0.5">{formatINR(selectedHead.summary.totalCommitted)}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Utilized PR</span>
                <p className="font-bold text-blue-700 mt-0.5">{formatINR(selectedHead.summary.totalActualUtilized || 0)}</p>
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
                    <th className="py-2 px-3 text-right text-amber-700">Committed</th>
                    <th className="py-2 px-3 text-right text-blue-700">Utilized</th>
                    <th className="py-2 px-3 text-right text-emerald-700">Remaining</th>
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
                      <td className="py-2 px-3 text-right text-blue-700">{formatINR(alloc.actualUtilizedAmount || 0)}</td>
                      <td className="py-2 px-3 text-right text-emerald-700">{formatINR(alloc.remainingAmount)}</td>
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

      {/* Viewing PR Invoices Modal */}
      {viewingPRInvoices && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Invoice History: {viewingPRInvoices.prNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  {viewingPRInvoices.departmentName} - {viewingPRInvoices.budgetHeadName}
                </p>
              </div>
              <button
                onClick={() => setViewingPRInvoices(null)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center text-xs">
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Approved PR Value</span>
                <span className="font-bold text-slate-900">{formatINR(viewingPRInvoices.totalAmount)}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Total Utilized (Invoiced)</span>
                <span className="font-bold text-blue-700">{formatINR(viewingPRInvoices.utilizedAmount || 0)}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Remaining PR Balance</span>
                <span className="font-bold text-emerald-700">{formatINR(viewingPRInvoices.remainingPRAmount !== undefined ? viewingPRInvoices.remainingPRAmount : viewingPRInvoices.totalAmount)}</span>
              </div>
            </div>

            {/* Attached Invoices List */}
            {viewingPRInvoices.invoices && viewingPRInvoices.invoices.length > 0 ? (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  Processed Invoices ({viewingPRInvoices.invoices.length}):
                </span>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {viewingPRInvoices.invoices.map((inv: any) => (
                    <div key={inv.id} className="p-3 bg-white flex items-center justify-between text-xs hover:bg-slate-50">
                      <div>
                        <span className="font-bold font-mono text-slate-900 block">{inv.invoiceNumber}</span>
                        <span className="text-[11px] text-slate-500">{inv.vendorName} • {inv.invoiceDate}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-700 block">{formatINR(inv.totalAmount)}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {inv.status || 'Approved'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                No invoices have been recorded against this PR yet.
              </div>
            )}

            {(user?.role === 'ADMIN' || user?.role === 'FINANCE') && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => {
                    const pr = viewingPRInvoices;
                    setViewingPRInvoices(null);
                    handleOpenAddInvoiceForPR(pr);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Another Invoice for this PR</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add New Budget Head Modal */}
      <AddBudgetModal
        isOpen={isAddBudgetOpen}
        onClose={() => setIsAddBudgetOpen(false)}
        onSuccess={fetchMasterBudget}
      />

      {/* Create / Add PR Invoice Modal */}
      <CreateInvoiceModal
        isOpen={isCreateInvoiceOpen}
        onClose={() => {
          setIsCreateInvoiceOpen(false);
          setInvoiceTargetPRId(undefined);
        }}
        onSuccess={handleInvoiceSuccess}
        defaultPRId={invoiceTargetPRId}
      />
    </div>
  );
};
