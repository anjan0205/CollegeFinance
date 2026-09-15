import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, Database, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Offline: React.FC = () => {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleCheckConnection = () => {
    setIsChecking(true);
    setTimeout(() => {
      setIsChecking(false);
      if (navigator.onLine) {
        setIsOnline(true);
        navigate('/dashboard');
      } else {
        alert('Still offline. Please check your WiFi or ethernet connection.');
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden text-center animate-fadeIn">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl mx-auto w-full z-10 space-y-6">
        <div className="w-20 h-20 bg-gradient-to-tr from-slate-700 to-indigo-700 rounded-3xl flex items-center justify-center text-white shadow-xl mx-auto">
          {isOnline ? <Wifi className="w-10 h-10 text-emerald-400" /> : <WifiOff className="w-10 h-10 text-slate-300" />}
        </div>

        <div className="space-y-2">
          <span
            className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
              isOnline
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {isOnline ? 'Internet Restored' : 'No Internet Connection'}
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
            {isOnline ? 'You are back online!' : 'You are currently offline'}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            {isOnline
              ? 'Your network connection has been re-established. You can return to your active tasks.'
              : 'Please check your WiFi, mobile hotspot, or campus LAN cable. Offline data caching is active.'}
          </p>
        </div>

        {/* Offline Cache Info */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl text-left space-y-2 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-slate-300 font-bold">
            <Database className="w-4 h-4 text-brand-400" />
            <span>Local Offline Cache Safeguard:</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Any unsubmitted Purchase Requisition drafts or form edits in your current browser session are safely cached in localStorage and will sync once internet access resumes.
          </p>
        </div>

        {/* Action button */}
        <div className="pt-2 flex items-center justify-center gap-3 text-xs">
          {isOnline ? (
            <Link
              to="/dashboard"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition"
            >
              <span>Back to Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <button
              onClick={handleCheckConnection}
              disabled={isChecking}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20 transition"
            >
              {isChecking ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry Connection</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
