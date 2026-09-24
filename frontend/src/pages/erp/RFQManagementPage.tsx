import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  Plus,
  Search,
  Building2,
  Clock,
  DollarSign,
  Award,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Send,
  Star
} from 'lucide-react';

interface QuoteItem {
  id: string;
  vendorId: string;
  vendorName: string;
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  totalAmount: number;
  deliveryDays: number;
  submittedAt: string;
  isSelected?: boolean;
  justificationForNonLowest?: string;
}

interface RFQItem {
  id: string;
  rfqNumber: string;
  prId: string;
  prNumber: string;
  departmentId: string;
  departmentName: string;
  title: string;
  vendorIds: string[];
  dueDate: string;
  status: 'OPEN' | 'CLOSED' | 'AWARDED' | 'CANCELLED';
  createdAt: string;
  quotes: QuoteItem[];
  selectedQuoteId?: string;
}

export const RFQManagementPage: React.FC = () => {
  const [rfqs, setRfqs] = useState<RFQItem[]>([
    {
      id: 'rfq-2026-001',
      rfqNumber: 'RFQ-2026-0001',
      prId: 'pr-2026-0042',
      prNumber: 'PR-2026-0042',
      departmentId: 'dept-cse',
      departmentName: 'Computer Science & Engineering',
      title: 'High Performance AI Computing Lab Workstations',
      vendorIds: ['v-tech-01', 'v-dell-02', 'v-hp-03'],
      dueDate: '2026-10-15',
      status: 'OPEN',
      createdAt: '2026-09-20T10:00:00Z',
      quotes: [
        {
          id: 'quote-001',
          vendorId: 'v-tech-01',
          vendorName: 'Apex Tech Solutions',
          lineItems: [
            { description: 'GPU Workstations Core i9 / RTX 4090', quantity: 5, unitPrice: 185000, totalPrice: 925000 }
          ],
          totalAmount: 925000,
          deliveryDays: 7,
          submittedAt: '2026-09-21T14:30:00Z'
        },
        {
          id: 'quote-002',
          vendorId: 'v-dell-02',
          vendorName: 'Dell Enterprise Systems',
          lineItems: [
            { description: 'GPU Workstations Core i9 / RTX 4090', quantity: 5, unitPrice: 192000, totalPrice: 960000 }
          ],
          totalAmount: 960000,
          deliveryDays: 4,
          submittedAt: '2026-09-21T16:00:00Z'
        },
        {
          id: 'quote-003',
          vendorId: 'v-hp-03',
          vendorName: 'HP Commercial Division',
          lineItems: [
            { description: 'GPU Workstations Core i9 / RTX 4090', quantity: 5, unitPrice: 189000, totalPrice: 945000 }
          ],
          totalAmount: 945000,
          deliveryDays: 10,
          submittedAt: '2026-09-22T09:15:00Z'
        }
      ]
    }
  ]);

  const [selectedRfq, setSelectedRfq] = useState<RFQItem | null>(rfqs[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [justification, setJustification] = useState('');
  const [selectedQuoteForAward, setSelectedQuoteForAward] = useState<QuoteItem | null>(null);
  const [showNewRfqModal, setShowNewRfqModal] = useState(false);
  const [awardSuccessMessage, setAwardSuccessMessage] = useState('');

  const [newRfqForm, setNewRfqForm] = useState({
    prNumber: '',
    title: '',
    departmentName: 'Computer Science & Engineering',
    dueDate: '',
    vendors: ''
  });

  const handleCreateRFQ = (e: React.FormEvent) => {
    e.preventDefault();
    const created: RFQItem = {
      id: `rfq-${Date.now()}`,
      rfqNumber: `RFQ-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      prId: `pr-${Date.now()}`,
      prNumber: newRfqForm.prNumber || 'PR-2026-NEW',
      departmentId: 'dept-gen',
      departmentName: newRfqForm.departmentName,
      title: newRfqForm.title || 'Procurement Request',
      vendorIds: newRfqForm.vendors.split(',').map((v) => v.trim()),
      dueDate: newRfqForm.dueDate || '2026-10-30',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      quotes: []
    };

    setRfqs([created, ...rfqs]);
    setSelectedRfq(created);
    setShowNewRfqModal(false);
    setNewRfqForm({ prNumber: '', title: '', departmentName: 'Computer Science & Engineering', dueDate: '', vendors: '' });
  };

  const lowestQuoteAmount = selectedRfq?.quotes.length
    ? Math.min(...selectedRfq.quotes.map((q) => q.totalAmount))
    : 0;

  const fastestDeliveryDays = selectedRfq?.quotes.length
    ? Math.min(...selectedRfq.quotes.map((q) => q.deliveryDays))
    : 0;

  const handleAwardPO = (quote: QuoteItem) => {
    if (!selectedRfq) return;

    if (quote.totalAmount > lowestQuoteAmount && !justification.trim()) {
      alert('A comment justification is mandatory when selecting a quote that is not the lowest cost option.');
      return;
    }

    const updatedRfqs = rfqs.map((r) => {
      if (r.id === selectedRfq.id) {
        const updatedQuotes = r.quotes.map((q) => ({
          ...q,
          isSelected: q.id === quote.id,
          justificationForNonLowest: q.id === quote.id ? justification : undefined
        }));
        return {
          ...r,
          status: 'AWARDED' as const,
          selectedQuoteId: quote.id,
          quotes: updatedQuotes
        };
      }
      return r;
    });

    setRfqs(updatedRfqs);
    setSelectedRfq(updatedRfqs.find((r) => r.id === selectedRfq.id) || null);
    setSelectedQuoteForAward(null);
    setJustification('');
    setAwardSuccessMessage(`Purchase Order successfully generated and awarded to ${quote.vendorName}!`);
    setTimeout(() => setAwardSuccessMessage(''), 5000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-7 h-7 text-indigo-600" />
              RFQ & Quote Comparison Matrix
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Procurement Officer RFQ Broadcast, Multi-Vendor Bidding & Side-by-Side Evaluation Engine
            </p>
          </div>
          <button
            onClick={() => setShowNewRfqModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-indigo-200 transition-all text-sm"
          >
            <Plus className="w-4 h-4" /> Create RFQ Broadcast
          </button>
        </div>

        {awardSuccessMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-4 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium text-sm">{awardSuccessMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* RFQ List Column */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search RFQ or PR number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-3">
              {rfqs
                .filter(
                  (r) =>
                    r.rfqNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    r.prNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    r.title.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((rfq) => (
                  <div
                    key={rfq.id}
                    onClick={() => setSelectedRfq(rfq)}
                    className={`p-4 rounded-xl cursor-pointer border transition-all ${
                      selectedRfq?.id === rfq.id
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                        {rfq.rfqNumber}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          rfq.status === 'AWARDED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {rfq.status}
                      </span>
                    </div>

                    <h4 className="font-semibold text-slate-800 text-sm mt-2 line-clamp-1">{rfq.title}</h4>

                    <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
                      <span>Linked: {rfq.prNumber}</span>
                      <span>Quotes: {rfq.quotes.length}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Detailed Quote Comparison View */}
          <div className="lg:col-span-2 space-y-6">
            {selectedRfq ? (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-slate-900">{selectedRfq.rfqNumber}</h2>
                      <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-medium">
                        Linked PR: {selectedRfq.prNumber}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-700 mt-1">{selectedRfq.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{selectedRfq.departmentName}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Deadline for Quotes</span>
                    <span className="text-sm font-semibold text-slate-700">{selectedRfq.dueDate}</span>
                  </div>
                </div>

                {/* Quotes Comparison Side-by-Side Cards */}
                <div>
                  <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-600" /> Vendor Quotes Comparison Matrix
                  </h3>

                  {selectedRfq.quotes.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed text-slate-500 text-sm">
                      No vendor quotes submitted yet for this RFQ.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {selectedRfq.quotes.map((quote) => {
                        const isLowest = quote.totalAmount === lowestQuoteAmount;
                        const isFastest = quote.deliveryDays === fastestDeliveryDays;

                        return (
                          <div
                            key={quote.id}
                            className={`p-5 rounded-2xl border flex flex-col justify-between relative transition-all ${
                              quote.isSelected
                                ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20 shadow-md'
                                : isLowest
                                ? 'border-indigo-400 bg-indigo-50/20'
                                : 'border-slate-200 bg-slate-50/50 hover:bg-white'
                            }`}
                          >
                            <div className="space-y-3">
                              {quote.isSelected && (
                                <span className="bg-emerald-600 text-white text-[10px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-full inline-block">
                                  Awarded Winner
                                </span>
                              )}

                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-slate-900 text-sm">{quote.vendorName}</h4>
                                <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
                                  <Star className="w-3.5 h-3.5 fill-amber-400" /> 4.8
                                </div>
                              </div>

                              <div className="text-2xl font-black text-slate-900">
                                ₹{quote.totalAmount.toLocaleString('en-IN')}
                              </div>

                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {isLowest && (
                                  <span className="text-[11px] font-bold bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full">
                                    ★ Lowest Price
                                  </span>
                                )}
                                {isFastest && (
                                  <span className="text-[11px] font-bold bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full">
                                    ⚡ Fastest ({quote.deliveryDays} days)
                                  </span>
                                )}
                              </div>

                              <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-200">
                                <div className="flex justify-between">
                                  <span>Delivery:</span>
                                  <span className="font-semibold text-slate-800">{quote.deliveryDays} Days</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Submitted:</span>
                                  <span>{new Date(quote.submittedAt).toLocaleDateString()}</span>
                                </div>
                              </div>

                              {quote.justificationForNonLowest && (
                                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 mt-2">
                                  <span className="font-bold block">Selection Justification:</span>
                                  {quote.justificationForNonLowest}
                                </div>
                              )}
                            </div>

                            {selectedRfq.status !== 'AWARDED' && (
                              <button
                                onClick={() => setSelectedQuoteForAward(quote)}
                                className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1"
                              >
                                Select & Award PO <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Justification & Award Confirmation Dialog */}
                {selectedQuoteForAward && (
                  <div className="p-5 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm">
                        Confirm Awarding PO to {selectedQuoteForAward.vendorName}
                      </h4>
                      <button
                        onClick={() => setSelectedQuoteForAward(null)}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                      >
                        Cancel
                      </button>
                    </div>

                    {selectedQuoteForAward.totalAmount > lowestQuoteAmount && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                          <AlertTriangle className="w-4 h-4 text-amber-600" /> Non-Lowest Cost Selection
                          Justification (Mandatory)
                        </div>
                        <textarea
                          value={justification}
                          onChange={(e) => setJustification(e.target.value)}
                          placeholder="State technical, warranty, delivery time, or reliability rationale for selecting this quote over the lowest price option..."
                          className="w-full p-3 border border-amber-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 bg-white"
                          rows={3}
                        />
                      </div>
                    )}

                    <button
                      onClick={() => handleAwardPO(selectedQuoteForAward)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" /> Confirm & Issue Purchase Order (PO)
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
                Select an RFQ from the list to view quote comparison matrix.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New RFQ Broadcast Modal */}
      {showNewRfqModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Send className="w-5 h-5 text-indigo-600" /> Create RFQ Vendor Broadcast
            </h3>

            <form onSubmit={handleCreateRFQ} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Linked PR Number</label>
                <input
                  type="text"
                  required
                  value={newRfqForm.prNumber}
                  onChange={(e) => setNewRfqForm({ ...newRfqForm, prNumber: e.target.value })}
                  placeholder="e.g. PR-2026-0042"
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Requirement Title</label>
                <input
                  type="text"
                  required
                  value={newRfqForm.title}
                  onChange={(e) => setNewRfqForm({ ...newRfqForm, title: e.target.value })}
                  placeholder="e.g. Campus Wi-Fi 6 Routers Procurement"
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Bidding Due Date</label>
                <input
                  type="date"
                  required
                  value={newRfqForm.dueDate}
                  onChange={(e) => setNewRfqForm({ ...newRfqForm, dueDate: e.target.value })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Invited Vendors (Comma Separated)</label>
                <input
                  type="text"
                  required
                  value={newRfqForm.vendors}
                  onChange={(e) => setNewRfqForm({ ...newRfqForm, vendors: e.target.value })}
                  placeholder="Apex Tech, Dell Systems, HP Commercial"
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewRfqModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
                >
                  Broadcast RFQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RFQManagementPage;
