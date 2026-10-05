import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Search, CheckCircle2 } from 'lucide-react';
import { erpService, getERPErrorMessage } from '../../services/erpService';
import { PaymentRecord } from '../../types/erpTypes';

export const InvoicePaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<any>({
    invoiceNumber: 'INV/2026/0014',
    vendorName: 'Apex Tech Solutions',
    paymentMode: 'NEFT',
    referenceNumber: `NEFT-AXIS-${Math.floor(10000 + Math.random() * 90000)}`,
    amountPaid: 100000
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      setPayments(await erpService.getPayments());
    } catch (err) {
      setError(getERPErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await erpService.createPayment(formData);
      setShowAddModal(false);
      await loadData();
    } catch (err) {
      setError(getERPErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPayments = payments.filter(pay =>
    pay.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pay.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pay.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold mb-1">
            <CreditCard className="w-4 h-4" /> Treasury Payment Disbursement
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Invoice Payments Ledger</h1>
          <p className="text-sm text-gray-500">
            Record bank transfers, NEFT/RTGS transaction IDs, and vendor payment releases.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Record Vendor Disbursement
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search Payment No, Ref, Vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</div>}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading payment disbursements...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-gray-200 text-slate-700 font-bold text-xs uppercase">
                <tr>
                  <th className="py-3.5 px-4">Payment Voucher No</th>
                  <th className="py-3.5 px-4">Vendor</th>
                  <th className="py-3.5 px-4">Invoice Linked</th>
                  <th className="py-3.5 px-4">Payment Mode & Ref No.</th>
                  <th className="py-3.5 px-4">Amount Released (₹)</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-indigo-600 block">{pay.paymentNumber}</span>
                      <span className="text-xs text-gray-400">{pay.paymentDate}</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {pay.vendorName}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-gray-600">
                      {pay.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="font-bold text-slate-800 block">{pay.paymentMode}</span>
                      <span className="font-mono text-gray-500">{pay.referenceNumber}</span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-emerald-600 text-base">
                      ₹{pay.amountPaid.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3.5 h-3.5" /> PROCESSED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border">
            <h3 className="text-lg font-bold text-slate-900">Disburse Vendor Payment</h3>
            <form onSubmit={handleAddSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block font-semibold mb-1">Invoice Number</label>
                <input
                  type="text"
                  required
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Vendor Name</label>
                <input
                  type="text"
                  required
                  value={formData.vendorName}
                  onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Bank Reference / UTR Number</label>
                <input
                  type="text"
                  required
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Amount Paid (₹)</label>
                <input
                  type="number"
                  required
                  value={formData.amountPaid}
                  onChange={(e) => setFormData({ ...formData, amountPaid: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setError(null); }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 text-white rounded-xl font-bold"
                >
                  {isSubmitting ? 'Releasing Payment…' : 'Confirm Payment Release'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
