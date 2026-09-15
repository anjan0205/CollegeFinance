import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X, Sliders, ShieldCheck } from 'lucide-react';

export const CookieBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('viit_cookie_consent_timestamp');
    if (!consent) {
      // Show after slight delay
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(
      'viit_cookie_preferences',
      JSON.stringify({ necessary: true, functional: true, analytics: true, notifications: true })
    );
    localStorage.setItem('viit_cookie_consent_timestamp', new Date().toISOString());
    setIsVisible(false);
  };

  const handleRejectNonEssential = () => {
    localStorage.setItem(
      'viit_cookie_preferences',
      JSON.stringify({ necessary: true, functional: false, analytics: false, notifications: false })
    );
    localStorage.setItem('viit_cookie_consent_timestamp', new Date().toISOString());
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-fadeIn">
      <div className="bg-slate-900/95 backdrop-blur-xl text-white p-5 rounded-3xl border border-slate-700 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-500/20 text-brand-400 rounded-xl border border-brand-500/30">
              <Cookie className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-white">We Value Your Privacy & Data</h4>
              <p className="text-[11px] text-slate-400">VIIT Institutional Compliance</p>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          We use essential cookies to maintain secure sessions and role-based permissions. Optional cookies help improve portal speeds. Read our{' '}
          <Link to="/legal/cookies" className="text-brand-400 hover:underline font-semibold">
            Cookie Policy
          </Link>.
        </p>

        <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-xs">
          <Link
            to="/legal/cookie-preferences"
            onClick={() => setIsVisible(false)}
            className="text-slate-400 hover:text-white font-medium flex items-center gap-1"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Customize</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRejectNonEssential}
              className="px-3 py-1.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-[11px] font-semibold transition"
            >
              Essential Only
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-[11px] font-bold shadow-md shadow-brand-500/20 transition"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
