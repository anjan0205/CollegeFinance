import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, CheckCircle2, RotateCcw, Save, Sliders, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CookieCategory {
  id: string;
  name: string;
  required: boolean;
  enabled: boolean;
  description: string;
  cookiesUsed: string[];
}

export const CookiePreferences: React.FC = () => {
  const [categories, setCategories] = useState<CookieCategory[]>([
    {
      id: 'necessary',
      name: 'Strictly Necessary Cookies',
      required: true,
      enabled: true,
      description: 'Essential for you to log in, navigate between pages, enforce security rules, and submit purchase requisitions safely.',
      cookiesUsed: ['session_token', 'csrf_token', 'firebase_auth_state', 'user_role']
    },
    {
      id: 'functional',
      name: 'Functional & UI Preferences',
      required: false,
      enabled: true,
      description: 'Allows the system to remember your department view filters, grid layout densities, and dark/light UI preferences.',
      cookiesUsed: ['ui_density', 'dept_filter_pref', 'sidebar_collapsed', 'fiscal_year_active']
    },
    {
      id: 'analytics',
      name: 'Performance & Analytics',
      required: false,
      enabled: true,
      description: 'Helps our IT operations team understand query latencies, API failure rates, and high-traffic reporting peaks.',
      cookiesUsed: ['perf_metric_trace', 'client_latency_ms', 'dashboard_session_id']
    },
    {
      id: 'notifications',
      name: 'Notification & Activity Sync',
      required: false,
      enabled: false,
      description: 'Enables background sync for real-time purchase requisition approvals, budget threshold toasts, and live audit alerts.',
      cookiesUsed: ['push_sync_channel', 'alert_dismiss_cache']
    }
  ]);

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('viit_cookie_preferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCategories((prev) =>
          prev.map((cat) => ({
            ...cat,
            enabled: cat.required ? true : parsed[cat.id] ?? cat.enabled
          }))
        );
      } catch {
        // use defaults
      }
    }
  }, []);

  const handleToggle = (id: string) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id && !cat.required ? { ...cat, enabled: !cat.enabled } : cat))
    );
    setSavedSuccess(false);
  };

  const handleAcceptAll = () => {
    const updated = categories.map((c) => ({ ...c, enabled: true }));
    setCategories(updated);
    saveToStorage(updated);
  };

  const handleRejectNonEssential = () => {
    const updated = categories.map((c) => ({ ...c, enabled: c.required }));
    setCategories(updated);
    saveToStorage(updated);
  };

  const handleSaveCustom = () => {
    saveToStorage(categories);
  };

  const saveToStorage = (cats: CookieCategory[]) => {
    const prefObj: Record<string, boolean> = {};
    cats.forEach((c) => {
      prefObj[c.id] = c.enabled;
    });
    localStorage.setItem('viit_cookie_preferences', JSON.stringify(prefObj));
    localStorage.setItem('viit_cookie_consent_timestamp', new Date().toISOString());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cookie Preferences & Consent</h1>
            <p className="text-sm text-slate-500">Manage how cookies and localized tracking tokens operate on your device.</p>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-medium">Your cookie preferences have been updated and saved successfully.</p>
        </div>
      )}

      {/* Intro info box */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm flex gap-3 items-start">
        <Info className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-slate-900 mb-1">Transparency in Institutional Data Handling</p>
          <p className="text-slate-600 text-xs leading-relaxed">
            VIIT College uses essential cookies to ensure safe login authorization, CSRF protection, and responsive budgeting workflows. You have full autonomy to enable or disable non-essential cookies below. For a comprehensive overview, view our{' '}
            <Link to="/legal/cookies" className="text-brand-600 hover:underline font-semibold">
              Cookie Policy
            </Link>.
          </p>
        </div>
      </div>

      {/* Cookie categories list */}
      <div className="space-y-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className={`p-5 rounded-2xl border transition-all ${
              cat.enabled
                ? 'border-brand-200 bg-white shadow-sm'
                : 'border-slate-200 bg-slate-50/70 opacity-90'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">{cat.name}</h3>
                  {cat.required ? (
                    <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 tracking-wider">
                      Always Active
                    </span>
                  ) : (
                    <span
                      className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full tracking-wider ${
                        cat.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {cat.enabled ? 'Active' : 'Disabled'}
                    </span>
                  )}
                </div>
                <p className="text-slate-600 text-xs leading-relaxed max-w-2xl">{cat.description}</p>
                <div className="pt-2 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-medium text-slate-400">Tokens:</span>
                  {cat.cookiesUsed.map((ck) => (
                    <code key={ck} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono border border-slate-200">
                      {ck}
                    </code>
                  ))}
                </div>
              </div>

              {/* Toggle switch */}
              <div className="flex items-center pt-1">
                <button
                  type="button"
                  disabled={cat.required}
                  onClick={() => handleToggle(cat.id)}
                  aria-label={`Toggle ${cat.name}`}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    cat.required
                      ? 'bg-brand-600 cursor-not-allowed opacity-80'
                      : cat.enabled
                      ? 'bg-brand-600 cursor-pointer'
                      : 'bg-slate-300 cursor-pointer'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      cat.enabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions footer */}
      <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200">
        <button
          onClick={handleRejectNonEssential}
          className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-2 transition"
        >
          <RotateCcw className="w-4 h-4" />
          Reject Non-Essential
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAcceptAll}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow transition"
          >
            Accept All Cookies
          </button>
          <button
            onClick={handleSaveCustom}
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-md shadow-brand-500/20 flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" />
            Save My Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
