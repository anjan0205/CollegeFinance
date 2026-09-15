import api from './api';
import {
  VendorMaster, ItemMaster, DepartmentMaster, CostCenterMaster, UoMMaster, StoreMaster,
  QuotationRecord, PRRecord, PORecord, GRNRecord, InventoryItem, StockIssueRecord,
  InvoiceRecord, PaymentRecord, PartPaymentRecord, DCNoteRecord, ProjectRecord, ERPSummaryMetrics
} from '../types/erpTypes';

// Initial fallback datasets for mock mode / offline safety
const MOCK_MASTERS = {
  vendors: [
    { id: 'VEND-001', name: 'Apex Tech Solutions', code: 'V-APX-01', category: 'IT Hardware', contactPerson: 'Rajesh Kumar', email: 'sales@apextech.com', phone: '+91 98230 11223', gstNo: '27AAACA1234A1Z5', address: 'Pune Industrial Estate, MH', rating: 4.8, status: 'APPROVED', createdAt: '2026-01-10' },
    { id: 'VEND-002', name: 'Standard Scientific Supplies', code: 'V-SSS-02', category: 'Lab Equipment', contactPerson: 'Sanjay Deshmukh', email: 'info@standardsci.in', phone: '+91 94220 88776', gstNo: '27AAACS9988B1Z2', address: 'Kothrud, Pune, MH', rating: 4.5, status: 'APPROVED', createdAt: '2026-01-15' },
    { id: 'VEND-003', name: 'Universal Book Distributors', code: 'V-UBD-03', category: 'Library Books', contactPerson: 'Meera Nair', email: 'books@ubd.co.in', phone: '+91 98900 55443', gstNo: '27AAACU3322C1Z8', address: 'FC Road, Pune, MH', rating: 4.9, status: 'PENDING_APPROVAL', createdAt: '2026-02-01' }
  ] as VendorMaster[],

  items: [
    { id: 'ITEM-001', itemCode: 'IT-PRJ-01', name: 'Epson High-Lumen Laser Projector', category: 'Electronics', subcategory: 'AV Equipment', uom: 'NOS', minStock: 2, reorderLevel: 5, currentStock: 8, unitPrice: 45000, hsnSacCode: '8528', status: 'APPROVED' },
    { id: 'ITEM-002', itemCode: 'LAB-OSC-02', name: 'Digital Storage Oscilloscope 100MHz', category: 'Lab Equipment', subcategory: 'Electronics Lab', uom: 'NOS', minStock: 5, reorderLevel: 10, currentStock: 14, unitPrice: 32000, hsnSacCode: '9030', status: 'APPROVED' },
    { id: 'ITEM-003', itemCode: 'FUR-DSK-03', name: 'Ergonomic Modular Computer Desk', category: 'Furniture', subcategory: 'Classroom', uom: 'NOS', minStock: 10, reorderLevel: 20, currentStock: 45, unitPrice: 6500, hsnSacCode: '9403', status: 'APPROVED' }
  ] as ItemMaster[],

  departments: [
    { id: 'DEP-01', code: 'CSE', name: 'Computer Science & Engineering', hodName: 'Dr. A. B. Patil', budgetCode: 'BH-2026-CSE', status: 'APPROVED' },
    { id: 'DEP-02', code: 'ECE', name: 'Electronics & Comm Engineering', hodName: 'Dr. V. S. Kulkarni', budgetCode: 'BH-2026-ECE', status: 'APPROVED' },
    { id: 'DEP-03', code: 'MECH', name: 'Mechanical Engineering', hodName: 'Dr. R. N. Joshi', budgetCode: 'BH-2026-MECH', status: 'APPROVED' }
  ] as DepartmentMaster[],

  costCenters: [
    { id: 'CC-01', code: 'CC-ACADEMIC-01', name: 'Undergraduate Labs Fund', department: 'CSE', status: 'APPROVED' },
    { id: 'CC-02', code: 'CC-RESEARCH-02', name: 'AI Center of Excellence Grant', department: 'CSE', status: 'APPROVED' },
    { id: 'CC-03', code: 'CC-INFRA-03', name: 'Campus Smart Classroom Infra', department: 'Central', status: 'APPROVED' }
  ] as CostCenterMaster[],

  uoms: [
    { id: 'UOM-01', code: 'NOS', name: 'Numbers / Units', status: 'APPROVED' },
    { id: 'UOM-02', code: 'BOX', name: 'Box of 10 Units', status: 'APPROVED' },
    { id: 'UOM-03', code: 'SET', name: 'Complete Kit / Set', status: 'APPROVED' }
  ] as UoMMaster[],

  stores: [
    { id: 'STR-01', code: 'MAIN-WH', name: 'Central VIIT Store Warehouse', location: 'Building A Basement', manager: 'S. Sharma', status: 'APPROVED' },
    { id: 'STR-02', code: 'IT-STORE', name: 'IT Infrastructure Store Room', location: 'Computer Center 3rd Floor', manager: 'P. Verma', status: 'APPROVED' }
  ] as StoreMaster[]
};

const MOCK_QUOTATIONS: QuotationRecord[] = [
  {
    id: 'QUOTE-2026-001',
    prId: 'PR/2026/0001',
    prNumber: 'PR/2026/0001',
    vendorId: 'VEND-001',
    vendorName: 'Apex Tech Solutions',
    quoteNumber: 'APX-Q-991',
    totalAmount: 180000,
    validUntil: '2026-04-30',
    status: 'SELECTED',
    items: [
      { itemId: 'ITEM-001', itemName: 'Epson High-Lumen Laser Projector', qty: 4, unitPrice: 45000, taxRate: 18, totalAmount: 180000 }
    ],
    remarks: 'Includes 3 years onsite warranty and installation.'
  },
  {
    id: 'QUOTE-2026-002',
    prId: 'PR/2026/0001',
    prNumber: 'PR/2026/0001',
    vendorId: 'VEND-002',
    vendorName: 'Standard Scientific Supplies',
    quoteNumber: 'SSS-Q-441',
    totalAmount: 195000,
    validUntil: '2026-04-15',
    status: 'SUBMITTED',
    items: [
      { itemId: 'ITEM-001', itemName: 'Epson High-Lumen Laser Projector', qty: 4, unitPrice: 48750, taxRate: 18, totalAmount: 195000 }
    ],
    remarks: 'Standard 1 year warranty.'
  }
];

const MOCK_PRS: PRRecord[] = [
  {
    id: 'PR-1',
    prNumber: 'PR/2026/0001',
    department: 'Computer Science & Engineering',
    budgetHead: 'BH-2026-CSE',
    requesterName: 'Dr. A. B. Patil',
    purpose: 'Smart Classroom AV Upgrade for Lab 4',
    totalAmount: 180000,
    priority: 'HIGH',
    status: 'APPROVED',
    createdAt: '2026-02-10',
    items: [
      { itemId: 'ITEM-001', itemName: 'Epson High-Lumen Laser Projector', qty: 4, estimatedUnitPrice: 45000, uom: 'NOS', totalEstimate: 180000 }
    ]
  },
  {
    id: 'PR-2',
    prNumber: 'PR/2026/0002',
    department: 'Electronics & Comm Engineering',
    budgetHead: 'BH-2026-ECE',
    requesterName: 'Dr. V. S. Kulkarni',
    purpose: 'VLSI Research Oscilloscopes Procurement',
    totalAmount: 96000,
    priority: 'MEDIUM',
    status: 'PENDING_HOD',
    createdAt: '2026-02-18',
    items: [
      { itemId: 'ITEM-002', itemName: 'Digital Storage Oscilloscope 100MHz', qty: 3, estimatedUnitPrice: 32000, uom: 'NOS', totalEstimate: 96000 }
    ]
  }
];

const MOCK_POS: PORecord[] = [
  {
    id: 'PO-1',
    poNumber: 'PO/2026/0042',
    prNumber: 'PR/2026/0001',
    vendorId: 'VEND-001',
    vendorName: 'Apex Tech Solutions',
    department: 'Computer Science & Engineering',
    poDate: '2026-02-14',
    deliveryDueDate: '2026-03-01',
    totalAmount: 180000,
    taxAmount: 32400,
    netAmount: 212400,
    status: 'PARTIALLY_RECEIVED',
    paymentTerms: '30 Days Credit',
    items: [
      { itemId: 'ITEM-001', itemName: 'Epson High-Lumen Laser Projector', qtyOrdered: 4, qtyReceived: 2, unitPrice: 45000, taxRate: 18, totalAmount: 180000 }
    ]
  }
];

const MOCK_GRNS: GRNRecord[] = [
  {
    id: 'GRN-1',
    grnNumber: 'GRN/2026/0018',
    poNumber: 'PO/2026/0042',
    vendorName: 'Apex Tech Solutions',
    storeName: 'IT Infrastructure Store Room',
    challanNumber: 'CH-APX-8821',
    receivedDate: '2026-02-22',
    receivedBy: 'P. Verma',
    inspectionStatus: 'PASSED',
    status: 'VERIFIED',
    remarks: '2 units received in excellent condition. Tested and accepted.',
    items: [
      { itemId: 'ITEM-001', itemName: 'Epson High-Lumen Laser Projector', qtyReceived: 2, qtyAccepted: 2, qtyRejected: 0, remarks: 'Verified Serial Nos: EP-881, EP-882' }
    ]
  }
];

const MOCK_INVENTORY: InventoryItem[] = [
  {
    id: 'INV-1',
    itemCode: 'IT-PRJ-01',
    itemName: 'Epson High-Lumen Laser Projector',
    category: 'Electronics',
    uom: 'NOS',
    storeLocation: 'IT Infrastructure Store Room',
    availableQty: 8,
    allocatedQty: 2,
    totalValue: 360000,
    reorderLevel: 5,
    lastReceivedDate: '2026-02-22'
  },
  {
    id: 'INV-2',
    itemCode: 'LAB-OSC-02',
    itemName: 'Digital Storage Oscilloscope 100MHz',
    category: 'Lab Equipment',
    uom: 'NOS',
    storeLocation: 'Central VIIT Store Warehouse',
    availableQty: 14,
    allocatedQty: 0,
    totalValue: 448000,
    reorderLevel: 10,
    lastReceivedDate: '2026-01-20'
  }
];

const MOCK_STOCK_ISSUES: StockIssueRecord[] = [
  {
    id: 'ISS-1',
    issueNumber: 'ISS/2026/0009',
    department: 'Computer Science & Engineering',
    issuedTo: 'Dr. A. B. Patil',
    storeLocation: 'IT Infrastructure Store Room',
    issueDate: '2026-02-25',
    purpose: 'Installed in Lab 4 Auditorium',
    status: 'ISSUED',
    items: [
      { itemId: 'ITEM-001', itemName: 'Epson High-Lumen Laser Projector', qtyIssued: 2 }
    ]
  }
];

const MOCK_INVOICES: InvoiceRecord[] = [
  {
    id: 'INV-REC-1',
    invoiceNumber: 'INV/2026/0014',
    vendorInvoiceNo: 'APX-INV-9901',
    poNumber: 'PO/2026/0042',
    grnNumber: 'GRN/2026/0018',
    vendorName: 'Apex Tech Solutions',
    invoiceDate: '2026-02-23',
    dueDate: '2026-03-25',
    amount: 180000,
    taxAmount: 32400,
    totalAmount: 212400,
    matched3Way: true,
    status: 'PARTIALLY_PAID',
    items: [
      { description: 'Epson High-Lumen Laser Projector (Batch 1)', qty: 2, unitPrice: 45000, total: 90000 }
    ]
  }
];

const MOCK_PAYMENTS: PaymentRecord[] = [
  {
    id: 'PAY-1',
    paymentNumber: 'PAY/2026/0008',
    invoiceNumber: 'INV/2026/0014',
    vendorName: 'Apex Tech Solutions',
    paymentDate: '2026-02-28',
    paymentMode: 'NEFT',
    referenceNumber: 'NEFT-AXIS-99210',
    amountPaid: 100000,
    status: 'PROCESSED',
    remarks: '50% advance delivery release payment.'
  }
];

const MOCK_PART_PAYMENTS: PartPaymentRecord[] = [
  {
    id: 'PP-1',
    poNumber: 'PO/2026/0042',
    invoiceNumber: 'INV/2026/0014',
    vendorName: 'Apex Tech Solutions',
    stageName: 'Stage 1: Initial Goods Received (50%)',
    percentage: 50,
    amount: 106200,
    dueDate: '2026-03-05',
    status: 'PAID',
    approvedBy: 'Finance Controller'
  },
  {
    id: 'PP-2',
    poNumber: 'PO/2026/0042',
    invoiceNumber: 'INV/2026/0014',
    vendorName: 'Apex Tech Solutions',
    stageName: 'Stage 2: Final Acceptance & Signoff (50%)',
    percentage: 50,
    amount: 106200,
    dueDate: '2026-03-25',
    status: 'PENDING_APPROVAL',
    approvedBy: undefined
  }
];

const MOCK_DC_NOTES: DCNoteRecord[] = [
  {
    id: 'DC-1',
    noteNumber: 'DC/2026/0002',
    type: 'DEBIT_NOTE',
    referenceDocType: 'GRN',
    referenceDocNumber: 'GRN/2026/0018',
    vendorName: 'Apex Tech Solutions',
    reason: 'Damaged HDMI cable assembly supplied in accessories box',
    amount: 2500,
    noteDate: '2026-02-24',
    status: 'APPROVED'
  }
];

const MOCK_PROJECTS: ProjectRecord[] = [
  {
    id: 'PROJ-1',
    code: 'PRJ-2026-AI-LAB',
    name: 'AI & Machine Learning High-Performance Computing Lab',
    department: 'Computer Science & Engineering',
    projectManager: 'Dr. A. B. Patil',
    budgetAllocated: 5000000,
    committedAmount: 212400,
    actualSpent: 100000,
    startDate: '2026-01-01',
    endDate: '2026-08-31',
    status: 'ACTIVE'
  },
  {
    id: 'PROJ-2',
    code: 'PRJ-2026-SOLAR-02',
    name: 'Rooftop Solar Energy Panel Installation Phase II',
    department: 'Electrical Engineering',
    projectManager: 'Prof. S. R. Varma',
    budgetAllocated: 3500000,
    committedAmount: 0,
    actualSpent: 0,
    startDate: '2026-03-01',
    endDate: '2026-11-30',
    status: 'PLANNED'
  }
];

// Service functions supporting smooth backend fallback
export const erpService = {
  // Master Data
  async getMasterData(type: string) {
    try {
      const res = await api.get(`/erp/master?type=${type}`);
      return res.data?.data || (MOCK_MASTERS as any)[type] || [];
    } catch {
      return (MOCK_MASTERS as any)[type] || [];
    }
  },

  async createMasterData(type: string, data: any) {
    try {
      const res = await api.post('/erp/master', { type, data });
      return res.data?.data;
    } catch {
      const newItem = { id: `${type.toUpperCase().slice(0, 4)}-${Date.now().toString().slice(-4)}`, ...data, status: 'PENDING_APPROVAL' };
      if ((MOCK_MASTERS as any)[type]) {
        (MOCK_MASTERS as any)[type].unshift(newItem);
      }
      return newItem;
    }
  },

  async getPendingMasterApprovals() {
    try {
      const res = await api.get('/erp/master/approvals');
      return res.data?.data || [];
    } catch {
      const pending: any[] = [];
      Object.entries(MOCK_MASTERS).forEach(([type, items]) => {
        items.forEach((item: any) => {
          if (item.status === 'PENDING_APPROVAL') {
            pending.push({ type, record: item });
          }
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
      const list = (MOCK_MASTERS as any)[type] || [];
      const target = list.find((item: any) => item.id === id);
      if (target) {
        target.status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      }
      return target;
    }
  },

  // Quotations
  async getQuotations() {
    try {
      const res = await api.get('/erp/quotations');
      return res.data?.data || MOCK_QUOTATIONS;
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
      return res.data?.data || MOCK_PRS;
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
      return res.data?.data || MOCK_POS;
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
      return res.data?.data || MOCK_GRNS;
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
      return res.data?.data || MOCK_INVENTORY;
    } catch {
      return MOCK_INVENTORY;
    }
  },

  // Stock Issue
  async getStockIssues() {
    try {
      const res = await api.get('/erp/stock-issues');
      return res.data?.data || MOCK_STOCK_ISSUES;
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
      return res.data?.data || MOCK_INVOICES;
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
      return res.data?.data || MOCK_PAYMENTS;
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
      return res.data?.data || MOCK_PART_PAYMENTS;
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
      return res.data?.data || MOCK_DC_NOTES;
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
      return res.data?.data || MOCK_PROJECTS;
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
      return res.data?.data;
    } catch {
      return {
        totalPRs: MOCK_PRS.length,
        totalPOs: MOCK_POS.length,
        totalGRNs: MOCK_GRNS.length,
        totalInvoices: MOCK_INVOICES.length,
        pendingApprovalsCount: MOCK_PRS.filter(x => x.status.includes('PENDING')).length + MOCK_MASTERS.vendors.filter(x => x.status === 'PENDING_APPROVAL').length,
        totalInventoryValue: MOCK_INVENTORY.reduce((sum, item) => sum + item.totalValue, 0),
        activeProjectsCount: MOCK_PROJECTS.filter(x => x.status === 'ACTIVE').length,
        totalPaymentsProcessed: MOCK_PAYMENTS.reduce((sum, p) => sum + p.amountPaid, 0)
      };
    }
  }
};
