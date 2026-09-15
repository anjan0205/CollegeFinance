import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home, UserCheck, Lock, LifeBuoy } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const Forbidden403: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden text-center animate-fadeIn">
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl mx-auto w-full z-10 space-y-6">
        <div className="relative">
          <span className="text-8xl sm:text-9xl font-black text-slate-800 select-none tracking-tighter">
            403
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-tr from-rose-600 to-amber-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-rose-500/30">
              <Lock className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full">
            Access Restricted
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
            Access Denied / Forbidden
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            Your current institutional role (<span className="text-white font-semibold">{user?.role || 'DEPARTMENT_USER'}</span>) does not have authorization to view this administrative or financial module.
          </p>
        </div>

        {/* Diagnostic info box */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl text-left space-y-2 text-xs text-slate-400">
          <p className="font-bold text-slate-300">Why am I seeing this page?</p>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
            <li>The page requires higher administrative sanction (e.g. FINANCE, HOD, or ADMIN).</li>
            <li>Your session token may need re-authorization following role updates.</li>
            <li>Departmental cross-access is restricted by institutional privacy bylaws.</li>
          </ul>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs pt-2">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold border border-slate-700 flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
          <Link
            to="/support"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold border border-slate-700 flex items-center gap-1.5 transition"
          >
            <LifeBuoy className="w-4 h-4" />
            <span>Request Elevation</span>
          </Link>
          <Link
            to="/dashboard"
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-lg shadow-brand-500/20 transition"
          >
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
