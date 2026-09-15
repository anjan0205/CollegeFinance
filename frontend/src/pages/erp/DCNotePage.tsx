import React, { useState, useEffect } from 'react';
import { FileDiff, Plus, Search, CheckCircle2 } from 'lucide-react';
import { erpService } from '../../services/erpService';
import { DCNoteRecord } from '../../types/erpTypes';

export const DCNotePage: React.FC = () => {
  const [notes, setNotes] = useState<DCNoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<any>({
    type: 'DEBIT_NOTE',
    referenceDocType: 'GRN',
    referenceDocNumber: 'GRN/2026/0018',
    vendorName: 'Apex Tech Solutions',
    reason: 'Shortage / Damage adjustment',
    amount: 2500
  });

  const loadData = async () => {
    setLoading(true);
    const res = await erpService.getDCNotes();
    setNotes(res);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await erpService.createDCNote(formData);
    setShowAddModal(false);
    loadData();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold mb-1">
            <FileDiff className="w-4 h-4" /> Financial Adjustments & Reconciliations
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Debit / Credit Note Register</h1>
          <p className="text-sm text-gray-500">
            Issue Debit and Credit Notes for goods damaged in transit, item shortages, or rate adjustments.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Issue D/C Note
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading notes ledger...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-gray-200 text-slate-700 font-bold text-xs uppercase">
                <tr>
                  <th className="py-3.5 px-4">Note Number & Date</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Vendor</th>
                  <th className="py-3.5 px-4">Reference Doc</th>
                  <th className="py-3.5 px-4">Reason / Adjustment Cause</th>
                  <th className="py-3.5 px-4">Adjustment Value (₹)</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {notes.map((note) => (
                  <tr key={note.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-indigo-600 block">{note.noteNumber}</span>
                      <span className="text-xs text-gray-400">{note.noteDate}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        note.type === 'DEBIT_NOTE' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {note.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {note.vendorName}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-gray-600">
                      {note.referenceDocType}: {note.referenceDocNumber}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-700 max-w-xs truncate">
                      {note.reason}
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900">
                      ₹{note.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3.5 h-3.5" /> APPROVED
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
            <h3 className="text-lg font-bold text-slate-900">Issue Debit / Credit Note</h3>
            <form onSubmit={handleAddSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block font-semibold mb-1">Note Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                >
                  <option value="DEBIT_NOTE">DEBIT NOTE (Vendor Owes Us)</option>
                  <option value="CREDIT_NOTE">CREDIT NOTE (We Owe Vendor)</option>
                </select>
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
                <label className="block font-semibold mb-1">Adjustment Reason</label>
                <textarea
                  rows={2}
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Adjustment Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
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
                  Issue Adjustment Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
