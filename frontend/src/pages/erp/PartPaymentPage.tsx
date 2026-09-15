import React, { useState, useEffect } from 'react';
import { PieChart, Plus, CheckCircle2, Clock } from 'lucide-react';
import { erpService } from '../../services/erpService';
import { PartPaymentRecord } from '../../types/erpTypes';

export const PartPaymentPage: React.FC = () => {
  const [partPayments, setPartPayments] = useState<PartPaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const res = await erpService.getPartPayments();
    setPartPayments(res);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold mb-1">
            <PieChart className="w-4 h-4" /> Staged Vendor Milestone Schedule
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Part Payment & Advance Management</h1>
          <p className="text-sm text-gray-500">
            Track percentage-based staged vendor payments and milestone releases for capital contracts.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 p-12 text-center text-gray-500">Loading part payment schedules...</div>
        ) : (
          partPayments.map((pp) => (
            <div key={pp.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-gray-400">{pp.poNumber}</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  pp.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {pp.status}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900">{pp.stageName}</h3>
                <span className="text-xs text-gray-500">{pp.vendorName}</span>
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs text-gray-400 block">Milestone Share</span>
                  <span className="font-black text-indigo-600 text-lg">{pp.percentage}%</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400 block">Stage Amount</span>
                  <span className="font-black text-slate-900 text-lg">₹{pp.amount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
