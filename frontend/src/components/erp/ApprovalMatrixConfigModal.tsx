import React, { useState } from 'react';
import { ShieldCheck, Sliders, Save, X, Plus, Trash2, Clock } from 'lucide-react';

interface ApprovalLevel {
  levelNumber: number;
  role: string;
  label: string;
  isParallel?: boolean;
  slaHours: number;
}

interface ApprovalMatrixRule {
  id: string;
  name: string;
  appliesTo: 'PR' | 'PO';
  minAmount: number;
  maxAmount: number;
  levels: ApprovalLevel[];
}

interface ApprovalMatrixConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_RULES: ApprovalMatrixRule[] = [
  {
    id: 'matrix-tier-1',
    name: 'Micro Spend Tier (<= 15,000)',
    appliesTo: 'PR',
    minAmount: 0,
    maxAmount: 15000,
    levels: [{ levelNumber: 1, role: 'CLUB_COORDINATOR', label: 'Club Coordinator / Lead', slaHours: 24 }]
  },
  {
    id: 'matrix-tier-2',
    name: 'Department Spend Tier (15,001 - 125,000)',
    appliesTo: 'PR',
    minAmount: 15001,
    maxAmount: 125000,
    levels: [
      { levelNumber: 1, role: 'CLUB_COORDINATOR', label: 'Club Coordinator / Lead', slaHours: 24 },
      { levelNumber: 2, role: 'HOD', label: 'Head of Department (HOD)', slaHours: 48 }
    ]
  },
  {
    id: 'matrix-tier-3',
    name: 'Institutional Spend Tier (125,001 - 1,100,000)',
    appliesTo: 'PR',
    minAmount: 125001,
    maxAmount: 1100000,
    levels: [
      { levelNumber: 1, role: 'CLUB_COORDINATOR', label: 'Club Coordinator / Lead', slaHours: 24 },
      { levelNumber: 2, role: 'HOD', label: 'Head of Department (HOD)', slaHours: 48 },
      { levelNumber: 3, role: 'FINANCE_CONTROLLER', label: 'Finance Controller', slaHours: 48 }
    ]
  },
  {
    id: 'matrix-tier-4',
    name: 'Major Capital Spend Tier (> 1,100,000)',
    appliesTo: 'PR',
    minAmount: 1100001,
    maxAmount: 999999999,
    levels: [
      { levelNumber: 1, role: 'CLUB_COORDINATOR', label: 'Club Coordinator / Lead', slaHours: 24 },
      { levelNumber: 2, role: 'HOD', label: 'Head of Department (HOD)', slaHours: 48 },
      { levelNumber: 3, role: 'FINANCE_CONTROLLER', label: 'Finance Controller', slaHours: 48 },
      { levelNumber: 4, role: 'PRINCIPAL', label: 'Principal / Director', slaHours: 72 }
    ]
  }
];

export const ApprovalMatrixConfigModal: React.FC<ApprovalMatrixConfigModalProps> = ({
  isOpen,
  onClose
}) => {
  const [rules, setRules] = useState<ApprovalMatrixRule[]>(DEFAULT_RULES);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-6 h-6 text-indigo-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">Approval Matrix Rules Engine Configurator</h2>
              <p className="text-xs text-slate-500">Configure spend thresholds, role hierarchy levels, and SLA hours</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {saveSuccess && (
          <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold text-center">
            Approval matrix rules successfully saved & updated in active rules engine!
          </div>
        )}

        <div className="space-y-6">
          {rules.map((rule, idx) => (
            <div key={rule.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <span className="font-bold text-sm text-indigo-900">{rule.name}</span>
                <span className="text-xs font-semibold text-slate-600 bg-white px-3 py-1 border rounded-lg">
                  Amount Range: ₹{rule.minAmount.toLocaleString()} — {rule.maxAmount > 9999999 ? '∞' : `₹${rule.maxAmount.toLocaleString()}`}
                </span>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Approval Sequence</span>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                  {rule.levels.map((lvl) => (
                    <div key={lvl.levelNumber} className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
                      <div className="font-bold text-indigo-700">L{lvl.levelNumber}: {lvl.label}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" /> SLA: {lvl.slaHours} hours
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 border-t pt-4">
          <button onClick={onClose} className="px-5 py-2 border rounded-xl font-bold text-xs text-slate-600">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md"
          >
            <Save className="w-4 h-4" /> Save Approval Rules
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApprovalMatrixConfigModal;
