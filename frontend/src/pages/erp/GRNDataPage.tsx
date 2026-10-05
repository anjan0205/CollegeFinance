import React, { useState, useEffect } from 'react';
import { PackageCheck, Plus, Search, Printer, CheckCircle2, ShieldAlert } from 'lucide-react';
import { erpService, getERPErrorMessage } from '../../services/erpService';
import { GRNRecord } from '../../types/erpTypes';
import { PrintableDocumentModal } from '../../components/erp/PrintableDocumentModal';

export const GRNDataPage: React.FC = () => {
  const [grns, setGrns] = useState<GRNRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGRNForPrint, setSelectedGRNForPrint] = useState<GRNRecord | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<any>({
    poNumber: 'PO/2026/0042',
    vendorName: 'Apex Tech Solutions',
    storeName: 'IT Infrastructure Store Room',
    receivedBy: 'P. Verma',
    inspectionStatus: 'PASSED',
    items: [{ itemId: 'I-201', itemName: 'High-End Workstation Computer (i9, 64GB RAM)', qtyReceived: 2, qtyAccepted: 2, qtyRejected: 0 }]
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      setGrns(await erpService.getGRNs());
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
      await erpService.createGRN(formData);
      setShowAddModal(false);
      await loadData();
    } catch (err) {
      setError(getERPErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredGRNs = grns.filter(grn =>
    grn.grnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    grn.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    grn.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold mb-1">
            <PackageCheck className="w-4 h-4" /> Goods Receipt Note Register
          </div>
          <h1 className="text-2xl font-bold text-slate-900">GRN Data & Physical Verification</h1>
          <p className="text-sm text-gray-500">
            Record material arrivals, perform physical & quality inspections, and auto-post stock into inventory.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Record New GRN Entry
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search GRN, PO, Vendor..."
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
          <div className="p-12 text-center text-gray-500">Loading GRN records...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-gray-200 text-slate-700 font-bold text-xs uppercase">
                <tr>
                  <th className="py-3.5 px-4">GRN Number & Date</th>
                  <th className="py-3.5 px-4">PO Reference & Vendor</th>
                  <th className="py-3.5 px-4">Target Store / Warehouse</th>
                  <th className="py-3.5 px-4">Inspection Result</th>
                  <th className="py-3.5 px-4">Inventory Posting</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredGRNs.map((grn) => (
                  <tr key={grn.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-indigo-600 block">{grn.grnNumber}</span>
                      <span className="text-xs text-gray-400">{grn.receivedDate}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 block text-xs">{grn.vendorName}</span>
                      <span className="font-mono text-xs text-gray-500">{grn.poNumber}</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-gray-700">
                      {grn.storeName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        grn.inspectionStatus === 'PASSED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {grn.inspectionStatus === 'PASSED' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                        {grn.inspectionStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900 text-emerald-400">
                        AUTO-POSTED
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedGRNForPrint(grn)}
                        className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="Print GRN Document"
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
      {selectedGRNForPrint && (
        <PrintableDocumentModal
          isOpen={!!selectedGRNForPrint}
          onClose={() => setSelectedGRNForPrint(null)}
          title="GOODS RECEIPT NOTE (GRN)"
          docNumber={selectedGRNForPrint.grnNumber}
          docDate={selectedGRNForPrint.receivedDate}
          metaFields={[
            { label: 'PO Reference', value: selectedGRNForPrint.poNumber },
            { label: 'Vendor', value: selectedGRNForPrint.vendorName },
            { label: 'Store Warehouse', value: selectedGRNForPrint.storeName },
            { label: 'Received By', value: selectedGRNForPrint.receivedBy }
          ]}
          tableHeaders={['Item Description', 'Qty Received', 'Qty Accepted', 'Qty Rejected', 'Inspection Remarks']}
          tableRows={selectedGRNForPrint.items?.map(it => [
            it.itemName,
            it.qtyReceived,
            it.qtyAccepted,
            it.qtyRejected,
            it.remarks || 'Accepted in good order'
          ]) || []}
          remarks={selectedGRNForPrint.remarks}
        />
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border">
            <h3 className="text-lg font-bold text-slate-900">Record New Goods Receipt Note</h3>
            <form onSubmit={handleAddSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block font-semibold mb-1">PO Reference Number</label>
                <input
                  type="text"
                  required
                  value={formData.poNumber}
                  onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
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
                <label className="block font-semibold mb-1">Delivery Challan / Bill No.</label>
                <input
                  type="text"
                  placeholder="CH-APX-998"
                  onChange={(e) => setFormData({ ...formData, challanNumber: e.target.value })}
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
                  {isSubmitting ? 'Posting GRN…' : 'Submit & Post to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
