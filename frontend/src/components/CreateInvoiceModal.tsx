import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { PRRecord } from '../types';
import { formatINR } from '../utils/formatters';
import { X, FileText, Building, Calendar, CheckCircle2, AlertCircle, Receipt, History, AlertTriangle, ArrowRight } from 'lucide-react';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultPRId?: string | number;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultPRId
}) => {
  const { user } = useAuth();
  const [allPRs, setAllPRs] = useState<PRRecord[]>([]);
  const [prSearchQuery, setPrSearchQuery] = useState<string>('');
  const [selectedPRId, setSelectedPRId] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [vendorName, setVendorName] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [taxAmount, setTaxAmount] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const randomInvNo = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      setInvoiceNumber(randomInvNo);
      setInvoiceDate(new Date().toISOString().substring(0, 10));
      setTaxAmount('');
      setRemarks('');
      setPrSearchQuery('');
      setError(null);
      fetchAllPRs();
    }
  }, [isOpen, defaultPRId]);

  async function fetchAllPRs() {
    try {
      const res = await api.get('/prs', { params: { limit: 5000 } });
      if (res.data.success) {
        const prs: PRRecord[] = res.data.data;
        setAllPRs(prs);

        if (defaultPRId) {
          const target = prs.find(p => String(p.id) === String(defaultPRId) || p.prNumber.toLowerCase() === String(defaultPRId).toLowerCase());
          if (target) {
            handlePRSelect(target);
            return;
          }
        }

        if (prs.length > 0 && !selectedPRId) {
          handlePRSelect(prs[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load PRs for invoice creation:', err);
    }
  }

  const handlePRSelect = (pr: PRRecord) => {
    setSelectedPRId(String(pr.id));
    if (pr.items && pr.items.length > 0 && pr.items[0].preferredVendor && pr.items[0].preferredVendor !== '-NA-') {
      setVendorName(pr.items[0].preferredVendor);
    } else {
      setVendorName('');
    }

    const remaining = pr.remainingPRAmount !== undefined ? pr.remainingPRAmount : pr.totalAmount;
    setTotalAmount(remaining > 0 ? String(remaining) : String(pr.totalAmount));
  };

  const handlePRChange = (prIdStr: string) => {
    setSelectedPRId(prIdStr);
    const found = allPRs.find(p => String(p.id) === prIdStr);
    if (found) {
      handlePRSelect(found);
    }
  };

  const filteredPRs = allPRs.filter(pr => {
    if (!prSearchQuery.trim()) return true;
    const q = prSearchQuery.toLowerCase();
    return (
      pr.prNumber.toLowerCase().includes(q) ||
      pr.departmentCode.toLowerCase().includes(q) ||
      pr.departmentName.toLowerCase().includes(q) ||
      pr.requestedBy.toLowerCase().includes(q) ||
      (pr.budgetHeadName && pr.budgetHeadName.toLowerCase().includes(q)) ||
      (pr.budgetHeadCode && String(pr.budgetHeadCode).toLowerCase().includes(q))
    );
  });

  if (!isOpen) return null;

  const selectedPR = allPRs.find(p => String(p.id) === selectedPRId);
  const prTotal = selectedPR ? selectedPR.totalAmount : 0;
  const prUtilizedBefore = selectedPR ? (selectedPR.utilizedAmount || 0) : 0;
  const prRemainingBefore = selectedPR ? (selectedPR.remainingPRAmount !== undefined ? selectedPR.remainingPRAmount : prTotal - prUtilizedBefore) : 0;

  const currentInvoiceVal = parseFloat(totalAmount) || 0;
  const newUtilized = prUtilizedBefore + currentInvoiceVal;
  const newRemaining = Math.max(0, prTotal - newUtilized);
  const isExceeding = currentInvoiceVal > prRemainingBefore;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedPRId) {
      setError('Please select a Purchase Requisition (PR).');
      return;
    }
    if (!invoiceNumber.trim()) {
      setError('Please enter a valid Invoice Number.');
      return;
    }
    if (!vendorName.trim()) {
      setError('Please provide Vendor / Supplier Name.');
      return;
    }
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      setError('Please enter a valid total invoice amount.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/invoices', {
        prId: selectedPRId,
        invoiceNumber,
        invoiceDate,
        vendorName,
        totalAmount: parseFloat(totalAmount),
        taxAmount: taxAmount ? parseFloat(taxAmount) : 0,
        remarks
      });

      if (res.data.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.data.message || 'Failed to create invoice.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Server error submitting invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Add Invoice for Accepted PR</h2>
              <p className="text-xs text-slate-400">Record partial or full invoice utilization against approved PRs</p>
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Select PR */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" /> Linked Purchase Requisition (PR) *
              </label>
              <span className="text-[11px] font-semibold text-emerald-600">
                {allPRs.length} PRs Available ({filteredPRs.length} Matching)
              </span>
            </div>

            {/* Quick Filter Box */}
            <input
              type="text"
              value={prSearchQuery}
              onChange={(e) => setPrSearchQuery(e.target.value)}
              placeholder="🔍 Search PR # (e.g. PR/APR26/001), Dept, Budget Code, Requestor..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-800 focus:outline-hidden focus:border-brand-500 font-medium"
            />

            <select
              value={selectedPRId}
              onChange={(e) => handlePRChange(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-slate-800 font-semibold focus:outline-hidden focus:border-brand-500 focus:bg-white"
            >
              <option value="">Select PR ({filteredPRs.length} PRs)...</option>
              {filteredPRs.map((pr) => (
                <option key={pr.id} value={pr.id}>
                  {pr.prNumber} - {pr.departmentCode} ({pr.budgetHeadName || pr.budgetHeadCode || 'Budget Head'}) - Total: {formatINR(pr.totalAmount)} {pr.utilizedAmount ? `[Utilized: ${formatINR(pr.utilizedAmount)}]` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Live PR Utilization & Remaining Balance Card */}
          {selectedPR && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                <div>
                  <span className="font-bold text-slate-900 text-sm">{selectedPR.prNumber}</span>
                  <span className="ml-2 text-slate-500">({selectedPR.departmentName} - {selectedPR.departmentCode})</span>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    {selectedPR.approvalStatus || 'Approved'}
                  </span>
                </div>
              </div>

              {/* 3 Metrics */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total PR Value</span>
                  <span className="text-xs font-bold text-slate-900">{formatINR(prTotal)}</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Already Utilized</span>
                  <span className="text-xs font-bold text-amber-600">{formatINR(prUtilizedBefore)}</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">PR Remaining</span>
                  <span className="text-xs font-bold text-emerald-600">{formatINR(prRemainingBefore)}</span>
                </div>
              </div>

              {/* Existing Invoices List for this PR */}
              {selectedPR.invoices && selectedPR.invoices.length > 0 && (
                <div className="pt-1">
                  <span className="font-bold text-slate-700 text-[11px] flex items-center gap-1 mb-1.5">
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    Existing Invoices Attached to this PR ({selectedPR.invoices.length}):
                  </span>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {selectedPR.invoices.map((inv: any) => (
                      <div key={inv.id} className="flex items-center justify-between px-2.5 py-1 bg-white rounded border border-slate-200 text-[11px]">
                        <span className="font-mono font-medium text-slate-800">{inv.invoiceNumber} ({inv.invoiceDate})</span>
                        <span className="text-slate-600 truncate max-w-[150px]">{inv.vendorName}</span>
                        <span className="font-bold text-amber-700">{formatINR(inv.totalAmount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Invoice Number & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Invoice Number *
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                required
                placeholder="e.g. INV-2026-890"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 font-mono focus:outline-hidden focus:border-brand-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Invoice Date
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 focus:outline-hidden focus:border-brand-500"
              />
            </div>
          </div>

          {/* Vendor Name */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" /> Vendor / Supplier Name *
            </label>
            <input
              type="text"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              required
              placeholder="e.g. Dell India Pvt Ltd / Precision Instruments"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 focus:outline-hidden focus:border-brand-500 focus:bg-white"
            />
          </div>

          {/* Invoice Value & Tax */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block font-bold text-slate-700 uppercase tracking-wider">
                  Invoice Amount (₹) *
                </label>
                {selectedPR && prRemainingBefore > 0 && (
                  <button
                    type="button"
                    onClick={() => setTotalAmount(String(prRemainingBefore))}
                    className="text-[10px] text-brand-600 hover:text-brand-700 font-bold underline cursor-pointer"
                  >
                    Fill Remaining ({formatINR(prRemainingBefore)})
                  </button>
                )}
              </div>
              <input
                type="number"
                min={0}
                step={0.01}
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                required
                placeholder="Amount to utilize"
                className={`w-full bg-slate-50 border rounded-lg py-2 px-3 font-bold focus:outline-hidden focus:bg-white ${
                  isExceeding ? 'border-amber-400 text-amber-800 bg-amber-50' : 'border-slate-200 text-slate-800 focus:border-brand-500'
                }`}
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tax / GST Component (₹)
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={taxAmount}
                onChange={(e) => setTaxAmount(e.target.value)}
                placeholder="Optional GST / Tax"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 focus:outline-hidden focus:border-brand-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Real-time Calculation Preview */}
          {selectedPR && currentInvoiceVal > 0 && (
            <div className={`p-3 rounded-xl border flex flex-col gap-1.5 ${
              isExceeding ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <div className="flex items-center justify-between font-semibold text-xs">
                <span className="flex items-center gap-1">
                  {isExceeding ? <AlertTriangle className="w-4 h-4 text-amber-600" /> : <ArrowRight className="w-4 h-4 text-emerald-600" />}
                  Calculation Preview after this Invoice:
                </span>
                <span className="font-bold">
                  Utilized: {formatINR(newUtilized)} / {formatINR(prTotal)}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>New PR Remaining Budget: <strong>{formatINR(newRemaining)}</strong></span>
                <span>PR Utilization Rate: <strong>{prTotal > 0 ? ((newUtilized / prTotal) * 100).toFixed(1) : 0}%</strong></span>
              </div>
              {isExceeding && (
                <p className="text-[11px] text-amber-700 font-medium">
                  Note: This invoice amount exceeds the remaining PR balance by {formatINR(currentInvoiceVal - prRemainingBefore)}.
                </p>
              )}
            </div>
          )}

          {/* Remarks */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Invoice Remarks / Utilization Description
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. 1st installment payment, material delivery note reference..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 focus:outline-hidden focus:border-brand-500 focus:bg-white"
            />
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {submitting ? (
                <span>Recording...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Record PR Invoice</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
