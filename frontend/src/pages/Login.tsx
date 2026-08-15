import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Building2, ShieldCheck, Lock, Mail, ArrowRight, UserCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@vignan.ac.in');
  const [password, setPassword] = useState('Admin@123');
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

  const handleQuickRole = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('Admin@123');
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
        <h2 className="mt-4 text-center text-2xl font-extrabold text-white tracking-tight">
          College Budget & PR System
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400 font-medium">
          Vignan's Institute of Information Technology (A)
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-slate-900/80 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl border border-slate-800 sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
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

          {/* Admin User Quick Select */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <p className="text-xs font-medium text-slate-400 mb-3 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-brand-400" /> Authorized Admin Login:
            </p>
            <div>
              <button
                type="button"
                onClick={() => handleQuickRole('admin@vignan.ac.in')}
                className="w-full px-3 py-2.5 rounded-lg bg-brand-950/60 hover:bg-brand-900/60 text-brand-200 border border-brand-500/30 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-white text-xs">System Administrator</div>
                  <div className="text-[10px] text-slate-400">admin@vignan.ac.in (Full Admin Access)</div>
                </div>
                <span className="text-[11px] font-bold text-brand-400 bg-brand-500/20 px-2 py-0.5 rounded border border-brand-500/30">Auto Fill</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-500">
            Oracle Database & Restful API Powered Enterprise ERP Platform
          </p>
        </div>
      </div>
    </div>
  );
};
