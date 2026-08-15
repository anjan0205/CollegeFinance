import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { formatINR } from '../utils/formatters';
import { X, Wallet, Building, Tag, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

interface AddBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultDepartmentId?: number;
  defaultBudgetHeadId?: number;
}

export const AddBudgetModal: React.FC<AddBudgetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultDepartmentId,
  defaultBudgetHeadId
}) => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [budgetHeads, setBudgetHeads] = useState<any[]>([]);

  const [departmentId, setDepartmentId] = useState<string>(defaultDepartmentId ? String(defaultDepartmentId) : '');
  const [budgetHeadId, setBudgetHeadId] = useState<string>(defaultBudgetHeadId ? String(defaultBudgetHeadId) : '');
  const [allocatedAmount, setAllocatedAmount] = useState<string>('');
  const [financialYear, setFinancialYear] = useState<string>('2026-27');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchDropdowns();
      if (defaultDepartmentId) setDepartmentId(String(defaultDepartmentId));
      if (defaultBudgetHeadId) setBudgetHeadId(String(defaultBudgetHeadId));
    }
  }, [isOpen, defaultDepartmentId, defaultBudgetHeadId]);

  async function fetchDropdowns() {
    try {
      const [dRes, bhRes] = await Promise.all([
        api.get('/departments'),
        api.get('/budget-heads')
      ]);
      if (dRes.data.success) {
        setDepartments(dRes.data.data);
        if (!departmentId && dRes.data.data.length > 0) {
          setDepartmentId(String(dRes.data.data[0].id));
        }
      }
      if (bhRes.data.success) {
        setBudgetHeads(bhRes.data.data);
        if (!budgetHeadId && bhRes.data.data.length > 0) {
          setBudgetHeadId(String(bhRes.data.data[0].id));
        }
      }
    } catch (err) {
      console.error('Failed to fetch modal dropdowns:', err);
    }
  }

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(allocatedAmount);
    if (isNaN(numAmount) || numAmount < 0) {
      setError('Please enter a valid non-negative allocated budget amount.');
      return;
    }
    if (!departmentId) {
      setError('Please select a target department.');
      return;
    }
    if (!budgetHeadId) {
      setError('Please select a budget head.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/budgets/allocation', {
        departmentId: parseInt(departmentId, 10),
        budgetHeadId: parseInt(budgetHeadId, 10),
        allocatedAmount: numAmount,
        financialYear
      });

      if (res.data.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.data.message || 'Failed to update budget allocation.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Server error allocating budget.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Add / Allocate Department Budget</h2>
              <p className="text-xs text-slate-400">Assign institutional funds to department budget head</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" /> Target Department *
            </label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-slate-800 font-semibold focus:outline-hidden focus:border-brand-500 focus:bg-white"
            >
              <option value="">Select Department...</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" /> Budget Code & Head *
            </label>
            <select
              value={budgetHeadId}
              onChange={(e) => setBudgetHeadId(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-slate-800 font-semibold focus:outline-hidden focus:border-brand-500 focus:bg-white"
            >
              <option value="">Select Budget Head...</option>
              {budgetHeads.map((bh) => (
                <option key={bh.id} value={bh.id}>
                  {bh.code} - {bh.name} ({bh.category})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Financial Year
              </label>
              <input
                type="text"
                value={financialYear}
                onChange={(e) => setFinancialYear(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-slate-800 font-medium focus:outline-hidden focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Allocated Amount (₹) *
              </label>
              <input
                type="number"
                min={0}
                placeholder="500000"
                value={allocatedAmount}
                onChange={(e) => setAllocatedAmount(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-slate-800 font-bold focus:outline-hidden focus:border-brand-500 focus:bg-white"
              />
            </div>
          </div>

          {allocatedAmount && !isNaN(parseFloat(allocatedAmount)) && (
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex justify-between items-center text-xs">
              <span className="font-semibold text-emerald-800">New Budget Allocation:</span>
              <span className="font-bold text-emerald-900 text-sm">{formatINR(parseFloat(allocatedAmount))}</span>
            </div>
          )}

          <div className="pt-3 flex justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {submitting ? (
                <span>Saving Allocation...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Budget Allocation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
