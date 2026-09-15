import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Send,
  UserCheck,
  Award,
  ArrowRight,
  ExternalLink,
  Building2,
  Filter,
  Eye,
  RefreshCw,
  Sparkles,
  CheckCheck,
  AlertTriangle,
  Inbox,
  FileText
} from 'lucide-react';
import { approvalEmailService, TwoTierApprovalRecord, EmailMessage } from '../../services/approvalEmailService';
import { MakerCheckerModal } from '../../components/erp/MakerCheckerModal';

export const MasterDataApprovalPage: React.FC = () => {
  const [approvals, setApprovals] = useState<TwoTierApprovalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING_PRINCIPAL' | 'PENDING_CEO' | 'APPROVED' | 'REJECTED'>('ALL');
  
  // Selected item for Maker-Checker in-app modal
  const [selectedRecordForAction, setSelectedRecordForAction] = useState<{ record: TwoTierApprovalRecord; level: 'principal' | 'ceo' } | null>(null);

  // Email Preview Modal / Drawer
  const [previewEmail, setPreviewEmail] = useState<EmailMessage | null>(null);
  const [showMailboxDrawer, setShowMailboxDrawer] = useState(false);
  const [allEmails, setAllEmails] = useState<EmailMessage[]>([]);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    const data = approvalEmailService.getApprovals();
    const emails = approvalEmailService.getSentEmails();
    setApprovals(data);
    setAllEmails(emails);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Perform action in-app
  const handlePortalActionSubmit = (action: 'APPROVE' | 'REJECT', remarks?: string) => {
    if (!selectedRecordForAction) return;

    const res = approvalEmailService.processApprovalAction(
      selectedRecordForAction.record.id,
      selectedRecordForAction.level,
      action,
      undefined,
      remarks,
      'PORTAL'
    );

    if (res.success) {
      showToast(
        action === 'APPROVE'
          ? `${selectedRecordForAction.level.toUpperCase()} approved! ${selectedRecordForAction.level === 'principal' ? 'CEO notification email dispatched.' : 'Master record activated & Admin notified.'}`
          : `${selectedRecordForAction.level.toUpperCase()} rejected request.`
      );
    }

    setSelectedRecordForAction(null);
    loadData();
  };

  // Open simulated email for specific record & level
  const handleOpenEmailForRecord = (record: TwoTierApprovalRecord, level: 'principal' | 'ceo' | 'admin') => {
    const emails = approvalEmailService.getSentEmails();
    const target = emails.find(e => e.recordId === record.id && (level === 'admin' ? e.recipientRole === 'ADMIN' : e.approvalLevel === level));

    if (target) {
      setPreviewEmail(target);
    } else {
      // Generate on the fly if not found
      if (level === 'principal') {
        const em = approvalEmailService.dispatchPrincipalEmail(record);
        setPreviewEmail(em);
      } else if (level === 'ceo') {
        const em = approvalEmailService.dispatchCEOEmail(record);
        setPreviewEmail(em);
      } else {
        const em = approvalEmailService.dispatchAdminConfirmationEmail(record);
        setPreviewEmail(em);
      }
      loadData();
    }
  };

  const filteredApprovals = approvals.filter(item => {
    if (activeFilter === 'ALL') return true;
    return item.status === activeFilter;
  });

  const pendingPrincipalCount = approvals.filter(a => a.status === 'PENDING_PRINCIPAL').length;
  const pendingCeoCount = approvals.filter(a => a.status === 'PENDING_CEO').length;
  const approvedCount = approvals.filter(a => a.status === 'APPROVED').length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold mb-1">
            <ShieldCheck className="w-4 h-4" /> 2-Tier Master Approval Hierarchy
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Principal & CEO Master Approval Queue
          </h1>
          <p className="text-xs md:text-sm text-gray-500 max-w-2xl">
            Dual-signoff governance: Requests are routed sequentially to the <strong>Principal</strong> (Dr. B. V. Ramana Murthy) and <strong>CEO</strong> (Dr. L. Rathaiah) via email with one-click direct approval and real-time synchronization to the <strong>Administrator (admin@vignan.ac.in)</strong>.
          </p>
        </div>

        {/* Action Center Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              loadData();
              setShowMailboxDrawer(true);
            }}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-2xs transition cursor-pointer"
          >
            <Inbox className="w-4 h-4 text-indigo-600" />
            <span>Simulated Email Mailbox</span>
            <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-full text-[10px] font-extrabold">
              {allEmails.length}
            </span>
          </button>

          <button
            onClick={loadData}
            className="p-2.5 text-gray-500 hover:text-slate-800 hover:bg-gray-100 rounded-xl border border-gray-200 transition"
            title="Refresh Approvals"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs md:text-sm font-semibold flex items-center gap-2 shadow-md animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 3-Card Summary Metric Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Principal Pending */}
        <div
          onClick={() => setActiveFilter('PENDING_PRINCIPAL')}
          className={`p-5 rounded-2xl border transition cursor-pointer ${
            activeFilter === 'PENDING_PRINCIPAL' ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-400/20' : 'bg-white border-gray-200 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-purple-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Tier 1: Principal Approval
            </span>
            <span className="text-xl font-black text-purple-900">{pendingPrincipalCount}</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Pending verification by principal@vignan.ac.in</p>
        </div>

        {/* CEO Pending */}
        <div
          onClick={() => setActiveFilter('PENDING_CEO')}
          className={`p-5 rounded-2xl border transition cursor-pointer ${
            activeFilter === 'PENDING_CEO' ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20' : 'bg-white border-gray-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-amber-700 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> Tier 2: CEO Final Signoff
            </span>
            <span className="text-xl font-black text-amber-900">{pendingCeoCount}</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Awaiting executive approval by ceo@vignan.ac.in</p>
        </div>

        {/* Fully Approved */}
        <div
          onClick={() => setActiveFilter('APPROVED')}
          className={`p-5 rounded-2xl border transition cursor-pointer ${
            activeFilter === 'APPROVED' ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/20' : 'bg-white border-gray-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-emerald-700 flex items-center gap-1.5">
              <CheckCheck className="w-3.5 h-3.5" /> Approved & Admin Notified
            </span>
            <span className="text-xl font-black text-emerald-900">{approvedCount}</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Active in Registry & confirmed to admin@vignan.ac.in</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {[
          { key: 'ALL', label: `All Requests (${approvals.length})` },
          { key: 'PENDING_PRINCIPAL', label: `Tier 1: Principal Pending (${pendingPrincipalCount})` },
          { key: 'PENDING_CEO', label: `Tier 2: CEO Pending (${pendingCeoCount})` },
          { key: 'APPROVED', label: `Fully Approved (${approvedCount})` },
          { key: 'REJECTED', label: 'Rejected' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeFilter === tab.key
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Approvals Grid */}
      {loading ? (
        <div className="p-12 text-center text-gray-500 text-sm">Loading 2-tier approval queue...</div>
      ) : filteredApprovals.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 space-y-2">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No Pending Requests in Selected Queue</h3>
          <p className="text-xs text-gray-500">All institutional master items are up to date.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredApprovals.map((item) => {
            const isPrincPending = item.principalApproval.status === 'PENDING';
            const isPrincApproved = item.principalApproval.status === 'APPROVED';
            const isCeoPending = item.ceoApproval.status === 'PENDING' && isPrincApproved;
            const isCeoApproved = item.ceoApproval.status === 'APPROVED';
            const isFullyApproved = item.status === 'APPROVED';
            const isRejected = item.status === 'REJECTED';

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4 hover:border-indigo-300 transition"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md border border-indigo-100">
                      {item.type}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {item.record.code || item.record.itemCode || item.record.id}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wide ${
                      isFullyApproved
                        ? 'bg-emerald-100 text-emerald-800'
                        : isRejected
                        ? 'bg-rose-100 text-rose-800'
                        : isPrincPending
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isFullyApproved
                      ? 'Fully Approved'
                      : isRejected
                      ? 'Rejected'
                      : isPrincPending
                      ? 'Principal Review'
                      : 'CEO Review'}
                  </span>
                </div>

                {/* Record Info */}
                <div>
                  <h3 className="font-bold text-base text-slate-900">{item.record.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {item.record.category || ''} {item.record.gstNo ? `| GST: ${item.record.gstNo}` : ''} {item.record.unitPrice ? `| Price: ₹${item.record.unitPrice.toLocaleString('en-IN')}` : ''}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Submitted by <strong>{item.submittedBy}</strong> on {item.submittedAt}
                  </p>
                </div>

                {/* 2-Tier Visual Pipeline Flow */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                    Sequential Approval Pipeline
                  </span>

                  {/* Level 1: Principal Step */}
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2">
                      {isPrincApproved ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : item.principalApproval.status === 'REJECTED' ? (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-purple-600 shrink-0 animate-pulse" />
                      )}
                      <div>
                        <div className="font-bold text-slate-800 text-[11px]">
                          1. Principal Approval (Dr. B. V. Ramana Murthy)
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isPrincApproved
                            ? `Approved via ${item.principalApproval.channel} on ${item.principalApproval.actionedAt}`
                            : 'Email sent to principal@vignan.ac.in'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenEmailForRecord(item, 'principal')}
                      className="text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded border border-purple-200 flex items-center gap-1 transition"
                      title="Inspect Email sent to Principal"
                    >
                      <Mail className="w-3 h-3" /> View Email
                    </button>
                  </div>

                  {/* Level 2: CEO Step */}
                  <div className={`flex items-center justify-between p-2.5 rounded-lg border ${
                    isPrincApproved ? 'bg-white border-slate-200' : 'bg-slate-100/70 border-slate-200 opacity-60'
                  }`}>
                    <div className="flex items-center gap-2">
                      {isCeoApproved ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : item.ceoApproval.status === 'REJECTED' ? (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      ) : isPrincApproved ? (
                        <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <div>
                        <div className="font-bold text-slate-800 text-[11px]">
                          2. CEO Executive Final Signoff (Dr. L. Rathaiah)
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isCeoApproved
                            ? `Authorized via ${item.ceoApproval.channel} on ${item.ceoApproval.actionedAt}`
                            : isPrincApproved
                            ? 'Email sent to ceo@vignan.ac.in'
                            : 'Awaiting Level 1 Principal Clearance'}
                        </div>
                      </div>
                    </div>

                    {isPrincApproved && (
                      <button
                        onClick={() => handleOpenEmailForRecord(item, 'ceo')}
                        className="text-[11px] font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded border border-amber-200 flex items-center gap-1 transition"
                        title="Inspect Email sent to CEO"
                      >
                        <Mail className="w-3 h-3" /> View Email
                      </button>
                    )}
                  </div>

                  {/* Admin Notification Status */}
                  <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                    <span className="flex items-center gap-1">
                      <Send className="w-3 h-3 text-slate-400" /> Admin Notification (admin@vignan.ac.in):
                    </span>
                    {item.adminNotification.sent ? (
                      <button
                        onClick={() => handleOpenEmailForRecord(item, 'admin')}
                        className="font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
                      >
                        Delivered ({item.adminNotification.sentAt})
                      </button>
                    ) : (
                      <span className="text-slate-400 italic">Dispatches on Final Signoff</span>
                    )}
                  </div>
                </div>

                {/* Card Bottom Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    {/* Open Email Simulation Drawer */}
                    {isPrincPending && (
                      <button
                        onClick={() => handleOpenEmailForRecord(item, 'principal')}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5" /> Approve via Principal Email
                      </button>
                    )}
                    {isCeoPending && (
                      <button
                        onClick={() => handleOpenEmailForRecord(item, 'ceo')}
                        className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5" /> Authorize via CEO Email
                      </button>
                    )}
                  </div>

                  {/* Manual Portal Action */}
                  {!isFullyApproved && !isRejected && (
                    <button
                      onClick={() =>
                        setSelectedRecordForAction({
                          record: item,
                          level: isPrincPending ? 'principal' : 'ceo'
                        })
                      }
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg transition"
                    >
                      Portal Maker-Checker
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SIMULATED EMAIL DRAWER / MODAL */}
      {previewEmail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                <Mail className="w-4 h-4" /> Live Interactive Email Client Simulator
              </div>
              <button
                onClick={() => setPreviewEmail(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Email Meta Headers */}
            <div className="bg-slate-50 border rounded-xl p-3 text-xs space-y-1.5">
              <div><strong className="text-slate-700">From:</strong> {previewEmail.from}</div>
              <div><strong className="text-slate-700">To:</strong> <span className="font-bold text-indigo-600">{previewEmail.to}</span></div>
              <div><strong className="text-slate-700">Subject:</strong> {previewEmail.subject}</div>
              <div><strong className="text-slate-700">Received:</strong> Today at {previewEmail.timestamp}</div>
            </div>

            {/* Rendered HTML Email Body safely in sandboxed iframe */}
            <div className="border rounded-xl overflow-hidden bg-white shadow-2xs">
              <iframe
                title="Email Preview"
                srcDoc={previewEmail.bodyHtml}
                className="w-full h-80 border-0"
                sandbox="allow-popups allow-top-navigation-by-user-activation"
              />
            </div>

            <div className="flex justify-between items-center pt-2 border-t text-xs text-gray-500">
              <span>* Clicking the buttons above executes the direct approval link.</span>
              <button
                type="button"
                onClick={() => setPreviewEmail(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold"
              >
                Close Email Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIMULATED MAILBOX OVERVIEW DRAWER */}
      {showMailboxDrawer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl border max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-base">
                <Inbox className="w-5 h-5" /> All Dispatched Approval Emails ({allEmails.length})
              </div>
              <button
                onClick={() => setShowMailboxDrawer(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2.5 pr-1">
              {allEmails.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs">No emails in outbox.</div>
              ) : (
                allEmails.map((em) => (
                  <div
                    key={em.id}
                    onClick={() => {
                      setShowMailboxDrawer(false);
                      setPreviewEmail(em);
                    }}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          em.recipientRole === 'PRINCIPAL' ? 'bg-purple-100 text-purple-800' :
                          em.recipientRole === 'CEO' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {em.to}
                        </span>
                        <span className="font-bold text-slate-800">{em.subject}</span>
                      </div>
                      <p className="text-slate-500 text-[11px] truncate max-w-lg">
                        Record: {em.recordName} ({em.recordType})
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">{em.timestamp}</span>
                      <Eye className="w-4 h-4 text-indigo-600" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* IN-APP MAKER-CHECKER OVERRIDE MODAL */}
      {selectedRecordForAction && (
        <MakerCheckerModal
          isOpen={!!selectedRecordForAction}
          onClose={() => setSelectedRecordForAction(null)}
          title={`Execute ${selectedRecordForAction.level.toUpperCase()} Verification`}
          recordIdentifier={`${selectedRecordForAction.record.record.name} (${selectedRecordForAction.record.type.toUpperCase()})`}
          onSubmit={handlePortalActionSubmit}
        />
      )}
    </div>
  );
};

export default MasterDataApprovalPage;
