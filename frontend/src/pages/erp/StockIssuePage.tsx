import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Plus, Search, Printer, CheckCircle2 } from 'lucide-react';
import { erpService } from '../../services/erpService';
import { StockIssueRecord } from '../../types/erpTypes';
import { PrintableDocumentModal } from '../../components/erp/PrintableDocumentModal';

export const StockIssuePage: React.FC = () => {
  const [issues, setIssues] = useState<StockIssueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIssueForPrint, setSelectedIssueForPrint] = useState<StockIssueRecord | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<any>({
    department: 'Computer Science & Engineering',
    issuedTo: 'Dr. A. B. Patil',
    storeLocation: 'IT Infrastructure Store Room',
    purpose: 'Lab Setup Requirement',
    items: [{ itemId: 'ITEM-001', itemName: 'Epson High-Lumen Laser Projector', qtyIssued: 1 }]
  });

  const loadData = async () => {
    setLoading(true);
    const res = await erpService.getStockIssues();
    setIssues(res);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await erpService.createStockIssue(formData);
    setShowAddModal(false);
    loadData();
  };

  const filteredIssues = issues.filter(iss =>
    iss.issueNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    iss.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    iss.issuedTo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold mb-1">
            <ArrowUpRight className="w-4 h-4" /> Internal Stock Requisition & Issue
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Stock Issue Register</h1>
          <p className="text-sm text-gray-500">
            Process internal department stock issue requests and deduct inventory balance.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Issue Stock to Department
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search Issue No, Dept, Recipient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading stock issue vouchers...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-gray-200 text-slate-700 font-bold text-xs uppercase">
                <tr>
                  <th className="py-3.5 px-4">Issue Voucher No & Date</th>
                  <th className="py-3.5 px-4">Target Department</th>
                  <th className="py-3.5 px-4">Recipient / Issued To</th>
                  <th className="py-3.5 px-4">Issuing Store Location</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredIssues.map((iss) => (
                  <tr key={iss.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-indigo-600 block">{iss.issueNumber}</span>
                      <span className="text-xs text-gray-400">{iss.issueDate}</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {iss.department}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-gray-700">
                      {iss.issuedTo}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">
                      {iss.storeLocation}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {iss.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedIssueForPrint(iss)}
                        className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="Print Issue Voucher"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Print Modal */}
      {selectedIssueForPrint && (
        <PrintableDocumentModal
          isOpen={!!selectedIssueForPrint}
          onClose={() => setSelectedIssueForPrint(null)}
          title="INTERNAL STOCK ISSUE VOUCHER"
          docNumber={selectedIssueForPrint.issueNumber}
          docDate={selectedIssueForPrint.issueDate}
          metaFields={[
            { label: 'Department', value: selectedIssueForPrint.department },
            { label: 'Issued To', value: selectedIssueForPrint.issuedTo },
            { label: 'Issuing Store', value: selectedIssueForPrint.storeLocation },
            { label: 'Purpose', value: selectedIssueForPrint.purpose }
          ]}
          tableHeaders={['Item Description', 'Qty Issued']}
          tableRows={selectedIssueForPrint.items?.map(it => [
            it.itemName,
            it.qtyIssued
          ]) || []}
        />
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border">
            <h3 className="text-lg font-bold text-slate-900">Issue Stock Voucher</h3>
            <form onSubmit={handleAddSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block font-semibold mb-1">Target Department</label>
                <input
                  type="text"
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Issued To (Person Name)</label>
                <input
                  type="text"
                  required
                  value={formData.issuedTo}
                  onChange={(e) => setFormData({ ...formData, issuedTo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={formData.items[0].itemName}
                  onChange={(e) => {
                    const items = [...formData.items];
                    items[0].itemName = e.target.value;
                    setFormData({ ...formData, items });
                  }}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Quantity Issued</label>
                <input
                  type="number"
                  required
                  value={formData.items[0].qtyIssued}
                  onChange={(e) => {
                    const items = [...formData.items];
                    items[0].qtyIssued = Number(e.target.value);
                    setFormData({ ...formData, items });
                  }}
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
                  Issue Stock & Deduct Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
