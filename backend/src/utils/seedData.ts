import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import crypto from 'crypto';
import { Department, BudgetHead, BudgetAllocation, PRRecord, PRItem, User, InvoiceRecord } from '../types';
import { sendPREmailNotification } from '../services/emailService';
import { getFirestoreDb, isFirebaseEnabled } from '../config/firebase';
import { getPgStatus, queryPgAsync, executePgQuery } from '../config/postgresDatabase';
import { 
  EMBEDDED_DEPARTMENTS, 
  EMBEDDED_BUDGET_HEADS, 
  EMBEDDED_BUDGET_ALLOCATIONS, 
  EMBEDDED_PRS, 
  EMBEDDED_INVOICES, 
  EMBEDDED_USERS 
} from '../data/embeddedMasterDataset';

let departments: Department[] = [];
let budgetHeads: BudgetHead[] = [];
let budgetAllocations: BudgetAllocation[] = [];
let prRecords: PRRecord[] = [];
let prItemsMap: Map<number | string, PRItem[]> = new Map();
let users: User[] = [];
let invoiceRecords: InvoiceRecord[] = [];

let isInitialized = false;
// Seed loading and remote hydration are separate states. Embedded seed data
// must never make the Firebase sync path believe the remote dataset is loaded.
let firebaseDataSynced = false;

// Department Mapping
export const DEPT_NAME_MAP: Record<string, { code: string; name: string; category: string }> = {
  'AI&DS': { code: 'AIDS', name: 'AI & Data Science', category: 'Academic' },
  'AI & DS': { code: 'AIDS', name: 'AI & Data Science', category: 'Academic' },
  'AIDS': { code: 'AIDS', name: 'AI & Data Science', category: 'Academic' },
  'CSE - AI': { code: 'AI', name: 'Artificial Intelligence', category: 'Academic' },
  'CSE-AI': { code: 'AI', name: 'Artificial Intelligence', category: 'Academic' },
  'AI': { code: 'AI', name: 'Artificial Intelligence', category: 'Academic' },
  'CSE - CS': { code: 'CS', name: 'Cyber Security', category: 'Academic' },
  'CSE-CS': { code: 'CS', name: 'Cyber Security', category: 'Academic' },
  'CS': { code: 'CS', name: 'Cyber Security', category: 'Academic' },
  'CSE - DS': { code: 'DS', name: 'Data Science', category: 'Academic' },
  'CSE-DS': { code: 'DS', name: 'Data Science', category: 'Academic' },
  'DS': { code: 'DS', name: 'Data Science', category: 'Academic' },
  'ACSE': { code: 'CSE', name: 'Computer Science & Engineering', category: 'Academic' },
  'CSE': { code: 'CSE', name: 'Computer Science & Engineering', category: 'Academic' },
  'CIVIL': { code: 'CE', name: 'Civil Engineering', category: 'Academic' },
  'CE': { code: 'CE', name: 'Civil Engineering', category: 'Academic' },
  'MECH': { code: 'ME', name: 'Mechanical Engineering', category: 'Academic' },
  'ME': { code: 'ME', name: 'Mechanical Engineering', category: 'Academic' },
  'EEE': { code: 'EEE', name: 'Electrical & Electronics Engineering', category: 'Academic' },
  'ECE': { code: 'ECE', name: 'Electronics & Communication Engineering', category: 'Academic' },
  'ECM': { code: 'ECM', name: 'Electronics & Computer Engineering', category: 'Academic' },
  'IT': { code: 'IT', name: 'Information Technology', category: 'Academic' },
  'MBA': { code: 'MBA', name: 'Master of Business Administration', category: 'Academic' },
  'MCA': { code: 'MCA', name: 'Master of Computer Applications', category: 'Academic' },
  'BS&H': { code: 'BS&H', name: 'Basic Sciences & Humanities', category: 'Academic' },
  'INFRA': { code: 'Dinf', name: 'Dean Infrastructure', category: 'Administrative' },
  'DINF': { code: 'Dinf', name: 'Dean Infrastructure', category: 'Administrative' },
  'NEW BUIDLING': { code: 'Dinf', name: 'Dean Infrastructure', category: 'Administrative' },
  'NEW SCHOOL BUIDLING': { code: 'Dinf', name: 'Dean Infrastructure', category: 'Administrative' },
  'ADMIN': { code: 'DOA', name: 'Dean Administration', category: 'Administrative' },
  'ADMIN OFFICE': { code: 'DOA', name: 'Dean Administration', category: 'Administrative' },
  'DOA': { code: 'DOA', name: 'Dean Administration', category: 'Administrative' },
  'I/C ELECTRICAL': { code: 'ELC', name: 'I/c Electrical', category: 'Central' },
  'ELC': { code: 'ELC', name: 'I/c Electrical', category: 'Central' },
  'I/C SYSTEM CELL': { code: 'SC', name: 'System Cell', category: 'Central' },
  'SYSTEM CELL': { code: 'SC', name: 'System Cell', category: 'Central' },
  'SC': { code: 'SC', name: 'System Cell', category: 'Central' },
  'I/C LIBRARY': { code: 'Lib', name: 'Library', category: 'Central' },
  'LIBRARY': { code: 'Lib', name: 'Library', category: 'Central' },
  'LIB': { code: 'Lib', name: 'Library', category: 'Central' },
  'ADMISSION': { code: 'DAD', name: 'Dean Admissions', category: 'Dean' },
  'ADMISSIONS': { code: 'DAD', name: 'Dean Admissions', category: 'Dean' },
  'DAD': { code: 'DAD', name: 'Dean Admissions', category: 'Dean' },
  'EXAM CELL': { code: 'EC', name: 'Examination Cell', category: 'Administrative' },
  'EC': { code: 'EC', name: 'Examination Cell', category: 'Administrative' },
  'IQAC': { code: 'DIQ', name: 'Dean IQAC', category: 'Dean' },
  'DIQ': { code: 'DIQ', name: 'Dean IQAC', category: 'Dean' },
  'T&P': { code: 'DTP', name: 'Dean Training & Placement', category: 'Dean' },
  'T_P': { code: 'DTP', name: 'Dean Training & Placement', category: 'Dean' },
  'PD': { code: 'DTP', name: 'Dean Training & Placement', category: 'Dean' },
  'DTP': { code: 'DTP', name: 'Dean Training & Placement', category: 'Dean' },
  'DEAN SA': { code: 'DSA', name: 'Dean Student Affairs', category: 'Dean' },
  'STUDENT AFFAIRS': { code: 'DSA', name: 'Dean Student Affairs', category: 'Dean' },
  'DSA': { code: 'DSA', name: 'Dean Student Affairs', category: 'Dean' },
  'DEAN FA': { code: 'DFA', name: 'Dean Faculty Affairs', category: 'Dean' },
  'FACULTY AFFAIRS': { code: 'DFA', name: 'Dean Faculty Affairs', category: 'Dean' },
  'FACULTY AFFIARS': { code: 'DFA', name: 'Dean Faculty Affairs', category: 'Dean' },
  'DFA': { code: 'DFA', name: 'Dean Faculty Affairs', category: 'Dean' },
  'ACADEMICS': { code: 'DAC', name: 'Dean Academics', category: 'Dean' },
  'DAC': { code: 'DAC', name: 'Dean Academics', category: 'Dean' },
  'R&D': { code: 'DRD', name: 'Dean R&D', category: 'Dean' },
  'DRD': { code: 'DRD', name: 'Dean R&D', category: 'Dean' },
  'MEDIA CELL': { code: 'MC', name: 'Media Cell', category: 'Administrative' },
  'MC': { code: 'MC', name: 'Media Cell', category: 'Administrative' },
  'I/C ATTENDANCE': { code: 'ATT', name: 'I/c Attendance', category: 'Administrative' },
  'ATT': { code: 'ATT', name: 'I/c Attendance', category: 'Administrative' },
  'VCIS': { code: 'VCIS', name: 'VCIS Cell', category: 'Administrative' },
  'DISA': { code: 'Disa', name: 'Dean International Students', category: 'Dean' },
  'WPC': { code: 'WPC', name: 'Women Protection Cell', category: 'Administrative' },
  'WOMEN PROTECTION CELL': { code: 'WPC', name: 'Women Protection Cell', category: 'Administrative' },
  'FINANCE': { code: 'FINANCE', name: 'Finance Office', category: 'Administrative' }
};

export function normalizeDeptCode(raw: any, remarksHint?: string): string {
  if (!raw || raw === 'N/A' || raw === 'undefined' || raw === 'EMPTY') {
    if (remarksHint) {
      const upper = remarksHint.toUpperCase();
      if (upper.includes('WASHROOM') || upper.includes('ADMIN BLOCK') || upper.includes('NEW ADMIN') || 
          upper.includes('SOFA') || upper.includes('FLOOR CLEANING') || upper.includes('WATER DISPENSER') || 
          upper.includes('BUILDING') || upper.includes('L BOARD') || upper.includes('PLUMBING') || upper.includes('CARPENTER')) {
        return 'Dinf';
      }
      if (upper.includes('ELECTRICAL') || upper.includes('STEVE JOBS LAB')) return 'ELC';
      if (upper.includes('ANRF') || upper.includes('GRANT RECEIVED')) return 'DRD';
      if (upper.includes('AIDS') || upper.includes('AI TOOLS')) return 'AIDS';
      if (upper.includes('YOGA DAY')) return 'DSA';
      if (upper.includes('GIFTS FOR HRS') || upper.includes('VISITING COMPANIES')) return 'DTP';
      if (upper.includes('VIZIANAGARAM') || upper.includes('FLEXI')) return 'MC';
      if (upper.includes('ADMISSION') || upper.includes('SWEET BOXES') || upper.includes('ROUND TABLE HIRE')) return 'DAD';
      if (upper.includes('IQAC') || upper.includes('NBA INSPECTION')) return 'DIQ';
      if (upper.includes('CIVIL')) return 'CE';
      if (upper.includes('MECHANICAL')) return 'ME';
      if (upper.includes('CSE')) return 'CSE';
      if (upper.includes('ECE')) return 'ECE';
    }
    return 'DOA';
  }
  const cleaned = String(raw).trim().toUpperCase();
  if (DEPT_NAME_MAP[cleaned]) return DEPT_NAME_MAP[cleaned].code;
  
  // Longest matching key first
  const keys = Object.keys(DEPT_NAME_MAP).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (cleaned === key || cleaned.includes(key)) return DEPT_NAME_MAP[key].code;
  }
  return 'DOA';
}

export function smartInferBudgetHead(rawCode: any, deptCode: string, remarksHint: string, availableHeads: BudgetHead[] = []): number {
  const parsedHead = parseInt(String(rawCode), 10);
  if (!isNaN(parsedHead)) {
    if (availableHeads.length === 0 || availableHeads.some(h => h.code === parsedHead)) {
      return parsedHead;
    }
  }

  const upper = (remarksHint || '').toUpperCase();

  if (upper.includes('ROAD') || upper.includes('PATCH WORKS') || upper.includes('CULVERT') || upper.includes('CONSTRUCTION') || upper.includes('SLAB WORK')) return 1008;
  if (upper.includes('SOFA') || upper.includes('FURNITURE') || upper.includes('CHAIR') || upper.includes('TABLE') || upper.includes('CARPENTER')) return 902;
  if (upper.includes('FLOOR CLEANING') || upper.includes('WASHROOM') || upper.includes('DISPENSER') || upper.includes('BUILDING MAINTENANCE') || upper.includes('PLUMBING')) return 909;
  if (upper.includes('ELECTRICAL') || upper.includes('WIRING') || upper.includes('STEVE JOBS LAB')) return 906;
  if (upper.includes('ANRF') || upper.includes('GRANT RECEIVED') || upper.includes('RESEARCH')) return 117;
  if (upper.includes('GUEST LECTURE') || upper.includes('VISITING FACULTY')) return 207;
  if (upper.includes('GIFTS FOR HRS') || upper.includes('COMPANIES')) return 704;
  if (upper.includes('YOGA DAY') || upper.includes('EXTRA CURRICULAR')) return 608;
  if (upper.includes('UPSC EXAM') || upper.includes('EXAM')) return 502;
  if (upper.includes('ADMISSION') || upper.includes('SWEET BOXES') || upper.includes('ROUND TABLE')) return 406;
  if (upper.includes('NBA INSPECTION') || upper.includes('MOCK INSPECTION') || upper.includes('IQAC')) return 803;
  if (upper.includes('EV BUGGY') || upper.includes('VEHICLE')) return 908;
  if (upper.includes('ALUMNI')) return 819;

  if (deptCode === 'Dinf') return 909;
  if (deptCode === 'ELC') return 906;
  if (deptCode === 'SC') return 308;

  return 911;
}

function parseExcelDate(val: any, defaultDate: string = '2026-04-01'): string {
  if (!val) return defaultDate;
  if (typeof val === 'number') {
    const d = XLSX.SSF.parse_date_code(val);
    if (d && d.y) {
      return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
    }
  }
  const str = String(val).trim();
  if (str.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }
  const parts = str.split(/[-/]/);
  if (parts.length === 3 && parts[2].length === 4) {
    return `${parts[2]}-${String(parts[1]).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`;
  }
  return defaultDate;
}

export function loadSeedData(forceReload: boolean = false) {
  if (isInitialized && !forceReload) return;
  loadEmbeddedDataset();
}

function initDefaultUsers() {
  users = [
    {
      id: 1,
      name: 'System Admin',
      email: 'admin@vignan.ac.in',
      role: 'ADMIN',
      departmentId: 9,
      departmentCode: 'DOA',
      departmentName: 'Dean Administration'
    },
    {
      id: 2,
      name: 'Finance Officer',
      email: 'finance@vignan.ac.in',
      role: 'FINANCE',
      departmentId: 10,
      departmentCode: 'FINANCE',
      departmentName: 'Finance Office'
    },
    {
      id: 3,
      name: 'Dr. V. Rama Rao',
      email: 'principal@viit.ac.in',
      role: 'ADMIN',
      departmentId: 9,
      departmentCode: 'DOA',
      departmentName: 'Principal Office (VIIT)'
    },
    {
      id: 4,
      name: 'Dr. B. Arundhati',
      email: 'principal.academics@viit.ac.in',
      role: 'ADMIN',
      departmentId: 9,
      departmentCode: 'DOA',
      departmentName: 'Principal Office (Academics)'
    },
    {
      id: 5,
      name: 'Dr. P. Sekhar',
      email: 'principal.admin@viit.ac.in',
      role: 'ADMIN',
      departmentId: 9,
      departmentCode: 'DOA',
      departmentName: 'Principal Office (Admin)'
    },
    {
      id: 6,
      name: 'Dr. K. Madhusudhan',
      email: 'principal.rnd@viit.ac.in',
      role: 'ADMIN',
      departmentId: 9,
      departmentCode: 'DOA',
      departmentName: 'Principal Office (R&D)'
    },
    {
      id: 7,
      name: 'Sri L. Rathaiah',
      email: 'ceo@viit.ac.in',
      role: 'ADMIN',
      departmentId: 9,
      departmentCode: 'DOA',
      departmentName: 'CEO & Chairman Office'
    },
    {
      id: 8,
      name: 'Sri K. Pavan Krishna',
      email: 'ceo.office@viit.ac.in',
      role: 'ADMIN',
      departmentId: 9,
      departmentCode: 'DOA',
      departmentName: 'CEO Office'
    },
    {
      id: 9,
      name: 'Dr. M. S. R. Sastry',
      email: 'ceo.finance@viit.ac.in',
      role: 'ADMIN',
      departmentId: 10,
      departmentCode: 'FINANCE',
      departmentName: 'CEO Finance Office'
    },
    {
      id: 10,
      name: 'Dr. CSE HOD',
      email: 'hod.cse@vignan.ac.in',
      role: 'HOD',
      departmentId: 1,
      departmentCode: 'CSE',
      departmentName: 'Computer Science & Engineering'
    },
    {
      id: 11,
      name: 'Dr. ECE HOD',
      email: 'hod.ece@vignan.ac.in',
      role: 'HOD',
      departmentId: 2,
      departmentCode: 'ECE',
      departmentName: 'Electronics & Communication Engineering'
    },
    {
      id: 12,
      name: 'Faculty User',
      email: 'user.cse@vignan.ac.in',
      role: 'DEPARTMENT_USER',
      departmentId: 1,
      departmentCode: 'CSE',
      departmentName: 'Computer Science & Engineering'
    }
  ];
}

function initDefaultMasterData() {
  initDefaultUsers();
  departments = [];
  budgetHeads = [];
  budgetAllocations = [];
  prRecords = [];
  prItemsMap = new Map();
  invoiceRecords = [];
}

export function injectTestPRRecord(): PRRecord {
  const testPRId = 'PR-TEST-9999';
  const existing = prRecords.find(p => String(p.id) === testPRId || p.prNumber === 'PR-2026-TEST');
  if (existing) return existing;

  const dept = departments.find(d => d.code === 'CSE') || departments[0] || { id: 6, code: 'CSE', name: 'Computer Science & Engineering' };
  const bh = budgetHeads.find(b => b.code === 103) || budgetHeads[0] || { id: 3, code: 103, name: 'Software Licenses & Subscriptions' };

  const validPdfDataUrl = 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDAKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCjMgMCBvYmoKPDAKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovQ29udGVudHMgNCAwIFIKL1Jlc291cmNlcyA8PAovRm9udCA8PAovRjEgNSAwIFIKPj4KPj4KZW5kb2JqCjQgMCBvYmoKPDAKL0xlbmd0aCA0NAo+PgpzdHJlYW0KQlQKL0YxIDI0IFRmCjEwMCA3MDAgVGQKKFRlc3QgUFIgU3VwcG9ydGluZyBEb2N1bWVudCkgVGoKRUQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCjAwMDAwMDAyNDQgMDAwMDAgbiAKMDAwMDAwMDMzOSAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDYKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQyMgolJUVPRg==';

  const testItems: PRItem[] = [
    {
      id: 99991,
      prId: testPRId,
      productName: 'NVIDIA RTX 4090 AI Workstation (24GB GPU, 64GB RAM)',
      productCode: 'PROD-GPU-4090',
      productType: 'goods',
      productDescription: 'High-Performance Workstation for Computer Vision & Deep Learning Lab',
      unitTypeName: 'Numbers',
      quantity: 2,
      unitPrice: 225000,
      totalValue: 450000,
      currentStock: 0,
      preferredVendor: 'Dell India Enterprise',
      productRequiredBy: '2026-09-30',
      itemRemarks: 'Priority Requisition for AI Lab'
    },
    {
      id: 99992,
      prId: testPRId,
      productName: '27-inch 4K Color-Accurate Professional Lab Display',
      productCode: 'PROD-DISP-4K',
      productType: 'goods',
      productDescription: 'Ultra-HD IPS Monitor with USB-C Hub & Dual DisplayPort',
      unitTypeName: 'Numbers',
      quantity: 2,
      unitPrice: 22500,
      totalValue: 45000,
      currentStock: 0,
      preferredVendor: 'Dell India Enterprise',
      productRequiredBy: '2026-09-30',
      itemRemarks: 'Lab Monitor Accessory'
    }
  ];

  const testInvoice: InvoiceRecord = {
    id: 9999,
    invoiceNumber: 'INV-2026-TEST-9999',
    invoiceDate: '2026-09-15',
    prId: testPRId,
    prNumber: 'PR-2026-TEST',
    departmentId: dept.id,
    departmentCode: dept.code,
    departmentName: dept.name,
    budgetHeadId: bh.id,
    budgetHeadCode: bh.code,
    budgetHeadName: bh.name,
    vendorName: 'Dell India Enterprise Pvt Ltd',
    totalAmount: 495000,
    status: 'Paid',
    paymentStatus: 'Paid',
    paymentDate: '2026-09-15',
    remarks: 'Full Invoice Settlement for Test PR',
    submittedBy: 'Finance Controller'
  };

  invoiceRecords.unshift(testInvoice);

  const testPR: PRRecord = {
    id: testPRId,
    prNumber: 'PR-2026-TEST',
    prDate: new Date().toISOString().substring(0, 10),
    departmentId: dept.id,
    departmentCode: dept.code,
    departmentName: dept.name,
    budgetHeadId: bh.id,
    budgetHeadCode: bh.code,
    budgetHeadName: bh.name,
    requestedBy: 'Dr. S. K. Rao (HOD Computer Science)',
    purpose: 'TEST REQUISITION: Verification of PR Document Uploads, Approvals, Invoicing, and Close PR Workflow.',
    totalAmount: 495000,
    status: 'Approved',
    approvalStatus: 'Approved',
    prPoStatus: 'Open',
    approval1: 'HOD Approved',
    approval2: 'Finance Approved',
    approval3: 'Admin Approved',
    sourceBudgetCode: `${bh.code}${dept.code}`,
    documentUrl: validPdfDataUrl,
    documentName: 'Dell_Quotation_AI_Lab_Equipment_2026.pdf',
    documentSize: 148500,
    documentType: 'application/pdf',
    attachments: [
      {
        name: 'Dell_Quotation_AI_Lab_Equipment_2026.pdf',
        url: validPdfDataUrl,
        size: 148500,
        type: 'application/pdf',
        remarks: 'Official Vendor Quotation & Technical Specifications',
        uploadedAt: new Date().toISOString()
      },
      {
        name: 'Principal_Sanction_Letter.pdf',
        url: validPdfDataUrl,
        size: 98400,
        type: 'application/pdf',
        remarks: 'Institutional Sanction & Approval Note',
        uploadedAt: new Date().toISOString()
      }
    ],
    items: testItems
  };

  prRecords.unshift(testPR);
  prItemsMap.set(testPRId, testItems);
  recalculateCommittedAmounts();
  return testPR;
}

export function loadEmbeddedDataset() {
  departments = JSON.parse(JSON.stringify(EMBEDDED_DEPARTMENTS));
  budgetHeads = JSON.parse(JSON.stringify(EMBEDDED_BUDGET_HEADS));
  budgetAllocations = JSON.parse(JSON.stringify(EMBEDDED_BUDGET_ALLOCATIONS));
  prRecords = JSON.parse(JSON.stringify(EMBEDDED_PRS));
  invoiceRecords = JSON.parse(JSON.stringify(EMBEDDED_INVOICES));
  
  initDefaultUsers(); // Initialize default users list with all Admin, Finance, Principal, CEO, HOD, and User accounts
  const embeddedUsers = JSON.parse(JSON.stringify(EMBEDDED_USERS));
  embeddedUsers.forEach((eu: any) => {
    if (!users.some(u => u.email.toLowerCase() === eu.email.toLowerCase())) {
      users.push(eu);
    }
  });

  prItemsMap.clear();
  prRecords.forEach(pr => {
    if (pr.items) prItemsMap.set(pr.id, pr.items);
  });
  injectTestPRRecord();
  recalculateCommittedAmounts();
  isInitialized = true;
  console.log(`[Embedded Dataset] Successfully loaded ${departments.length} departments, ${budgetHeads.length} budget heads, ${budgetAllocations.length} allocations, ${prRecords.length} PRs, ${users.length} users.`);
}

export function initFallbackDataset() {
  initDefaultUsers();

  departments = [
    { id: 1, code: 'CSE', name: 'Computer Science & Engineering', category: 'Academic' },
    { id: 2, code: 'ECE', name: 'Electronics & Communication Engineering', category: 'Academic' },
    { id: 3, code: 'ME', name: 'Mechanical Engineering', category: 'Academic' },
    { id: 4, code: 'CE', name: 'Civil Engineering', category: 'Academic' },
    { id: 5, code: 'EEE', name: 'Electrical & Electronics Engineering', category: 'Academic' },
    { id: 6, code: 'AIDS', name: 'AI & Data Science', category: 'Academic' },
    { id: 7, code: 'DOA', name: 'Dean Administration', category: 'Administrative' },
    { id: 8, code: 'FINANCE', name: 'Finance Office', category: 'Administrative' }
  ];

  budgetHeads = [
    { id: 1, code: 101, name: 'Printing & Stationery', category: 'Recurring' },
    { id: 2, code: 102, name: 'Equipment & Machinery Maintenance', category: 'Recurring' },
    { id: 3, code: 103, name: 'Software Licenses & Subscriptions', category: 'Non-Recurring' },
    { id: 4, code: 104, name: 'Laboratory Consumables', category: 'Recurring' },
    { id: 5, code: 105, name: 'Workshops & Technical Events', category: 'Recurring' },
    { id: 6, code: 106, name: 'Furniture & Campus Infrastructure', category: 'Non-Recurring' }
  ];

  budgetAllocations = [];
  let allocId = 1;
  departments.forEach(dept => {
    budgetHeads.forEach(head => {
      const baseAmt = (dept.code === 'CSE' || dept.code === 'ECE') ? 1500000 : 800000;
      budgetAllocations.push({
        id: allocId++,
        departmentId: dept.id,
        departmentCode: dept.code,
        departmentName: dept.name,
        budgetHeadId: head.id,
        budgetHeadCode: head.code,
        budgetHeadName: head.name,
        sourceBudgetCode: `${head.code}${dept.code}`,
        financialYear: '2026-27',
        allocatedAmount: baseAmt,
        committedAmount: 0,
        actualUtilizedAmount: 0,
        remainingAmount: baseAmt,
        utilizationPercentage: 0,
        alertStatus: 'Normal'
      });
    });
  });

  const samplePRData = [
    { deptCode: 'CSE', headCode: 103, title: 'NVIDIA RTX 4090 GPU Workstations for AI Lab', vendor: 'Dell India Pvt Ltd', amount: 450000 },
    { deptCode: 'CSE', headCode: 101, title: 'A4 Paper Rims & Printer Cartridges Q3', vendor: 'Stationery Mart', amount: 35000 },
    { deptCode: 'ECE', headCode: 104, title: 'VLSI Circuit Components & Breadboards', vendor: 'Pioneer Electronics', amount: 120000 },
    { deptCode: 'ECE', headCode: 102, title: 'Calibration of Oscilloscopes & Function Generators', vendor: 'Lab Equipments Co.', amount: 65000 },
    { deptCode: 'ME', headCode: 102, title: 'CNC Milling Machine Servicing & Spare Parts', vendor: 'Siemens Electricals', amount: 210000 },
    { deptCode: 'CE', headCode: 104, title: 'Concrete Testing Mold & Compression Samples', vendor: 'Supreme Hardware', amount: 85000 },
    { deptCode: 'EEE', headCode: 103, title: 'MATLAB & Simulink Campus Network Licenses', vendor: 'MathWorks India', amount: 320000 },
    { deptCode: 'AIDS', headCode: 103, title: 'Cloud Infrastructure & AWS Credit Vouchers', vendor: 'Amazon Web Services', amount: 180000 },
    { deptCode: 'DOA', headCode: 106, title: 'Ergonomic Office Chairs for Admin Block', vendor: 'Godrej Interio', amount: 140000 },
    { deptCode: 'FINANCE', headCode: 101, title: 'Annual Tax Audit Ledger Books & File Binders', vendor: 'National Book House', amount: 28000 }
  ];

  prRecords = [];
  prItemsMap = new Map();

  samplePRData.forEach((sample, idx) => {
    const prId = idx + 1;
    const prNumber = `PR-2026-${String(prId).padStart(4, '0')}`;
    const dept = departments.find(d => d.code === sample.deptCode) || departments[0];
    const head = budgetHeads.find(h => h.code === sample.headCode) || budgetHeads[0];

    const prItem: PRItem = {
      id: 1000 + prId,
      prId,
      productName: sample.title,
      productCode: `PROD-${1000 + prId}`,
      productType: 'goods',
      productDescription: sample.title,
      unitTypeName: 'Set',
      quantity: 1,
      unitPrice: sample.amount,
      totalValue: sample.amount,
      currentStock: 0,
      preferredVendor: sample.vendor,
      productRequiredBy: '2026-06-30',
      itemRemarks: 'Required for academic lab operations'
    };

    const pr: PRRecord = {
      id: prId,
      prNumber,
      prDate: '2026-05-10',
      departmentId: dept.id,
      departmentCode: dept.code,
      departmentName: dept.name,
      budgetHeadId: head.id,
      budgetHeadCode: head.code,
      budgetHeadName: head.name,
      requestedBy: `HOD ${dept.code}`,
      purpose: sample.title,
      totalAmount: sample.amount,
      status: 'Approved',
      approvalStatus: 'Approved',
      prPoStatus: 'Open',
      approval1: 'HOD Approved',
      approval2: 'Finance Approved',
      approval3: 'Admin Approved',
      sourceBudgetCode: `${head.code}${dept.code}`,
      items: [prItem]
    };

    prRecords.push(pr);
    prItemsMap.set(prId, [prItem]);
  });

  initDefaultInvoices();
  recalculateCommittedAmounts();
}

export function recalculateCommittedAmounts() {
  budgetAllocations.forEach(alloc => {
    alloc.committedAmount = 0;
    alloc.actualUtilizedAmount = 0;
  });

  // Calculate invoice utilized amounts per PR
  const prInvoiceMap = new Map<string, { totalInvoiced: number; invoices: InvoiceRecord[] }>();
  invoiceRecords.forEach(inv => {
    if (inv.status !== 'Rejected') {
      const keys = [String(inv.prId).toUpperCase(), (inv.prNumber || '').toUpperCase()].filter(Boolean);
      keys.forEach(k => {
        if (!prInvoiceMap.has(k)) {
          prInvoiceMap.set(k, { totalInvoiced: 0, invoices: [] });
        }
      });
      // Add only once per invoice using primary prId or prNumber
      const primaryKey = String(inv.prId).toUpperCase();
      if (prInvoiceMap.has(primaryKey)) {
        prInvoiceMap.get(primaryKey)!.totalInvoiced += Number(inv.totalAmount) || 0;
        prInvoiceMap.get(primaryKey)!.invoices.push(inv);
      }
    }
  });

  prRecords.forEach(pr => {
    const invData = prInvoiceMap.get(String(pr.id).toUpperCase()) || 
                    prInvoiceMap.get(pr.prNumber.toUpperCase()) || 
                    { totalInvoiced: 0, invoices: [] };

    const prUtilized = invData.totalInvoiced;
    const prRemaining = Math.max(0, pr.totalAmount - prUtilized);

    (pr as any).utilizedAmount = prUtilized;
    (pr as any).remainingPRAmount = prRemaining;
    (pr as any).invoices = invData.invoices;
    (pr as any).invoicedPercentage = pr.totalAmount > 0 
      ? parseFloat(((prUtilized / pr.totalAmount) * 100).toFixed(1)) 
      : 0;

    // Only commit/utilize budget once PR is Approved or Closed
    if (pr.approvalStatus === 'Approved' || pr.status === 'Approved' || pr.status === 'Closed' || pr.prPoStatus === 'Closed') {
      const alloc = budgetAllocations.find(ba =>
        (String(ba.departmentId) === String(pr.departmentId) || (ba.departmentCode && pr.departmentCode && ba.departmentCode.trim().toUpperCase() === pr.departmentCode.trim().toUpperCase())) &&
        (String(ba.budgetHeadId) === String(pr.budgetHeadId) || ba.budgetHeadCode === pr.budgetHeadCode)
      );
      if (alloc) {
        alloc.actualUtilizedAmount += prUtilized;
        alloc.committedAmount += prRemaining;
      }
    }
  });

  budgetAllocations.forEach(alloc => {
    alloc.remainingAmount = alloc.allocatedAmount - alloc.committedAmount - alloc.actualUtilizedAmount;
    if (alloc.allocatedAmount > 0) {
      alloc.utilizationPercentage = parseFloat((((alloc.committedAmount + alloc.actualUtilizedAmount) / alloc.allocatedAmount) * 100).toFixed(2));
    } else {
      alloc.utilizationPercentage = (alloc.committedAmount + alloc.actualUtilizedAmount) > 0 ? 100 : 0;
    }

    const pct = alloc.utilizationPercentage;
    if (pct > 100) alloc.alertStatus = 'Exceeded';
    else if (pct >= 85) alloc.alertStatus = 'Critical';
    else if (pct >= 70) alloc.alertStatus = 'Warning';
    else alloc.alertStatus = 'Normal';
  });
}

export async function updateAllocationAmount(allocationId: number, newAllocatedAmount: number): Promise<BudgetAllocation | null> {
  const alloc = budgetAllocations.find(a => a.id === allocationId);
  if (alloc) {
    alloc.allocatedAmount = newAllocatedAmount;
    recalculateCommittedAmounts();
    await syncAllocationToFirestore(alloc.departmentId, alloc.budgetHeadId);
    return alloc;
  }
  return null;
}

export async function updateBudgetHeadAllocation(departmentId: number, budgetHeadId: number, newAllocatedAmount: number): Promise<BudgetAllocation | null> {
  let alloc = budgetAllocations.find(a => a.departmentId === departmentId && a.budgetHeadId === budgetHeadId);
  if (alloc) {
    alloc.allocatedAmount = newAllocatedAmount;
    recalculateCommittedAmounts();
    await syncAllocationToFirestore(departmentId, budgetHeadId);
    return alloc;
  }
  return null;
}

export async function updatePRStatusRecord(
  id: number | string,
  approvalStatus?: 'Approved' | 'Pending' | 'Rejected',
  status?: 'Open' | 'Approved' | 'Pending' | 'Rejected' | 'Closed',
  prPoStatus?: 'Open' | 'Closed' | 'In-Process',
  tierApproval?: {
    stage: 'Principal' | 'CEO';
    action: 'Approved' | 'Rejected';
    remarks?: string;
    actionBy?: string;
  }
): Promise<PRRecord | null> {
  loadSeedData();
  const pr = prRecords.find(p => String(p.id) === String(id) || p.prNumber.toLowerCase() === String(id).toLowerCase());
  if (!pr) return null;

  if (!pr.principalEmail) pr.principalEmail = 'principal@viit.ac.in';
  if (!pr.ceoEmail) pr.ceoEmail = 'ceo@viit.ac.in';
  if (!pr.emailLogs) pr.emailLogs = [];

  const now = new Date().toISOString();

  if (tierApproval) {
    if (tierApproval.stage === 'Principal') {
      if (tierApproval.action === 'Approved') {
        pr.principalStatus = 'APPROVED';
        pr.principalActionAt = now;
        pr.principalRemarks = tierApproval.remarks || 'Approved by Principal';
        pr.approvalStage = 'PENDING_CEO';
        pr.approvalStatus = 'Pending';
        pr.approval1 = 'Principal Approved';

        // Dispatch Email to CEO
        const emailLog = sendPREmailNotification(
          pr.id,
          pr.prNumber,
          pr.ceoEmail,
          'CEO',
          pr.totalAmount,
          pr.departmentName,
          pr.purpose || 'Purchase Requisition Approval'
        );
        pr.emailLogs.push(emailLog);

      } else if (tierApproval.action === 'Rejected') {
        pr.principalStatus = 'REJECTED';
        pr.principalActionAt = now;
        pr.principalRemarks = tierApproval.remarks || 'Rejected by Principal';
        pr.approvalStage = 'REJECTED';
        pr.approvalStatus = 'Rejected';
        pr.status = 'Rejected';
        pr.approval1 = 'Rejected by Principal';
      }
    } else if (tierApproval.stage === 'CEO') {
      if (pr.principalStatus === 'REJECTED') {
        throw new Error('Sequential workflow policy error: This Purchase Requisition was REJECTED by the Principal at Tier 1. CEO sign-off is permanently disabled.');
      }
      if (pr.principalStatus !== 'APPROVED') {
        throw new Error('Sequential workflow policy error: Tier 1 Principal approval is required prior to CEO sign-off.');
      }
      if (tierApproval.action === 'Approved') {
        pr.ceoStatus = 'APPROVED';
        pr.ceoActionAt = now;
        pr.ceoRemarks = tierApproval.remarks || 'Approved by CEO';
        pr.approvalStage = 'APPROVED';
        pr.approvalStatus = 'Approved';
        pr.status = 'Approved';
        pr.approval2 = 'CEO Approved';
        pr.approval3 = 'Fully Approved';
      } else if (tierApproval.action === 'Rejected') {
        pr.ceoStatus = 'REJECTED';
        pr.ceoActionAt = now;
        pr.ceoRemarks = tierApproval.remarks || 'Rejected by CEO';
        pr.approvalStage = 'REJECTED';
        pr.approvalStatus = 'Rejected';
        pr.status = 'Rejected';
        pr.approval2 = 'Rejected by CEO';
      }
    }
  } else if (approvalStatus) {
    if (approvalStatus === 'Approved') {
      if (pr.principalStatus === 'REJECTED') {
        throw new Error('Sequential workflow policy error: This Purchase Requisition was REJECTED by the Principal at Tier 1. It cannot be approved.');
      }
      pr.approvalStatus = approvalStatus;
      pr.approvalStage = 'APPROVED';
      pr.principalStatus = 'APPROVED';
      pr.principalActionAt = pr.principalActionAt || now;
      pr.ceoStatus = 'APPROVED';
      pr.ceoActionAt = pr.ceoActionAt || now;
      pr.approval1 = 'Principal Approved';
      pr.approval2 = 'CEO Approved';
      pr.approval3 = 'Fully Approved';
      if (!status) pr.status = 'Approved';
    } else if (approvalStatus === 'Rejected') {
      pr.approvalStage = 'REJECTED';
      if (!pr.principalStatus || pr.principalStatus === 'PENDING') {
        pr.principalStatus = 'REJECTED';
        pr.principalActionAt = now;
      } else if (!pr.ceoStatus || pr.ceoStatus === 'PENDING') {
        pr.ceoStatus = 'REJECTED';
        pr.ceoActionAt = now;
      }
      pr.approval1 = 'Rejected';
      if (!status) pr.status = 'Rejected';
    } else if (approvalStatus === 'Pending') {
      pr.approvalStage = 'PENDING_PRINCIPAL';
      pr.principalStatus = 'PENDING';
      pr.ceoStatus = 'PENDING';
      pr.approval1 = 'Pending Principal Review';
      if (!status) pr.status = 'Pending';
    }
  }

  if (status) {
    pr.status = status;
    if (status === 'Closed') {
      pr.prPoStatus = 'Closed';
    } else if (status === 'Approved' && pr.prPoStatus === 'Closed') {
      pr.prPoStatus = 'Open';
    }
  }

  if (prPoStatus) {
    pr.prPoStatus = prPoStatus;
  }

  recalculateCommittedAmounts();
  await syncPRToFirestore(pr);
  await syncAllocationToFirestore(pr.departmentId, pr.budgetHeadId);
  return pr;
}

export async function createPRRecord(prInput: {
  departmentId: number;
  budgetHeadId: number;
  requestedBy: string;
  purpose: string;
  principalName?: string;
  principalEmail?: string;
  ceoName?: string;
  ceoEmail?: string;
  items: Array<{
    productName: string;
    productDescription?: string;
    quantity: number;
    unitPrice: number;
    preferredVendor?: string;
    itemRemarks?: string;
  }>;
  prDate?: string;
  approvalStatus?: 'Approved' | 'Pending' | 'Rejected';
  approvalStage?: 'PENDING_PRINCIPAL' | 'PENDING_CEO' | 'APPROVED' | 'REJECTED';
  status?: 'Open' | 'Approved' | 'Pending' | 'Rejected' | 'Closed';
  documentUrl?: string;
  documentName?: string;
  documentSize?: number;
  documentType?: string;
  attachments?: Array<{
    name: string;
    url: string;
    size?: number;
    type?: string;
    uploadedAt?: string;
  }>;
}): Promise<PRRecord> {
  loadSeedData();

  const deptObj = departments.find(d => d.id === prInput.departmentId) || departments[0];
  const headObj = budgetHeads.find(bh => bh.id === prInput.budgetHeadId) || budgetHeads[0];

  const nextId = getPgStatus() ? crypto.randomUUID() : (prRecords.length > 0 ? Math.max(...prRecords.map(p => Number(p.id) || 0)) + 1 : 1);
  const prNumber = `PR-2026-${String(prRecords.length + 1).padStart(4, '0')}`;
  const prDate = prInput.prDate || new Date().toISOString().substring(0, 10);
 
  const principalName = prInput.principalName || 'Dr. V. Rama Rao';
  const principalEmail = prInput.principalEmail || 'principal@viit.ac.in';
  const ceoName = prInput.ceoName || 'Sri L. Rathaiah';
  const ceoEmail = prInput.ceoEmail || 'ceo@viit.ac.in';

  const approvalStatus = prInput.approvalStatus || 'Pending';
  const approvalStage = prInput.approvalStage || (
    approvalStatus === 'Approved' ? 'APPROVED' :
    approvalStatus === 'Rejected' ? 'REJECTED' : 'PENDING_PRINCIPAL'
  );

  const status = prInput.status || (approvalStage === 'APPROVED' ? 'Approved' : approvalStage === 'REJECTED' ? 'Rejected' : 'Pending');

  const principalStatus = approvalStage === 'APPROVED' || approvalStage === 'PENDING_CEO' ? 'APPROVED' : (approvalStage === 'REJECTED' ? 'REJECTED' : 'PENDING');
  const ceoStatus = approvalStage === 'APPROVED' ? 'APPROVED' : 'PENDING';

  let totalAmount = 0;
  let itemIdCounter = typeof nextId === 'number' ? (1000 + nextId * 10) : 0;
  const createdItems: PRItem[] = (prInput.items || []).map(item => {
    const qty = Math.max(1, item.quantity || 1);
    const price = Math.max(0, item.unitPrice || 0);
    const itemTotal = qty * price;
    totalAmount += itemTotal;
 
    return {
      id: typeof nextId === 'number' ? itemIdCounter++ : crypto.randomUUID(),
      prId: nextId,
      productName: item.productName || 'Equipment / Service Item',
      productCode: `PROD-${itemIdCounter}`,
      productType: 'goods',
      productDescription: item.productDescription || '-NA-',
      unitTypeName: 'Numbers',
      quantity: qty,
      unitPrice: price,
      totalValue: itemTotal,
      currentStock: 0,
      preferredVendor: item.preferredVendor || '-NA-',
      productRequiredBy: prDate,
      itemRemarks: item.itemRemarks || '-NA-'
    };
  });

  const emailLogs = [];
  if (principalStatus === 'PENDING') {
    const emailLog = sendPREmailNotification(
      nextId,
      prNumber,
      principalEmail,
      'Principal',
      totalAmount,
      deptObj.name,
      prInput.purpose || 'Purchase Requisition Approval'
    );
    emailLogs.push(emailLog);
  }

  const newPR: PRRecord = {
    id: nextId,
    prNumber,
    prDate,
    departmentId: deptObj.id,
    departmentCode: deptObj.code,
    departmentName: deptObj.name,
    budgetHeadId: headObj.id,
    budgetHeadCode: headObj.code,
    budgetHeadName: headObj.name,
    requestedBy: prInput.requestedBy || 'Admin Applied PR',
    purpose: prInput.purpose || 'Manual Department Purchase Request',
    totalAmount,
    status,
    approvalStatus: approvalStage === 'APPROVED' ? 'Approved' : approvalStage === 'REJECTED' ? 'Rejected' : 'Pending',
    prPoStatus: 'Open',
    principalName,
    principalEmail,
    principalStatus,
    ceoName,
    ceoEmail,
    ceoStatus,
    approvalStage,
    emailLogs,
    approval1: principalStatus === 'APPROVED' ? 'Principal Approved' : 'Pending Principal Review',
    approval2: ceoStatus === 'APPROVED' ? 'CEO Approved' : (principalStatus === 'APPROVED' ? 'Pending CEO Review' : 'Waiting for Principal'),
    approval3: approvalStage === 'APPROVED' ? 'Fully Approved' : 'Pending Approvals',
    sourceBudgetCode: `${headObj.code}${deptObj.code}`,
    documentUrl: prInput.documentUrl,
    documentName: prInput.documentName,
    documentSize: prInput.documentSize,
    documentType: prInput.documentType,
    attachments: prInput.attachments || (prInput.documentUrl ? [{
      name: prInput.documentName || 'PR Supporting Document',
      url: prInput.documentUrl,
      size: prInput.documentSize,
      type: prInput.documentType,
      uploadedAt: new Date().toISOString()
    }] : []),
    items: createdItems
  };

  prRecords.unshift(newPR);
  prItemsMap.set(nextId, createdItems);

  recalculateCommittedAmounts();
  await syncPRToFirestore(newPR);
  await syncAllocationToFirestore(newPR.departmentId, newPR.budgetHeadId);
  return newPR;
}

export async function createOrUpdateBudgetAllocation(
  departmentId: number,
  budgetHeadId: number,
  allocatedAmount: number,
  financialYear: string = '2026-27'
): Promise<BudgetAllocation> {
  loadSeedData();

  let alloc = budgetAllocations.find(a => a.departmentId === departmentId && a.budgetHeadId === budgetHeadId);
  const deptObj = departments.find(d => d.id === departmentId);
  const headObj = budgetHeads.find(bh => bh.id === budgetHeadId);

  if (alloc) {
    alloc.allocatedAmount = allocatedAmount;
  } else {
    const nextId = getPgStatus() ? crypto.randomUUID() : (budgetAllocations.length > 0 ? Math.max(...budgetAllocations.map(a => Number(a.id) || 0)) + 1 : 1);
    alloc = {
      id: nextId,
      departmentId: deptObj ? deptObj.id : departmentId,
      departmentCode: deptObj ? deptObj.code : `DEPT${departmentId}`,
      departmentName: deptObj ? deptObj.name : `Department ${departmentId}`,
      budgetHeadId: headObj ? headObj.id : budgetHeadId,
      budgetHeadCode: headObj ? headObj.code : budgetHeadId,
      budgetHeadName: headObj ? headObj.name : `Budget Head ${budgetHeadId}`,
      sourceBudgetCode: `${headObj ? headObj.code : budgetHeadId}${deptObj ? deptObj.code : departmentId}`,
      financialYear,
      allocatedAmount,
      committedAmount: 0,
      actualUtilizedAmount: 0,
      remainingAmount: allocatedAmount,
      utilizationPercentage: 0,
      alertStatus: 'Normal'
    };
    budgetAllocations.push(alloc);
  }

  recalculateCommittedAmounts();
  await syncAllocationToFirestore(alloc.departmentId, alloc.budgetHeadId);
  return alloc;
}

// Data Accessors
export function getSeedDepartments(): Department[] {
  loadSeedData();
  return departments;
}

export function getSeedBudgetHeads(): BudgetHead[] {
  loadSeedData();
  return budgetHeads;
}

export function getSeedBudgetAllocations(): BudgetAllocation[] {
  loadSeedData();
  return budgetAllocations;
}

export function getSeedPRRecords(): PRRecord[] {
  loadSeedData();
  return prRecords;
}

export function getSeedUsers(): User[] {
  loadSeedData();
  if (!users || users.length === 0) {
    initDefaultUsers();
  }
  return users;
}

export function initDefaultInvoices(): InvoiceRecord[] {
  invoiceRecords = [];
  return invoiceRecords;
}

export function getSeedInvoices(): InvoiceRecord[] {
  loadSeedData();
  if (invoiceRecords.length === 0) {
    initDefaultInvoices();
  }
  return invoiceRecords;
}

export async function createInvoiceRecord(input: {
  invoiceNumber: string;
  invoiceDate?: string;
  prId: number | string;
  vendorName: string;
  totalAmount: number;
  taxAmount?: number;
  remarks?: string;
  submittedBy?: string;
}): Promise<InvoiceRecord> {
  loadSeedData();
  if (invoiceRecords.length === 0) {
    initDefaultInvoices();
  }

  const pr = prRecords.find(p => String(p.id) === String(input.prId) || p.prNumber.toLowerCase() === String(input.prId).toLowerCase()) || prRecords[0];

  const nextId = invoiceRecords.length > 0 ? Math.max(...invoiceRecords.map(i => Number(i.id) || 0)) + 1 : 1;
  const newInvoice: InvoiceRecord = {
    id: nextId,
    invoiceNumber: input.invoiceNumber || `INV-2026-${String(nextId).padStart(3, '0')}`,
    invoiceDate: input.invoiceDate || new Date().toISOString().substring(0, 10),
    prId: pr.id,
    prNumber: pr.prNumber,
    departmentId: pr.departmentId,
    departmentCode: pr.departmentCode,
    departmentName: pr.departmentName,
    budgetHeadId: pr.budgetHeadId,
    budgetHeadCode: pr.budgetHeadCode,
    budgetHeadName: pr.budgetHeadName,
    vendorName: input.vendorName || 'Vendor Supplier',
    totalAmount: Number(input.totalAmount) || pr.totalAmount || 0,
    taxAmount: Number(input.taxAmount) || 0,
    status: 'Pending',
    paymentStatus: 'Unpaid',
    remarks: input.remarks || '',
    submittedBy: input.submittedBy || 'HOD User',
    createdAt: new Date().toISOString().substring(0, 10)
  };

  invoiceRecords.unshift(newInvoice);
  recalculateCommittedAmounts();

  // Persist to database
  await syncInvoiceToFirestore(newInvoice);

  return newInvoice;
}

export async function updateInvoiceStatusRecord(
  id: number | string,
  status: 'Pending' | 'Approved' | 'Paid' | 'Rejected',
  paymentStatus?: 'Unpaid' | 'Partial' | 'Paid'
): Promise<InvoiceRecord | null> {
  loadSeedData();
  if (invoiceRecords.length === 0) {
    initDefaultInvoices();
  }

  const inv = invoiceRecords.find(i => String(i.id) === String(id));
  if (!inv) return null;

  inv.status = status;
  if (status === 'Paid') {
    inv.paymentStatus = 'Paid';
    inv.paymentDate = new Date().toISOString().substring(0, 10);
  } else if (paymentStatus) {
    inv.paymentStatus = paymentStatus;
  }

  recalculateCommittedAmounts();

  // Persist to database
  await syncInvoiceToFirestore(inv);

  return inv;
}

// ============================================================================
// Firebase Firestore Sync Helpers
// ============================================================================

export async function syncAllocationToFirestore(departmentId: number | string, budgetHeadId: number | string) {
  // Sync to Postgres in background
  await syncAllocationToPostgres(departmentId, budgetHeadId);

  if (!isFirebaseEnabled()) return;
  const db = getFirestoreDb();
  if (!db) return;

  const alloc = budgetAllocations.find(a => 
    (String(a.departmentId) === String(departmentId) || (a.departmentCode && String(departmentId) && a.departmentCode.trim().toUpperCase() === String(departmentId).trim().toUpperCase())) && 
    (String(a.budgetHeadId) === String(budgetHeadId) || a.budgetHeadCode === Number(budgetHeadId))
  );
  if (alloc) {
    try {
      const cleaned = JSON.parse(JSON.stringify(alloc));
      const documentId = alloc.sourceBudgetCode || `${alloc.budgetHeadCode}_${alloc.departmentCode}`;
      await db.collection('budgetAllocations').doc(String(documentId)).set(cleaned, { merge: true });
      console.log(`[Firebase] Synced budget allocation ${alloc.sourceBudgetCode} to Firestore.`);
    } catch (err: any) {
      console.error(`[Firebase Error] Failed to sync allocation: ${err.message}`);
      throw new Error(`Firebase could not save budget allocation: ${err.message}`);
    }
  }
}

export async function syncPRToFirestore(pr: PRRecord) {
  // Sync to Postgres in background
  await syncPRToPostgres(pr);

  if (!isFirebaseEnabled()) return;
  const db = getFirestoreDb();
  if (!db) return;

  try {
    const cleaned = JSON.parse(JSON.stringify(pr));
    await db.collection('prs').doc(pr.prNumber).set(cleaned);
    console.log(`[Firebase] Synced PR ${pr.prNumber} to Firestore.`);
  } catch (err: any) {
    console.error(`[Firebase Error] Failed to sync PR: ${err.message}`);
    throw new Error(`Firebase could not save purchase requisition: ${err.message}`);
  }
}

export async function syncInvoiceToFirestore(inv: InvoiceRecord) {
  // Sync to Postgres in background
  await syncInvoiceToPostgres(inv);

  if (!isFirebaseEnabled()) return;
  const db = getFirestoreDb();
  if (!db) return;

  try {
    const cleaned = JSON.parse(JSON.stringify(inv));
    await db.collection('invoices').doc(inv.invoiceNumber).set(cleaned);
    console.log(`[Firebase] Synced invoice ${inv.invoiceNumber} to Firestore.`);
  } catch (err: any) {
    console.error(`[Firebase Error] Failed to sync invoice: ${err.message}`);
    throw new Error(`Firebase could not save invoice: ${err.message}`);
  }
}

function generateSamplePRs(): PRRecord[] {
  return [];
}

function parseFirestoreRestFields(fields: any) {
  if (!fields) return {};
  const res: any = {};
  for (const [key, val] of Object.entries<any>(fields)) {
    if ('stringValue' in val) res[key] = val.stringValue;
    else if ('integerValue' in val) res[key] = Number(val.integerValue);
    else if ('doubleValue' in val) res[key] = Number(val.doubleValue);
    else if ('booleanValue' in val) res[key] = val.booleanValue;
    else if ('arrayValue' in val) {
      res[key] = (val.arrayValue.values || []).map((v: any) => parseFirestoreRestFields({ item: v }).item);
    } else if ('mapValue' in val) {
      res[key] = parseFirestoreRestFields(val.mapValue.fields);
    }
  }
  return res;
}

async function fetchFirestoreCollectionRest(collectionName: string): Promise<any[]> {
  try {
    let allDocs: any[] = [];
    let pageToken = '';
    do {
      const url = `https://firestore.googleapis.com/v1/projects/collegefinance-87409/databases/(default)/documents/${collectionName}?pageSize=300${pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : ''}`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        }
      });
      if (!response.ok) break;
      const data: any = await response.json();
      if (data.documents && Array.isArray(data.documents)) {
        allDocs.push(...data.documents.map((doc: any) => parseFirestoreRestFields(doc.fields)));
      }
      pageToken = data.nextPageToken || '';
    } while (pageToken);
    return allDocs;
  } catch (err) {
    return [];
  }
}

export async function syncDataFromFirebase(): Promise<boolean> {
  if (firebaseDataSynced && departments.length > 0 && budgetAllocations.length > 0) {
    console.log('[Firebase] Remote dataset is already hydrated in memory.');
    return true;
  }

  if (!isFirebaseEnabled() || !getFirestoreDb()) {
    console.error('[Firebase] Admin SDK is unavailable; remote data was not loaded.');
    return false;
  }

  const db = getFirestoreDb()!;

  try {
    console.log('[Firebase] Syncing data from Firestore to memory...');
    
    // Fetch departments & allocations
    const deptSnap = await db.collection('departments').get();
    const allocSnap = await db.collection('budgetAllocations').get();
    if (deptSnap.empty || allocSnap.empty) {
      console.log('[Firebase] Firestore is missing master budget. Loading and seeding the embedded master dataset...');
      loadSeedData(true);
      await seedFirebaseFromLocalData();
      firebaseDataSynced = true;
      return true;
    }

    const fetchedDepts: Department[] = [];
    deptSnap.forEach((doc: any) => fetchedDepts.push(doc.data() as Department));
    departments = fetchedDepts.sort((a, b) => Number(a.id) - Number(b.id));

    // Fetch users
    const userSnap = await db.collection('users').get();
    const fetchedUsers: User[] = [];
    userSnap.forEach((doc: any) => fetchedUsers.push(doc.data() as User));
    if (fetchedUsers.length > 0) {
      users = fetchedUsers.sort((a, b) => Number(a.id) - Number(b.id));
    } else {
      initDefaultUsers();
    }

    // Fetch budgetHeads
    const bhSnap = await db.collection('budgetHeads').get();
    const fetchedHeads: BudgetHead[] = [];
    bhSnap.forEach((doc: any) => fetchedHeads.push(doc.data() as BudgetHead));
    budgetHeads = fetchedHeads.sort((a, b) => Number(a.id) - Number(b.id));

    // Fetch budgetAllocations
    const fetchedAllocs: BudgetAllocation[] = [];
    allocSnap.forEach((doc: any) => fetchedAllocs.push(doc.data() as BudgetAllocation));
    budgetAllocations = fetchedAllocs.sort((a, b) => Number(a.id) - Number(b.id));

    // Fetch prs
    const prSnap = await db.collection('prs').get();
    const fetchedPRs: PRRecord[] = [];
    if (!prSnap.empty) {
      prSnap.forEach((doc: any) => {
        const pr = doc.data() as PRRecord;
        fetchedPRs.push(pr);
        if (pr.items) {
          prItemsMap.set(pr.id, pr.items);
        }
      });
    }
    
    if (fetchedPRs.length > 0) {
      prRecords = fetchedPRs.sort((a, b) => Number(b.id) - Number(a.id));
    } else {
      console.log(`[Firebase Sync] Firestore has only ${fetchedPRs.length} PRs. Loading complete embedded PR dataset (${EMBEDDED_PRS.length} PRs)...`);
      prRecords = JSON.parse(JSON.stringify(EMBEDDED_PRS));
      prRecords.forEach(pr => {
        if (pr.items) prItemsMap.set(pr.id, pr.items);
      });
    }

    // Fetch invoices
    const invSnap = await db.collection('invoices').get();
    const fetchedInvoices: InvoiceRecord[] = [];
    if (!invSnap.empty) {
      invSnap.forEach((doc: any) => fetchedInvoices.push(doc.data() as InvoiceRecord));
    }
    invoiceRecords = fetchedInvoices.sort((a, b) => Number(b.id) - Number(a.id));

    // Recalculate allocation committed amounts & utilization with active PR data
    recalculateCommittedAmounts();

    isInitialized = true;
    firebaseDataSynced = true;
    console.log(`[Firebase] Successfully synced from Firestore: ${departments.length} departments, ${users.length} users, ${budgetHeads.length} budget heads, ${budgetAllocations.length} allocations, ${prRecords.length} PRs, ${invoiceRecords.length} invoices.`);
    return true;
  } catch (error: any) {
    console.error(`[Firebase Sync Error] Failed to sync from Firestore: ${error.message}`);
    console.log('[Firebase] Falling back to local data modes.');
    return false;
  }
}

export async function syncUserToFirestore(user: User): Promise<void> {
  if (!isFirebaseEnabled()) return;
  const db = getFirestoreDb();
  if (!db) throw new Error('Firebase is enabled, but Firestore is unavailable.');
  try {
    const cleaned = JSON.parse(JSON.stringify(user));
    await db.collection('users').doc(String(user.email).toLowerCase()).set(cleaned, { merge: true });
  } catch (err: any) {
    throw new Error(`Firebase could not save user: ${err.message}`);
  }
}

export function isFirebaseDatasetLoaded(): boolean {
  return firebaseDataSynced;
}

export async function seedFirebaseFromLocalData() {
  if (!isFirebaseEnabled()) return;
  const db = getFirestoreDb();
  if (!db) return;

  try {
    console.log('[Firebase] Seeding Firestore with local Excel data...');
    const writeInBatches = async (collectionName: string, items: any[], getId: (item: any) => string) => {
      let batch = db.batch();
      let count = 0;
      for (const item of items) {
        const cleaned = JSON.parse(JSON.stringify(item));
        const docRef = db.collection(collectionName).doc(getId(cleaned));
        batch.set(docRef, cleaned);
        count++;
        if (count === 400) {
          await batch.commit();
          batch = db.batch();
          count = 0;
        }
      }
      if (count > 0) {
        await batch.commit();
      }
    };

    await writeInBatches('departments', departments, (item) => item.code);
    await writeInBatches('users', users, (item) => item.email);
    await writeInBatches('budgetHeads', budgetHeads, (item) => String(item.code));
    await writeInBatches('budgetAllocations', budgetAllocations, (item) => item.sourceBudgetCode || `${item.budgetHeadCode}_${item.departmentCode}`);
    await writeInBatches('prs', prRecords, (item) => item.prNumber);

    // Seed invoices if available
    if (invoiceRecords.length === 0) {
      initDefaultInvoices();
    }
    await writeInBatches('invoices', invoiceRecords, (item) => item.invoiceNumber);

    console.log('[Firebase] Firestore seeding complete.');
  } catch (err: any) {
    console.error(`[Firebase Error] Failed to seed Firestore: ${err.message}`);
    throw new Error(`Firebase synchronization failed: ${err.message}`);
  }
}

// ============================================================================
// PostgreSQL Sync Helpers
// ============================================================================

export async function syncAllocationToPostgres(departmentId: number | string, budgetHeadId: number | string) {
  if (!getPgStatus()) return;

  const alloc = budgetAllocations.find(a => 
    (String(a.departmentId) === String(departmentId) || (a.departmentCode && String(departmentId) && a.departmentCode.trim().toUpperCase() === String(departmentId).trim().toUpperCase())) && 
    (String(a.budgetHeadId) === String(budgetHeadId) || a.budgetHeadCode === Number(budgetHeadId))
  );
  if (alloc) {
    try {
      await executePgQuery(
        `INSERT INTO budget_allocation 
          (id, department_id, budget_head_id, source_budget_code, financial_year, 
           allocated_amount, committed_amount, actual_utilized_amount, remaining_amount, 
           utilization_percentage, alert_status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (source_budget_code) DO UPDATE SET
           allocated_amount = EXCLUDED.allocated_amount,
           committed_amount = EXCLUDED.committed_amount,
           actual_utilized_amount = EXCLUDED.actual_utilized_amount,
           remaining_amount = EXCLUDED.remaining_amount,
           utilization_percentage = EXCLUDED.utilization_percentage,
           alert_status = EXCLUDED.alert_status`,
        [
          alloc.id, alloc.departmentId, alloc.budgetHeadId, alloc.sourceBudgetCode, alloc.financialYear,
          alloc.allocatedAmount, alloc.committedAmount, alloc.actualUtilizedAmount,
          alloc.remainingAmount, alloc.utilizationPercentage, alloc.alertStatus
        ]
      );
      console.log(`[PostgreSQL] Synced budget allocation ${alloc.sourceBudgetCode} to Cloud SQL.`);
    } catch (err: any) {
      console.error(`[PostgreSQL Error] Failed to sync allocation: ${err.message}`);
    }
  }
}

export async function syncInvoiceToPostgres(inv: InvoiceRecord) {
  if (!getPgStatus()) return;

  try {
    await executePgQuery(
      `INSERT INTO invoice 
        (id, invoice_number, invoice_date, pr_id, pr_number, department_id, 
         budget_head_id, vendor_name, total_amount, tax_amount, 
         status, payment_status, payment_date, remarks, submitted_by, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       ON CONFLICT (invoice_number) DO UPDATE SET
         status = EXCLUDED.status,
         payment_status = EXCLUDED.payment_status,
         payment_date = EXCLUDED.payment_date,
         total_amount = EXCLUDED.total_amount,
         tax_amount = EXCLUDED.tax_amount,
         remarks = EXCLUDED.remarks`,
      [
        inv.id, inv.invoiceNumber, inv.invoiceDate, inv.prId, inv.prNumber, inv.departmentId,
        inv.budgetHeadId, inv.vendorName, inv.totalAmount, inv.taxAmount || 0,
        inv.status, inv.paymentStatus, inv.paymentDate || null, inv.remarks || '',
        inv.submittedBy, inv.createdAt || new Date().toISOString().substring(0, 10)
      ]
    );
    console.log(`[PostgreSQL] Synced invoice ${inv.invoiceNumber} to Cloud SQL.`);
  } catch (err: any) {
    console.error(`[PostgreSQL Error] Failed to sync invoice: ${err.message}`);
  }
}

export async function syncPRToPostgres(pr: PRRecord) {
  if (!getPgStatus()) return;

  try {
    // 1. Upsert PR Record
    await executePgQuery(
      `INSERT INTO purchase_request 
        (id, pr_number, pr_date, department_id, budget_head_id, requested_by, 
         purpose, total_amount, status, approval_status, pr_po_status, 
         approval1, approval2, approval3, source_budget_code) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT (pr_number) DO UPDATE SET
         pr_date = EXCLUDED.pr_date,
         purpose = EXCLUDED.purpose,
         total_amount = EXCLUDED.total_amount,
         status = EXCLUDED.status,
         approval_status = EXCLUDED.approval_status,
         pr_po_status = EXCLUDED.pr_po_status,
         approval1 = EXCLUDED.approval1,
         approval2 = EXCLUDED.approval2,
         approval3 = EXCLUDED.approval3`,
      [
        pr.id, pr.prNumber, pr.prDate, pr.departmentId, pr.budgetHeadId, pr.requestedBy,
        pr.purpose || '', pr.totalAmount, pr.status, pr.approvalStatus, pr.prPoStatus,
        pr.approval1 || '', pr.approval2 || '', pr.approval3 || '', pr.sourceBudgetCode
      ]
    );

    // 2. Clear old PR Items
    await executePgQuery('DELETE FROM purchase_request_item WHERE purchase_request_id = $1', [pr.id]);

    // 3. Re-insert items
    const items = prItemsMap.get(pr.id) || [];
    for (const item of items) {
      const itemUuid = crypto.randomUUID();
      await executePgQuery(
        `INSERT INTO purchase_request_item 
          (id, purchase_request_id, product_name, product_code, product_type, product_description, 
           unit_type_name, quantity, unit_price, total_value, current_stock, 
           preferred_vendor, product_required_by, item_remarks) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          itemUuid, pr.id, item.productName, item.productCode || '', item.productType || 'goods',
          item.productDescription || '', item.unitTypeName || 'Numbers', item.quantity,
          item.unitPrice, item.totalValue, item.currentStock || 0, item.preferredVendor || '',
          item.productRequiredBy || '', item.itemRemarks || ''
        ]
      );
    }

    console.log(`[PostgreSQL] Synced PR ${pr.prNumber} and ${items.length} items to Cloud SQL.`);
  } catch (err: any) {
    console.error(`[PostgreSQL Error] Failed to sync PR: ${err.message}`);
  }
}

export async function syncDataFromPostgres(): Promise<boolean> {
  if (!getPgStatus()) {
    console.log('[PostgreSQL] Not enabled. Skipping PostgreSQL synchronization.');
    return false;
  }

  try {
    console.log('[PostgreSQL] Syncing data from Cloud SQL to memory...');
    
    // Fetch departments
    const dbDepts = await queryPgAsync<any>('SELECT id, dept_code as code, dept_name as name, category FROM department');
    if (dbDepts.length === 0) {
      console.log('[PostgreSQL] Database master budget is empty. Operating in clean empty dataset mode.');
      initDefaultUsers();
      departments = [];
      budgetHeads = [];
      budgetAllocations = [];
      prRecords = [];
      prItemsMap = new Map();
      invoiceRecords = [];
      isInitialized = true;
      return true;
    }
    departments = dbDepts.map((d: any) => ({
      id: d.id,
      code: d.code,
      name: d.name,
      category: d.category
    })).sort((a: any, b: any) => String(a.id).localeCompare(String(b.id)));

    // Fetch users
    const dbUsers = await queryPgAsync<any>('SELECT id, name, email, role, department_id as "departmentId" FROM "user"');
    users = dbUsers.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      departmentId: u.departmentId
    })).sort((a: any, b: any) => String(a.id).localeCompare(String(b.id)));

    // Fetch budget heads
    const dbHeads = await queryPgAsync<any>('SELECT id, budget_head_code as code, name, category, description FROM budget_head');
    budgetHeads = dbHeads.map((h: any) => ({
      id: h.id,
      code: Number(h.code),
      name: h.name,
      category: h.category,
      description: h.description
    })).sort((a: any, b: any) => String(a.id).localeCompare(String(b.id)));

    // Fetch allocations
    const dbAllocations = await queryPgAsync<any>(`
      SELECT id, department_id as "departmentId", budget_head_id as "budgetHeadId", source_budget_code as "sourceBudgetCode", financial_year as "financialYear",
             allocated_amount as "allocatedAmount", committed_amount as "committedAmount", actual_utilized_amount as "actualUtilizedAmount", remaining_amount as "remainingAmount",
             utilization_percentage as "utilizationPercentage", alert_status as "alertStatus"
      FROM budget_allocation
    `);
    
    const deptMap = new Map(departments.map(d => [d.id, d]));
    const headMap = new Map(budgetHeads.map(h => [h.id, h]));

    budgetAllocations = dbAllocations.map((a: any) => {
      const dept = deptMap.get(a.departmentId);
      const head = headMap.get(a.budgetHeadId);
      return {
        id: a.id,
        departmentId: a.departmentId,
        departmentCode: dept ? dept.code : '',
        departmentName: dept ? dept.name : '',
        budgetHeadId: a.budgetHeadId,
        budgetHeadCode: head ? head.code : 0,
        budgetHeadName: head ? head.name : '',
        sourceBudgetCode: a.sourceBudgetCode,
        financialYear: a.financialYear,
        allocatedAmount: Number(a.allocatedAmount),
        committedAmount: Number(a.committedAmount),
        actualUtilizedAmount: Number(a.actualUtilizedAmount),
        remainingAmount: Number(a.remainingAmount),
        utilizationPercentage: Number(a.utilizationPercentage),
        alertStatus: a.alertStatus as any
      };
    }).sort((a: any, b: any) => String(a.id).localeCompare(String(b.id)));

    // Fetch PRs
    const dbPRs = await queryPgAsync<any>(`
      SELECT id, pr_number as "prNumber", to_char(pr_date, 'YYYY-MM-DD') as "prDate", department_id as "departmentId", budget_head_id as "budgetHeadId", requested_by as "requestedBy",
             purpose, total_amount as "totalAmount", status, approval_status as "approvalStatus", pr_po_status as "prPoStatus",
             approval1, approval2, approval3, source_budget_code as "sourceBudgetCode"
      FROM purchase_request
    `);

    // Fetch PR Items
    const dbPRItems = await queryPgAsync<any>(`
      SELECT id, purchase_request_id as "prId", product_name as "productName", product_code as "productCode", product_type as "productType", product_description as "productDescription",
             unit_type_name as "unitTypeName", quantity, unit_price as "unitPrice", total_value as "totalValue", current_stock as "currentStock",
             preferred_vendor as "preferredVendor", product_required_by as "productRequiredBy", item_remarks as "itemRemarks"
      FROM purchase_request_item
    `);

    // Group items by prId
    const itemsByPrId = new Map<string, PRItem[]>();
    dbPRItems.forEach((item: any) => {
      const mappedItem: PRItem = {
        id: item.id,
        prId: item.prId,
        productName: item.productName,
        productCode: item.productCode,
        productType: item.productType,
        productDescription: item.productDescription,
        unitTypeName: item.unitTypeName,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalValue: Number(item.totalValue),
        currentStock: Number(item.currentStock),
        preferredVendor: item.preferredVendor,
        productRequiredBy: item.productRequiredBy,
        itemRemarks: item.itemRemarks
      };
      if (!itemsByPrId.has(item.prId)) {
        itemsByPrId.set(item.prId, []);
      }
      itemsByPrId.get(item.prId)!.push(mappedItem);
    });

    prRecords = dbPRs.map((p: any) => {
      const dept = deptMap.get(p.departmentId);
      const head = headMap.get(p.budgetHeadId);
      const items = itemsByPrId.get(p.id) || [];
      prItemsMap.set(p.id, items);
      
      return {
        id: p.id,
        prNumber: p.prNumber,
        prDate: p.prDate,
        departmentId: p.departmentId,
        departmentCode: dept ? dept.code : '',
        departmentName: dept ? dept.name : '',
        budgetHeadId: p.budgetHeadId,
        budgetHeadCode: head ? head.code : 0,
        budgetHeadName: head ? head.name : '',
        requestedBy: p.requestedBy,
        purpose: p.purpose,
        totalAmount: Number(p.totalAmount),
        status: p.status as any,
        approvalStatus: p.approvalStatus as any,
        prPoStatus: p.prPoStatus as any,
        approval1: p.approval1,
        approval2: p.approval2,
        approval3: p.approval3,
        sourceBudgetCode: p.sourceBudgetCode,
        items
      };
    }).sort((a: any, b: any) => String(b.id).localeCompare(String(a.id)));

    // Fetch invoices
    try {
      const dbInvoices = await queryPgAsync<any>(`
        SELECT id, invoice_number as "invoiceNumber", to_char(invoice_date, 'YYYY-MM-DD') as "invoiceDate",
               pr_id as "prId", pr_number as "prNumber", department_id as "departmentId",
               budget_head_id as "budgetHeadId", vendor_name as "vendorName",
               total_amount as "totalAmount", tax_amount as "taxAmount",
               status, payment_status as "paymentStatus", 
               to_char(payment_date, 'YYYY-MM-DD') as "paymentDate",
               remarks, submitted_by as "submittedBy", 
               to_char(created_at, 'YYYY-MM-DD') as "createdAt"
        FROM invoice
      `);

      invoiceRecords = dbInvoices.map((inv: any) => {
        const dept = deptMap.get(inv.departmentId);
        const head = headMap.get(inv.budgetHeadId);
        return {
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          invoiceDate: inv.invoiceDate,
          prId: inv.prId,
          prNumber: inv.prNumber,
          departmentId: inv.departmentId,
          departmentCode: dept ? dept.code : '',
          departmentName: dept ? dept.name : '',
          budgetHeadId: inv.budgetHeadId,
          budgetHeadCode: head ? head.code : 0,
          budgetHeadName: head ? head.name : '',
          vendorName: inv.vendorName,
          totalAmount: Number(inv.totalAmount),
          taxAmount: Number(inv.taxAmount || 0),
          status: inv.status as any,
          paymentStatus: inv.paymentStatus as any,
          paymentDate: inv.paymentDate,
          remarks: inv.remarks,
          submittedBy: inv.submittedBy,
          createdAt: inv.createdAt
        };
      }).sort((a: any, b: any) => String(b.id).localeCompare(String(a.id)));
    } catch (invErr: any) {
      console.log(`[PostgreSQL] Invoice table may not exist yet: ${invErr.message}. Invoices will use in-memory defaults.`);
    }
    // Recalculate allocation committed amounts & utilization with active PR data
    recalculateCommittedAmounts();

    // Ensure that all allocations in the database are updated with the sum of all committed PRs
    for (const alloc of budgetAllocations) {
      await syncAllocationToPostgres(alloc.departmentId, alloc.budgetHeadId);
    }

    isInitialized = true;
    console.log(`[PostgreSQL] Successfully synced from Cloud SQL: ${departments.length} departments, ${users.length} users, ${budgetHeads.length} budget heads, ${budgetAllocations.length} allocations, ${prRecords.length} PRs, ${invoiceRecords.length} invoices.`);
    return true;
  } catch (error: any) {
    console.error(`[PostgreSQL Sync Error] Failed to sync from Cloud SQL: ${error.message}`);
    return false;
  }
}

async function seedPostgresFromLocalData() {
  console.log('[PostgreSQL] Database seeding is handled by seedPostgres script.');
}

export async function clearAllPRRecords(): Promise<boolean> {
  loadSeedData();

  // 1. Clear In-Memory PR and Invoice records
  prRecords = [];
  prItemsMap.clear();
  invoiceRecords = [];

  // 2. Clear Firestore PRs and Invoices collections
  if (isFirebaseEnabled()) {
    const db = getFirestoreDb();
    if (db) {
      try {
        const prSnap = await db.collection('prs').get();
        if (!prSnap.empty) {
          const batch1 = db.batch();
          prSnap.docs.forEach((doc: any) => batch1.delete(doc.ref));
          await batch1.commit();
        }

        const invSnap = await db.collection('invoices').get();
        if (!invSnap.empty) {
          const batch2 = db.batch();
          invSnap.docs.forEach((doc: any) => batch2.delete(doc.ref));
          await batch2.commit();
        }
        console.log('[Firebase] Cleared all PR and invoice documents from Firestore.');
      } catch (err: any) {
        console.error('[Firebase Error] Failed to clear Firestore PR records:', err.message);
      }
    }
  }

  // 3. Clear Postgres PR and Invoice records
  if (getPgStatus()) {
    try {
      await executePgQuery('DELETE FROM purchase_request_item;');
      await executePgQuery('DELETE FROM purchase_request;');
      console.log('[PostgreSQL] Deleted all purchase_request records from Cloud SQL.');
    } catch (err: any) {
      console.error('[PostgreSQL Error] Failed to delete Postgres PR records:', err.message);
    }
  }

  // 4. Clear SQLite tables if applicable
  try {
    const { runSqlAsync } = require('../config/sqlDatabase');
    if (runSqlAsync) {
      await runSqlAsync('DELETE FROM purchase_request_item;');
      await runSqlAsync('DELETE FROM purchase_request;');
      console.log('[SQLite] Cleared all purchase_request records from SQLite database.');
    }
  } catch (err: any) {
    // Ignore SQLite if not initialized
  }

  // 5. Recalculate allocation committed amounts & utilization (all reset to 0)
  recalculateCommittedAmounts();

  // 6. Sync updated 0-committed allocations to Firestore / Postgres
  if (isFirebaseEnabled()) {
    for (const alloc of budgetAllocations) {
      await syncAllocationToFirestore(alloc.departmentId, alloc.budgetHeadId);
    }
  }
  console.log('[Seed Engine] All PR data successfully deleted.');
  return true;
}

export async function clearAllMasterAndPRData(): Promise<boolean> {
  initDefaultUsers();
  departments = [];
  budgetHeads = [];
  budgetAllocations = [];
  prRecords = [];
  prItemsMap = new Map();
  invoiceRecords = [];

  // 1. Clear Firestore collections in safe chunks of 400
  if (isFirebaseEnabled()) {
    const db = getFirestoreDb();
    if (db) {
      try {
        const collections = ['prs', 'prItems', 'invoices', 'departments', 'budgetHeads', 'budgetAllocations'];
        for (const colName of collections) {
          const snap = await db.collection(colName).get();
          if (!snap.empty) {
            let batch = db.batch();
            let count = 0;
            for (const doc of snap.docs) {
              batch.delete(doc.ref);
              count++;
              if (count === 400) {
                await batch.commit();
                batch = db.batch();
                count = 0;
              }
            }
            if (count > 0) {
              await batch.commit();
            }
            console.log(`[Firebase] Cleared ${snap.size} documents from collection '${colName}'.`);
          }
        }
      } catch (err: any) {
        console.error('[Firebase Error] Failed to clear Firestore collections:', err.message);
      }
    }
  }

  // 2. Clear Postgres tables (both quoted PascalCase & unquoted lowercase)
  if (getPgStatus()) {
    try {
      await executePgQuery(`
        TRUNCATE TABLE 
          "PurchaseRequestItem", "PurchaseRequest", "Invoice", "BudgetAllocation", "BudgetHead", "Department", "ImportBatch", "ImporterErrorRecord"
        CASCADE;
      `);
      console.log('[PostgreSQL] Cleared PascalCase Cloud SQL tables.');
    } catch (err: any) {
      console.log(`[PostgreSQL Note] PascalCase tables cleanup: ${err.message}`);
    }

    try {
      await executePgQuery(`
        TRUNCATE TABLE 
          purchase_request_item, purchase_request, invoice, budget_allocation, budget_head, department, import_batch, import_error_record
        CASCADE;
      `);
      console.log('[PostgreSQL] Cleared lowercase Cloud SQL tables.');
    } catch (err: any) {
      console.log(`[PostgreSQL Note] Lowercase tables cleanup: ${err.message}`);
    }
  }

  // 3. Clear SQLite tables
  try {
    const { runSqlAsync } = require('../config/sqlDatabase');
    if (runSqlAsync) {
      await runSqlAsync('DELETE FROM purchase_request_item;');
      await runSqlAsync('DELETE FROM purchase_request;');
      await runSqlAsync('DELETE FROM invoice;');
      await runSqlAsync('DELETE FROM budget_allocation;');
      await runSqlAsync('DELETE FROM budget_head;');
      await runSqlAsync('DELETE FROM department;');
      console.log('[SQLite] Cleared all master budget and PR tables from SQLite database.');
    }
  } catch (err: any) {
    // Ignore SQLite if not active
  }

  isInitialized = true;
  console.log('[Seed Engine] All Master Budget and PR data successfully purged.');
  return true;
}

