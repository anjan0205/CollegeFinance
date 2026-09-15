import React from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { LEGAL_DOCUMENTS } from './LegalData';
import {
  Printer,
  Share2,
  Calendar,
  FileCheck,
  Shield,
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  Sliders
} from 'lucide-react';

interface LegalPolicyPageProps {
  slugOverride?: string;
}

export const LegalPolicyPage: React.FC<LegalPolicyPageProps> = ({ slugOverride }) => {
  const params = useParams<{ slug: string }>();
  const slug = slugOverride || params.slug || 'privacy';

  const doc = LEGAL_DOCUMENTS[slug];

  if (!doc) {
    return <Navigate to="/legal" replace />;
  }

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Document URL copied to clipboard!');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Policy Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
            <Shield className="w-3.5 h-3.5" />
            <span>{doc.category}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium flex items-center gap-1.5 transition"
              title="Share document link"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
            <button
              onClick={handlePrint}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium flex items-center gap-1.5 transition"
              title="Print policy"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">{doc.title}</h1>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-3xl">{doc.summary}</p>

        <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Last revised: {doc.lastUpdated}</span>
          <span>•</span>
          <span>VIIT Institutional Governance & Compliance</span>
        </div>
      </div>

      {/* Special banner for Cookie Policy with direct link to Cookie Preferences */}
      {slug === 'cookies' && (
        <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-amber-900 text-sm">Need to update your cookie consent?</p>
              <p className="text-amber-700 text-xs">You can configure cookie categories directly in your settings.</p>
            </div>
          </div>
          <Link
            to="/legal/cookie-preferences"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm transition whitespace-nowrap"
          >
            Manage Preferences
          </Link>
        </div>
      )}

      {/* Policy Sections */}
      <div className="space-y-6">
        {doc.sections.map((sec, idx) => (
          <section key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-600" />
              {sec.title}
            </h2>
            <div className="space-y-2 text-sm text-slate-600 leading-relaxed pl-4 border-l border-slate-100">
              {sec.content.map((p, pIdx) => (
                <p key={pIdx}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Policy footer signature */}
      <div className="p-5 bg-slate-900 text-slate-300 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs">
        <div>
          <p className="font-semibold text-white">Questions regarding this policy?</p>
          <p className="text-slate-400">Contact the Office of Legal & Administrative Affairs at legal@viit.ac.in</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/legal"
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All Policies
          </Link>
          <Link
            to="/support"
            className="px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium transition"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
};
