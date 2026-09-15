import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Inbox,
  Search,
  Loader2,
  AlertOctagon,
  CheckCircle2,
  Lock,
  ServerCrash,
  FileQuestion,
  Wrench,
  WifiOff,
  Clock,
  ExternalLink,
  RotateCcw,
  Plus
} from 'lucide-react';

export const UXStatesPlayground: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'empty' | 'noResults' | 'loading' | 'error' | 'success' | 'allRoutes'>('empty');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorBanner, setShowErrorBanner] = useState(true);

  const systemRoutes = [
    { name: '404 - Not Found Page', path: '/404', desc: 'Broken URL fallback with intelligent destination links', icon: FileQuestion, color: 'text-brand-500' },
    { name: '403 - Forbidden Access', path: '/403', desc: 'Role privilege denial & administrative elevation workflow', icon: Lock, color: 'text-amber-500' },
    { name: '500 - Internal Server Error', path: '/500', desc: 'Unexpected system failure with unique Incident ID tracking', icon: ServerCrash, color: 'text-rose-500' },
    { name: 'Maintenance Mode', path: '/maintenance', desc: 'Scheduled upgrade mode with live countdown and upgrade scope', icon: Wrench, color: 'text-orange-500' },
    { name: 'Offline Network Screen', path: '/offline', desc: 'Real-time internet detector with local cached mode safeguard', icon: WifiOff, color: 'text-indigo-500' },
    { name: 'Session Expired', path: '/session-expired', desc: 'Inactivity auto-lock with inline password unlock modal', icon: Clock, color: 'text-purple-500' }
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-8 rounded-3xl text-white shadow-xl flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold border border-brand-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Production UX Audit & Design System</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">UX States & Error Pages Gallery</h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Standardized production UX states covering empty lists, failed queries, skeleton loaders, error toasts, and dedicated server status screens.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('empty')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'empty' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Empty State</span>
        </button>

        <button
          onClick={() => setActiveTab('noResults')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'noResults' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>No Search Results</span>
        </button>

        <button
          onClick={() => setActiveTab('loading')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'loading' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Loader2 className="w-4 h-4" />
          <span>Loading Skeletons</span>
        </button>

        <button
          onClick={() => setActiveTab('error')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'error' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          <span>Error States</span>
        </button>

        <button
          onClick={() => setActiveTab('success')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'success' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Success States</span>
        </button>

        <button
          onClick={() => setActiveTab('allRoutes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'allRoutes' ? 'bg-brand-600 text-white shadow-sm' : 'text-brand-600 hover:bg-brand-50'
          }`}
        >
          <ExternalLink className="w-4 h-4" />
          <span>Standalone System Screens (404, 403, 500...)</span>
        </button>
      </div>

      {/* TAB CONTENT: Empty State */}
      {activeTab === 'empty' && (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4 animate-fadeIn">
          <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto border border-slate-200">
            <Inbox className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">No Purchase Requisitions Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Your department has not raised any purchase requisitions for the current quarter yet.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/prs/all"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Requisition</span>
            </Link>
          </div>
        </div>
      )}

      {/* TAB CONTENT: No Search Results */}
      {activeTab === 'noResults' && (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4 animate-fadeIn">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto border border-amber-200">
            <Search className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">No Matching Records Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              We couldn't find any budget heads or invoices matching <span className="font-semibold text-slate-800">"Quantum Computing Lab 2024"</span>.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => alert('Search filters reset!')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Search Filters</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Loading Skeletons */}
      {activeTab === 'loading' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-brand-600 animate-spin" />
              <span>Loading Skeletons & Data Fetching Shimmers</span>
            </h3>
            <span className="text-[10px] font-bold uppercase bg-brand-50 text-brand-700 px-2 py-0.5 rounded">
              Simulated Loading State
            </span>
          </div>

          {/* Skeletons */}
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="h-24 bg-slate-100 rounded-2xl" />
              <div className="h-24 bg-slate-100 rounded-2xl" />
              <div className="h-24 bg-slate-100 rounded-2xl" />
            </div>
            <div className="h-40 bg-slate-100 rounded-2xl" />
            <div className="space-y-2">
              <div className="h-10 bg-slate-100 rounded-xl" />
              <div className="h-10 bg-slate-100 rounded-xl" />
              <div className="h-10 bg-slate-100 rounded-xl" />
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Error States */}
      {activeTab === 'error' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-fadeIn">
          <h3 className="font-bold text-slate-900 text-sm">Inline Error Banners & Toast States</h3>

          {/* Banner */}
          {showErrorBanner && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-4 text-rose-800 text-xs">
              <div className="flex items-center gap-3">
                <AlertOctagon className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <div>
                  <p className="font-bold">Budget Overrun Error on Head: LAB_EQUIPMENT</p>
                  <p className="text-[11px] text-rose-700">Requisition amount (₹3,50,000) exceeds available department balance (₹1,20,000).</p>
                </div>
              </div>
              <button
                onClick={() => setShowErrorBanner(false)}
                className="text-rose-500 hover:text-rose-800 font-bold text-sm"
              >
                ✕
              </button>
            </div>
          )}

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 text-xs">
            <AlertOctagon className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span>Warning: Quotation attachment file exceeds recommended 10MB upload limit.</span>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Success States */}
      {activeTab === 'success' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-fadeIn text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">Purchase Requisition #1094 Sanctioned</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Principal and Finance approvals recorded on the institutional blockchain audit ledger.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                setShowSuccessToast(true);
                setTimeout(() => setShowSuccessToast(false), 3000);
              }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition"
            >
              Trigger Floating Success Toast
            </button>
          </div>

          {showSuccessToast && (
            <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-bounce">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-bold">Action executed successfully!</span>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Standalone System Screens Links */}
      {activeTab === 'allRoutes' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-fadeIn">
          {systemRoutes.map((rt) => {
            const IconComponent = rt.icon;
            return (
              <Link
                key={rt.path}
                to={rt.path}
                className="group p-6 bg-white rounded-3xl border border-slate-200 hover:border-brand-400 hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 group-hover:bg-brand-50 rounded-2xl w-fit border border-slate-100 transition">
                    <IconComponent className={`w-6 h-6 ${rt.color}`} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-brand-600 transition">
                    {rt.name}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{rt.desc}</p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-brand-600">
                  <span>Open Screen</span>
                  <ExternalLink className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
