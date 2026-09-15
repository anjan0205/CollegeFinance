import React from 'react';
import { X, Printer, Download, CheckCircle, ShieldCheck } from 'lucide-react';

interface PrintableDocumentProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  docNumber: string;
  docDate: string;
  metaFields: { label: string; value: string | number }[];
  tableHeaders: string[];
  tableRows: (string | number)[][];
  totalLabel?: string;
  totalAmount?: number;
  remarks?: string;
  verifiedBy?: string;
}

export const PrintableDocumentModal: React.FC<PrintableDocumentProps> = ({
  isOpen,
  onClose,
  title,
  docNumber,
  docDate,
  metaFields,
  tableHeaders,
  tableRows,
  totalLabel = 'Total Amount',
  totalAmount,
  remarks,
  verifiedBy = 'ERP Master Verification Engine'
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Action Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-lg">{title} - Printable Preview</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 shadow-sm transition"
            >
              <Printer className="w-4 h-4" /> Print / Export PDF
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1.5 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Body (Printable Region) */}
        <div id="printable-document-content" className="p-8 overflow-y-auto space-y-6 text-gray-800">
          {/* Institutional Header */}
          <div className="border-b-2 border-slate-900 pb-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-indigo-700 text-white flex items-center justify-center font-extrabold text-sm">
                  VIIT
                </div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Vishwakarma Institute of Information Technology
                </h1>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Survey No. 2/3/4, Kondhwa (Bk), Pune - 411048 | Central Finance & ERP Section
              </p>
              <p className="text-xs text-indigo-700 font-semibold mt-1">
                OFFICIAL ERP SYSTEM GENERATED PROCUREMENT DOCUMENT
              </p>
            </div>
            <div className="text-right">
              <div className="inline-block bg-slate-100 text-slate-800 px-3 py-1.5 rounded-md font-mono text-sm font-bold border border-slate-300">
                {docNumber}
              </div>
              <p className="text-xs text-gray-500 mt-1 font-medium">Date: {docDate}</p>
            </div>
          </div>

          {/* Document Title Header */}
          <div className="text-center bg-slate-50 py-2.5 rounded-lg border border-slate-200">
            <h2 className="text-base font-extrabold tracking-wider text-slate-800 uppercase">
              {title}
            </h2>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50/80 p-4 rounded-xl border border-gray-200 text-sm">
            {metaFields.map((field, idx) => (
              <div key={idx}>
                <span className="text-xs font-semibold uppercase text-gray-500 block mb-0.5">{field.label}</span>
                <span className="font-semibold text-slate-900">{field.value}</span>
              </div>
            ))}
          </div>

          {/* Items Table */}
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-100 border-b border-gray-300 text-slate-700 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  {tableHeaders.map((header, idx) => (
                    <th key={idx} className="py-2.5 px-3 border-l border-gray-200">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tableRows.map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="py-2.5 px-3 text-center text-xs font-mono text-gray-500">{rIdx + 1}</td>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="py-2.5 px-3 border-l border-gray-200 text-gray-800">
                        {typeof cell === 'number' && cell > 1000 ? `₹${cell.toLocaleString('en-IN')}` : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary & Remarks */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 pt-2">
            <div className="w-full md:w-2/3 text-xs text-gray-600 bg-amber-50/50 p-3.5 rounded-lg border border-amber-200">
              <span className="font-bold text-amber-900 block mb-1">Remarks & Authorization Notes:</span>
              <p>{remarks || 'Verified and recorded in master ledger. Digitally authorized via ERP portal.'}</p>
            </div>
            {totalAmount !== undefined && (
              <div className="w-full md:w-1/3 bg-slate-900 text-white p-4 rounded-xl text-right">
                <span className="text-xs uppercase text-slate-400 font-semibold block">{totalLabel}</span>
                <span className="text-2xl font-black text-emerald-400">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>

          {/* Signatures */}
          <div className="pt-12 grid grid-cols-3 gap-6 text-center text-xs font-semibold text-gray-600">
            <div className="border-t border-gray-300 pt-2">
              Prepared By / Requester
            </div>
            <div className="border-t border-gray-300 pt-2">
              HOD / Store Manager Signature
            </div>
            <div className="border-t border-slate-800 pt-2 text-slate-900 font-bold">
              Finance Controller / Principal
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
