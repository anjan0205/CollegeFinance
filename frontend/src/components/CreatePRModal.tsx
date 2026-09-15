import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatINR } from '../utils/formatters';
import { 
  X, Plus, Trash2, FilePlus, Building, Tag, User, Calendar, CheckCircle2, 
  AlertCircle, Wallet, FileText, ChevronDown, ChevronUp, Clock, UploadCloud, 
  Paperclip, FileUp, Eye, Download, FileSpreadsheet, FileImage
} from 'lucide-react';

interface CreatePRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultDepartmentId?: number;
}

interface ItemRow {
  productName: string;
  productDescription: string;
  quantity: number | string;
  unitPrice: number | string;
  preferredVendor: string;
}

interface AttachedDoc {
  id: string;
  file?: File;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  remarks?: string;
}

export const PRINCIPAL_USERS = [
  { name: 'Dr. V. Rama Rao', email: 'principal@viit.ac.in', designation: 'Principal (VIIT)' },
  { name: 'Dr. B. Arundhati', email: 'principal.academics@viit.ac.in', designation: 'Principal (Academics)' },
  { name: 'Dr. P. Sekhar', email: 'principal.admin@viit.ac.in', designation: 'Principal (Admin)' },
  { name: 'Dr. K. Madhusudhan', email: 'principal.rnd@viit.ac.in', designation: 'Dean & Principal (R&D)' }
];

export const CEO_USERS = [
  { name: 'Sri L. Rathaiah', email: 'ceo@viit.ac.in', designation: 'CEO & Chairman (Vignan Group)' },
  { name: 'Sri K. Pavan Krishna', email: 'ceo.office@viit.ac.in', designation: 'CEO / Vice-Chairman' },
  { name: 'Dr. M. S. R. Sastry', email: 'ceo.finance@viit.ac.in', designation: 'Executive Director & CEO' }
];

export const CreatePRModal: React.FC<CreatePRModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultDepartmentId
}) => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<any[]>([]);
  const [budgetHeads, setBudgetHeads] = useState<any[]>([]);
  const [departmentAllocations, setDepartmentAllocations] = useState<any[]>([]);
  const [departmentPRs, setDepartmentPRs] = useState<any[]>([]);
  const [selectedAllocation, setSelectedAllocation] = useState<any | null>(null);
  const [showExistingPRsList, setShowExistingPRsList] = useState<boolean>(false);

  const [departmentId, setDepartmentId] = useState<string>(defaultDepartmentId ? String(defaultDepartmentId) : (user?.departmentId ? String(user.departmentId) : ''));
  const [budgetHeadId, setBudgetHeadId] = useState<string>('');
  const [requestedBy, setRequestedBy] = useState<string>(user?.name || 'Department HOD');
  const [purpose, setPurpose] = useState<string>('');
  const [prDate, setPrDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [approvalStatus, setApprovalStatus] = useState<'Approved' | 'Pending'>('Pending');
  const [principalName, setPrincipalName] = useState<string>(PRINCIPAL_USERS[0].name);
  const [principalEmail, setPrincipalEmail] = useState<string>(PRINCIPAL_USERS[0].email);
  const [ceoName, setCeoName] = useState<string>(CEO_USERS[0].name);
  const [ceoEmail, setCeoEmail] = useState<string>(CEO_USERS[0].email);

  const [items, setItems] = useState<ItemRow[]>([
    { productName: '', productDescription: '', quantity: 1, unitPrice: '', preferredVendor: '' }
  ]);

  // Document Upload State
  const [attachedFiles, setAttachedFiles] = useState<AttachedDoc[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getDocIcon = (type: string, name: string) => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf' || type.includes('pdf')) {
      return <FileText className="w-5 h-5 text-rose-500" />;
    } else if (['xlsx', 'xls', 'csv'].includes(ext) || type.includes('sheet') || type.includes('excel')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    } else if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext) || type.includes('image')) {
      return <FileImage className="w-5 h-5 text-purple-500" />;
    }
    return <Paperclip className="w-5 h-5 text-brand-500" />;
  };

  const processFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB per file

    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i];
      if (f.size > maxSizeBytes) {
        setError(`File "${f.name}" exceeds the 10MB limit.`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setAttachedFiles(prev => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            file: f,
            name: f.name,
            size: f.size,
            type: f.type || 'application/octet-stream',
            dataUrl,
            remarks: 'PR Supporting Document / Quotation'
          }
        ]);
      };
      reader.readAsDataURL(f);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    if (e.target) e.target.value = '';
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleFileRemarkChange = (id: string, remarks: string) => {
    setAttachedFiles(prev => prev.map(f => f.id === id ? { ...f, remarks } : f));
  };

  useEffect(() => {
    if (isOpen) {
      fetchDropdowns();
      if (defaultDepartmentId) {
        setDepartmentId(String(defaultDepartmentId));
      } else if (user?.departmentId) {
        setDepartmentId(String(user.departmentId));
      }
      if (user?.name) {
        setRequestedBy(user.name);
      }
    }
  }, [isOpen, defaultDepartmentId, user]);

  async function fetchDropdowns() {
    try {
      const [dRes, bhRes] = await Promise.all([
        api.get('/departments'),
        api.get('/budget-heads')
      ]);
      if (dRes.data.success) {
        setDepartments(dRes.data.data);
        if (!departmentId && dRes.data.data.length > 0) {
          setDepartmentId(String(dRes.data.data[0].id));
        }
      }
      if (bhRes.data.success) {
        setBudgetHeads(bhRes.data.data);
        if (bhRes.data.data.length > 0) {
          setBudgetHeadId(String(bhRes.data.data[0].id));
        }
      }
    } catch (err) {
      console.error('Failed to fetch modal dropdowns:', err);
    }
  }

  useEffect(() => {
    if (departmentId) {
      fetchDepartmentData(departmentId);
    } else {
      setDepartmentAllocations([]);
      setDepartmentPRs([]);
      setSelectedAllocation(null);
    }
  }, [departmentId]);

  async function fetchDepartmentData(deptId: string) {
    try {
      const [allocRes, prRes] = await Promise.all([
        api.get(`/departments/${deptId}/budget`),
        api.get(`/departments/${deptId}/prs`)
      ]);
      if (allocRes.data.success) {
        setDepartmentAllocations(allocRes.data.data);
      }
      if (prRes.data.success) {
        setDepartmentPRs(prRes.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch department budget allocations & PRs:', err);
    }
  }

  useEffect(() => {
    if (budgetHeadId && departmentAllocations.length > 0) {
      const found = departmentAllocations.find(
        a => String(a.budgetHeadId) === String(budgetHeadId) || 
             String(a.budgetHeadCode) === String(budgetHeadId) ||
             (budgetHeads.find(bh => String(bh.id) === String(budgetHeadId)) && 
              String(a.budgetHeadCode) === String(budgetHeads.find(bh => String(bh.id) === String(budgetHeadId))?.code))
      );
      setSelectedAllocation(found || null);
    } else {
      setSelectedAllocation(null);
    }
  }, [budgetHeadId, departmentAllocations, budgetHeads]);

  // Compute metrics for existing PRs under the selected Budget Code
  const selectedBudgetHeadObj = budgetHeads.find(bh => String(bh.id) === String(budgetHeadId));
  const selectedBudgetHeadCode = selectedBudgetHeadObj?.code || selectedAllocation?.budgetHeadCode;

  const budgetCodePRs = departmentPRs.filter(p => {
    if (budgetHeadId && String(p.budgetHeadId) === String(budgetHeadId)) return true;
    if (selectedBudgetHeadCode && (p.budgetHeadCode === selectedBudgetHeadCode || (p.sourceBudgetCode && p.sourceBudgetCode.includes(selectedBudgetHeadCode)))) return true;
    return false;
  });

  const approvedPRsCount = budgetCodePRs.filter(p => p.approvalStatus === 'Approved' || p.status === 'Approved').length;
  const pendingPRsCount = budgetCodePRs.filter(p => p.approvalStatus === 'Pending' || p.status === 'Pending').length;
  const approvedTotalVal = budgetCodePRs
    .filter(p => p.approvalStatus === 'Approved' || p.status === 'Approved')
    .reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const pendingTotalVal = budgetCodePRs
    .filter(p => p.approvalStatus === 'Pending' || p.status === 'Pending')
    .reduce((sum, p) => sum + (p.totalAmount || 0), 0);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([
      ...items,
      { productName: '', productDescription: '', quantity: 1, unitPrice: '', preferredVendor: '' }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ItemRow, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const calculatedTotal = items.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!departmentId) {
      setError('Please select a target department.');
      return;
    }
    if (!budgetHeadId) {
      setError('Please select a budget head.');
      return;
    }
    if (!purpose.trim()) {
      setError('Please enter a purpose / requisition description.');
      return;
    }
    if (items.some(i => !i.productName.trim())) {
      setError('Please provide product/item names for all requested items.');
      return;
    }

    try {
      setSubmitting(true);
      const primaryDoc = attachedFiles[0];
      const res = await api.post('/prs', {
        departmentId: parseInt(departmentId, 10),
        budgetHeadId: parseInt(budgetHeadId, 10),
        requestedBy,
        purpose,
        principalName,
        principalEmail,
        ceoName,
        ceoEmail,
        prDate,
        approvalStatus: 'Pending',
        status: 'Pending',
        items: items.map(i => ({
          ...i,
          quantity: Number(i.quantity) || 1,
          unitPrice: Number(i.unitPrice) || 0
        })),
        documentUrl: primaryDoc?.dataUrl,
        documentName: primaryDoc?.name,
        documentSize: primaryDoc?.size,
        documentType: primaryDoc?.type,
        attachments: attachedFiles.map(f => ({
          name: f.name,
          url: f.dataUrl,
          size: f.size,
          type: f.type,
          remarks: f.remarks,
          uploadedAt: new Date().toISOString()
        }))
      });

      if (res.data.success) {
        setAttachedFiles([]);
        onSuccess();
        onClose();
      } else {
        setError(res.data.message || 'Failed to create PR.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Server error creating PR record.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-500/20 text-brand-400 rounded-xl border border-brand-500/30">
              <FilePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Apply New Department PR</h2>
              <p className="text-xs text-slate-400">Manual Purchase Requisition assignment & budget commitment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Department Selection */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" /> Target Department *
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                disabled={user?.role === 'HOD' || user?.role === 'DEPARTMENT_USER'}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 font-semibold focus:outline-hidden focus:border-brand-500 focus:bg-white disabled:bg-slate-100 disabled:text-slate-500"
              >
                <option value="">Select Department...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Budget Head Selection */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" /> Budget Code & Head *
              </label>
              <select
                value={budgetHeadId}
                onChange={(e) => setBudgetHeadId(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 font-semibold focus:outline-hidden focus:border-brand-500 focus:bg-white"
              >
                <option value="">Select Budget Head...</option>
                {budgetHeads.map((bh) => (
                  <option key={bh.id} value={bh.id}>
                    {bh.code} - {bh.name} ({bh.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Requested By */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Requested By *
              </label>
              <input
                type="text"
                value={requestedBy}
                onChange={(e) => setRequestedBy(e.target.value)}
                required
                placeholder="Faculty / HOD / Admin Name"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 focus:outline-hidden focus:border-brand-500 focus:bg-white"
              />
            </div>

            {/* PR Date */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> PR Date
              </label>
              <input
                type="date"
                value={prDate}
                onChange={(e) => setPrDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 focus:outline-hidden focus:border-brand-500"
              />
            </div>

            {/* Principal Selection Dropdown */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" /> Principal Approval *
              </label>
              <select
                value={`${principalName}|${principalEmail}`}
                onChange={(e) => {
                  const [name, email] = e.target.value.split('|');
                  setPrincipalName(name);
                  setPrincipalEmail(email);
                }}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 font-semibold focus:outline-hidden focus:border-indigo-500 focus:bg-white"
              >
                {PRINCIPAL_USERS.map((u) => (
                  <option key={u.email} value={`${u.name}|${u.email}`}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            {/* CEO Selection Dropdown */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-600" /> CEO Approval *
              </label>
              <select
                value={`${ceoName}|${ceoEmail}`}
                onChange={(e) => {
                  const [name, email] = e.target.value.split('|');
                  setCeoName(name);
                  setCeoEmail(email);
                }}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 font-semibold focus:outline-hidden focus:border-purple-500 focus:bg-white"
              >
                {CEO_USERS.map((u) => (
                  <option key={u.email} value={`${u.name}|${u.email}`}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            {/* LIVE BUDGET OVERVIEW BANNER */}
            {selectedAllocation && (
              <div className="md:col-span-2 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-4 border border-indigo-500/30 shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-500/20 pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-indigo-300 font-bold block">
                        Selected Budget Code Balance Overview
                      </span>
                      <span className="text-sm font-bold text-white">
                        {selectedAllocation.budgetHeadCode} - {selectedAllocation.budgetHeadName} ({selectedAllocation.departmentCode})
                      </span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                    selectedAllocation.remainingAmount <= 0 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                    selectedAllocation.utilizationPercentage >= 85 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {selectedAllocation.remainingAmount <= 0 ? 'Exceeded' : `${selectedAllocation.utilizationPercentage}% Utilized`}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-center">
                  <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Allocated Budget</span>
                    <span className="text-xs sm:text-sm font-bold text-white mt-0.5 block">{formatINR(selectedAllocation.allocatedAmount)}</span>
                  </div>

                  <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                    <span className="text-[10px] text-amber-400 font-semibold uppercase block">Committed / Utilized</span>
                    <span className="text-xs sm:text-sm font-bold text-amber-300 mt-0.5 block">{formatINR(selectedAllocation.committedAmount + selectedAllocation.actualUtilizedAmount)}</span>
                  </div>

                  <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                    <span className="text-[10px] text-emerald-400 font-semibold uppercase block">Available Remaining</span>
                    <span className={`text-xs sm:text-sm font-extrabold mt-0.5 block ${selectedAllocation.remainingAmount < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {formatINR(selectedAllocation.remainingAmount)}
                    </span>
                  </div>

                  <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                    <span className="text-[10px] text-indigo-300 font-semibold uppercase block">Existing PRs</span>
                    <span className="text-xs sm:text-sm font-bold text-indigo-200 mt-0.5 block">
                      {budgetCodePRs.length} PRs
                    </span>
                    <span className="text-[9px] text-slate-400 block font-normal truncate">
                      {approvedPRsCount} Appr | {pendingPRsCount} Pend
                    </span>
                  </div>
                </div>

                {/* Collapsible Existing PRs Summary & List */}
                {budgetCodePRs.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-indigo-500/20">
                    <button
                      type="button"
                      onClick={() => setShowExistingPRsList(!showExistingPRsList)}
                      className="w-full flex items-center justify-between text-xs font-bold text-indigo-300 hover:text-white transition-colors cursor-pointer py-1"
                    >
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-indigo-400" />
                        Existing PRs for Budget Code {selectedBudgetHeadCode} ({budgetCodePRs.length} total - ₹{formatINR(approvedTotalVal + pendingTotalVal)})
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-indigo-300 bg-white/10 px-2 py-0.5 rounded font-semibold">
                        {showExistingPRsList ? 'Hide List' : 'View PR Breakdown'}
                        {showExistingPRsList ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </span>
                    </button>

                    {showExistingPRsList && (
                      <div className="mt-2 space-y-1 max-h-44 overflow-y-auto pr-1 bg-black/40 rounded-lg p-2.5 border border-white/10 text-[11px]">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="text-[10px] text-indigo-300 uppercase border-b border-white/10 pb-1">
                              <th className="py-1 px-1 font-semibold">PR #</th>
                              <th className="py-1 px-1 font-semibold">Date</th>
                              <th className="py-1 px-1 font-semibold">Requested By</th>
                              <th className="py-1 px-1 font-semibold text-right">Total Amount</th>
                              <th className="py-1 px-1 font-semibold text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {budgetCodePRs.map((pr: any, i: number) => (
                              <tr key={pr.id || i} className="hover:bg-white/5 transition-colors">
                                <td className="py-1.5 px-1 font-bold text-white font-mono">{pr.prNumber}</td>
                                <td className="py-1.5 px-1 text-slate-300">{pr.prDate || pr.requestedDate}</td>
                                <td className="py-1.5 px-1 text-slate-300 truncate max-w-[120px]">{pr.requestedBy}</td>
                                <td className="py-1.5 px-1 text-right font-semibold text-indigo-200">{formatINR(pr.totalAmount)}</td>
                                <td className="py-1.5 px-1 text-center">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    pr.approvalStatus === 'Approved' || pr.status === 'Approved'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  }`}>
                                    {pr.approvalStatus || pr.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Real-Time Requisition Budget Comparison */}
                {calculatedTotal > 0 && (
                  <div className={`mt-3 pt-2.5 border-t text-xs font-semibold flex items-center justify-between ${
                    calculatedTotal > selectedAllocation.remainingAmount 
                      ? 'border-rose-500/30 text-rose-300' 
                      : 'border-emerald-500/30 text-emerald-300'
                  }`}>
                    <span className="flex items-center gap-1.5">
                      {calculatedTotal > selectedAllocation.remainingAmount ? (
                        <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      )}
                      {calculatedTotal > selectedAllocation.remainingAmount
                        ? `Warning: Requisition total (${formatINR(calculatedTotal)}) exceeds remaining budget by ${formatINR(calculatedTotal - selectedAllocation.remainingAmount)}`
                        : `Sufficient Balance: Remaining after PR will be ${formatINR(selectedAllocation.remainingAmount - calculatedTotal)}`}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Purpose */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Purpose / Purchase Justification *
            </label>
            <textarea
              rows={2}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              required
              placeholder="Detailed description of goods, lab equipment, or services requested..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 focus:outline-hidden focus:border-brand-500 focus:bg-white"
            />
          </div>

          {/* PR Document & Attachment Upload Section */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-800 uppercase tracking-wider text-xs flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-brand-600" />
                PR Supporting Documents & Quotations
                <span className="text-[10px] text-slate-400 font-normal lowercase">(optional - PDF, Word, Excel, Images up to 10MB)</span>
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
              >
                <FileUp className="w-3.5 h-3.5 text-brand-600" /> Browse File
              </button>
            </div>

            {/* Hidden Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.webp"
              className="hidden"
            />

            {/* Drag and Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-brand-500 bg-brand-50/50 scale-[0.99]'
                  : 'border-slate-300 hover:border-brand-400 bg-white/80 hover:bg-slate-50/80'
              }`}
            >
              <div className="flex flex-col items-center justify-center gap-1.5">
                <div className="p-2 bg-slate-100 text-slate-600 rounded-full">
                  <UploadCloud className="w-5 h-5 text-brand-600" />
                </div>
                <div className="text-xs text-slate-700 font-medium">
                  <span className="font-bold text-brand-600 hover:underline">Click to upload document</span> or drag and drop files here
                </div>
                <p className="text-[10px] text-slate-400">
                  Attach vendor quotations, purchase notes, tech specs, or approval sanction letters
                </p>
              </div>
            </div>

            {/* Uploaded Files List */}
            {attachedFiles.length > 0 && (
              <div className="space-y-2 mt-2">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Attached Documents ({attachedFiles.length})</span>
                  <span className="text-[10px] text-slate-400 font-normal">Stored with PR record</span>
                </div>

                <div className="space-y-2">
                  {attachedFiles.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-white border border-slate-200 rounded-lg p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs hover:border-brand-300 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex-shrink-0">
                          {getDocIcon(doc.type, doc.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 truncate" title={doc.name}>
                            {doc.name}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded font-medium text-slate-600">
                              {formatFileSize(doc.size)}
                            </span>
                            <span className="uppercase text-slate-400">{doc.name.split('.').pop()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Document tag / remarks (e.g. Quotation 1)"
                          value={doc.remarks || ''}
                          onChange={(e) => handleFileRemarkChange(doc.id, e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[11px] text-slate-700 w-44 focus:outline-hidden focus:border-brand-500 focus:bg-white"
                        />
                        <a
                          href={doc.dataUrl}
                          target="_blank"
                          rel="noreferrer"
                          download={doc.name}
                          className="p-1.5 rounded text-slate-500 hover:text-brand-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Preview / Download Document"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(doc.id)}
                          className="p-1.5 rounded text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remove File"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Requested Items / Services ({items.length})
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 px-2.5 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item Line
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Item / Product Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Oscilloscope / Lab Desktop"
                      value={item.productName}
                      onChange={(e) => handleItemChange(idx, 'productName', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded py-1 px-2 text-xs text-slate-800"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                      className="w-full bg-slate-50 border border-slate-200 rounded py-1 px-2 text-xs text-slate-800 text-right font-semibold"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Unit Price (₹)</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded py-1 px-2 text-xs text-slate-800 text-right font-semibold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Line Total</label>
                    <div className="py-1 px-2 bg-slate-100 rounded text-right font-bold text-slate-800">
                      {formatINR((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}
                    </div>
                  </div>

                  <div className="sm:col-span-1 flex items-center justify-center">
                    <button
                      type="button"
                      disabled={items.length <= 1}
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 rounded text-rose-500 hover:bg-rose-50 disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="sm:col-span-6">
                    <input
                      type="text"
                      placeholder="Product Description / Specs"
                      value={item.productDescription}
                      onChange={(e) => handleItemChange(idx, 'productDescription', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded py-1 px-2 text-[11px] text-slate-600"
                    />
                  </div>

                  <div className="sm:col-span-6">
                    <input
                      type="text"
                      placeholder="Preferred Vendor Name"
                      value={item.preferredVendor}
                      onChange={(e) => handleItemChange(idx, 'preferredVendor', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded py-1 px-2 text-[11px] text-slate-600"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Total Summary */}
            <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-lg border border-emerald-200">
              <span className="font-bold text-emerald-800 text-xs">Total Requisition Amount</span>
              <span className="font-extrabold text-emerald-900 text-base">{formatINR(calculatedTotal)}</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {submitting ? (
                <span>Submitting PR...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Apply & Commit PR</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
