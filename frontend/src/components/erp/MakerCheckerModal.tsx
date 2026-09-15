import React, { useState } from 'react';
import { X, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface MakerCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  recordIdentifier: string;
  onSubmit: (action: 'APPROVE' | 'REJECT', remarks?: string) => void;
}

export const MakerCheckerModal: React.FC<MakerCheckerModalProps> = ({
  isOpen,
  onClose,
  title,
  recordIdentifier,
  onSubmit
}) => {
  const [remarks, setRemarks] = useState('');
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT'>('APPROVE');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(actionType, remarks);
    setRemarks('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-lg">{title}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
            <span className="text-gray-500 font-semibold block text-xs uppercase mb-0.5">Target Item / Reference</span>
            <span className="font-mono font-bold text-slate-800">{recordIdentifier}</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-gray-600 block">Select Action</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setActionType('APPROVE')}
                className={`py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition ${
                  actionType === 'APPROVE'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-emerald-50'
                }`}
              >
                <CheckCircle className="w-4 h-4" /> Approve
              </button>
              <button
                type="button"
                onClick={() => setActionType('REJECT')}
                className={`py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition ${
                  actionType === 'REJECT'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-rose-50'
                }`}
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-gray-600 block mb-1">
              Checker Comments / Audit Notes
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Provide reason or approval notes for audit log..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-sm font-bold text-white rounded-xl shadow-md transition ${
                actionType === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              Confirm {actionType === 'APPROVE' ? 'Approval' : 'Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
