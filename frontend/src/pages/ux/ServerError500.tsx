import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ServerCrash, RefreshCw, Home, LifeBuoy, Copy, Check, Terminal } from 'lucide-react';

export const ServerError500: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const incidentId = 'INC-500-VIIT-' + Math.random().toString(36).substring(2, 9).toUpperCase();

  const handleCopy = () => {
    navigator.clipboard.writeText(incidentId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden text-center animate-fadeIn">
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl mx-auto w-full z-10 space-y-6">
        <div className="relative">
          <span className="text-8xl sm:text-9xl font-black text-slate-800 select-none tracking-tighter">
            500
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-tr from-rose-600 to-red-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-rose-500/30">
              <ServerCrash className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full">
            Internal Server Error
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
            Something went wrong on our end
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            Our telemetry systems have captured this event. Our backend engineering team has been automatically alerted.
          </p>
        </div>

        {/* Incident Box */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl text-left space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <Terminal className="w-4 h-4 text-brand-400" />
              <span>Incident Reference ID:</span>
            </div>
            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition flex items-center gap-1 text-[11px]"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p className="font-mono font-bold text-sm text-brand-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
            {incidentId}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs pt-2">
          <button
            onClick={handleReload}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-lg shadow-brand-500/20 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload Page</span>
          </button>
          <Link
            to="/support"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold border border-slate-700 flex items-center gap-1.5 transition"
          >
            <LifeBuoy className="w-4 h-4" />
            <span>Report to Helpdesk</span>
          </Link>
          <Link
            to="/dashboard"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold border border-slate-700 flex items-center gap-1.5 transition"
          >
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
