import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { formatINR } from '../utils/formatters';
import { X, Plus, Trash2, FilePlus, Building, Tag, User, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

interface CreatePRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultDepartmentId?: number;
}

interface ItemRow {
  productName: string;
  productDescription: string;
  quantity: number;
  unitPrice: number;
  preferredVendor: string;
}

export const CreatePRModal: React.FC<CreatePRModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultDepartmentId
}) => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [budgetHeads, setBudgetHeads] = useState<any[]>([]);

  const [departmentId, setDepartmentId] = useState<string>(defaultDepartmentId ? String(defaultDepartmentId) : '');
  const [budgetHeadId, setBudgetHeadId] = useState<string>('');
  const [requestedBy, setRequestedBy] = useState<string>('System Admin');
  const [purpose, setPurpose] = useState<string>('');
  const [prDate, setPrDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [approvalStatus, setApprovalStatus] = useState<'Approved' | 'Pending'>('Approved');

  const [items, setItems] = useState<ItemRow[]>([
    { productName: '', productDescription: '', quantity: 1, unitPrice: 0, preferredVendor: '' }
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchDropdowns();
      if (defaultDepartmentId) {
        setDepartmentId(String(defaultDepartmentId));
      }
    }
  }, [isOpen, defaultDepartmentId]);

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
        if (bhRes.data.data.length > 0) {
          setBudgetHeadId(String(bhRes.data.data[0].id));
        }
      }
    } catch (err) {
      console.error('Failed to fetch modal dropdowns:', err);
    }
  }

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([
      ...items,
      { productName: '', productDescription: '', quantity: 1, unitPrice: 0, preferredVendor: '' }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ItemRow, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const calculatedTotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!departmentId) {
      setError('Please select a target department.');
      return;
    }
    if (!budgetHeadId) {
      setError('Please select a budget head.');
      return;
    }
    if (!purpose.trim()) {
      setError('Please enter a purpose / requisition description.');
      return;
    }
    if (items.some(i => !i.productName.trim())) {
      setError('Please provide product/item names for all requested items.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/prs', {
        departmentId: parseInt(departmentId, 10),
        budgetHeadId: parseInt(budgetHeadId, 10),
        requestedBy,
        purpose,
        prDate,
        approvalStatus,
        status: approvalStatus === 'Approved' ? 'Approved' : 'Pending',
        items
      });

      if (res.data.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.data.message || 'Failed to create PR.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Server error creating PR record.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-500/20 text-brand-400 rounded-xl border border-brand-500/30">
              <FilePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Apply New Department PR</h2>
              <p className="text-xs text-slate-400">Manual Purchase Requisition assignment & budget commitment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Department Selection */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" /> Target Department *
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 font-semibold focus:outline-hidden focus:border-brand-500 focus:bg-white"
              >
                <option value="">Select Department...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Budget Head Selection */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" /> Budget Code & Head *
              </label>
              <select
                value={budgetHeadId}
                onChange={(e) => setBudgetHeadId(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 font-semibold focus:outline-hidden focus:border-brand-500 focus:bg-white"
              >
                <option value="">Select Budget Head...</option>
                {budgetHeads.map((bh) => (
                  <option key={bh.id} value={bh.id}>
                    {bh.code} - {bh.name} ({bh.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Requested By */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Requested By *
              </label>
              <input
                type="text"
                value={requestedBy}
                onChange={(e) => setRequestedBy(e.target.value)}
                required
                placeholder="Faculty / HOD / Admin Name"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 focus:outline-hidden focus:border-brand-500 focus:bg-white"
              />
            </div>

            {/* PR Date & Initial Approval */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> PR Date
                </label>
                <input
                  type="date"
                  value={prDate}
                  onChange={(e) => setPrDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 focus:outline-hidden focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Approval Status
                </label>
                <select
                  value={approvalStatus}
                  onChange={(e: any) => setApprovalStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 font-semibold focus:outline-hidden focus:border-brand-500"
                >
                  <option value="Approved">Approved</option>
                  <option value="Pending">Pending Review</option>
                </select>
              </div>
            </div>
          </div>

          {/* Purpose */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Purpose / Purchase Justification *
            </label>
            <textarea
              rows={2}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              required
              placeholder="Detailed description of goods, lab equipment, or services requested..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 focus:outline-hidden focus:border-brand-500 focus:bg-white"
            />
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Requested Items / Services ({items.length})
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 px-2.5 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item Line
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Item / Product Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Oscilloscope / Lab Desktop"
                      value={item.productName}
                      onChange={(e) => handleItemChange(idx, 'productName', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded py-1 px-2 text-xs text-slate-800"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-slate-50 border border-slate-200 rounded py-1 px-2 text-xs text-slate-800 text-right font-semibold"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Unit Price (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded py-1 px-2 text-xs text-slate-800 text-right font-semibold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Line Total</label>
                    <div className="py-1 px-2 bg-slate-100 rounded text-right font-bold text-slate-800">
                      {formatINR(item.quantity * item.unitPrice)}
                    </div>
                  </div>

                  <div className="sm:col-span-1 flex items-center justify-center">
                    <button
                      type="button"
                      disabled={items.length <= 1}
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 rounded text-rose-500 hover:bg-rose-50 disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="sm:col-span-6">
                    <input
                      type="text"
                      placeholder="Product Description / Specs"
                      value={item.productDescription}
                      onChange={(e) => handleItemChange(idx, 'productDescription', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded py-1 px-2 text-[11px] text-slate-600"
                    />
                  </div>

                  <div className="sm:col-span-6">
                    <input
                      type="text"
                      placeholder="Preferred Vendor Name"
                      value={item.preferredVendor}
                      onChange={(e) => handleItemChange(idx, 'preferredVendor', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded py-1 px-2 text-[11px] text-slate-600"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Total Summary */}
            <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-lg border border-emerald-200">
              <span className="font-bold text-emerald-800 text-xs">Total Requisition Amount</span>
              <span className="font-extrabold text-emerald-900 text-base">{formatINR(calculatedTotal)}</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-slate-200">
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
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {submitting ? (
                <span>Submitting PR...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Apply & Commit PR</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
