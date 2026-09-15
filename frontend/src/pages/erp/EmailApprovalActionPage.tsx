import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Mail,
  ArrowRight,
  ExternalLink,
  Building2,
  UserCheck,
  Award,
  Sparkles
} from 'lucide-react';
import { approvalEmailService, TwoTierApprovalRecord } from '../../services/approvalEmailService';

export const EmailApprovalActionPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const id = searchParams.get('id') || '';
  const type = searchParams.get('type') || 'master';
  const level = (searchParams.get('level') as 'principal' | 'ceo') || 'principal';
  const action = (searchParams.get('action') as 'APPROVE' | 'REJECT') || 'APPROVE';
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{ success: boolean; message: string; record?: TwoTierApprovalRecord } | null>(null);

  useEffect(() => {
    if (!id || !token) {
      setResult({
        success: false,
        message: 'Invalid approval link parameters. Missing ID or security authorization token.'
      });
      setLoading(false);
      return;
    }

    // Process the action
    const res = approvalEmailService.processApprovalAction(id, level, action, token, undefined, 'EMAIL');
    setResult(res);
    setLoading(false);
  }, [id, level, action, token]);

  const isApproved = action === 'APPROVE';
  const approverRole = level === 'principal' ? 'Principal (Dr. B. V. Ramana Murthy)' : 'Chairman & CEO (Dr. L. Rathaiah)';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center mb-6">
        <div className="w-16 h-16 rounded-2xl p-2 bg-white flex items-center justify-center shadow-xl shadow-brand-500/20 mx-auto mb-3">
          <img src="/logo.png" alt="VIIT Logo" className="w-full h-full object-contain" />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">
          VIIT Executive Approval Gateway
        </h2>
        <p className="text-xs text-slate-400 font-bold">
          College Budget & ERP System — Direct Email Authorization Handler
        </p>
      </div>

      {/* Main Confirmation Card */}
      <div className="w-full max-w-lg bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl text-slate-200 z-10 space-y-6">
        {loading ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-brand-500 border-t-white rounded-full animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-300">Authorizing email digital signature...</p>
          </div>
        ) : result?.success ? (
          <div className="space-y-5">
            {/* Status Icon Header */}
            <div className="text-center space-y-2">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg ${
                isApproved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              }`}>
                {isApproved ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
              </div>
              <h3 className="text-xl font-black text-white">
                {isApproved ? 'Authorization Confirmed & Recorded!' : 'Request Rejected'}
              </h3>
              <p className="text-xs text-slate-400">
                Action executed directly via email signature link on {new Date().toLocaleTimeString()}
              </p>
            </div>

            {/* Approval Details Box */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Master Record:</span>
                <span className="font-bold text-white text-right">{result.record?.record.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Record Type:</span>
                <span className="font-semibold text-brand-400 uppercase">{type}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Sign-off Authority:</span>
                <span className="font-semibold text-emerald-400">{approverRole}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Workflow Progression:</span>
                <span className={`font-bold px-2 py-0.5 rounded ${
                  result.record?.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' :
                  result.record?.status === 'PENDING_CEO' ? 'bg-amber-950 text-amber-300 border border-amber-500/30' : 'bg-rose-950 text-rose-300'
                }`}>
                  {result.record?.status === 'APPROVED' ? 'FULLY APPROVED & ACTIVE' :
                   result.record?.status === 'PENDING_CEO' ? 'ADVANCED TO CEO QUEUE' : result.record?.status}
                </span>
              </div>
            </div>

            {/* Next Step Information Alert */}
            <div className="p-3.5 rounded-xl bg-indigo-950/50 border border-indigo-500/30 text-indigo-200 text-xs flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                {level === 'principal' && isApproved && (
                  <span>
                    <strong>Next Step:</strong> Email notification with one-click authorization has been automatically transmitted to <strong>CEO (ceo@vignan.ac.in)</strong>.
                  </span>
                )}
                {level === 'ceo' && isApproved && (
                  <span>
                    <strong>Next Step:</strong> Master Record has been <strong>ACTIVATED</strong> in the ERP system. Final confirmation email dispatched to <strong>System Administrator (admin@vignan.ac.in)</strong>.
                  </span>
                )}
                {!isApproved && (
                  <span>
                    Rejection notification dispatched to department maker and <strong>admin@vignan.ac.in</strong>.
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <Link
                to="/erp/master-approval"
                className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 transition"
              >
                <span>View Master Approval Queue</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/erp/master-data"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition"
              >
                <span>Browse Live Master Registry</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4 py-4">
            <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <h3 className="text-lg font-bold text-white">Action Verification Failed</h3>
            <p className="text-xs text-rose-300">{result?.message || 'Unable to process approval link.'}</p>
            <Link
              to="/dashboard"
              className="inline-block mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
            >
              Return to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailApprovalActionPage;
