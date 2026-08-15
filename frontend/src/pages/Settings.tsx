import React from 'react';
import { Settings as SettingsIcon, Database, Shield, FileText, CheckCircle2 } from 'lucide-react';

export const Settings: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-slate-700" /> System Settings & Configuration
          </h1>
          <p className="text-xs text-slate-500 font-medium">Oracle Database Connection pooling status & business rule configurations</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-brand-600" /> Oracle Database Environment
          </h3>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Node.js Driver:</span>
              <span className="font-bold text-slate-800">oracledb v6.5.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Connection Mode:</span>
              <span className="font-bold text-emerald-700">Parameterized Pool (createPool)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Financial Cycle:</span>
              <span className="font-bold text-slate-800">FY 2026-27 Master Budget</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">PR Creation Scope:</span>
              <span className="font-bold text-amber-700">Disabled (Analytics & Tracking Only)</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-violet-600" /> Budget Utilization Threshold Rules
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-center font-semibold">
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
              Normal: &lt;70%
            </div>
            <div className="p-3 bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
              Warning: 70–85%
            </div>
            <div className="p-3 bg-orange-50 text-orange-800 rounded-lg border border-orange-200">
              Critical: 85–100%
            </div>
            <div className="p-3 bg-rose-50 text-rose-800 rounded-lg border border-rose-200">
              Exceeded: &gt;100%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
