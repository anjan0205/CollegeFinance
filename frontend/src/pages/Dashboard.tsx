import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { formatINR, formatINRCompact } from '../utils/formatters';
import { DashboardSummaryData } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import {
  Wallet, TrendingUp, DollarSign, FileText, CheckCircle2, Clock, XCircle,
  AlertTriangle, ShieldAlert, ChevronRight, Award, Building2, Plus, FilePlus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CreatePRModal } from '../components/CreatePRModal';
import { AddBudgetModal } from '../components/AddBudgetModal';
import { useAuth } from '../contexts/AuthContext';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummaryData | null>(null);
  const [deptUtilization, setDeptUtilization] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [prStatus, setPrStatus] = useState<any[]>([]);
  const [topSpenders, setTopSpenders] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isCreatePROpen, setIsCreatePROpen] = useState(false);
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);

  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sumRes, deptRes, monthRes, statusRes, spenderRes, alertRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/dashboard/department-utilization'),
        api.get('/dashboard/monthly-pr'),
        api.get('/dashboard/pr-status'),
        api.get('/dashboard/top-spenders'),
        api.get('/dashboard/budget-alerts')
      ]);

      if (sumRes.data.success) setSummary(sumRes.data.data);
      if (deptRes.data.success) setDeptUtilization(deptRes.data.data);
      if (monthRes.data.success) setMonthlyTrend(monthRes.data.data);
      if (statusRes.data.success) setPrStatus(statusRes.data.data);
      if (spenderRes.data.success) setTopSpenders(spenderRes.data.data);
      if (alertRes.data.success) setAlerts(alertRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200 rounded-xl"></div>
          <div className="h-80 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#64748b'];

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Executive Financial Dashboard</h1>
          <p className="text-xs text-slate-500 font-medium">Real-time budget utilization, department analysis & PR committed expenditure</p>
        </div>
        <div className="flex items-center gap-2">
          {user?.role === 'ADMIN' && (
            <>
              <button
                onClick={() => setIsCreatePROpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <FilePlus className="w-4 h-4" />
                <span>Apply New PR</span>
              </button>
              <button
                onClick={() => setIsAddBudgetOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Budget</span>
              </button>
            </>
          )}
          <span className="text-xs font-semibold px-3 py-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
            FY 2026-27 Master Cycle
          </span>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Card 1: Total Budget */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Budget</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-900 mt-2">{formatINRCompact(summary?.totalAllocated)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5 truncate">{formatINR(summary?.totalAllocated)}</p>
        </div>

        {/* Card 2: Total Utilized / Committed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">PR Committed</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-amber-700 mt-2">{formatINRCompact(summary?.totalCommitted)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{summary?.utilizationPct}% Utilized</p>
        </div>

        {/* Card 3: Remaining Budget */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Remaining</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-emerald-700 mt-2">{formatINRCompact(summary?.totalRemaining)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{formatINR(summary?.totalRemaining)}</p>
        </div>

        {/* Card 4: Total PRs */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total PRs</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900 mt-2">{summary?.totalPRs}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Imported PR Records</p>
        </div>

        {/* Card 5: Approved PRs */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Approved PRs</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-emerald-600 mt-2">{summary?.approvedPRs}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Approval Granted</p>
        </div>

        {/* Card 6: Pending PRs */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pending PRs</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-amber-600 mt-2">{summary?.pendingPRs}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">In Review Workflow</p>
        </div>
      </div>

      {/* Large Utilization Gauge / Highlight Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">Master Budget Utilization Rate</span>
            <div className="text-4xl font-extrabold tracking-tight">
              {summary?.utilizationPct}% <span className="text-sm font-normal text-slate-300">Utilized</span>
            </div>
            <p className="text-xs text-slate-400">
              <span className="text-white font-semibold">{formatINRCompact(summary?.totalCommitted)}</span> PR Committed out of <span className="text-white font-semibold">{formatINRCompact(summary?.totalAllocated)}</span> Allocated Budget
            </p>
          </div>

          <div className="w-full md:w-1/2 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Overall Commitment Progress</span>
              <span className="text-brand-300">{formatINR(summary?.totalCommitted)}</span>
            </div>
            <div className="w-full h-4 bg-slate-700/80 rounded-full overflow-hidden p-0.5 border border-slate-600/50">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(summary?.utilizationPct || 0, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-medium">
              <span>0%</span>
              <span>Warning: 70%</span>
              <span>Critical: 85%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department-wise Budget Comparison Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Department-wise Budget Utilization</h2>
              <p className="text-xs text-slate-500">Allocated vs PR Committed Amount per Department</p>
            </div>
            <button
              onClick={() => navigate('/budget/departments')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptUtilization.slice(0, 8)} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <XAxis dataKey="code" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any) => [formatINR(value), 'Amount']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="allocated" name="Allocated Budget" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="committed" name="PR Committed" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly PR Trend Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Monthly PR Expenditure Trend</h2>
              <p className="text-xs text-slate-500">Monthly PR value progression (April - July 2026)</p>
            </div>
            <button
              onClick={() => navigate('/prs/all')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>PR Analysis</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any) => [formatINR(value), 'PR Total Amount']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="prAmount" name="PR Value (₹)" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Status Distribution & Top Spenders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PR Status Distribution Pie Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900 mb-1">PR Status Distribution</h2>
          <p className="text-xs text-slate-500 mb-4">Breakdown by approval & execution status</p>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={prStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="status"
                >
                  {prStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [value, 'PRs']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2">
            {prStatus.map((s, idx) => (
              <div key={s.status} className="flex items-center gap-2 p-1.5 rounded bg-slate-50 border border-slate-100">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <span className="font-medium text-slate-700">{s.status}:</span>
                <span className="font-bold text-slate-900 ml-auto">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Spending Departments Ranked Table */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" /> Top Spending Departments
              </h2>
              <p className="text-xs text-slate-500">Ranked by PR committed expenditure</p>
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>Full Report</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3 text-right">Allocated Budget</th>
                  <th className="py-2.5 px-3 text-right">PR Committed</th>
                  <th className="py-2.5 px-3 text-right">Utilization %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {topSpenders.slice(0, 5).map((dept, idx) => (
                  <tr key={dept.code} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-bold text-slate-400">#{idx + 1}</td>
                    <td className="py-2.5 px-3 text-slate-900 font-semibold">
                      {dept.name} <span className="text-slate-400 font-normal">({dept.code})</span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{formatINR(dept.allocatedAmount)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-amber-700">{formatINR(dept.committedAmount)}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                        dept.utilizationPct >= 85 ? 'bg-rose-100 text-rose-800' :
                        dept.utilizationPct >= 70 ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {dept.utilizationPct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Budget Alerts Section */}
      {alerts && alerts.summary && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" /> Budget Utilization Threshold Alerts
            </h2>
            <button
              onClick={() => navigate('/budget/utilization')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>Manage Alerts</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="text-xs font-semibold text-emerald-800">Normal (&lt;70%)</div>
              <div className="text-xl font-bold text-emerald-900 mt-1">{alerts.summary.normalCount}</div>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <div className="text-xs font-semibold text-amber-800">Warning (70-85%)</div>
              <div className="text-xl font-bold text-amber-900 mt-1">{alerts.summary.warningCount}</div>
            </div>
            <div className="p-3 rounded-xl bg-orange-50 border border-orange-200">
              <div className="text-xs font-semibold text-orange-800">Critical (85-100%)</div>
              <div className="text-xl font-bold text-orange-900 mt-1">{alerts.summary.criticalCount}</div>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
              <div className="text-xs font-semibold text-rose-800">Exceeded (&gt;100%)</div>
              <div className="text-xl font-bold text-rose-900 mt-1">{alerts.summary.exceededCount}</div>
            </div>
          </div>
        </div>
      )}

      {/* Create PR Modal */}
      <CreatePRModal
        isOpen={isCreatePROpen}
        onClose={() => setIsCreatePROpen(false)}
        onSuccess={fetchDashboardData}
      />

      {/* Add Budget Modal */}
      <AddBudgetModal
        isOpen={isAddBudgetOpen}
        onClose={() => setIsAddBudgetOpen(false)}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
};
