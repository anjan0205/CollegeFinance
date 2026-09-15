import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LifeBuoy,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Clock,
  FileText,
  Building,
  Upload
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const Support: React.FC = () => {
  const { user } = useAuth();
  const [ticketSubject, setTicketSubject] = useState('');
  const [category, setCategory] = useState('PR_DISCREPANCY');
  const [priority, setPriority] = useState('NORMAL');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);

  const existingTickets = [
    { id: 'TKT-2026-104', subject: 'Lab Consumables Budget Head Allocation Query', status: 'IN_PROGRESS', date: '2 hours ago', dept: 'CSE' },
    { id: 'TKT-2026-089', subject: 'Vendor GST Verification failure on PO #409', status: 'RESOLVED', date: 'Yesterday', dept: 'ECE' },
    { id: 'TKT-2026-061', subject: 'Requesting HOD Multi-Signature Re-delegation', status: 'RESOLVED', date: 'Mar 02, 2026', dept: 'MECH' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !message.trim()) {
      alert('Please fill in both subject and description.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const newId = `TKT-2026-${Math.floor(100 + Math.random() * 900)}`;
      setSubmittedTicket(newId);
      setTicketSubject('');
      setMessage('');
    }, 1200);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold border border-brand-500/30">
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>VIIT IT & Accounts Helpdesk</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Institutional Support Portal</h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Submit priority service requests, report budget head discrepancies, or request administrative procurement assistance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/help"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-md transition"
          >
            Browse Help Center & FAQs
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ticket Submission Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Submit a New Support Ticket</h2>
              <p className="text-xs text-slate-500 mt-0.5">Tickets are routed directly to the College IT & Finance Desk.</p>
            </div>

            {submittedTicket ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3 animate-fadeIn">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Ticket #{submittedTicket} Created!</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  An assigned technician will review your request within 2 to 4 business hours. Confirmation sent to {user?.email || 'your email'}.
                </p>
                <button
                  onClick={() => setSubmittedTicket(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
                >
                  Create Another Ticket
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    >
                      <option value="PR_DISCREPANCY">Purchase Requisition Issue</option>
                      <option value="BUDGET_HEAD">Budget Head Allocation Query</option>
                      <option value="INVOICE_UPLOAD">Invoice & GST Verification</option>
                      <option value="RBAC_PERMISSIONS">User Permissions & HOD Delegation</option>
                      <option value="BUG_REPORT">Portal Bug / Performance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    >
                      <option value="LOW">Low (General Inquiries)</option>
                      <option value="NORMAL">Normal (Standard Operations)</option>
                      <option value="HIGH">High (Urgent Sanctions)</option>
                      <option value="CRITICAL">Critical (Procurement Deadlines)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Budget overrun error when approving PR #1042"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Detailed Description</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide specific details, Department code, PR IDs, or error messages..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-brand-500/20 flex items-center gap-2 transition"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Ticket</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Recent Tickets List */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Your Recent Tickets</h3>
            <div className="space-y-3">
              {existingTickets.map((t) => (
                <div key={t.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900">{t.id}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          t.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium mt-1">{t.subject}</p>
                  </div>
                  <span className="text-[11px] text-slate-400">{t.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Emergency Contacts & Help sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Phone className="w-4 h-4 text-brand-600" />
              <span>Campus Emergency Helplines</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-800">Finance & Accounts Section</p>
                <p className="text-slate-500 text-[11px]">Ext: 4091 / 4092</p>
                <p className="text-brand-600 font-mono mt-1">+91 (020) 2420-2100</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-800">Central IT & Server Room</p>
                <p className="text-slate-500 text-[11px]">Ext: 8810</p>
                <p className="text-brand-600 font-mono mt-1">it.support@viit.ac.in</p>
              </div>
            </div>
          </div>

          <div className="bg-brand-50 p-6 rounded-3xl border border-brand-200 space-y-3 text-xs">
            <h4 className="font-bold text-brand-900 text-sm">Need User Guides?</h4>
            <p className="text-brand-700 leading-relaxed">
              Step-by-step documentation on creating Purchase Requisitions, uploading Excel master budgets, and managing approval chains.
            </p>
            <Link
              to="/help"
              className="inline-block px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold transition shadow-sm"
            >
              Open Help Center →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
