import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LEGAL_DOCUMENTS } from './LegalData';
import {
  Shield,
  FileCheck,
  Search,
  ArrowRight,
  Sliders,
  Scale,
  Lock,
  Building,
  Calendar,
  ExternalLink
} from 'lucide-react';

export const LegalHub: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const docs = Object.values(LEGAL_DOCUMENTS);

  const categories = ['ALL', ...Array.from(new Set(docs.map((d) => d.category)))];

  const filteredDocs = docs.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || d.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold border border-brand-500/30">
            <Scale className="w-3.5 h-3.5" />
            <span>Institutional Governance & Compliance Hub</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Legal & Compliance Policies</h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Transparent institutional policies, financial procurement terms, data privacy standards, and digital accessibility compliance for VIIT College.
          </p>

          <div className="pt-2 flex items-center gap-3">
            <Link
              to="/legal/cookie-preferences"
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 transition"
            >
              <Sliders className="w-4 h-4" />
              Manage Cookie Preferences
            </Link>
            <Link
              to="/legal/privacy"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search policies or terms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat === 'ALL' ? 'All Policies' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Policies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDocs.map((doc) => (
          <Link
            key={doc.id}
            to={`/legal/${doc.slug}`}
            className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md">
                  {doc.category}
                </span>
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {doc.lastUpdated}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition">
                {doc.title}
              </h3>

              <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{doc.summary}</p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-brand-600">
              <span>Read Document</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}

        {/* Dedicated Cookie Preferences Card */}
        <Link
          to="/legal/cookie-preferences"
          className="group bg-amber-50/50 p-6 rounded-2xl border border-amber-200 hover:border-amber-400 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-1 rounded-md">
                Interactive Tool
              </span>
              <Sliders className="w-4 h-4 text-amber-600" />
            </div>

            <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-700 transition">
              Cookie Preferences & Consent
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              Interactively adjust functional cookies, analytics tokens, and notification telemetry according to your privacy choices.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-amber-200/60 flex items-center justify-between text-xs font-semibold text-amber-700">
            <span>Configure Consent</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
};
