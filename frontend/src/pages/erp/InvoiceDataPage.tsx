import React, { useState, useEffect } from 'react';
import { Receipt, Plus, Search, ShieldCheck, CheckCircle2, AlertOctagon } from 'lucide-react';
import { erpService } from '../../services/erpService';
import { InvoiceRecord } from '../../types/erpTypes';
import { PrintableDocumentModal } from '../../components/erp/PrintableDocumentModal';

export const InvoiceDataPage: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<InvoiceRecord | null>(null);

  const loadData = async () => {
    setLoading(true);
    const res = await erpService.getInvoices();
    setInvoices(res);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredInvoices = invoices.filter(inv =>
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.vendorInvoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold mb-1">
            <Receipt className="w-4 h-4" /> 3-Way Match Invoice Audit
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Invoice Data Ledger</h1>
          <p className="text-sm text-gray-500">
            Verify vendor invoices against PO quantities and verified GRNs prior to payment release.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search Invoice No, Vendor, PO..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading invoice register...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-gray-200 text-slate-700 font-bold text-xs uppercase">
                <tr>
                  <th className="py-3.5 px-4">Invoice No & Date</th>
                  <th className="py-3.5 px-4">Vendor & Bill Ref</th>
                  <th className="py-3.5 px-4">PO / GRN Linked</th>
                  <th className="py-3.5 px-4">3-Way Audit Match</th>
                  <th className="py-3.5 px-4">Total Amount (₹)</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-indigo-600 block">{inv.invoiceNumber}</span>
                      <span className="text-xs text-gray-400">{inv.invoiceDate}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>{inv.vendorName}</div>
                      <span className="font-mono text-xs text-gray-500">Ref: {inv.vendorInvoiceNo}</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-gray-600">
                      <div>PO: {inv.poNumber}</div>
                      <div>GRN: {inv.grnNumber}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        inv.matched3Way ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {inv.matched3Way ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertOctagon className="w-3.5 h-3.5" />}
                        {inv.matched3Way ? '3-WAY MATCHED' : 'DISCREPANCY'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900">
                      ₹{inv.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
