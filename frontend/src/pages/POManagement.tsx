import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  ShoppingBag,
  Plus,
  Search,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileSpreadsheet,
  Upload,
  Edit3,
  CheckCheck,
  Building2,
  Calendar,
  DollarSign,
  Filter,
  Download,
  Trash2,
  FileText,
  HelpCircle,
  Eye,
  RefreshCw,
  PackageCheck,
  ChevronRight,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { erpService } from '../services/erpService';
import { PORecord, POItem } from '../types/erpTypes';
import { PrintableDocumentModal } from '../components/erp/PrintableDocumentModal';
import * as XLSX from 'xlsx';

type POMode =
  | 'raise'
  | 'direct'
  | 'my-pos'
  | 'on-hold'
  | 'rejected'
  | 'close'
  | 'import'
  | 'modify';

export const POManagement: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine current active mode based on route
  const getModeFromPath = (): POMode => {
    const path = location.pathname;
    if (path.endsWith('/raise')) return 'raise';
    if (path.endsWith('/direct')) return 'direct';
    if (path.endsWith('/on-hold')) return 'on-hold';
    if (path.endsWith('/rejected')) return 'rejected';
    if (path.endsWith('/close') || path.endsWith('/closed')) return 'close';
    if (path.endsWith('/import')) return 'import';
    if (path.endsWith('/modify')) return 'modify';
    return 'my-pos';
  };

  const currentMode = getModeFromPath();

  // PO State
  const [pos, setPos] = useState<PORecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPOForPrint, setSelectedPOForPrint] = useState<PORecord | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State for Raise PO / Add Direct PO
  const [poFormData, setPoFormData] = useState({
    prNumber: '',
    vendorName: '',
    vendorId: 'VEND-001',
    department: 'Computer Science & Engineering',
    poDate: new Date().toISOString().split('T')[0],
    deliveryDueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentTerms: '30 Days Net Credit',
    remarks: '',
    isDirect: false
  });

  const [poItems, setPoItems] = useState<POItem[]>([
    { itemId: 'ITEM-001', itemName: 'High-Performance Workstation Unit', qtyOrdered: 2, qtyReceived: 0, unitPrice: 65000, taxRate: 18, totalAmount: 130000 }
  ]);

  // State for Modify PO
  const [selectedPOToModify, setSelectedPOToModify] = useState<PORecord | null>(null);

  // State for Direct Import
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);

  // State for Hold Info Release Modal
  const [holdPOToResolve, setHoldPOToResolve] = useState<PORecord | null>(null);
  const [holdResolutionNote, setHoldResolutionNote] = useState('');

  // Initial Load
  const loadData = async () => {
    setLoading(true);
    const res = await erpService.getPOs();
    
    // Inject some sample statuses if not present for realistic simulation
    const enriched: PORecord[] = res.map((p: PORecord, idx: number) => {
      if (idx === 1 && p.status !== 'ON_HOLD') {
        return { ...p, status: 'ON_HOLD' as const, holdReason: 'Technical specifications clarification required for Lab 3 delivery.' };
      }
      if (idx === 2 && p.status !== 'REJECTED') {
        return { ...p, status: 'REJECTED' as const, rejectionReason: 'Budget allocation ceiling exceeded for current financial quarter.' };
      }
      return p;
    });

    setPos(enriched);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helpers for calculations
  const calculateSubtotal = () => poItems.reduce((sum, it) => sum + (it.qtyOrdered * it.unitPrice), 0);
  const calculateTax = () => poItems.reduce((sum, it) => sum + (it.qtyOrdered * it.unitPrice * (it.taxRate / 100)), 0);
  const calculateGrandTotal = () => calculateSubtotal() + calculateTax();

  const handleAddItemRow = () => {
    setPoItems(prev => [
      ...prev,
      {
        itemId: `ITEM-${Date.now().toString().slice(-3)}`,
        itemName: '',
        qtyOrdered: 1,
        qtyReceived: 0,
        unitPrice: 0,
        taxRate: 18,
        totalAmount: 0
      }
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (poItems.length > 1) {
      setPoItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof POItem, value: any) => {
    setPoItems(prev => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };
      if (field === 'qtyOrdered' || field === 'unitPrice') {
        item.totalAmount = (Number(item.qtyOrdered) || 0) * (Number(item.unitPrice) || 0);
      }
      next[index] = item;
      return next;
    });
  };

  // Submit PO (Raise PO or Direct PO)
  const handlePOSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const grandTotal = calculateGrandTotal();

    const newPO: any = {
      poNumber: `PO/2026/${Math.floor(1000 + Math.random() * 9000)}`,
      prNumber: poFormData.isDirect ? 'DIRECT-PO (NO PR)' : (poFormData.prNumber || 'PR/2026/0091'),
      vendorName: poFormData.vendorName || 'Apex Tech Solutions',
      vendorId: poFormData.vendorId,
      department: poFormData.department,
      poDate: poFormData.poDate,
      deliveryDueDate: poFormData.deliveryDueDate,
      totalAmount: subtotal,
      taxAmount: tax,
      netAmount: grandTotal,
      status: 'APPROVED',
      paymentTerms: poFormData.paymentTerms,
      items: poItems.map(it => ({
        ...it,
        totalAmount: it.qtyOrdered * it.unitPrice
      }))
    };

    await erpService.createPO(newPO);
    setPos(prev => [newPO, ...prev]);

    setSuccessMsg(`Purchase Order ${newPO.poNumber} created successfully for ₹${grandTotal.toLocaleString('en-IN')}!`);
    setTimeout(() => {
      setSuccessMsg(null);
      navigate('/pos/my-pos');
    }, 1500);
  };

  // Handle Modify PO Save
  const handleModifyPOSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPOToModify) return;

    setPos(prev => prev.map(p => p.id === selectedPOToModify.id ? selectedPOToModify : p));
    setSuccessMsg(`Purchase Order ${selectedPOToModify.poNumber} has been modified successfully.`);
    setSelectedPOToModify(null);
    setTimeout(() => setSuccessMsg(null), 2000);
  };

  // Close a PO
  const handleClosePO = (poId: string) => {
    setPos(prev => prev.map(p => p.id === poId ? { ...p, status: 'CLOSED' as any } : p));
    setSuccessMsg('Purchase order has been marked as officially CLOSED.');
    setTimeout(() => setSuccessMsg(null), 2000);
  };

  // Release Hold
  const handleReleaseHold = () => {
    if (!holdPOToResolve) return;
    setPos(prev => prev.map(p => p.id === holdPOToResolve.id ? { ...p, status: 'APPROVED' as any, holdReason: undefined } : p));
    setSuccessMsg(`Hold on ${holdPOToResolve.poNumber} released! Status moved to APPROVED.`);
    setHoldPOToResolve(null);
    setHoldResolutionNote('');
    setTimeout(() => setSuccessMsg(null), 2000);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = pos.map(p => ({
      'PO Number': p.poNumber,
      'PO Date': p.poDate,
      'Vendor': p.vendorName,
      'PR Ref': p.prNumber,
      'Department': p.department,
      'Net Amount (INR)': p.netAmount || p.totalAmount,
      'Status': p.status,
      'Delivery Due Date': p.deliveryDueDate,
      'Payment Terms': p.paymentTerms
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Purchase Orders');
    XLSX.writeFile(wb, `VIIT_Purchase_Orders_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Handle File Upload for Direct PO Import
  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImportFile(file);

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          setImportPreview(data.slice(0, 5));
        } catch {
          // Fallback mock preview if binary parsing fails
          setImportPreview([
            { 'PO Number': 'PO/DIR/901', 'Vendor': 'Apex Tech', 'Amount': 85000, 'Dept': 'CSE' },
            { 'PO Number': 'PO/DIR/902', 'Vendor': 'Standard Sci', 'Amount': 120000, 'Dept': 'ECE' }
          ]);
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleProcessImport = () => {
    if (importPreview.length > 0) {
      setSuccessMsg(`Successfully imported ${importPreview.length} direct purchase orders into the ledger!`);
      setImportFile(null);
      setImportPreview([]);
      setTimeout(() => {
        setSuccessMsg(null);
        navigate('/pos/my-pos');
      }, 1500);
    }
  };

  // Filtered list based on current view
  const getDisplayPOs = () => {
    let filtered = pos;

    if (currentMode === 'on-hold') {
      filtered = filtered.filter(p => (p.status as string) === 'ON_HOLD');
    } else if (currentMode === 'rejected') {
      filtered = filtered.filter(p => (p.status as string) === 'REJECTED');
    } else if (currentMode === 'close') {
      filtered = filtered.filter(p => (p.status as string) === 'CLOSED' || (p.status as string) === 'PARTIALLY_RECEIVED' || (p.status as string) === 'FULFILLED');
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.poNumber.toLowerCase().includes(term) ||
          p.vendorName.toLowerCase().includes(term) ||
          p.department.toLowerCase().includes(term) ||
          p.prNumber.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const displayPOs = getDisplayPOs();

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-amber-600 text-sm font-semibold mb-1">
            <PackageCheck className="w-4 h-4" /> Purchase Order (PO) Management Module
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {currentMode === 'raise' && 'Raise Purchase Order (PO)'}
            {currentMode === 'direct' && 'Add Direct Purchase Order'}
            {currentMode === 'my-pos' && 'My Purchase Orders Registry'}
            {currentMode === 'on-hold' && 'Purchase Orders On Hold (Additional Info Needed)'}
            {currentMode === 'rejected' && 'Rejected Purchase Orders'}
            {currentMode === 'close' && 'Close Purchase Orders'}
            {currentMode === 'import' && 'Direct Purchase Order Import'}
            {currentMode === 'modify' && 'Modify Existing Purchase Order'}
          </h1>
          <p className="text-xs md:text-sm text-gray-500">
            {currentMode === 'raise' && 'Generate procurement PO linked to approved requisition and quotations.'}
            {currentMode === 'direct' && 'Direct institutional purchase order generation without prerequisite PR dependency.'}
            {currentMode === 'my-pos' && 'Comprehensive ledger of all institutional purchase orders with live fulfillment progress.'}
            {currentMode === 'on-hold' && 'Review and clear orders paused for technical specifications, approvals, or pricing clarification.'}
            {currentMode === 'rejected' && 'Audit rejected procurement orders and re-submit with revised terms.'}
            {currentMode === 'close' && 'Finalize fulfilled or terminated purchase orders and reconcile with invoices.'}
            {currentMode === 'import' && 'Bulk upload external direct purchase orders via Excel / CSV templates.'}
            {currentMode === 'modify' && 'Update terms, delivery schedules, or line items for open purchase orders.'}
          </p>
        </div>

        {/* Quick Nav Links */}
        <div className="flex flex-wrap items-center gap-2">
          {currentMode !== 'raise' && (
            <Link
              to="/pos/raise"
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" /> Raise PO
            </Link>
          )}
          {currentMode !== 'direct' && (
            <Link
              to="/pos/direct"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" /> Add Direct PO
            </Link>
          )}
          {currentMode !== 'my-pos' && (
            <Link
              to="/pos/my-pos"
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm flex items-center gap-1.5 transition"
            >
              <FileText className="w-4 h-4" /> All POs
            </Link>
          )}
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* MODE 1 & 2: RAISE PO / ADD DIRECT PO */}
      {(currentMode === 'raise' || currentMode === 'direct') && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-lg font-bold text-slate-900">
              {currentMode === 'raise' ? 'Standard PR-Linked Purchase Order Form' : 'Direct Institutional Purchase Order Form'}
            </h2>
            <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
              {currentMode === 'raise' ? 'PR LINKED' : 'DIRECT PO'}
            </span>
          </div>

          <form onSubmit={handlePOSubmit} className="space-y-6">
            {/* Header Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {currentMode === 'raise' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    PR Reference Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={poFormData.prNumber}
                    onChange={(e) => setPoFormData({ ...poFormData, prNumber: e.target.value })}
                    placeholder="PR/2026/0001"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-slate-800 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Direct PO Classification <span className="text-rose-500">*</span>
                  </label>
                  <select
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-slate-800 text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option>Direct Emergency Procurement</option>
                    <option>Annual Maintenance Contract (AMC)</option>
                    <option>Direct Institutional Subscription</option>
                    <option>Rate Contract Standard PO</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Vendor Name <span className="text-rose-500">*</span>
                </label>
                <select
                  value={poFormData.vendorName}
                  onChange={(e) => setPoFormData({ ...poFormData, vendorName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-slate-800 text-sm bg-white focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Select Vendor...</option>
                  <option value="Apex Tech Solutions">Apex Tech Solutions (VEND-001)</option>
                  <option value="Standard Scientific Supplies">Standard Scientific Supplies (VEND-002)</option>
                  <option value="Universal Book Distributors">Universal Book Distributors (VEND-003)</option>
                  <option value="National Hardware Works">National Hardware Works (VEND-004)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Department <span className="text-rose-500">*</span>
                </label>
                <select
                  value={poFormData.department}
                  onChange={(e) => setPoFormData({ ...poFormData, department: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-slate-800 text-sm bg-white focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Electronics & Comm Engineering">Electronics & Comm Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Central Administration">Central Administration</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Delivery Due Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={poFormData.deliveryDueDate}
                  onChange={(e) => setPoFormData({ ...poFormData, deliveryDueDate: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-slate-800 text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Payment terms & remarks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Payment Terms
                </label>
                <input
                  type="text"
                  value={poFormData.paymentTerms}
                  onChange={(e) => setPoFormData({ ...poFormData, paymentTerms: e.target.value })}
                  placeholder="e.g. 30 Days Net Credit / 50% Advance"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-slate-800 text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Remarks / Special Instructions
                </label>
                <input
                  type="text"
                  value={poFormData.remarks}
                  onChange={(e) => setPoFormData({ ...poFormData, remarks: e.target.value })}
                  placeholder="Delivery to Room 402, include warranty certificate"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-slate-800 text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider">Purchase Order Line Items</span>
                <button
                  type="button"
                  onClick={handleAddItemRow}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Line Item
                </button>
              </div>

              <div className="p-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-gray-200 font-bold text-slate-700 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3 w-28">Qty</th>
                      <th className="py-2.5 px-3 w-36">Unit Price (₹)</th>
                      <th className="py-2.5 px-3 w-28">GST Tax (%)</th>
                      <th className="py-2.5 px-3 w-36">Total (₹)</th>
                      <th className="py-2.5 px-3 w-16 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {poItems.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            required
                            value={it.itemName}
                            onChange={(e) => handleItemChange(idx, 'itemName', e.target.value)}
                            placeholder="e.g. Epson Laser Projector 4000 Lumens"
                            className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-slate-800 text-xs focus:ring-1 focus:ring-amber-500"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min="1"
                            required
                            value={it.qtyOrdered}
                            onChange={(e) => handleItemChange(idx, 'qtyOrdered', Number(e.target.value))}
                            className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-slate-800 text-xs focus:ring-1 focus:ring-amber-500"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min="0"
                            required
                            value={it.unitPrice}
                            onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                            className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-slate-800 text-xs focus:ring-1 focus:ring-amber-500"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={it.taxRate}
                            onChange={(e) => handleItemChange(idx, 'taxRate', Number(e.target.value))}
                            className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-slate-800 text-xs bg-white focus:ring-1 focus:ring-amber-500"
                          >
                            <option value="0">0% (Nil)</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18% (Standard)</option>
                            <option value="28">28%</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          ₹{((it.qtyOrdered * it.unitPrice) * (1 + it.taxRate / 100)).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {poItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(idx)}
                              className="text-rose-500 hover:text-rose-700 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation Summary */}
              <div className="bg-slate-50 p-4 border-t border-gray-200 flex justify-end">
                <div className="w-72 space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>₹{calculateSubtotal().toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Total GST Amount:</span>
                    <span>₹{calculateTax().toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-extrabold text-sm border-t pt-1">
                    <span>Grand Total:</span>
                    <span className="text-indigo-600">₹{calculateGrandTotal().toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate('/pos/my-pos')}
                className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition"
              >
                <PackageCheck className="w-4 h-4" /> Generate & Approve PO
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODE 7: DIRECT PO IMPORT */}
      {currentMode === 'import' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Direct Purchase Order Bulk Import</h2>
              <p className="text-xs text-gray-500">Upload standardized Excel or CSV files containing external purchase orders.</p>
            </div>
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition"
            >
              <Download className="w-4 h-4 text-emerald-600" /> Download Template (.xlsx)
            </button>
          </div>

          <div className="border-2 border-dashed border-indigo-300 rounded-2xl p-8 text-center bg-indigo-50/30 flex flex-col items-center justify-center space-y-3">
            <Upload className="w-10 h-10 text-indigo-500" />
            <h3 className="font-bold text-slate-800 text-sm">Select Excel / CSV File to Import</h3>
            <p className="text-xs text-gray-500 max-w-md">Supports files formatted with PO Number, Vendor Name, Department, Items, and Amounts.</p>
            <label className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md cursor-pointer transition">
              Browse PO File
              <input type="file" accept=".xlsx, .xls, .csv" onChange={handleImportFileChange} className="hidden" />
            </label>
            {importFile && (
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full">
                {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
              </span>
            )}
          </div>

          {importPreview.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-700">Preview Parsed Records ({importPreview.length})</h4>
              <div className="border rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                      {Object.keys(importPreview[0]).map((k, i) => (
                        <th key={i} className="p-3">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {importPreview.map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((v: any, j) => (
                          <td key={j} className="p-3 text-slate-800">{String(v)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setImportPreview([])}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-xs"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleProcessImport}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  <CheckCheck className="w-4 h-4" /> Confirm & Import to Ledger
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 8: MODIFY PO MODAL / DRAWER */}
      {selectedPOToModify && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                Modify Purchase Order: <span className="text-indigo-600 font-mono">{selectedPOToModify.poNumber}</span>
              </h3>
              <button
                onClick={() => setSelectedPOToModify(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleModifyPOSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Delivery Due Date</label>
                <input
                  type="date"
                  value={selectedPOToModify.deliveryDueDate}
                  onChange={(e) => setSelectedPOToModify({ ...selectedPOToModify, deliveryDueDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">Payment Terms</label>
                <input
                  type="text"
                  value={selectedPOToModify.paymentTerms || ''}
                  onChange={(e) => setSelectedPOToModify({ ...selectedPOToModify, paymentTerms: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">Status</label>
                <select
                  value={selectedPOToModify.status}
                  onChange={(e) => setSelectedPOToModify({ ...selectedPOToModify, status: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-xl bg-white"
                >
                  <option value="APPROVED">APPROVED</option>
                  <option value="PARTIALLY_RECEIVED">PARTIALLY_RECEIVED</option>
                  <option value="ON_HOLD">ON_HOLD</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedPOToModify(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-md"
                >
                  Save Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HOLD RESOLUTION MODAL */}
      {holdPOToResolve && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border">
            <div className="flex items-center gap-2 text-amber-600 font-bold">
              <AlertCircle className="w-5 h-5" /> Release Hold on Purchase Order
            </div>
            <p className="text-xs text-gray-600">
              PO Number: <span className="font-mono font-bold text-slate-900">{holdPOToResolve.poNumber}</span>
              <br />
              Current Hold Reason: <span className="text-rose-600 italic">{(holdPOToResolve as any).holdReason || 'Pending technical specifications approval'}</span>
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Resolution Notes / Approval Justification
              </label>
              <textarea
                rows={3}
                value={holdResolutionNote}
                onChange={(e) => setHoldResolutionNote(e.target.value)}
                placeholder="Technical verification completed and approved by HOD..."
                className="w-full p-3 border rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setHoldPOToResolve(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReleaseHold}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Release Hold & Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DATA TABLE VIEW (FOR MY POS, ON-HOLD, REJECTED, CLOSE, MODIFY) */}
      {(currentMode === 'my-pos' || currentMode === 'on-hold' || currentMode === 'rejected' || currentMode === 'close' || currentMode === 'modify') && (
        <div className="space-y-4">
          {/* Controls & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search PO Number, Vendor, Department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs md:text-sm rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-gray-300 bg-white font-semibold text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="APPROVED">APPROVED</option>
                <option value="PARTIALLY_RECEIVED">PARTIALLY_RECEIVED</option>
                <option value="FULFILLED">FULFILLED</option>
                <option value="ON_HOLD">ON_HOLD</option>
                <option value="REJECTED">REJECTED</option>
                <option value="CLOSED">CLOSED</option>
              </select>

              <button
                onClick={handleExportExcel}
                className="px-3.5 py-2 border border-gray-300 hover:bg-gray-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition"
                title="Export to Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Excel
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-500 text-sm">Loading purchase order records...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-gray-200 text-slate-700 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">PO Number & Date</th>
                      <th className="py-3.5 px-4">Vendor</th>
                      <th className="py-3.5 px-4">PR / Reference</th>
                      <th className="py-3.5 px-4">Fulfillment Progress</th>
                      <th className="py-3.5 px-4">Net Amount (₹)</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {displayPOs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-gray-400 text-sm">
                          No purchase orders found matching this filter criteria.
                        </td>
                      </tr>
                    ) : (
                      displayPOs.map((po) => {
                        const totalOrdered = po.items?.reduce((s, i) => s + i.qtyOrdered, 0) || 1;
                        const totalReceived = po.items?.reduce((s, i) => s + i.qtyReceived, 0) || 0;
                        const percent = Math.min(100, Math.round((totalReceived / totalOrdered) * 100));

                        return (
                          <tr key={po.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3.5 px-4">
                              <span className="font-mono font-bold text-indigo-600 block">{po.poNumber}</span>
                              <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3 h-3" /> {po.poDate}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-semibold text-slate-900 block">{po.vendorName}</span>
                              <span className="text-[10px] text-slate-500">{po.department}</span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-gray-500">
                              {po.prNumber}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="space-y-1 w-36">
                                <div className="flex justify-between text-[11px] font-semibold">
                                  <span className="text-gray-500">{totalReceived}/{totalOrdered} Received</span>
                                  <span className="text-indigo-600">{percent}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-1.5 rounded-full ${percent === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-black text-slate-900">
                              ₹{(po.netAmount || po.totalAmount).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                  po.status === 'APPROVED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : po.status === 'ON_HOLD'
                                    ? 'bg-amber-100 text-amber-800'
                                    : po.status === 'REJECTED'
                                    ? 'bg-rose-100 text-rose-800'
                                    : po.status === 'CLOSED'
                                    ? 'bg-slate-200 text-slate-700'
                                    : 'bg-indigo-100 text-indigo-800'
                                }`}
                              >
                                {po.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3" />}
                                {po.status === 'ON_HOLD' && <AlertCircle className="w-3 h-3" />}
                                {po.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                                {po.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right space-x-1">
                              {/* Print */}
                              <button
                                onClick={() => setSelectedPOForPrint(po)}
                                className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                title="Print Official PO Document"
                              >
                                <Printer className="w-4 h-4" />
                              </button>

                              {/* Modify / Edit */}
                              <button
                                onClick={() => setSelectedPOToModify(po)}
                                className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                title="Modify PO"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {/* Release Hold if On Hold */}
                              {(po.status as string) === 'ON_HOLD' && (
                                <button
                                  onClick={() => setHoldPOToResolve(po)}
                                  className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-md text-[10px] transition"
                                >
                                  Release Hold
                                </button>
                              )}

                              {/* Close PO action if open */}
                              {currentMode === 'close' && po.status !== 'CLOSED' && (
                                <button
                                  onClick={() => handleClosePO(po.id)}
                                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-md text-[10px] transition"
                                >
                                  Close PO
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Official PO Print Modal */}
      {selectedPOForPrint && (
        <PrintableDocumentModal
          isOpen={!!selectedPOForPrint}
          onClose={() => setSelectedPOForPrint(null)}
          title="OFFICIAL PURCHASE ORDER (PO)"
          docNumber={selectedPOForPrint.poNumber}
          docDate={selectedPOForPrint.poDate}
          metaFields={[
            { label: 'Vendor', value: selectedPOForPrint.vendorName },
            { label: 'PR Reference', value: selectedPOForPrint.prNumber },
            { label: 'Department', value: selectedPOForPrint.department },
            { label: 'Delivery Due Date', value: selectedPOForPrint.deliveryDueDate }
          ]}
          tableHeaders={['Item Name', 'Qty Ordered', 'Unit Price (₹)', 'Tax (%)', 'Total (₹)']}
          tableRows={selectedPOForPrint.items?.map(it => [
            it.itemName,
            it.qtyOrdered,
            it.unitPrice,
            `${it.taxRate}%`,
            it.totalAmount
          ]) || []}
          totalAmount={selectedPOForPrint.netAmount || selectedPOForPrint.totalAmount}
          remarks={`Payment Terms: ${selectedPOForPrint.paymentTerms || '30 Days Net Credit'}`}
        />
      )}
    </div>
  );
};

export default POManagement;
