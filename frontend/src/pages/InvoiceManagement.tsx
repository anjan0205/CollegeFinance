import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { formatINR, formatDate } from '../utils/formatters';
import { InvoiceRecord } from '../types';
import { CreateInvoiceModal } from '../components/CreateInvoiceModal';
import { InvoiceDetailsModal } from '../components/InvoiceDetailsModal';
import { useAuth } from '../contexts/AuthContext';
import {
  Search,
  Filter,
  Download,
  Receipt,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  RefreshCw,
  Building,
  DollarSign,
  Calendar,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const InvoiceManagement: React.FC = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination & Metadata
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalAmountSum, setTotalAmountSum] = useState(0);

  const [deptList, setDeptList] = useState<any[]>([]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [search, department, status, startDate, endDate, page]);

  async function fetchDepartments() {
    try {
      const res = await api.get('/departments');
      if (res.data.success) {
        setDeptList(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load departments list:', err);
    }
  }

  async function fetchInvoices() {
    try {
      setLoading(true);
      const res = await api.get('/invoices', {
        params: {
          search,
          department,
          status,
          startDate,
          endDate,
          page,
          limit: 20
        }
      });

      if (res.data.success) {
        setInvoices(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
        setTotalCount(res.data.pagination.total);
        setTotalAmountSum(res.data.summary.totalAmount);
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    } finally {
      setLoading(false);
    }
  }

  const exportToExcel = () => {
    const exportData = invoices.map(inv => ({
      'Invoice Number': inv.invoiceNumber,
      'Invoice Date': inv.invoiceDate,
      'Vendor Name': inv.vendorName,
      'PR Number': inv.prNumber,
      'Department Code': inv.departmentCode,
      'Department Name': inv.departmentName,
      'Budget Head Code': inv.budgetHeadCode,
      'Budget Head Name': inv.budgetHeadName,
      'Total Amount (₹)': inv.totalAmount,
      'Tax Amount (₹)': inv.taxAmount || 0,
      'Status': inv.status,
      'Payment Status': inv.paymentStatus,
      'Submitted By': inv.submittedBy,
      'Remarks': inv.remarks || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');
    XLSX.writeFile(workbook, `College_Invoices_${new Date().toISOString().substring(0, 10)}.xlsx`);
  };

  // Summary Card calculations
  const paidTotal = invoices.filter(i => i.status === 'Paid' || i.paymentStatus === 'Paid').reduce((sum, i) => sum + i.totalAmount, 0);
  const pendingTotal = invoices.filter(i => i.status === 'Pending').reduce((sum, i) => sum + i.totalAmount, 0);
  const approvedTotal = invoices.filter(i => i.status === 'Approved').reduce((sum, i) => sum + i.totalAmount, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Page Title & Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Receipt className="w-7 h-7 text-emerald-600" />
            Vendor Invoice Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track vendor bills, linked PR expenditures, and process invoice payments
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchInvoices()}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Refresh Invoices"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Export Excel
          </button>

          {user?.role === 'ADMIN' && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Submit Invoice
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Invoices</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{totalCount}</p>
            <span className="text-[11px] text-slate-500 font-medium">Total Value: {formatINR(totalAmountSum)}</span>
          </div>
          <div className="p-3 bg-brand-50 text-brand-600 rounded-xl">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Settled & Paid</span>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{formatINR(paidTotal)}</p>
            <span className="text-[11px] text-emerald-700 font-medium font-mono">Actual Utilized Budget</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Verification</span>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">{formatINR(pendingTotal)}</p>
            <span className="text-[11px] text-amber-700 font-medium">Awaiting Finance Approval</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved / Unpaid</span>
            <p className="text-2xl font-extrabold text-blue-600 mt-1">{formatINR(approvedTotal)}</p>
            <span className="text-[11px] text-blue-700 font-medium">Ready for Payment</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search Invoice No, Vendor, PR No, Dept..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-800 focus:outline-hidden focus:border-brand-500 font-medium"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={department}
              onChange={e => { setDepartment(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-brand-500 font-medium"
            >
              <option value="ALL">All Departments</option>
              {deptList.map(d => (
                <option key={d.id} value={d.code}>{d.code} - {d.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={e => { setStatus(e.target.value); setPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-brand-500 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Paid">Paid</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Reset Filters */}
          <button
            onClick={() => {
              setSearch('');
              setDepartment('ALL');
              setStatus('ALL');
              setStartDate('');
              setEndDate('');
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors cursor-pointer text-center"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Main Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3">Invoice Details</th>
                <th className="px-4 py-3">Vendor Name</th>
                <th className="px-4 py-3">Department & PR</th>
                <th className="px-4 py-3">Budget Head</th>
                <th className="px-4 py-3 text-right">Invoice Value</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400 font-medium">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400 font-medium">
                    No vendor invoices found matching current criteria.
                  </td>
                </tr>
              ) : (
                invoices.map(inv => (
                  <tr 
                    key={inv.id} 
                    onClick={() => setSelectedInvoice(inv)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    {/* Invoice Details */}
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 font-mono text-xs">{inv.invoiceNumber}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" /> {formatDate(inv.invoiceDate)}
                      </div>
                    </td>

                    {/* Vendor Name */}
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {inv.vendorName}
                    </td>

                    {/* Department & PR */}
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800">{inv.departmentCode}</div>
                      <div className="text-[11px] text-indigo-600 font-mono font-semibold">{inv.prNumber}</div>
                    </td>

                    {/* Budget Head */}
                    <td className="px-4 py-3">
                      <div className="font-mono text-slate-700 font-semibold">{inv.budgetHeadCode}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[140px]">{inv.budgetHeadName}</div>
                    </td>

                    {/* Value */}
                    <td className="px-4 py-3 text-right">
                      <div className="font-bold text-slate-900">{formatINR(inv.totalAmount)}</div>
                      {inv.taxAmount ? (
                        <div className="text-[10px] text-slate-400">Tax: {formatINR(inv.taxAmount)}</div>
                      ) : null}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                        inv.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                        inv.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Pagination */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-800">{invoices.length}</strong> of <strong className="text-slate-800">{totalCount}</strong> total invoices
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 bg-white border border-slate-200 rounded-md text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition-colors cursor-pointer"
            >
              Previous
            </button>
            <span className="font-semibold text-slate-700">Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 bg-white border border-slate-200 rounded-md text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateInvoiceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => fetchInvoices()}
      />

      <InvoiceDetailsModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onStatusUpdate={() => fetchInvoices()}
      />
    </div>
  );
};
