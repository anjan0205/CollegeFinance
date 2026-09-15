import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Clock, ShieldCheck, RefreshCw, Bell, AlertTriangle } from 'lucide-react';

export const Maintenance: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 2,
    minutes: 45,
    seconds: 18
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden text-center animate-fadeIn">
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl mx-auto w-full z-10 space-y-6">
        {/* Icon */}
        <div className="w-20 h-20 bg-gradient-to-tr from-amber-600 to-orange-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-amber-500/30 mx-auto">
          <Wrench className="w-10 h-10 animate-bounce" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
            Scheduled System Upgrade
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
            System Maintenance in Progress
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            The VIIT College Budget & Purchase Requisition portal is undergoing scheduled database indexing and security updates.
          </p>
        </div>

        {/* Live Countdown Clock */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Estimated Resumption In</span>
          </p>
          <div className="flex items-center justify-center gap-4 text-center">
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 w-20">
              <span className="text-2xl font-black text-amber-400 font-mono">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <p className="text-[9px] uppercase font-bold text-slate-500 mt-1">Hours</p>
            </div>
            <span className="text-2xl font-bold text-slate-600">:</span>
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 w-20">
              <span className="text-2xl font-black text-amber-400 font-mono">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <p className="text-[9px] uppercase font-bold text-slate-500 mt-1">Minutes</p>
            </div>
            <span className="text-2xl font-bold text-slate-600">:</span>
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 w-20">
              <span className="text-2xl font-black text-amber-400 font-mono">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <p className="text-[9px] uppercase font-bold text-slate-500 mt-1">Seconds</p>
            </div>
          </div>
        </div>

        {/* Maintenance Scope Details */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-3xl text-left space-y-2 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-slate-300 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Scope of Upgrade:</span>
          </div>
          <p className="text-[11px] text-slate-400">
            • Firestore security index optimizations for FY 2026-27 budget roll-overs.
            <br />
            • Enhanced GST tax calculation module for department invoice uploads.
            <br />
            • All pending requisitions and audit logs remain strictly safe and unimpacted.
          </p>
        </div>

        {/* Action button */}
        <div className="pt-2 flex items-center justify-center gap-3 text-xs">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Check If Live Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
