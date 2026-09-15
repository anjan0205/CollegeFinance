import React from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import {
  Shield,
  FileCheck,
  Scale,
  Sliders,
  ArrowLeft,
  BookOpen,
  Lock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { LEGAL_DOCUMENTS } from '../pages/legal/LegalData';

export const LegalLayout: React.FC = () => {
  const docs = Object.values(LEGAL_DOCUMENTS);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-md group-hover:bg-brand-600 transition">
                V
              </div>
              <div>
                <h1 className="font-extrabold text-slate-900 text-sm tracking-tight leading-tight">VIIT Finance</h1>
                <p className="text-[11px] text-slate-500 font-bold">Legal & Governance</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Portal</span>
            </Link>
            <Link
              to="/help"
              className="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition"
            >
              Help Center
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Side Navigation for Legal Pages */}
          <aside className="lg:col-span-1 space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-24 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Policies & Terms</span>
                <Link to="/legal" className="text-xs text-brand-600 font-semibold hover:underline">
                  Overview
                </Link>
              </div>

              <div className="space-y-1 max-h-[calc(100vh-220px)] overflow-y-auto pr-1 text-xs">
                <NavLink
                  to="/legal"
                  end
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-xl transition ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 font-bold border border-brand-200'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  <div className="flex items-center gap-2">
                    <Scale className="w-3.5 h-3.5 text-brand-600" />
                    <span>All Legal Hub</span>
                  </div>
                </NavLink>

                <NavLink
                  to="/legal/cookie-preferences"
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-xl transition ${
                      isActive
                        ? 'bg-amber-50 text-amber-900 font-bold border border-amber-200'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  <div className="flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-amber-600" />
                    <span>Cookie Preferences</span>
                  </div>
                </NavLink>

                <div className="pt-2 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Individual Policies
                </div>

                {docs.map((doc) => (
                  <NavLink
                    key={doc.id}
                    to={`/legal/${doc.slug}`}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-xl transition ${
                        isActive
                          ? 'bg-brand-50 text-brand-700 font-bold border border-brand-200'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`
                    }
                  >
                    <span className="truncate">{doc.title}</span>
                    <ChevronRight className="w-3 h-3 text-slate-400 opacity-50" />
                  </NavLink>
                ))}
              </div>
            </div>
          </aside>

          {/* Legal Main Content View */}
          <main className="lg:col-span-3">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} VIIT College. All rights reserved. Registered Educational Institution.</p>
          <div className="flex items-center gap-4 text-slate-600 font-medium">
            <Link to="/legal/privacy" className="hover:text-brand-600">Privacy</Link>
            <Link to="/legal/terms" className="hover:text-brand-600">Terms</Link>
            <Link to="/legal/security" className="hover:text-brand-600">Security</Link>
            <Link to="/legal/accessibility" className="hover:text-brand-600">Accessibility</Link>
            <Link to="/support" className="hover:text-brand-600">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
