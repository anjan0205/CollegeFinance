import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { formatINR } from '../utils/formatters';
import { BarChart3, Download, Building2, Layers, Calendar, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

export const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DEPT' | 'HEAD' | 'MONTHLY' | 'STATUS'>('DEPT');
  const [data, setData] = useState<any>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData(activeTab);
  }, [activeTab]);

  async function fetchReportData(tab: string) {
    try {
      setLoading(true);
      let endpoint = '/reports/departments';
      if (tab === 'HEAD') endpoint = '/reports/budget-heads';
      else if (tab === 'MONTHLY') endpoint = '/reports/monthly';
      else if (tab === 'STATUS') endpoint = '/reports/pr-status';

      const res = await api.get(endpoint);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  }

  const exportReportExcel = () => {
    let filename = `College_${activeTab}_Report_${new Date().toISOString().substring(0, 10)}.xlsx`;
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-600" /> Institutional Financial Reports
          </h1>
          <p className="text-xs text-slate-500 font-medium">Department, budget head, monthly trend & status analysis reports</p>
        </div>
        <button
          onClick={exportReportExcel}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Active Report</span>
        </button>
      </div>

      {/* Report Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('DEPT')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'DEPT' ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" /> Department Report
        </button>

        <button
          onClick={() => setActiveTab('HEAD')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'HEAD' ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" /> Budget Head Report
        </button>

        <button
          onClick={() => setActiveTab('MONTHLY')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'MONTHLY' ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" /> Monthly Report
        </button>

        <button
          onClick={() => setActiveTab('STATUS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'STATUS' ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" /> PR Status Report
        </button>
      </div>

      {/* Report Content Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 font-medium animate-pulse">
            Generating financial analytics report...
          </div>
        ) : activeTab === 'DEPT' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Department Code</th>
                  <th className="py-3 px-4">Department Name</th>
                  <th className="py-3 px-4 text-right">Allocated Budget</th>
                  <th className="py-3 px-4 text-right">PR Committed Amount</th>
                  <th className="py-3 px-4 text-right">Actual Utilized</th>
                  <th className="py-3 px-4 text-right">Remaining Budget</th>
                  <th className="py-3 px-4 text-right">Utilization %</th>
                  <th className="py-3 px-4 text-right">PR Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {Array.isArray(data) && data.map((row: any) => (
                  <tr key={row.departmentCode} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{row.departmentCode}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{row.departmentName}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(row.allocatedBudget)}</td>
                    <td className="py-3 px-4 text-right font-bold text-amber-700">{formatINR(row.prCommittedAmount)}</td>
                    <td className="py-3 px-4 text-right text-blue-700">{formatINR(row.actualUtilizedAmount)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-700">{formatINR(row.remainingBudget)}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{row.utilizationPercentage}%</td>
                    <td className="py-3 px-4 text-right text-slate-600">{row.prCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'HEAD' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Budget Code</th>
                  <th className="py-3 px-4">Budget Head Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Allocated Budget</th>
                  <th className="py-3 px-4 text-right">PR Committed</th>
                  <th className="py-3 px-4 text-right">Remaining Budget</th>
                  <th className="py-3 px-4 text-right">Utilization %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {Array.isArray(data) && data.map((row: any) => (
                  <tr key={row.budgetCode} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{row.budgetCode}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{row.budgetHeadName}</td>
                    <td className="py-3 px-4 text-slate-500">{row.category}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(row.allocatedBudget)}</td>
                    <td className="py-3 px-4 text-right font-bold text-amber-700">{formatINR(row.prCommittedAmount)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-700">{formatINR(row.remainingBudget)}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{row.utilizationPercentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'MONTHLY' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Month</th>
                  <th className="py-3 px-4 text-right">PR Count</th>
                  <th className="py-3 px-4 text-right">Total PR Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {Array.isArray(data) && data.map((row: any) => (
                  <tr key={row.month} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{row.month}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-800">{row.prCount} PRs</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">{formatINR(row.totalPRValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">PR Approval & Status Breakdown</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-xs font-semibold text-emerald-800">Approved PRs</span>
                <p className="text-xl font-bold text-emerald-900 mt-1">{data?.approved?.count || 0}</p>
                <span className="text-xs text-emerald-700 mt-1 block">{formatINR(data?.approved?.totalValue)}</span>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-xs font-semibold text-amber-800">Pending PRs</span>
                <p className="text-xl font-bold text-amber-900 mt-1">{data?.pending?.count || 0}</p>
                <span className="text-xs text-amber-700 mt-1 block">{formatINR(data?.pending?.totalValue)}</span>
              </div>

              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
                <span className="text-xs font-semibold text-rose-800">Rejected PRs</span>
                <p className="text-xl font-bold text-rose-900 mt-1">{data?.rejected?.count || 0}</p>
                <span className="text-xs text-rose-700 mt-1 block">{formatINR(data?.rejected?.totalValue)}</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-100 border border-slate-300">
                <span className="text-xs font-semibold text-slate-800">Closed PRs</span>
                <p className="text-xl font-bold text-slate-900 mt-1">{data?.closed?.count || 0}</p>
                <span className="text-xs text-slate-700 mt-1 block">{formatINR(data?.closed?.totalValue)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
