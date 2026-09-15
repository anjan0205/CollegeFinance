import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Lock, ArrowRight, ShieldCheck, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const SessionExpired: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter your password to unlock.');
      return;
    }

    setIsUnlocking(true);
    setError(null);

    setTimeout(() => {
      setIsUnlocking(false);
      navigate('/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden text-center animate-fadeIn">
      <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md mx-auto w-full z-10 space-y-6">
        <div className="w-16 h-16 bg-gradient-to-tr from-brand-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand-500/20 mx-auto">
          <Clock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
            Security Inactivity Timeout
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            Your Session Has Expired
          </h1>
          <p className="text-slate-400 text-xs leading-relaxed max-w-sm mx-auto">
            For institutional financial security, your session locked after 30 minutes of inactivity.
          </p>
        </div>

        {/* Quick Re-Unlock Modal Box */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-4 text-left">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-brand-600 text-white font-bold flex items-center justify-center text-sm uppercase">
              {user?.name ? user.name.substring(0, 2) : 'US'}
            </div>
            <div>
              <p className="font-bold text-xs text-white">{user?.name || 'Authorized Faculty / User'}</p>
              <p className="text-[11px] text-slate-400">{user?.email || 'user@viit.ac.in'}</p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Enter Password to Resume</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isUnlocking}
              className="w-full py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-brand-500/20 transition flex items-center justify-center gap-2"
            >
              {isUnlocking ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Unlock Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center">
            <Link
              to="/login"
              className="text-xs text-slate-400 hover:text-slate-200 font-medium inline-flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log in with different account</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
