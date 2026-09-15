import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  BookOpen,
  HelpCircle,
  FileSpreadsheet,
  FileText,
  PieChart,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  MessageCircle,
  LifeBuoy
} from 'lucide-react';

interface FAQItem {
  q: string;
  a: string;
  category: string;
}

export const HelpCenter: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      category: 'BUDGETS',
      q: 'How are departmental budget allocations created and approved?',
      a: 'The Principal or Finance Administrator creates the Master Budget at the beginning of the fiscal year. Departments are allocated specific funds across designated Budget Heads (e.g. Lab Equipment, Software Licenses, Consumables). Allocations cannot be exceeded without an administrative revision.'
    },
    {
      category: 'PRS',
      q: 'What is the multi-tier approval workflow for a Purchase Requisition?',
      a: 'A faculty member initiates a PR with quotation items. The requisition routes to the Head of Department (HOD) for initial review. Once endorsed, it moves to the Finance Officer for budget fund lock, and finally to the Principal for final financial sanction.'
    },
    {
      category: 'PRS',
      q: 'Can a rejected Purchase Requisition be amended and re-submitted?',
      a: 'Yes. Requisitioners can view the rejection remarks provided by the reviewer in the PR Details modal, update quotation attachments or reduce line-item quantities, and re-trigger the approval chain.'
    },
    {
      category: 'INVOICES',
      q: 'How do we link vendor invoices and GST receipts to an approved PR?',
      a: 'Navigate to the Invoices tab, click "Create Invoice", select the sanctioned PR number, and upload the scanned vendor tax invoice. The system cross-references the PO amount and calculates tax credits automatically.'
    },
    {
      category: 'DATA_IMPORT',
      q: 'How do we bulk import historical budget data from Excel (.xlsx)?',
      a: 'Administrators can use the "Data Import" module. Download the standardized Excel template, paste historical ledgers or department budgets, and upload. The system validates all columns before importing to Firestore.'
    },
    {
      category: 'ACCOUNT',
      q: 'How do I reset my account password or enable Two-Factor Authentication (2FA)?',
      a: 'Visit Account Settings from the top right user menu. You can update your password under the "Security & 2FA" tab or enable authenticator-based OTP verification for high-value actions.'
    }
  ];

  const categories = [
    { id: 'ALL', name: 'All Topics' },
    { id: 'BUDGETS', name: 'Master Budget & Allocations' },
    { id: 'PRS', name: 'Purchase Requisitions (PR)' },
    { id: 'INVOICES', name: 'Invoices & GST' },
    { id: 'DATA_IMPORT', name: 'Excel Data Import' },
    { id: 'ACCOUNT', name: 'Security & Accounts' }
  ];

  const filteredFaqs = faqs.filter((f) => {
    const matchesSearch =
      f.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.a.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCat === 'ALL' || f.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fadeIn">
      {/* Hero Search Section */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-8 sm:p-12 rounded-3xl text-white shadow-xl text-center space-y-4 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold border border-brand-500/30">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Knowledge Base & User Manuals</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">How can we help you today?</h1>
        <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto">
          Search answers on budgeting rules, PR approval steps, vendor invoice reconciliations, and college procurement policies.
        </p>

        {/* Search Bar */}
        <div className="pt-2 max-w-lg mx-auto relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Search FAQs, workflows, error codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white/20 transition"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCat(c.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedCat === c.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Quick Guide Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3 hover:border-brand-300 transition">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl w-fit">
            <PieChart className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Budget Management Guide</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Understand how departmental allocation caps, contingency reserves, and fiscal year rollover functions work.
          </p>
          <Link to="/budget/master" className="text-xs font-semibold text-brand-600 hover:underline inline-block pt-1">
            Open Master Budget →
          </Link>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3 hover:border-brand-300 transition">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-fit">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">PR Lifecycle & Quotations</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Best practices for comparing minimum 3 vendor quotations and securing expedited approvals.
          </p>
          <Link to="/prs/all" className="text-xs font-semibold text-indigo-600 hover:underline inline-block pt-1">
            Manage Requisitions →
          </Link>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3 hover:border-brand-300 transition">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Compliance & Audit Rules</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Institutional governance bylaws, NAAC audit requirements, and digital signature records.
          </p>
          <Link to="/legal" className="text-xs font-semibold text-emerald-600 hover:underline inline-block pt-1">
            View Compliance Hub →
          </Link>
        </div>
      </div>

      {/* Interactive FAQ Accordion */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-2">Frequently Asked Questions</h2>

        {filteredFaqs.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No matching questions found for "{searchTerm}". Try a different search term or browse categories.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-all ${
                    isOpen ? 'border-brand-300 bg-brand-50/20 shadow-sm' : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs font-bold text-slate-900"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-brand-600 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-brand-100/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Still need help CTA */}
      <div className="p-6 bg-slate-900 text-white rounded-3xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-bold text-base">Still need assistance?</h3>
          <p className="text-xs text-slate-400">Our IT & Accounts helpdesk team is available Monday to Saturday, 9 AM – 6 PM.</p>
        </div>
        <Link
          to="/support"
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-md transition"
        >
          Submit Support Ticket
        </Link>
      </div>
    </div>
  );
};
