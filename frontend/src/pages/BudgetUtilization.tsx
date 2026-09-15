import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { formatINR } from '../utils/formatters';
import { ShieldAlert, AlertTriangle, CheckCircle, Flame, Filter } from 'lucide-react';

export const BudgetUtilization: React.FC = () => {
  const [alerts, setAlerts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'EXCEEDED' | 'CRITICAL' | 'WARNING'>('ALL');

  useEffect(() => {
    fetchAlerts();
  }, []);

  async function fetchAlerts() {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/budget-alerts');
      if (res.data.success) {
        setAlerts(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch budget utilization alerts:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !alerts) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
        <div className="h-32 bg-slate-200 rounded-2xl"></div>
        <div className="h-64 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  const flagged = alerts.flagged || [];
  const filteredAlerts = flagged.filter((item: any) => {
    if (activeTab === 'EXCEEDED') return item.alertStatus === 'Exceeded';
    if (activeTab === 'CRITICAL') return item.alertStatus === 'Critical';
    if (activeTab === 'WARNING') return item.alertStatus === 'Warning';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" /> Budget Utilization & Threshold Monitor
          </h1>
          <p className="text-xs text-slate-500 font-medium">Automated monitoring across 4 threshold bands: Normal (&lt;70%), Warning (70-85%), Critical (85-100%), Exceeded (&gt;100%)</p>
        </div>
      </div>

      {/* Summary Band Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('ALL')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTab === 'ALL' ? 'bg-slate-900 text-white border-slate-800 shadow-md' : 'bg-white text-slate-800 border-slate-200'
          }`}
        >
          <div className="text-xs font-semibold uppercase tracking-wider">Total Active Allocations</div>
          <div className="text-2xl font-bold mt-1">
            {alerts.summary.normalCount + alerts.summary.warningCount + alerts.summary.criticalCount + alerts.summary.exceededCount}
          </div>
        </div>

        <div
          onClick={() => setActiveTab('WARNING')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTab === 'WARNING' ? 'bg-amber-500 text-white border-amber-600 shadow-md' : 'bg-amber-50 text-amber-900 border-amber-200'
          }`}
        >
          <div className="text-xs font-semibold uppercase tracking-wider">Warning (70–85%)</div>
          <div className="text-2xl font-bold mt-1">{alerts.summary.warningCount}</div>
        </div>

        <div
          onClick={() => setActiveTab('CRITICAL')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTab === 'CRITICAL' ? 'bg-orange-600 text-white border-orange-700 shadow-md' : 'bg-orange-50 text-orange-900 border-orange-200'
          }`}
        >
          <div className="text-xs font-semibold uppercase tracking-wider">Critical (85–100%)</div>
          <div className="text-2xl font-bold mt-1">{alerts.summary.criticalCount}</div>
        </div>

        <div
          onClick={() => setActiveTab('EXCEEDED')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTab === 'EXCEEDED' ? 'bg-rose-600 text-white border-rose-700 shadow-md' : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="text-xs font-semibold uppercase tracking-wider">Exceeded (&gt;100%)</div>
          <div className="text-2xl font-bold mt-1">{alerts.summary.exceededCount}</div>
        </div>
      </div>

      {/* Flagged Allocation Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-semibold text-slate-700">
          <span>Flagged Allocations ({filteredAlerts.length})</span>
          <span className="text-slate-400">Sorted by highest utilization rate</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Budget Head</th>
                <th className="py-3 px-4 text-right">Allocated</th>
                <th className="py-3 px-4 text-right">PR Committed</th>
                <th className="py-3 px-4 text-right">Remaining</th>
                <th className="py-3 px-4 text-right">Utilization %</th>
                <th className="py-3 px-4">Threshold Alert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alloc: any) => (
                  <tr key={alloc.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{alloc.departmentName} ({alloc.departmentCode})</td>
                    <td className="py-3 px-4 text-slate-800">
                      <span className="font-mono font-semibold">{alloc.budgetHeadCode}</span> - {alloc.budgetHeadName}
                    </td>
                    <td className="py-3 px-4 text-right font-bold">{formatINR(alloc.allocatedAmount)}</td>
                    <td className="py-3 px-4 text-right font-bold text-amber-700">{formatINR(alloc.committedAmount)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-700">{formatINR(alloc.remainingAmount)}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{alloc.utilizationPercentage}%</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        alloc.alertStatus === 'Exceeded' ? 'bg-rose-100 text-rose-800' :
                        alloc.alertStatus === 'Critical' ? 'bg-orange-100 text-orange-800' :
                        alloc.alertStatus === 'Warning' ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {alloc.alertStatus}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No budget allocations found for selected threshold filter.
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
