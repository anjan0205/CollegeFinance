import React, { useState } from 'react';
import { InvoiceRecord } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { X, CheckCircle2, Clock, XCircle, Building, Tag, User, Receipt, ShieldCheck, DollarSign, Calendar, FileText } from 'lucide-react';

interface InvoiceDetailsModalProps {
  invoice: InvoiceRecord | null;
  onClose: () => void;
  onStatusUpdate?: () => void;
}

export const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({ invoice: initialInv, onClose, onStatusUpdate }) => {
  const { user } = useAuth();
  const [inv, setInv] = useState<InvoiceRecord | null>(initialInv);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!inv) return null;

  const isFinanceOrAdmin = user?.role === 'ADMIN' || user?.role === 'FINANCE';
  const isPaid = inv.status === 'Paid' || inv.paymentStatus === 'Paid';
  const isApproved = inv.status === 'Approved';
  const isRejected = inv.status === 'Rejected';
  const isPending = inv.status === 'Pending';

  const handleUpdateStatus = async (status: 'Approved' | 'Paid' | 'Rejected' | 'Pending', paymentStatus?: 'Unpaid' | 'Paid') => {
    try {
      setUpdating(true);
      setMessage(null);
      const res = await api.patch(`/invoices/${inv.id}/status`, {
        status,
        paymentStatus: paymentStatus || (status === 'Paid' ? 'Paid' : 'Unpaid')
      });

      if (res.data.success) {
        setInv(res.data.data);
        setMessage({ type: 'success', text: `Invoice status updated to '${status}' successfully.` });
        if (onStatusUpdate) onStatusUpdate();
      } else {
        setMessage({ type: 'error', text: res.data.message || 'Status update failed.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to connect to backend server.' });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col my-auto text-xs">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Invoice Details: <span className="font-mono text-emerald-400">{inv.invoiceNumber}</span>
              </h2>
              <p className="text-xs text-slate-400">Billed on {formatDate(inv.invoiceDate)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Finance/Admin Action Controls */}
        {isFinanceOrAdmin && (
          <div className="bg-slate-800 px-6 py-3 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-slate-200">Finance Controls: Invoice Approval & Payment Settlement</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={updating || isPaid}
                onClick={() => handleUpdateStatus('Paid', 'Paid')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <DollarSign className="w-3.5 h-3.5" /> Mark Paid & Settle
              </button>
              <button
                disabled={updating || isApproved || isPaid}
                onClick={() => handleUpdateStatus('Approved')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve Invoice
              </button>
              <button
                disabled={updating || isRejected}
                onClick={() => handleUpdateStatus('Rejected')}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject Invoice
              </button>
            </div>
          </div>
        )}

        {/* Notification Banner */}
        {message && (
          <div className={`px-6 py-2.5 text-xs font-semibold ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' : 'bg-rose-50 text-rose-800 border-b border-rose-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Key Metric Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200">
              <span className="text-xs font-semibold text-emerald-700">Total Invoice Amount</span>
              <p className="text-xl font-bold text-emerald-800 mt-0.5">{formatINR(inv.totalAmount)}</p>
              {inv.taxAmount ? (
                <span className="text-[11px] text-emerald-600 font-medium">Tax/GST Included: {formatINR(inv.taxAmount)}</span>
              ) : null}
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-medium text-slate-500">Invoice Approval Status</span>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                  inv.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                  inv.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {inv.status}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-medium text-slate-500">Payment Status</span>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  inv.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                  inv.paymentStatus === 'Partial' ? 'bg-amber-100 text-amber-800' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {inv.paymentStatus} {inv.paymentDate ? `(${formatDate(inv.paymentDate)})` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Details Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Vendor & Billing Info</h4>
              <div className="text-slate-600 space-y-1">
                <div><span className="font-semibold text-slate-700">Vendor Name:</span> <strong className="text-slate-900">{inv.vendorName}</strong></div>
                <div><span className="font-semibold text-slate-700">Invoice Number:</span> <span className="font-mono font-bold text-brand-600">{inv.invoiceNumber}</span></div>
                <div><span className="font-semibold text-slate-700">Invoice Date:</span> {formatDate(inv.invoiceDate)}</div>
                <div><span className="font-semibold text-slate-700">Submitted By:</span> {inv.submittedBy}</div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Department & PR Linkage</h4>
              <div className="text-slate-600 space-y-1">
                <div><span className="font-semibold text-slate-700">Department:</span> <strong className="text-slate-900">{inv.departmentName} ({inv.departmentCode})</strong></div>
                <div><span className="font-semibold text-slate-700">Linked PR:</span> <span className="font-mono font-bold text-indigo-600">{inv.prNumber}</span></div>
                <div><span className="font-semibold text-slate-700">Budget Head:</span> <span className="font-mono font-semibold text-slate-800">{inv.budgetHeadCode}</span> - {inv.budgetHeadName}</div>
              </div>
            </div>
          </div>

          {/* Remarks / Justification */}
          {inv.remarks && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Invoice Remarks / Delivery Notes</h4>
              <p className="text-sm text-slate-700 leading-relaxed">{inv.remarks}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>College Finance Invoice System</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
