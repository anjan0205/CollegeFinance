import React, { useState } from 'react';
import { PRRecord } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { X, CheckCircle, Clock, XCircle, FileText, ShoppingCart, User, Building, Tag, Package, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface PRDetailsModalProps {
  pr: PRRecord | null;
  onClose: () => void;
  onStatusUpdate?: () => void;
}

export const PRDetailsModal: React.FC<PRDetailsModalProps> = ({ pr: initialPr, onClose, onStatusUpdate }) => {
  const { user } = useAuth();
  const [pr, setPr] = useState<PRRecord | null>(initialPr);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!pr) return null;

  const isAdmin = user?.role === 'ADMIN';
  const isApproved = pr.approvalStatus === 'Approved';
  const isRejected = pr.approvalStatus === 'Rejected';
  const isPending = pr.approvalStatus === 'Pending';
  const isClosed = pr.status === 'Closed' || pr.prPoStatus === 'Closed';

  const handleUpdateStatus = async (approvalStatus: 'Approved' | 'Rejected' | 'Pending', status?: 'Open' | 'Approved' | 'Pending' | 'Rejected' | 'Closed') => {
    try {
      setUpdating(true);
      setMessage(null);
      const res = await api.patch(`/prs/${pr.id}/status`, {
        approvalStatus,
        status: status || (approvalStatus === 'Approved' ? 'Approved' : approvalStatus === 'Rejected' ? 'Rejected' : 'Pending')
      });

      if (res.data.success) {
        setPr(res.data.data);
        setMessage({ type: 'success', text: `PR status updated to '${approvalStatus}' successfully.` });
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
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col my-auto text-xs">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-500/20 text-brand-400 rounded-lg border border-brand-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                PR Details: <span className="font-mono text-brand-400">{pr.prNumber}</span>
              </h2>
              <p className="text-xs text-slate-400">Requested on {formatDate(pr.prDate)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin Action Banner */}
        {isAdmin && (
          <div className="bg-slate-800 px-6 py-3 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-slate-200">Admin Controls: Update PR Approval & Budget Status</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={updating || isApproved}
                onClick={() => handleUpdateStatus('Approved', 'Approved')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve PR
              </button>
              <button
                disabled={updating || isRejected}
                onClick={() => handleUpdateStatus('Rejected', 'Rejected')}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject PR
              </button>
              <button
                disabled={updating || isPending}
                onClick={() => handleUpdateStatus('Pending', 'Pending')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <Clock className="w-3.5 h-3.5" /> Mark Pending
              </button>
            </div>
          </div>
        )}

        {/* Alert Notification */}
        {message && (
          <div className={`px-6 py-2.5 text-xs font-semibold ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' : 'bg-rose-50 text-rose-800 border-b border-rose-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Status Timeline Bar */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Workflow & Approval Timeline</h3>
            <div className="grid grid-cols-4 gap-2 text-center relative">
              {/* Step 1: Created */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs border border-emerald-300 mb-1.5">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-800">PR Created</span>
                <span className="text-[10px] text-slate-500">{formatDate(pr.prDate)}</span>
              </div>

              {/* Step 2: Approval */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border mb-1.5 ${
                  isApproved ? 'bg-emerald-100 text-emerald-600 border-emerald-300' :
                  isRejected ? 'bg-rose-100 text-rose-600 border-rose-300' :
                  'bg-amber-100 text-amber-600 border-amber-300'
                }`}>
                  {isApproved ? <CheckCircle className="w-4 h-4" /> :
                   isRejected ? <XCircle className="w-4 h-4" /> :
                   <Clock className="w-4 h-4" />}
                </div>
                <span className="text-xs font-semibold text-slate-800">Approval Phase</span>
                <span className={`text-[10px] font-medium ${
                  isApproved ? 'text-emerald-600' : isRejected ? 'text-rose-600' : 'text-amber-600'
                }`}>{pr.approvalStatus}</span>
              </div>

              {/* Step 3: Decision */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border mb-1.5 ${
                  isApproved ? 'bg-emerald-100 text-emerald-600 border-emerald-300' :
                  isRejected ? 'bg-rose-100 text-rose-600 border-rose-300' :
                  'bg-slate-100 text-slate-400 border-slate-300'
                }`}>
                  {isApproved ? <CheckCircle className="w-4 h-4" /> :
                   isRejected ? <XCircle className="w-4 h-4" /> :
                   <Clock className="w-4 h-4" />}
                </div>
                <span className="text-xs font-semibold text-slate-800">Department Status</span>
                <span className="text-[10px] text-slate-500">{pr.status}</span>
              </div>

              {/* Step 4: Purchase Processing */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border mb-1.5 ${
                  isClosed ? 'bg-emerald-100 text-emerald-600 border-emerald-300' :
                  'bg-slate-100 text-slate-500 border-slate-300'
                }`}>
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-800">PR-PO Status</span>
                <span className="text-[10px] text-slate-500">{pr.prPoStatus}</span>
              </div>
            </div>
          </div>

          {/* Overview Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" /> Department
              </span>
              <p className="text-sm font-bold text-slate-800 mt-1">{pr.departmentName} ({pr.departmentCode})</p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" /> Budget Code & Head
              </span>
              <p className="text-sm font-bold text-slate-800 mt-1">
                {pr.budgetHeadCode} - {pr.budgetHeadName}
              </p>
              <span className="text-[11px] text-slate-500 font-mono">Source Code: {pr.sourceBudgetCode}</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Requested By
              </span>
              <p className="text-sm font-bold text-slate-800 mt-1">{pr.requestedBy}</p>
            </div>

            <div className="p-3.5 bg-emerald-50/60 rounded-lg border border-emerald-200">
              <span className="text-xs font-semibold text-emerald-700">Total PR Value</span>
              <p className="text-xl font-bold text-emerald-800 mt-0.5">{formatINR(pr.totalAmount)}</p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs font-medium text-slate-500">PR Overall Status</span>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  pr.status === 'Closed' ? 'bg-slate-100 text-slate-700' :
                  pr.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                  pr.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {pr.status}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs font-medium text-slate-500">Approval Status</span>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  pr.approvalStatus === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                  pr.approvalStatus === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {pr.approvalStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Purpose & Remarks */}
          {pr.purpose && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Purpose / PR Remarks</h4>
              <p className="text-sm text-slate-700 leading-relaxed">{pr.purpose}</p>
            </div>
          )}

          {/* Approver Details */}
          {(pr.approval1 || pr.approval2 || pr.approval3) && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Approval Log</h4>
              {pr.approval1 && (
                <div className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-200">
                  <span className="font-semibold text-slate-800">Approval 1:</span> {pr.approval1}
                </div>
              )}
              {pr.approval2 && (
                <div className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-200">
                  <span className="font-semibold text-slate-800">Approval 2:</span> {pr.approval2}
                </div>
              )}
              {pr.approval3 && pr.approval3 !== '-NA-' && (
                <div className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-200">
                  <span className="font-semibold text-slate-800">Approval 3:</span> {pr.approval3}
                </div>
              )}
            </div>
          )}

          {/* PR Items Table */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-brand-600" /> Requested Items ({pr.items?.length || 0})
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3">Item / Description</th>
                    <th className="py-3 px-3">Product Code</th>
                    <th className="py-3 px-3 text-right">Quantity</th>
                    <th className="py-3 px-3 text-right">Unit Price</th>
                    <th className="py-3 px-3 text-right">Total Value</th>
                    <th className="py-3 px-3">Vendor / Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {pr.items && pr.items.length > 0 ? (
                    pr.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3 font-medium text-slate-900">
                          <div>{item.productName}</div>
                          {item.productDescription && item.productDescription !== '-NA-' && (
                            <span className="text-[11px] text-slate-500 font-normal">{item.productDescription}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">{item.productCode || 'N/A'}</td>
                        <td className="py-3 px-3 text-right font-medium">{item.quantity} {item.unitTypeName || ''}</td>
                        <td className="py-3 px-3 text-right">{formatINR(item.unitPrice)}</td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900">{formatINR(item.totalValue)}</td>
                        <td className="py-3 px-3 text-slate-600">
                          {item.preferredVendor && item.preferredVendor !== '-NA-' && (
                            <div className="font-medium text-slate-800">Vendor: {item.preferredVendor}</div>
                          )}
                          {item.itemRemarks && item.itemRemarks !== '-NA-' && (
                            <div className="text-[11px] text-slate-500">{item.itemRemarks}</div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        No line items recorded for this PR header.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>College PR Admin Management Platform</span>
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
