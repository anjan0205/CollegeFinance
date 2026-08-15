import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formatINR, formatINRCompact, formatDate } from '../utils/formatters';
import { PRRecord } from '../types';
import { PRDetailsModal } from '../components/PRDetailsModal';
import { CreatePRModal } from '../components/CreatePRModal';
import { AddBudgetModal } from '../components/AddBudgetModal';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Building2, Wallet, TrendingUp, DollarSign, FileText, CheckCircle2, Package, Layers, Plus, FilePlus } from 'lucide-react';

export const DepartmentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPR, setSelectedPR] = useState<PRRecord | null>(null);

  const [isCreatePROpen, setIsCreatePROpen] = useState(false);
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);

  useEffect(() => {
    if (id) fetchDepartmentDetails(id);
  }, [id]);

  async function fetchDepartmentDetails(deptId: string) {
    try {
      setLoading(true);
      const res = await api.get(`/departments/${deptId}`);
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load department details:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="h-32 bg-slate-200 rounded-2xl"></div>
        <div className="h-64 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  const { department, overview, budgetBreakdown, prs } = data;

  return (
    <div className="space-y-6">
      {/* Back Button & Department Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/budget/departments')}
            className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              {department.name} <span className="text-sm font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">({department.code})</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">{department.category} Department Budget & PR Tracking Overview</p>
          </div>
        </div>

        {user?.role === 'ADMIN' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreatePROpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <FilePlus className="w-4 h-4" />
              <span>Apply PR for Dept</span>
            </button>
            <button
              onClick={() => setIsAddBudgetOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Budget</span>
            </button>
          </div>
        )}
      </div>

      {/* Department Overview Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500">Allocated Budget</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{formatINR(overview.allocatedBudget)}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500">PR Committed Amount</span>
          <p className="text-xl font-bold text-amber-700 mt-1">{formatINR(overview.prCommittedAmount)}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500">Actual Expenditure</span>
          <p className="text-xl font-bold text-blue-700 mt-1">{formatINR(overview.actualUtilized)}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500">Remaining Budget</span>
          <p className="text-xl font-bold text-emerald-700 mt-1">{formatINR(overview.remainingBudget)}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500">Utilization Rate</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{overview.utilizationPct}%</p>
        </div>
      </div>

      {/* Section 1: Budget Head Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-600" /> Budget Head Breakdown
            </h2>
            <p className="text-xs text-slate-500">Allocation and PR expenditure mapped by budget code for {department.code}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Budget Head Name</th>
                <th className="py-3 px-4 text-right">Allocated</th>
                <th className="py-3 px-4 text-right">PR Committed</th>
                <th className="py-3 px-4 text-right">Utilized</th>
                <th className="py-3 px-4 text-right">Remaining</th>
                <th className="py-3 px-4 text-right">Utilization %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {budgetBreakdown.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{item.budgetHeadCode}</td>
                  <td className="py-3 px-4 text-slate-900 font-semibold">{item.budgetHeadName}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(item.allocatedAmount)}</td>
                  <td className="py-3 px-4 text-right font-semibold text-amber-700">{formatINR(item.committedAmount)}</td>
                  <td className="py-3 px-4 text-right text-blue-700">{formatINR(item.actualUtilizedAmount)}</td>
                  <td className="py-3 px-4 text-right font-semibold text-emerald-700">{formatINR(item.remainingAmount)}</td>
                  <td className="py-3 px-4 text-right font-bold">{item.utilizationPercentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Department PRs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" /> Department Purchase Requisitions ({prs.length})
            </h2>
            <p className="text-xs text-slate-500">PR records associated with {department.name}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">PR Number</th>
                <th className="py-3 px-4">PR Date</th>
                <th className="py-3 px-4">Budget Head</th>
                <th className="py-3 px-4">Requested By</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Approval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {prs.length > 0 ? (
                prs.map((pr: PRRecord) => (
                  <tr
                    key={pr.id}
                    onClick={() => setSelectedPR(pr)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-brand-600">{pr.prNumber}</td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(pr.prDate)}</td>
                    <td className="py-3 px-4 text-slate-800">
                      <span className="font-semibold">{pr.budgetHeadCode}</span> - {pr.budgetHeadName}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{pr.requestedBy}</td>
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No PR records recorded for this department.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PR Details Modal */}
      {selectedPR && (
        <PRDetailsModal
          pr={selectedPR}
          onClose={() => setSelectedPR(null)}
          onStatusUpdate={() => id && fetchDepartmentDetails(id)}
        />
      )}

      {/* Create PR Modal */}
      <CreatePRModal
        isOpen={isCreatePROpen}
        defaultDepartmentId={department.id}
        onClose={() => setIsCreatePROpen(false)}
        onSuccess={() => id && fetchDepartmentDetails(id)}
      />

      {/* Add Budget Modal */}
      <AddBudgetModal
        isOpen={isAddBudgetOpen}
        defaultDepartmentId={department.id}
        onClose={() => setIsAddBudgetOpen(false)}
        onSuccess={() => id && fetchDepartmentDetails(id)}
      />
    </div>
  );
};

