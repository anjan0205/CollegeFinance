import api from './api';
import {
  QuotationRecord, PRRecord, PORecord, GRNRecord, InventoryItem, StockIssueRecord,
  InvoiceRecord, PaymentRecord, PartPaymentRecord, DCNoteRecord, ProjectRecord, ERPSummaryMetrics
} from '../types/erpTypes';
import {
  SEED_MASTERS, SEED_QUOTATIONS, SEED_POS, SEED_GRNS, SEED_INVENTORY, SEED_STOCK_ISSUES,
  SEED_INVOICES, SEED_PAYMENTS, SEED_PART_PAYMENTS, SEED_DC_NOTES, SEED_PROJECTS
} from '../data/erpSeedData';

// Mutable offline copies. These are ONLY used when a request throws (e.g. the
// localhost backend is down and the production client engine is not active).
// In production every /erp/* call is served by the Firebase client engine, which
// returns real, Firestore-persisted arrays — so these are pure safety nets.
const MOCK_MASTERS: Record<string, any[]> = {
  vendors: [...SEED_MASTERS.vendors],
  items: [...SEED_MASTERS.items],
  departments: [...SEED_MASTERS.departments],
  costCenters: [...SEED_MASTERS.costCenters],
  uoms: [...SEED_MASTERS.uoms],
  stores: [...SEED_MASTERS.stores]
};
const MOCK_QUOTATIONS: QuotationRecord[] = [...SEED_QUOTATIONS];
const MOCK_POS: PORecord[] = [...SEED_POS];
const MOCK_GRNS: GRNRecord[] = [...SEED_GRNS];
const MOCK_INVENTORY: InventoryItem[] = [...SEED_INVENTORY];
const MOCK_STOCK_ISSUES: StockIssueRecord[] = [...SEED_STOCK_ISSUES];
const MOCK_INVOICES: InvoiceRecord[] = [...SEED_INVOICES];
const MOCK_PAYMENTS: PaymentRecord[] = [...SEED_PAYMENTS];
const MOCK_PART_PAYMENTS: PartPaymentRecord[] = [...SEED_PART_PAYMENTS];
const MOCK_DC_NOTES: DCNoteRecord[] = [...SEED_DC_NOTES];
const MOCK_PROJECTS: ProjectRecord[] = [...SEED_PROJECTS];

const MOCK_PRS: PRRecord[] = [
  { id: 'PR-1', prNumber: 'PR/2026/0001', department: 'Computer Science & Engineering', budgetHead: 'BH-2026-CSE', requesterName: 'Dr. A. B. Patil', purpose: 'Smart Classroom AV Upgrade for Lab 4', totalAmount: 180000, priority: 'HIGH', status: 'APPROVED', createdAt: '2026-02-10', items: [{ itemId: 'ITEM-001', itemName: 'Epson High-Lumen Laser Projector', qty: 4, estimatedUnitPrice: 45000, uom: 'NOS', totalEstimate: 180000 }] },
  { id: 'PR-2', prNumber: 'PR/2026/0002', department: 'Electronics & Comm Engineering', budgetHead: 'BH-2026-ECE', requesterName: 'Dr. V. S. Kulkarni', purpose: 'VLSI Research Oscilloscopes Procurement', totalAmount: 96000, priority: 'MEDIUM', status: 'PENDING_HOD', createdAt: '2026-02-18', items: [{ itemId: 'ITEM-002', itemName: 'Digital Storage Oscilloscope 100MHz', qty: 3, estimatedUnitPrice: 32000, uom: 'NOS', totalEstimate: 96000 }] }
];

// Use the API array whenever the response is well-formed (even if empty — an
// empty list is a legitimate answer). Fall back to seed data only on a genuine
// error or malformed payload.
function pickList<T>(data: any, fallback: T[]): T[] {
  return Array.isArray(data) ? (data as T[]) : fallback;
}

export const erpService = {
  // Master Data
  async getMasterData(type: string) {
    try {
      const res = await api.get(`/erp/master?type=${type}`);
      return pickList(res.data?.data, MOCK_MASTERS[type] || []);
    } catch {
      return MOCK_MASTERS[type] || [];
    }
  },

  async createMasterData(type: string, data: any) {
    try {
      const res = await api.post('/erp/master', { type, data });
      return res.data?.data;
    } catch {
      const newItem = { id: `${type.toUpperCase().slice(0, 4)}-${Date.now().toString().slice(-4)}`, ...data, status: 'PENDING_APPROVAL' };
      if (MOCK_MASTERS[type]) MOCK_MASTERS[type].unshift(newItem);
      return newItem;
    }
  },

  async getPendingMasterApprovals() {
    try {
      const res = await api.get('/erp/master/approvals');
      return pickList(res.data?.data, []);
    } catch {
      const pending: any[] = [];
      Object.entries(MOCK_MASTERS).forEach(([type, items]) => {
        items.forEach((item: any) => {
          if (item.status === 'PENDING_APPROVAL') pending.push({ type, record: item });
        });
      });
      return pending;
    }
  },

  async approveMasterData(type: string, id: string, action: 'APPROVE' | 'REJECT', remarks?: string) {
    try {
      const res = await api.post('/erp/master/approve', { type, id, action, remarks });
      return res.data?.data;
    } catch {
      const target = (MOCK_MASTERS[type] || []).find((item: any) => item.id === id);
      if (target) target.status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      return target;
    }
  },

  // Quotations
  async getQuotations() {
    try {
      const res = await api.get('/erp/quotations');
      return pickList(res.data?.data, MOCK_QUOTATIONS);
    } catch {
      return MOCK_QUOTATIONS;
    }
  },

  async createQuotation(data: any) {
    try {
      const res = await api.post('/erp/quotations', data);
      return res.data?.data;
    } catch {
      const newQ = { id: `QUOTE-${Date.now().toString().slice(-4)}`, ...data, status: 'SUBMITTED' };
      MOCK_QUOTATIONS.unshift(newQ);
      return newQ;
    }
  },

  async selectWinningQuotation(id: string, remarks?: string) {
    try {
      const res = await api.post(`/erp/quotations/${id}/select-winner`, { remarks });
      return res.data?.data;
    } catch {
      const q = MOCK_QUOTATIONS.find(x => x.id === id);
      if (q) q.status = 'SELECTED';
      return q;
    }
  },

  // PR
  async getPRs() {
    try {
      const res = await api.get('/erp/prs');
      return pickList(res.data?.data, MOCK_PRS);
    } catch {
      return MOCK_PRS;
    }
  },

  async createPR(data: any) {
    try {
      const res = await api.post('/erp/prs', data);
      return res.data?.data;
    } catch {
      const newPR = { id: `PR-${Date.now().toString().slice(-4)}`, prNumber: `PR/2026/${Math.floor(1000 + Math.random() * 9000)}`, ...data, status: 'PENDING_HOD', createdAt: new Date().toISOString().split('T')[0] };
      MOCK_PRS.unshift(newPR);
      return newPR;
    }
  },

  async approvePR(id: string, action: 'APPROVE' | 'REJECT', remarks?: string) {
    try {
      const res = await api.post(`/erp/prs/${id}/approve`, { action, remarks });
      return res.data?.data;
    } catch {
      const pr = MOCK_PRS.find(x => x.id === id);
      if (pr) pr.status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      return pr;
    }
  },

  // PO
  async getPOs() {
    try {
      const res = await api.get('/erp/pos');
      return pickList(res.data?.data, MOCK_POS);
    } catch {
      return MOCK_POS;
    }
  },

  async createPO(data: any) {
    try {
      const res = await api.post('/erp/pos', data);
      return res.data?.data;
    } catch {
      const newPO = { id: `PO-${Date.now().toString().slice(-4)}`, poNumber: `PO/2026/${Math.floor(1000 + Math.random() * 9000)}`, ...data, status: 'APPROVED', poDate: new Date().toISOString().split('T')[0] };
      MOCK_POS.unshift(newPO);
      return newPO;
    }
  },

  // GRN
  async getGRNs() {
    try {
      const res = await api.get('/erp/grns');
      return pickList(res.data?.data, MOCK_GRNS);
    } catch {
      return MOCK_GRNS;
    }
  },

  async createGRN(data: any) {
    try {
      const res = await api.post('/erp/grns', data);
      return res.data?.data;
    } catch {
      const newGRN = { id: `GRN-${Date.now().toString().slice(-4)}`, grnNumber: `GRN/2026/${Math.floor(1000 + Math.random() * 9000)}`, ...data, status: 'VERIFIED', receivedDate: new Date().toISOString().split('T')[0] };
      MOCK_GRNS.unshift(newGRN);
      return newGRN;
    }
  },

  // Inventory
  async getInventory() {
    try {
      const res = await api.get('/erp/inventory');
      return pickList(res.data?.data, MOCK_INVENTORY);
    } catch {
      return MOCK_INVENTORY;
    }
  },

  // Stock Issue
  async getStockIssues() {
    try {
      const res = await api.get('/erp/stock-issues');
      return pickList(res.data?.data, MOCK_STOCK_ISSUES);
    } catch {
      return MOCK_STOCK_ISSUES;
    }
  },

  async createStockIssue(data: any) {
    try {
      const res = await api.post('/erp/stock-issues', data);
      return res.data?.data;
    } catch {
      const newIss = { id: `ISS-${Date.now().toString().slice(-4)}`, issueNumber: `ISS/2026/${Math.floor(1000 + Math.random() * 9000)}`, ...data, status: 'ISSUED', issueDate: new Date().toISOString().split('T')[0] };
      MOCK_STOCK_ISSUES.unshift(newIss);
      return newIss;
    }
  },

  // Invoices
  async getInvoices() {
    try {
      const res = await api.get('/erp/invoices');
      return pickList(res.data?.data, MOCK_INVOICES);
    } catch {
      return MOCK_INVOICES;
    }
  },

  async createInvoice(data: any) {
    try {
      const res = await api.post('/erp/invoices', data);
      return res.data?.data;
    } catch {
      const newInv = { id: `INV-${Date.now().toString().slice(-4)}`, invoiceNumber: `INV/2026/${Math.floor(1000 + Math.random() * 9000)}`, ...data, status: 'PENDING_APPROVAL', matched3Way: true };
      MOCK_INVOICES.unshift(newInv);
      return newInv;
    }
  },

  // Payments
  async getPayments() {
    try {
      const res = await api.get('/erp/payments');
      return pickList(res.data?.data, MOCK_PAYMENTS);
    } catch {
      return MOCK_PAYMENTS;
    }
  },

  async createPayment(data: any) {
    try {
      const res = await api.post('/erp/payments', data);
      return res.data?.data;
    } catch {
      const newPay = { id: `PAY-${Date.now().toString().slice(-4)}`, paymentNumber: `PAY/2026/${Math.floor(1000 + Math.random() * 9000)}`, ...data, status: 'PROCESSED', paymentDate: new Date().toISOString().split('T')[0] };
      MOCK_PAYMENTS.unshift(newPay);
      return newPay;
    }
  },

  // Part Payments
  async getPartPayments() {
    try {
      const res = await api.get('/erp/part-payments');
      return pickList(res.data?.data, MOCK_PART_PAYMENTS);
    } catch {
      return MOCK_PART_PAYMENTS;
    }
  },

  async createPartPayment(data: any) {
    try {
      const res = await api.post('/erp/part-payments', data);
      return res.data?.data;
    } catch {
      const newPP = { id: `PP-${Date.now().toString().slice(-4)}`, ...data, status: 'PENDING_APPROVAL' };
      MOCK_PART_PAYMENTS.unshift(newPP);
      return newPP;
    }
  },

  // D/C Notes
  async getDCNotes() {
    try {
      const res = await api.get('/erp/dc-notes');
      return pickList(res.data?.data, MOCK_DC_NOTES);
    } catch {
      return MOCK_DC_NOTES;
    }
  },

  async createDCNote(data: any) {
    try {
      const res = await api.post('/erp/dc-notes', data);
      return res.data?.data;
    } catch {
      const newDC = { id: `DC-${Date.now().toString().slice(-4)}`, noteNumber: `DC/2026/${Math.floor(1000 + Math.random() * 9000)}`, ...data, status: 'APPROVED', noteDate: new Date().toISOString().split('T')[0] };
      MOCK_DC_NOTES.unshift(newDC);
      return newDC;
    }
  },

  // Projects
  async getProjects() {
    try {
      const res = await api.get('/erp/projects');
      return pickList(res.data?.data, MOCK_PROJECTS);
    } catch {
      return MOCK_PROJECTS;
    }
  },

  async createProject(data: any) {
    try {
      const res = await api.post('/erp/projects', data);
      return res.data?.data;
    } catch {
      const newProj = { id: `PROJ-${Date.now().toString().slice(-4)}`, committedAmount: 0, actualSpent: 0, status: 'PLANNED', ...data };
      MOCK_PROJECTS.unshift(newProj);
      return newProj;
    }
  },

  // Summary Metrics
  async getERPSummary(): Promise<ERPSummaryMetrics> {
    try {
      const res = await api.get('/erp/summary');
      if (res.data?.data) return res.data.data;
      throw new Error('no summary');
    } catch {
      return {
        totalPRs: MOCK_PRS.length,
        totalPOs: MOCK_POS.length,
        totalGRNs: MOCK_GRNS.length,
        totalInvoices: MOCK_INVOICES.length,
        pendingApprovalsCount: MOCK_PRS.filter(x => x.status.includes('PENDING')).length + MOCK_MASTERS.vendors.filter((x: any) => x.status === 'PENDING_APPROVAL').length,
        totalInventoryValue: MOCK_INVENTORY.reduce((sum, item) => sum + item.totalValue, 0),
        activeProjectsCount: MOCK_PROJECTS.filter(x => x.status === 'ACTIVE').length,
        totalPaymentsProcessed: MOCK_PAYMENTS.reduce((sum, p) => sum + p.amountPaid, 0)
      };
    }
  }
};
