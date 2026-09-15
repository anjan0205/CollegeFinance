import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        login(response.data.token, response.data.user);
        navigate('/dashboard');
      } else {
        setError(response.data.message || 'Login failed.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to connect to backend server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (targetEmail: string) => {
    setEmail(targetEmail);
    setPassword('admin123');
    setError(null);
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email: targetEmail, password: 'admin123' });
      if (response.data.success) {
        login(response.data.token, response.data.user);
        navigate('/dashboard');
      } else {
        setError(response.data.message || 'Login failed.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to connect to backend server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl p-2 bg-white flex items-center justify-center shadow-xl shadow-brand-500/20">
            <img src="/logo.png" alt="VIIT Logo" className="w-full h-full object-contain" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-black text-white tracking-tight">
          VIIT Finance
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400 font-bold">
          College Budget & ERP System — Vignan's Institute of Information Technology (A)
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-slate-900/80 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl border border-slate-800 sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit} autoComplete="off">
            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-hidden focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                  placeholder="name@vignan.ac.in"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-hidden focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to System</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Preset Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-800 space-y-3">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
              ⚡ Quick 1-Click Demo Logins
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin('admin@vignan.ac.in')}
                className="px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-brand-500 rounded-xl text-left transition-all group cursor-pointer disabled:opacity-50"
              >
                <div className="text-[10px] font-bold text-brand-400 uppercase tracking-wide">System Admin</div>
                <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-white">admin@vignan.ac.in</div>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin('finance@vignan.ac.in')}
                className="px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500 rounded-xl text-left transition-all group cursor-pointer disabled:opacity-50"
              >
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">Finance Officer</div>
                <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-white">finance@vignan.ac.in</div>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin('principal@viit.ac.in')}
                className="px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500 rounded-xl text-left transition-all group cursor-pointer disabled:opacity-50"
              >
                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide">Principal</div>
                <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-white">principal@viit.ac.in</div>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin('ceo@viit.ac.in')}
                className="px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-purple-500 rounded-xl text-left transition-all group cursor-pointer disabled:opacity-50"
              >
                <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">CEO / Chairman</div>
                <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-white">ceo@viit.ac.in</div>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin('hod.cse@vignan.ac.in')}
                className="px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 rounded-xl text-left transition-all group cursor-pointer disabled:opacity-50"
              >
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">HOD (CSE)</div>
                <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-white">hod.cse@vignan.ac.in</div>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin('user.cse@vignan.ac.in')}
                className="px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500 rounded-xl text-left transition-all group cursor-pointer disabled:opacity-50"
              >
                <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wide">Faculty User</div>
                <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-white">user.cse@vignan.ac.in</div>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-500 font-bold">
            Cloud Database & RESTful API Powered Enterprise ERP Platform
          </p>
        </div>
      </div>
    </div>
  );
};
