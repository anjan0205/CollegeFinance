import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  Database,
  Shield,
  User,
  Sparkles,
  LifeBuoy,
  BookOpen,
  Scale,
  Compass,
  Sliders,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Lock,
  Wrench,
  WifiOff,
  Clock,
  ServerCrash,
  FileQuestion,
  Info
} from 'lucide-react';

// Sub-components / Views embedded in Settings
import { AccountSettings } from './lifecycle/AccountSettings';
import { Support } from './support/Support';
import { HelpCenter } from './support/HelpCenter';
import { LegalHub } from './legal/LegalHub';
import { CookiePreferences } from './legal/CookiePreferences';
import { UXStatesPlayground } from './ux/UXStatesPlayground';
import { LEGAL_DOCUMENTS } from './legal/LegalData';

export const Settings: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'system';
  const [selectedLegalDoc, setSelectedLegalDoc] = useState<string | null>(null);

  const tabs = [
    { id: 'system', name: 'System & Database', icon: Database, color: 'text-brand-500' },
    { id: 'account', name: 'Account & Security', icon: User, color: 'text-violet-500' },
    { id: 'support', name: 'Support Helpdesk', icon: LifeBuoy, color: 'text-rose-500' },
    { id: 'help', name: 'Help Center & FAQ', icon: BookOpen, color: 'text-indigo-500' },
    { id: 'legal', name: 'Legal & Policies', icon: Scale, color: 'text-emerald-500' },
    { id: 'cookies', name: 'Cookie Preferences', icon: Sliders, color: 'text-amber-600' },
    { id: 'ux-states', name: 'UX States & Demo Lab', icon: Compass, color: 'text-cyan-500' }
  ];

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId });
    setSelectedLegalDoc(null);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-1 border border-slate-200">
            <SettingsIcon className="w-3.5 h-3.5" />
            <span>Central Configuration & Institutional Hub</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings & Resources</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your account security, campus database connections, support requests, legal policies, and system diagnostics in one place.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full">
            ● All Systems Operational
          </span>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1.5 overflow-x-auto">
        {tabs.map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <IconComp className={`w-4 h-4 ${isActive ? 'text-white' : tab.color}`} />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: System & Database Configuration */}
      {activeTab === 'system' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Oracle & Firebase DB card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-brand-600" />
                <span>Enterprise Database Connection Environment</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Active connection pooling, cache synchronization, and real-time state listeners.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs font-mono">
                <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider font-sans">
                  Cloud Master Database
                </p>
                <div className="flex justify-between">
                  <span className="text-slate-500">Database Engine:</span>
                  <span className="font-bold text-slate-800">Firestore & Express REST Engine</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Connection Mode:</span>
                  <span className="font-bold text-emerald-700 font-sans font-bold">Synchronized Multi-Tenant Pool</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Active Financial Cycle:</span>
                  <span className="font-bold text-slate-800">FY 2026-27 Master</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">PR Creation Scope:</span>
                  <span className="font-bold text-emerald-700">Enabled (Multi-Tier Workflow)</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs font-mono">
                <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider font-sans">
                  Firebase Cloud Firestore & Storage
                </p>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cloud Project ID:</span>
                  <span className="font-bold text-slate-800">collegefinance-87409</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Storage Bucket:</span>
                  <span className="font-bold text-slate-800">Invoices & Quotations</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Security Rules:</span>
                  <span className="font-bold text-emerald-700">Audited & Role-Enforced</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sync Status:</span>
                  <span className="font-bold text-emerald-700">Live Real-time Snapshot</span>
                </div>
              </div>
            </div>
          </div>

          {/* Budget Utilization Threshold Rules */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-violet-600" />
                <span>Departmental Budget Utilization Threshold Rules</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated status tagging applied across department detail ledgers and dashboard visualizations.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-center font-semibold">
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200">
                <p className="font-bold text-sm">Normal</p>
                <p className="text-[11px] text-emerald-600 mt-1">&lt; 70% Allocated</p>
              </div>
              <div className="p-4 bg-amber-50 text-amber-800 rounded-2xl border border-amber-200">
                <p className="font-bold text-sm">Warning</p>
                <p className="text-[11px] text-amber-600 mt-1">70% – 85% Allocated</p>
              </div>
              <div className="p-4 bg-orange-50 text-orange-800 rounded-2xl border border-orange-200">
                <p className="font-bold text-sm">Critical</p>
                <p className="text-[11px] text-orange-600 mt-1">85% – 100% Allocated</p>
              </div>
              <div className="p-4 bg-rose-50 text-rose-800 rounded-2xl border border-rose-200">
                <p className="font-bold text-sm">Exceeded</p>
                <p className="text-[11px] text-rose-600 mt-1">&gt; 100% Allocated</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Account & Security */}
      {activeTab === 'account' && (
        <div className="animate-fadeIn">
          <AccountSettings />
        </div>
      )}

      {/* TAB 3: Support Desk */}
      {activeTab === 'support' && (
        <div className="animate-fadeIn">
          <Support />
        </div>
      )}

      {/* TAB 5: Help Center & FAQs */}
      {activeTab === 'help' && (
        <div className="animate-fadeIn">
          <HelpCenter />
        </div>
      )}

      {/* TAB 6: Legal & Compliance Policies */}
      {activeTab === 'legal' && (
        <div className="space-y-6 animate-fadeIn">
          {selectedLegalDoc ? (
            <div className="space-y-4">
              <button
                onClick={() => setSelectedLegalDoc(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
              >
                ← Back to Legal Policies List
              </button>
              {(() => {
                const doc = LEGAL_DOCUMENTS[selectedLegalDoc];
                if (!doc) return <p>Policy not found.</p>;
                return (
                  <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                    <div className="border-b border-slate-100 pb-4">
                      <span className="text-xs font-bold uppercase text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md">
                        {doc.category}
                      </span>
                      <h2 className="text-2xl font-bold text-slate-900 mt-2">{doc.title}</h2>
                      <p className="text-xs text-slate-500 mt-1">{doc.summary}</p>
                      <p className="text-[11px] text-slate-400 mt-2">Last revised: {doc.lastUpdated}</p>
                    </div>

                    <div className="space-y-4">
                      {doc.sections.map((sec, sIdx) => (
                        <div key={sIdx} className="space-y-2">
                          <h4 className="font-bold text-sm text-slate-900">{sec.title}</h4>
                          <div className="space-y-1 text-xs text-slate-600 pl-3 border-l-2 border-slate-200">
                            {sec.content.map((p, pIdx) => (
                              <p key={pIdx}>{p}</p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Institutional Compliance Policies</h3>
                  <p className="text-xs text-slate-500">Select any policy below to read full governing terms.</p>
                </div>
                <button
                  onClick={() => handleTabChange('cookies')}
                  className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Sliders className="w-3.5 h-3.5 text-amber-600" />
                  <span>Cookie Preferences</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.values(LEGAL_DOCUMENTS).map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedLegalDoc(doc.id)}
                    className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-brand-400 hover:shadow-md cursor-pointer transition flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                        {doc.category}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900">{doc.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2">{doc.summary}</p>
                    </div>
                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-brand-600">
                      <span>View Policy</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: Cookie Preferences */}
      {activeTab === 'cookies' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm animate-fadeIn">
          <CookiePreferences />
        </div>
      )}

      {/* TAB 8: UX States & Demo Lab */}
      {activeTab === 'ux-states' && (
        <div className="animate-fadeIn">
          <UXStatesPlayground />
        </div>
      )}
    </div>
  );
};
