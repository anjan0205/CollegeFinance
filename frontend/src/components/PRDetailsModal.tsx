import React, { useState } from 'react';
import { PRRecord } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  X, CheckCircle, Clock, XCircle, FileText, ShoppingCart, User, Building, 
  Tag, Package, ShieldCheck, CheckCircle2, Paperclip, Download, Eye, 
  FileSpreadsheet, FileImage, ExternalLink, Lock, CheckCheck, RotateCcw,
  Mail, Send, Check, AlertCircle
} from 'lucide-react';

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

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getDocIcon = (type?: string, name?: string) => {
    const ext = (name || '').split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf' || (type && type.includes('pdf'))) {
      return <FileText className="w-5 h-5 text-rose-500" />;
    } else if (['xlsx', 'xls', 'csv'].includes(ext) || (type && (type.includes('sheet') || type.includes('excel')))) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    } else if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext) || (type && type.includes('image'))) {
      return <FileImage className="w-5 h-5 text-purple-500" />;
    }
    return <Paperclip className="w-5 h-5 text-brand-500" />;
  };

  const attachedDocsList = pr.attachments && pr.attachments.length > 0 
    ? pr.attachments 
    : (pr.documentUrl ? [{
        name: pr.documentName || 'PR Attachment Document',
        url: pr.documentUrl,
        size: pr.documentSize,
        type: pr.documentType,
        uploadedAt: pr.prDate
      }] : []);

  const isExecutive = user?.role === 'PRINCIPAL' || user?.role === 'CEO' || Boolean(user?.email?.toLowerCase().includes('principal')) || Boolean(user?.email?.toLowerCase().includes('ceo'));
  const canManage = user?.role === 'ADMIN' || user?.role === 'FINANCE' || user?.role === 'HOD' || isExecutive;
  const isApproved = pr.approvalStatus === 'Approved' || pr.approvalStage === 'APPROVED';
  const isRejected = pr.approvalStatus === 'Rejected' || pr.approvalStage === 'REJECTED';
  const isPending = !isApproved && !isRejected;
  const isClosed = pr.status === 'Closed' || pr.prPoStatus === 'Closed';

  const principalEmail = pr.principalEmail || 'principal@viit.ac.in';
  const ceoEmail = pr.ceoEmail || 'ceo@viit.ac.in';
  const principalStatus = pr.principalStatus || (isApproved ? 'APPROVED' : isRejected ? 'REJECTED' : 'PENDING');
  const ceoStatus = pr.ceoStatus || (isApproved ? 'APPROVED' : 'PENDING');

  const handleTierApproval = async (stage: 'Principal' | 'CEO', action: 'Approved' | 'Rejected') => {
    try {
      setUpdating(true);
      setMessage(null);
      const res = await api.patch(`/prs/${pr.id}/status`, {
        tierApproval: {
          stage,
          action,
          remarks: `${action} by ${stage} (${stage === 'Principal' ? principalEmail : ceoEmail})`
        }
      });

      if (res.data.success) {
        setPr(res.data.data);
        setMessage({ type: 'success', text: `PR Stage 2-Tier update '${stage}' set to '${action}' successfully.` });
        if (onStatusUpdate) onStatusUpdate();
      } else {
        setMessage({ type: 'error', text: res.data.message || 'Stage approval failed.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to connect to backend server.' });
    } finally {
      setUpdating(false);
    }
  };

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
        setMessage({ type: 'success', text: `PR status updated to '${status || approvalStatus}' successfully.` });
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

  const handleClosePR = async () => {
    try {
      setUpdating(true);
      setMessage(null);
      const res = await api.patch(`/prs/${pr.id}/status`, {
        status: 'Closed'
      });

      if (res.data.success) {
        setPr(res.data.data);
        setMessage({ type: 'success', text: `Purchase Requisition ${pr.prNumber} has been successfully Closed.` });
        if (onStatusUpdate) onStatusUpdate();
      } else {
        setMessage({ type: 'error', text: res.data.message || 'Failed to close PR.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to connect to backend server.' });
    } finally {
      setUpdating(false);
    }
  };

  const handleReOpenPR = async () => {
    try {
      setUpdating(true);
      setMessage(null);
      const res = await api.patch(`/prs/${pr.id}/status`, {
        status: 'Approved',
        approvalStatus: 'Approved'
      });

      if (res.data.success) {
        setPr(res.data.data);
        setMessage({ type: 'success', text: `Purchase Requisition ${pr.prNumber} has been Re-Opened.` });
        if (onStatusUpdate) onStatusUpdate();
      } else {
        setMessage({ type: 'error', text: res.data.message || 'Failed to re-open PR.' });
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

        {/* Admin & Finance Controls Banner */}
        {canManage && (
          <div className="bg-slate-800 px-6 py-3 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-slate-200">Requisition Controls: Update Approval & Lifecycle Status</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!isExecutive && (
                <button
                  disabled={updating || isApproved || principalStatus === 'REJECTED'}
                  onClick={() => handleUpdateStatus('Approved', 'Approved')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                  title={principalStatus === 'REJECTED' ? 'Cannot approve: PR was rejected by Principal at Tier 1' : ''}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve PR
                </button>
              )}
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
              {!isClosed ? (
                <button
                  disabled={updating}
                  onClick={handleClosePR}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs border border-indigo-400/40"
                  title="Close Purchase Requisition when billing / invoices are completed"
                >
                  <Lock className="w-3.5 h-3.5" /> Close PR
                </button>
              ) : (
                <button
                  disabled={updating}
                  onClick={handleReOpenPR}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs border border-slate-600"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-indigo-400" /> Re-Open PR
                </button>
              )}
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
          {/* Master Approvals (Principal & CEO) */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Principal Approval Card */}
              <div className={`p-4 rounded-xl border transition-all ${
                principalStatus === 'APPROVED' ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-100' :
                principalStatus === 'REJECTED' ? 'bg-rose-950/40 border-rose-500/40 text-rose-100' :
                'bg-slate-800/80 border-slate-700 text-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-400" />
                    <div>
                      <span className="font-extrabold text-xs block text-white">{pr.principalName || 'Dr. V. Rama Rao'}</span>
                      <span className="text-[10px] text-indigo-300 font-medium">Principal Approval</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                    principalStatus === 'APPROVED' ? 'bg-emerald-500 text-white' :
                    principalStatus === 'REJECTED' ? 'bg-rose-500 text-white' :
                    'bg-amber-500 text-slate-900'
                  }`}>
                    {principalStatus}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-indigo-200 mb-1">{principalEmail}</p>
                <p className="text-[11px] text-slate-300 italic mb-3">
                  {pr.principalRemarks || (principalStatus === 'PENDING' ? 'Waiting for Principal approval' : '')}
                </p>

                {canManage && principalStatus === 'PENDING' && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700">
                    <button
                      disabled={updating}
                      onClick={() => handleTierApproval('Principal', 'Approved')}
                      className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve (Principal)
                    </button>
                    <button
                      disabled={updating}
                      onClick={() => handleTierApproval('Principal', 'Rejected')}
                      className="py-1.5 px-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>

              {/* CEO Approval Card */}
              <div className={`p-4 rounded-xl border transition-all ${
                ceoStatus === 'APPROVED' ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-100' :
                ceoStatus === 'REJECTED' ? 'bg-rose-950/40 border-rose-500/40 text-rose-100' :
                principalStatus === 'REJECTED' ? 'bg-rose-950/30 border-rose-800/60 text-rose-200' :
                principalStatus === 'APPROVED' ? 'bg-slate-800/80 border-indigo-500/40 text-slate-200' :
                'bg-slate-900/50 border-slate-800 opacity-60 text-slate-400'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-400" />
                    <div>
                      <span className="font-extrabold text-xs block text-white">{pr.ceoName || 'Sri L. Rathaiah'}</span>
                      <span className="text-[10px] text-purple-300 font-medium">CEO Approval (Tier 2)</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                    ceoStatus === 'APPROVED' ? 'bg-emerald-500 text-white' :
                    ceoStatus === 'REJECTED' ? 'bg-rose-500 text-white' :
                    principalStatus === 'REJECTED' ? 'bg-rose-900/90 text-rose-200 border border-rose-700' :
                    principalStatus === 'APPROVED' ? 'bg-amber-500 text-slate-900' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    {principalStatus === 'REJECTED' ? 'TERMINATED AT TIER 1' : ceoStatus}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-purple-200 mb-1">{ceoEmail}</p>
                <p className="text-[11px] text-slate-300 italic mb-3">
                  {pr.ceoRemarks || (
                    principalStatus === 'REJECTED'
                      ? `🚫 Workflow Terminated: Requisition was REJECTED by Principal (${pr.principalName || 'Dr. V. Rama Rao'}). CEO approval is permanently disabled.`
                      : principalStatus !== 'APPROVED'
                      ? '🔒 Locked until Tier 1 Principal sign-off'
                      : 'Waiting for CEO approval'
                  )}
                </p>

                {canManage && principalStatus === 'APPROVED' && ceoStatus === 'PENDING' && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700">
                    <button
                      disabled={updating}
                      onClick={() => handleTierApproval('CEO', 'Approved')}
                      className="flex-1 py-1.5 px-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve (CEO)
                    </button>
                    <button
                      disabled={updating}
                      onClick={() => handleTierApproval('CEO', 'Rejected')}
                      className="py-1.5 px-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Email Dispatch Audit Log Sub-Section */}
            {pr.emailLogs && pr.emailLogs.length > 0 && (
              <div className="bg-slate-950/60 rounded-xl p-3 border border-indigo-500/20 text-[11px]">
                <span className="font-bold text-indigo-300 block mb-1.5 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-indigo-400" /> Automated Email Audit & Action Token Dispatch Log
                </span>
                <div className="space-y-1.5">
                  {pr.emailLogs.map((log, idx) => (
                    <div key={idx} className="flex flex-wrap items-center justify-between bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-slate-300 font-mono">
                      <span>To: <strong className="text-white">{log.to}</strong> ({log.recipientRole})</span>
                      <span className="text-[10px] text-indigo-400">Sent: {new Date(log.sentAt).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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

            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs font-semibold text-slate-700">Total PR Value</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">{formatINR(pr.totalAmount)}</p>
            </div>

            <div className="p-3.5 bg-blue-50/70 rounded-lg border border-blue-200">
              <span className="text-xs font-semibold text-blue-700">Utilized PR (Invoiced)</span>
              <p className="text-lg font-bold text-blue-800 mt-0.5">{formatINR(pr.utilizedAmount || 0)}</p>
            </div>

            <div className="p-3.5 bg-emerald-50/70 rounded-lg border border-emerald-200">
              <span className="text-xs font-semibold text-emerald-700">Remaining PR Budget</span>
              <p className="text-lg font-bold text-emerald-800 mt-0.5">
                {formatINR(pr.remainingPRAmount !== undefined ? pr.remainingPRAmount : (pr.totalAmount - (pr.utilizedAmount || 0)))}
              </p>
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

            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs font-medium text-slate-500">Invoices Processed</span>
              <p className="text-lg font-bold text-slate-800 mt-0.5">
                {pr.invoices ? pr.invoices.length : 0} {pr.invoices && pr.invoices.length === 1 ? 'Invoice' : 'Invoices'}
              </p>
            </div>
          </div>

          {/* Purpose & Remarks */}
          {pr.purpose && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Purpose / PR Remarks</h4>
              <p className="text-sm text-slate-700 leading-relaxed">{pr.purpose}</p>
            </div>
          )}

          {/* Attached Supporting Documents */}
          {attachedDocsList.length > 0 && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-brand-600" />
                  Attached Supporting Documents ({attachedDocsList.length})
                </h4>
                <span className="text-[10px] text-slate-400 font-medium">Uploaded Requisition Documentation</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {attachedDocsList.map((doc: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-3 shadow-2xs hover:border-brand-300 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex-shrink-0">
                        {getDocIcon(doc.type, doc.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 truncate" title={doc.name}>
                          {doc.name}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          {doc.size ? (
                            <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded font-medium text-slate-600">
                              {formatFileSize(doc.size)}
                            </span>
                          ) : null}
                          {doc.remarks && (
                            <span className="text-slate-500 truncate max-w-[140px]">{doc.remarks}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        download={doc.name}
                        className="px-2.5 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer border border-brand-200"
                        title="View / Download Attached Document"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
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
