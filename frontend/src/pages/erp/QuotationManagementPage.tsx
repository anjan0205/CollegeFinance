import React, { useState, useEffect } from 'react';
import { FileText, Plus, Award, CheckCircle2, TrendingDown } from 'lucide-react';
import { erpService } from '../../services/erpService';
import { QuotationRecord } from '../../types/erpTypes';

export const QuotationManagementPage: React.FC = () => {
  const [quotations, setQuotations] = useState<QuotationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const loadData = async () => {
    setLoading(true);
    const res = await erpService.getQuotations();
    setQuotations(res);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectWinner = async (id: string) => {
    await erpService.selectWinningQuotation(id, 'Selected L1 vendor following price evaluation committee report.');
    loadData();
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await erpService.createQuotation(formData);
    setShowAddModal(false);
    setFormData({});
    loadData();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold mb-1">
            <FileText className="w-4 h-4" /> Vendor Bid Comparison Matrix
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Quotation Management</h1>
          <p className="text-sm text-gray-500">
            Compare vendor commercial quotes against Purchase Requisitions to award winning orders (L1 selection).
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Record Vendor Quotation
        </button>
      </div>

      {/* Quotations List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 p-12 text-center text-gray-500">Loading quotations...</div>
        ) : (
          quotations.map((quote) => (
            <div
              key={quote.id}
              className={`bg-white rounded-2xl p-6 border shadow-sm space-y-4 transition ${
                quote.status === 'SELECTED' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-gray-400 block">{quote.prNumber}</span>
                  <h3 className="text-lg font-extrabold text-slate-900">{quote.vendorName}</h3>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                    quote.status === 'SELECTED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {quote.status === 'SELECTED' && <Award className="w-3.5 h-3.5 text-emerald-600" />}
                  {quote.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-gray-500 block">Quote Ref No.</span>
                  <span className="font-mono font-bold text-slate-800">{quote.quoteNumber}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Valid Until</span>
                  <span className="font-semibold text-slate-800">{quote.validUntil}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase text-gray-400 block">Quoted Items</span>
                {quote.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs py-1 border-b border-gray-100">
                    <span className="text-gray-700">{item.itemName} (x{item.qty})</span>
                    <span className="font-semibold text-slate-900">₹{item.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div>
                  <span className="text-xs text-gray-400 block">Total Commercial Bid</span>
                  <span className="text-xl font-black text-slate-900">
                    ₹{quote.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                {quote.status !== 'SELECTED' && (
                  <button
                    onClick={() => handleSelectWinner(quote.id)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Award L1 Order
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border">
            <h3 className="text-lg font-bold text-slate-900">Record Vendor Quote</h3>
            <form onSubmit={handleAddSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block font-semibold mb-1">PR Number</label>
                <input
                  type="text"
                  required
                  placeholder="PR/2026/0001"
                  onChange={(e) => setFormData({ ...formData, prNumber: e.target.value, prId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Vendor Name</label>
                <input
                  type="text"
                  required
                  placeholder="Apex Tech Solutions"
                  onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Quote Reference Number</label>
                <input
                  type="text"
                  required
                  placeholder="APX-Q-991"
                  onChange={(e) => setFormData({ ...formData, quoteNumber: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Total Commercial Amount (₹)</label>
                <input
                  type="number"
                  required
                  onChange={(e) => setFormData({ ...formData, totalAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold"
                >
                  Save Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
