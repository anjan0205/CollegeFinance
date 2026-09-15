import { Request, Response } from 'express';
import {
  Vendor,
  Item,
  Department,
  BudgetHead,
  UoM,
  StoreLocation,
  MasterDataChangeRequest,
  Quotation,
  PurchaseRequisition,
  PurchaseOrder,
  GoodsReceiptNote,
  InventoryItem,
  StockIssue,
  VendorInvoice,
  InvoicePayment,
  DebitCreditNote,
  ProjectContainer
} from '../types/erpTypes';

// Initial In-Memory Seed State for all 14 modules
let vendorsStore: Vendor[] = [
  { id: 'V-101', code: 'VEND-001', name: 'TechLab Supplies Pvt Ltd', gstin: '27AAACT1042A1Z5', contactPerson: 'Suresh Kumar', phone: '+91 98230 11223', email: 'suresh@techlab.com', address: 'Plot 42, MIDC, Pune', category: 'GOODS', bankName: 'HDFC Bank', accountNumber: '5010023490182', ifscCode: 'HDFC0000104', status: 'ACTIVE' },
  { id: 'V-102', code: 'VEND-002', name: 'Apex Industrial Solutions', gstin: '27AABCA4912B1Z8', contactPerson: 'Anita Rao', phone: '+91 98500 44556', email: 'anita@apexind.co.in', address: 'Baner Road, Pune', category: 'BOTH', bankName: 'State Bank of India', accountNumber: '30920048123', ifscCode: 'SBIN0001423', status: 'ACTIVE' },
  { id: 'V-103', code: 'VEND-003', name: 'Global Scientific Hardware', gstin: '27AACCS9012C1Z2', contactPerson: 'Vikram Shah', phone: '+91 97640 88990', email: 'vikram@globalsci.in', address: 'Kothrud, Pune', category: 'GOODS', bankName: 'ICICI Bank', accountNumber: '003901582910', ifscCode: 'ICIC0000039', status: 'ACTIVE' }
];

let itemsStore: Item[] = [
  { id: 'I-201', itemCode: 'ITM-COMP-01', name: 'High-End Workstation Computer (i9, 64GB RAM)', category: 'LAB_HARDWARE', uom: 'pcs', hsnSacCode: '84713010', reorderLevel: 5, lastPurchasePrice: 125000, currentStock: 18, status: 'ACTIVE' },
  { id: 'I-202', itemCode: 'ITM-ELEC-02', name: 'Digital Storage Oscilloscope (100MHz)', category: 'LAB_EQUIPMENT', uom: 'pcs', hsnSacCode: '90302000', reorderLevel: 3, lastPurchasePrice: 45000, currentStock: 8, status: 'ACTIVE' },
  { id: 'I-203', itemCode: 'ITM-SOFT-03', name: 'MATLAB Campus Site License (1-Year)', category: 'SOFTWARE', uom: 'license', hsnSacCode: '997331', reorderLevel: 2, lastPurchasePrice: 320000, currentStock: 15, status: 'ACTIVE' },
  { id: 'I-204', itemCode: 'ITM-CONS-04', name: 'Cat6 Ethernet Cable Reel (308m)', category: 'CONSUMABLES', uom: 'reel', hsnSacCode: '85444990', reorderLevel: 10, lastPurchasePrice: 8500, currentStock: 2, status: 'ACTIVE' }
];

let masterApprovalsStore: MasterDataChangeRequest[] = [
  { id: 'REQ-101', entityType: 'VENDORS', requestType: 'ADD', proposedData: { name: 'Pinnacle Chemical Corp', gstin: '27AABCP9012D1Z9', category: 'GOODS' }, createdBy: 'Faculty User', createdAt: '2026-03-10', status: 'PENDING' }
];

let quotationsStore: Quotation[] = [
  { id: 'Q-301', quotationNo: 'QT-2026-001', prId: 'PR/2026/0001', vendorId: 'V-101', vendorName: 'TechLab Supplies Pvt Ltd', items: [{ itemId: 'I-201', itemName: 'High-End Workstation Computer', qty: 5, unitPrice: 122000, totalPrice: 610000 }], validityDate: '2026-04-15', deliveryDays: 10, paymentTerms: '30 Days Net', status: 'SELECTED', isWinning: true, createdAt: '2026-03-02' },
  { id: 'Q-302', quotationNo: 'QT-2026-002', prId: 'PR/2026/0001', vendorId: 'V-102', vendorName: 'Apex Industrial Solutions', items: [{ itemId: 'I-201', itemName: 'High-End Workstation Computer', qty: 5, unitPrice: 125000, totalPrice: 625000 }], validityDate: '2026-04-10', deliveryDays: 14, paymentTerms: '15 Days Net', status: 'REJECTED', isWinning: false, createdAt: '2026-03-03' }
];

let prsStore: PurchaseRequisition[] = [
  {
    id: 'PR-401',
    prNo: 'PR/2026/0001',
    departmentId: 'D-CSE',
    departmentName: 'Computer Engineering',
    requestedBy: 'Dr. Rajesh Sharma',
    date: '2026-03-01',
    budgetHeadId: 'BH-501',
    budgetHeadName: 'Lab Equipment & Hardware',
    projectId: 'PROJ-901',
    projectName: 'AI & Robotics Lab Setup',
    items: [{ itemId: 'I-201', itemCode: 'ITM-COMP-01', itemName: 'High-End Workstation Computer (i9, 64GB RAM)', uom: 'pcs', qty: 5, orderedQty: 5, estimatedPrice: 125000, totalEstimated: 625000 }],
    justification: 'Upgrading PG Deep Learning Laboratory hardware.',
    priority: 'HIGH',
    status: 'APPROVED',
    createdBy: 'Dr. Rajesh Sharma',
    createdAt: '2026-03-01',
    approvedBy: 'Principal / Admin',
    approvedAt: '2026-03-03',
    history: [{ timestamp: '2026-03-01 10:00', action: 'Created', user: 'Dr. Rajesh Sharma' }, { timestamp: '2026-03-03 14:20', action: 'Approved', user: 'Principal / Admin' }]
  }
];

let posStore: PurchaseOrder[] = [
  {
    id: 'PO-501',
    poNo: 'PO/2026/0042',
    prId: 'PR-401',
    prNo: 'PR/2026/0001',
    quotationId: 'Q-301',
    vendorId: 'V-101',
    vendorName: 'TechLab Supplies Pvt Ltd',
    vendorGstin: '27AAACT1042A1Z5',
    projectId: 'PROJ-901',
    projectName: 'AI & Robotics Lab Setup',
    date: '2026-03-04',
    deliveryDate: '2026-03-14',
    paymentTerms: '30 Days Net',
    deliveryAddress: 'VIIT Central Stores, Main Campus, Pune',
    items: [{ itemId: 'I-201', itemCode: 'ITM-COMP-01', itemName: 'High-End Workstation Computer (i9, 64GB RAM)', uom: 'pcs', qtyOrdered: 5, qtyReceived: 5, unitPrice: 122000, taxRatePct: 18, taxAmount: 109800, totalAmount: 719800 }],
    subtotal: 610000,
    taxTotal: 109800,
    grandTotal: 719800,
    status: 'RECEIVED',
    createdBy: 'Finance Officer',
    createdAt: '2026-03-04',
    approvedBy: 'Principal / Admin',
    history: [{ timestamp: '2026-03-04 11:00', action: 'PO Raised', user: 'Finance Officer' }]
  }
];

let grnsStore: GoodsReceiptNote[] = [
  {
    id: 'GRN-601',
    grnNo: 'GRN/2026/0018',
    poId: 'PO-501',
    poNo: 'PO/2026/0042',
    vendorName: 'TechLab Supplies Pvt Ltd',
    storeId: 'STORE-01',
    storeName: 'Central Electronics & IT Store',
    dateReceived: '2026-03-12',
    receivedBy: 'Store In-charge',
    items: [{ itemId: 'I-201', itemName: 'High-End Workstation Computer', qtyOrdered: 5, qtyReceived: 5, qtyAccepted: 5, qtyRejected: 0, unitPrice: 122000 }],
    status: 'POSTED',
    isDiscrepancyFlagged: false,
    history: [{ timestamp: '2026-03-12 15:30', action: 'GRN Posted & Stock Updated', user: 'Store In-charge' }]
  }
];

let inventoryStore: InventoryItem[] = [
  { id: 'INV-701', itemId: 'I-201', itemCode: 'ITM-COMP-01', itemName: 'High-End Workstation Computer', category: 'LAB_HARDWARE', storeId: 'STORE-01', storeName: 'Central Electronics Store', uom: 'pcs', openingStock: 13, receivedQty: 5, issuedQty: 0, currentStock: 18, reorderLevel: 5, unitCost: 122000, totalValuation: 2196000, status: 'NORMAL' },
  { id: 'INV-702', itemId: 'I-204', itemCode: 'ITM-CONS-04', itemName: 'Cat6 Ethernet Cable Reel', category: 'CONSUMABLES', storeId: 'STORE-01', storeName: 'Central Electronics Store', uom: 'reel', openingStock: 5, receivedQty: 0, issuedQty: 3, currentStock: 2, reorderLevel: 10, unitCost: 8500, totalValuation: 17000, status: 'CRITICAL' }
];

let stockIssuesStore: StockIssue[] = [
  {
    id: 'ISS-801',
    issueNo: 'ISS/2026/0009',
    departmentId: 'D-CSE',
    departmentName: 'Computer Engineering',
    requestedBy: 'Prof. Anil Varma',
    storeId: 'STORE-01',
    storeName: 'Central Electronics Store',
    date: '2026-03-10',
    items: [{ itemId: 'I-204', itemName: 'Cat6 Ethernet Cable Reel', qtyRequested: 3, qtyIssued: 3, unitPrice: 8500 }],
    purpose: 'Network cabling for new IoT Research Lab',
    status: 'ISSUED',
    issuedBy: 'Store In-charge',
    createdAt: '2026-03-10',
    history: [{ timestamp: '2026-03-10 11:15', action: 'Stock Issued', user: 'Store In-charge' }]
  }
];

let invoicesStore: VendorInvoice[] = [
  {
    id: 'INV-901',
    internalInvNo: 'INV/2026/0014',
    vendorInvNo: 'TL-INV-9921',
    poId: 'PO-501',
    poNo: 'PO/2026/0042',
    grnId: 'GRN-601',
    grnNo: 'GRN/2026/0018',
    vendorId: 'V-101',
    vendorName: 'TechLab Supplies Pvt Ltd',
    invoiceDate: '2026-03-13',
    dueDate: '2026-04-12',
    items: [{ itemId: 'I-201', itemName: 'High-End Workstation Computer', qty: 5, unitPrice: 122000, taxRatePct: 18, amount: 719800 }],
    subtotal: 610000,
    taxAmount: 109800,
    tdsDeduction: 12200,
    netPayable: 707600,
    paidAmount: 200000,
    balanceOutstanding: 507600,
    threeWayMatchPassed: true,
    status: 'PARTIALLY_PAID',
    history: [{ timestamp: '2026-03-13 10:00', action: 'Verified & 3-Way Match Passed', user: 'Finance Officer' }]
  }
];

let paymentsStore: InvoicePayment[] = [
  {
    id: 'PAY-1001',
    paymentNo: 'PAY/2026/0005',
    invoiceId: 'INV-901',
    internalInvNo: 'INV/2026/0014',
    vendorInvNo: 'TL-INV-9921',
    vendorName: 'TechLab Supplies Pvt Ltd',
    paymentDate: '2026-03-14',
    amountPaid: 200000,
    paymentMode: 'NEFT_RTGS',
    txnReference: 'NEFT-SBI-409182901',
    isAdvance: false,
    status: 'PROCESSED',
    notes: 'Stage 1 Advance payment disbursed'
  }
];

let dcNotesStore: DebitCreditNote[] = [
  {
    id: 'DC-1101',
    noteNo: 'DC/2026/0002',
    type: 'DEBIT',
    linkedGrnNo: 'GRN/2026/0018',
    linkedInvoiceNo: 'INV/2026/0014',
    vendorName: 'TechLab Supplies Pvt Ltd',
    date: '2026-03-14',
    reason: 'SHORT_SUPPLY',
    adjustedAmount: 15000,
    adjustedQty: 1,
    remarks: 'Shortage of auxiliary power adapters in consignment',
    status: 'POSTED',
    createdAt: '2026-03-14',
    history: [{ timestamp: '2026-03-14 16:00', action: 'Debit Note Issued', user: 'Finance Officer' }]
  }
];

let projectsStore: ProjectContainer[] = [
  {
    id: 'PROJ-901',
    code: 'PRJ-AI-2026',
    name: 'AI & Robotics Center of Excellence',
    departmentName: 'Computer Engineering',
    totalBudget: 2500000,
    committedSpend: 719800,
    actualSpend: 200000,
    remainingBudget: 1780200,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'ACTIVE',
    manager: 'Dr. Rajesh Sharma'
  }
];

// Helper to generate sequential IDs
const generateNo = (prefix: string, count: number) => `${prefix}/2026/${String(count + 1).padStart(4, '0')}`;

// 2.1 Master Data Controller
export const getMasterData = (req: Request, res: Response) => {
  res.json({
    success: true,
    vendors: vendorsStore,
    items: itemsStore,
    masterApprovals: masterApprovalsStore
  });
};

export const createMasterDataRequest = (req: Request, res: Response) => {
  const { entityType, proposedData, requestType } = req.body;
  const newReq: MasterDataChangeRequest = {
    id: `REQ-${Date.now()}`,
    entityType,
    requestType: requestType || 'ADD',
    proposedData,
    createdBy: req.body.createdBy || 'Staff User',
    createdAt: new Date().toISOString().split('T')[0],
    status: 'PENDING'
  };
  masterApprovalsStore.unshift(newReq);
  res.status(201).json({ success: true, message: 'Master Data change submitted for Approval', data: newReq });
};

// 2.2 Master Data Approval Controller
export const approveMasterDataChange = (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, rejectionReason, approvedBy } = req.body;
  const item = masterApprovalsStore.find((m) => m.id === id);
  if (!item) return res.status(404).json({ success: false, message: 'Request not found' });

  item.status = status;
  item.approvedBy = approvedBy || 'Admin User';
  item.approvedAt = new Date().toISOString().split('T')[0];
  item.rejectionReason = rejectionReason;

  if (status === 'APPROVED') {
    if (item.entityType === 'VENDORS') {
      vendorsStore.unshift({ ...item.proposedData, id: `V-${Date.now()}`, code: `VEND-00${vendorsStore.length + 1}`, status: 'ACTIVE' });
    } else if (item.entityType === 'ITEMS') {
      itemsStore.unshift({ ...item.proposedData, id: `I-${Date.now()}`, itemCode: `ITM-00${itemsStore.length + 1}`, status: 'ACTIVE' });
    }
  }

  res.json({ success: true, message: `Master Data request ${status.toLowerCase()}`, data: item });
};

// 2.3 Quotation Management Controller
export const getQuotations = (req: Request, res: Response) => {
  res.json({ success: true, quotations: quotationsStore });
};

export const createQuotation = (req: Request, res: Response) => {
  const newQuote: Quotation = {
    id: `Q-${Date.now()}`,
    quotationNo: generateNo('QT', quotationsStore.length),
    prId: req.body.prId,
    vendorId: req.body.vendorId,
    vendorName: req.body.vendorName,
    items: req.body.items || [],
    validityDate: req.body.validityDate || '2026-05-01',
    deliveryDays: Number(req.body.deliveryDays) || 7,
    paymentTerms: req.body.paymentTerms || '30 Days Net',
    status: 'RECEIVED',
    createdAt: new Date().toISOString().split('T')[0]
  };
  quotationsStore.unshift(newQuote);
  res.status(201).json({ success: true, data: newQuote });
};

export const selectWinningQuotation = (req: Request, res: Response) => {
  const { id } = req.params;
  quotationsStore.forEach((q) => {
    if (q.id === id) {
      q.status = 'SELECTED';
      q.isWinning = true;
    } else if (q.prId && q.prId === quotationsStore.find((x) => x.id === id)?.prId) {
      q.status = 'REJECTED';
      q.isWinning = false;
    }
  });
  res.json({ success: true, message: 'Winning quotation selected' });
};

// 2.4 PR Data Controller
export const getPRs = (req: Request, res: Response) => {
  res.json({ success: true, prs: prsStore });
};

export const createPR = (req: Request, res: Response) => {
  const newPr: PurchaseRequisition = {
    id: `PR-${Date.now()}`,
    prNo: generateNo('PR', prsStore.length),
    departmentId: req.body.departmentId || 'D-CSE',
    departmentName: req.body.departmentName || 'Computer Engineering',
    requestedBy: req.body.requestedBy || 'Faculty User',
    date: new Date().toISOString().split('T')[0],
    budgetHeadId: req.body.budgetHeadId || 'BH-501',
    budgetHeadName: req.body.budgetHeadName || 'Lab Equipment',
    projectId: req.body.projectId,
    projectName: req.body.projectName,
    items: req.body.items || [],
    justification: req.body.justification || 'Departmental Requirement',
    priority: req.body.priority || 'MEDIUM',
    status: 'PENDING_APPROVAL',
    createdBy: req.body.createdBy || 'Faculty User',
    createdAt: new Date().toISOString().split('T')[0],
    history: [{ timestamp: new Date().toLocaleString(), action: 'Created PR', user: 'Faculty User' }]
  };
  prsStore.unshift(newPr);
  res.status(201).json({ success: true, data: newPr });
};

export const updatePRStatus = (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, rejectionReason, approvedBy } = req.body;
  const pr = prsStore.find((p) => p.id === id);
  if (!pr) return res.status(404).json({ success: false, message: 'PR not found' });

  pr.status = status;
  if (status === 'APPROVED') {
    pr.approvedBy = approvedBy || 'Admin User';
    pr.approvedAt = new Date().toISOString().split('T')[0];
  } else if (status === 'REJECTED') {
    pr.rejectionReason = rejectionReason;
  }
  pr.history.push({ timestamp: new Date().toLocaleString(), action: `Status changed to ${status}`, user: approvedBy || 'User', remarks: rejectionReason });
  res.json({ success: true, data: pr });
};

// 2.5 PO Data Controller
export const getPOs = (req: Request, res: Response) => {
  res.json({ success: true, pos: posStore });
};

export const createPO = (req: Request, res: Response) => {
  const subtotal = (req.body.items || []).reduce((acc: number, it: any) => acc + (it.qtyOrdered * it.unitPrice), 0);
  const taxTotal = subtotal * 0.18;
  const newPo: PurchaseOrder = {
    id: `PO-${Date.now()}`,
    poNo: generateNo('PO', posStore.length),
    prId: req.body.prId || 'PR-401',
    prNo: req.body.prNo || 'PR/2026/0001',
    quotationId: req.body.quotationId,
    vendorId: req.body.vendorId || 'V-101',
    vendorName: req.body.vendorName || 'TechLab Supplies Pvt Ltd',
    vendorGstin: req.body.vendorGstin || '27AAACT1042A1Z5',
    projectId: req.body.projectId,
    projectName: req.body.projectName,
    date: new Date().toISOString().split('T')[0],
    deliveryDate: req.body.deliveryDate || '2026-04-01',
    paymentTerms: req.body.paymentTerms || '30 Days Net',
    deliveryAddress: req.body.deliveryAddress || 'VIIT Central Stores, Main Campus, Pune',
    items: req.body.items || [],
    subtotal,
    taxTotal,
    grandTotal: subtotal + taxTotal,
    status: 'APPROVED',
    createdBy: req.body.createdBy || 'Finance Officer',
    createdAt: new Date().toISOString().split('T')[0],
    history: [{ timestamp: new Date().toLocaleString(), action: 'PO Generated', user: 'Finance Officer' }]
  };
  posStore.unshift(newPo);

  // Update Project Committed Spend
  if (newPo.projectId) {
    const proj = projectsStore.find((p) => p.id === newPo.projectId);
    if (proj) {
      proj.committedSpend += newPo.grandTotal;
      proj.remainingBudget = proj.totalBudget - proj.committedSpend;
    }
  }

  res.status(201).json({ success: true, data: newPo });
};

// 2.6 GRN Data Controller
export const getGRNs = (req: Request, res: Response) => {
  res.json({ success: true, grns: grnsStore });
};

export const createGRN = (req: Request, res: Response) => {
  const newGrn: GoodsReceiptNote = {
    id: `GRN-${Date.now()}`,
    grnNo: generateNo('GRN', grnsStore.length),
    poId: req.body.poId,
    poNo: req.body.poNo,
    vendorName: req.body.vendorName,
    storeId: req.body.storeId || 'STORE-01',
    storeName: req.body.storeName || 'Central Store',
    dateReceived: new Date().toISOString().split('T')[0],
    receivedBy: req.body.receivedBy || 'Store In-Charge',
    items: req.body.items || [],
    status: 'POSTED',
    isDiscrepancyFlagged: req.body.isDiscrepancyFlagged || false,
    history: [{ timestamp: new Date().toLocaleString(), action: 'GRN Received & Stock Posted', user: 'Store In-Charge' }]
  };
  grnsStore.unshift(newGrn);

  // Auto-Update Inventory Register stock balances
  newGrn.items.forEach((it) => {
    const invItem = inventoryStore.find((x) => x.itemId === it.itemId);
    if (invItem) {
      invItem.receivedQty += it.qtyAccepted;
      invItem.currentStock += it.qtyAccepted;
      invItem.totalValuation = invItem.currentStock * invItem.unitCost;
      invItem.status = invItem.currentStock <= invItem.reorderLevel ? 'LOW_STOCK' : 'NORMAL';
    }
  });

  res.status(201).json({ success: true, data: newGrn });
};

// 2.7 Inventory Register Controller
export const getInventory = (req: Request, res: Response) => {
  res.json({ success: true, inventory: inventoryStore });
};

// 2.8 Stock Issue Controller
export const getStockIssues = (req: Request, res: Response) => {
  res.json({ success: true, issues: stockIssuesStore });
};

export const createStockIssue = (req: Request, res: Response) => {
  const newIssue: StockIssue = {
    id: `ISS-${Date.now()}`,
    issueNo: generateNo('ISS', stockIssuesStore.length),
    departmentId: req.body.departmentId || 'D-CSE',
    departmentName: req.body.departmentName || 'Computer Engineering',
    requestedBy: req.body.requestedBy || 'Faculty User',
    storeId: req.body.storeId || 'STORE-01',
    storeName: req.body.storeName || 'Central Electronics Store',
    date: new Date().toISOString().split('T')[0],
    items: req.body.items || [],
    purpose: req.body.purpose || 'Internal Consumption',
    status: 'ISSUED',
    issuedBy: 'Store In-charge',
    createdAt: new Date().toISOString().split('T')[0],
    history: [{ timestamp: new Date().toLocaleString(), action: 'Stock Issued to Department', user: 'Store In-charge' }]
  };
  stockIssuesStore.unshift(newIssue);

  // Decrement Inventory Register
  newIssue.items.forEach((it) => {
    const inv = inventoryStore.find((x) => x.itemId === it.itemId);
    if (inv) {
      inv.issuedQty += it.qtyIssued;
      inv.currentStock = Math.max(0, inv.currentStock - it.qtyIssued);
      inv.totalValuation = inv.currentStock * inv.unitCost;
      if (inv.currentStock <= inv.reorderLevel) inv.status = 'CRITICAL';
    }
  });

  res.status(201).json({ success: true, data: newIssue });
};

// 2.9 Invoice Data Controller
export const getInvoices = (req: Request, res: Response) => {
  res.json({ success: true, invoices: invoicesStore });
};

export const createInvoice = (req: Request, res: Response) => {
  const subtotal = Number(req.body.subtotal) || 50000;
  const taxAmount = subtotal * 0.18;
  const tdsDeduction = subtotal * 0.02;
  const netPayable = subtotal + taxAmount - tdsDeduction;

  const newInv: VendorInvoice = {
    id: `INV-${Date.now()}`,
    internalInvNo: generateNo('INV', invoicesStore.length),
    vendorInvNo: req.body.vendorInvNo || 'V-INV-1001',
    poId: req.body.poId || 'PO-501',
    poNo: req.body.poNo || 'PO/2026/0042',
    grnId: req.body.grnId,
    grnNo: req.body.grnNo,
    vendorId: req.body.vendorId || 'V-101',
    vendorName: req.body.vendorName || 'TechLab Supplies Pvt Ltd',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: req.body.dueDate || '2026-04-30',
    items: req.body.items || [],
    subtotal,
    taxAmount,
    tdsDeduction,
    netPayable,
    paidAmount: 0,
    balanceOutstanding: netPayable,
    threeWayMatchPassed: true,
    status: 'APPROVED_FOR_PAYMENT',
    history: [{ timestamp: new Date().toLocaleString(), action: 'Invoice Received & 3-Way Match Verified', user: 'Finance Officer' }]
  };
  invoicesStore.unshift(newInv);
  res.status(201).json({ success: true, data: newInv });
};

// 2.10 & 2.11 Invoice Payments & Part Payment Controller
export const getPayments = (req: Request, res: Response) => {
  res.json({ success: true, payments: paymentsStore });
};

export const createPayment = (req: Request, res: Response) => {
  const { invoiceId, amountPaid, paymentMode, txnReference, isAdvance, notes } = req.body;
  const inv = invoicesStore.find((i) => i.id === invoiceId);

  const newPay: InvoicePayment = {
    id: `PAY-${Date.now()}`,
    paymentNo: generateNo('PAY', paymentsStore.length),
    invoiceId: invoiceId || 'INV-901',
    internalInvNo: inv?.internalInvNo || 'INV/2026/0014',
    vendorInvNo: inv?.vendorInvNo || 'TL-INV-9921',
    vendorName: inv?.vendorName || 'TechLab Supplies Pvt Ltd',
    paymentDate: new Date().toISOString().split('T')[0],
    amountPaid: Number(amountPaid) || 50000,
    paymentMode: paymentMode || 'NEFT_RTGS',
    txnReference: txnReference || 'NEFT-409182901',
    isAdvance: Boolean(isAdvance),
    status: 'PROCESSED',
    notes
  };

  paymentsStore.unshift(newPay);

  if (inv) {
    inv.paidAmount += newPay.amountPaid;
    inv.balanceOutstanding = Math.max(0, inv.netPayable - inv.paidAmount);
    inv.status = inv.balanceOutstanding === 0 ? 'PAID' : 'PARTIALLY_PAID';
  }

  res.status(201).json({ success: true, data: newPay });
};

// 2.12 D/C Note Controller
export const getDCNotes = (req: Request, res: Response) => {
  res.json({ success: true, dcNotes: dcNotesStore });
};

export const createDCNote = (req: Request, res: Response) => {
  const newDc: DebitCreditNote = {
    id: `DC-${Date.now()}`,
    noteNo: generateNo('DC', dcNotesStore.length),
    type: req.body.type || 'DEBIT',
    linkedGrnNo: req.body.linkedGrnNo,
    linkedInvoiceNo: req.body.linkedInvoiceNo,
    vendorName: req.body.vendorName || 'TechLab Supplies Pvt Ltd',
    date: new Date().toISOString().split('T')[0],
    reason: req.body.reason || 'SHORT_SUPPLY',
    adjustedAmount: Number(req.body.adjustedAmount) || 10000,
    adjustedQty: Number(req.body.adjustedQty) || 1,
    remarks: req.body.remarks || 'Adjustment Note',
    status: 'POSTED',
    createdAt: new Date().toISOString().split('T')[0],
    history: [{ timestamp: new Date().toLocaleString(), action: 'D/C Note Issued', user: 'Finance Officer' }]
  };
  dcNotesStore.unshift(newDc);
  res.status(201).json({ success: true, data: newDc });
};

// 2.13 Project Management Controller
export const getProjects = (req: Request, res: Response) => {
  res.json({ success: true, projects: projectsStore });
};

export const createProject = (req: Request, res: Response) => {
  const newProj: ProjectContainer = {
    id: `PROJ-${Date.now()}`,
    code: `PRJ-${String(projectsStore.length + 1).padStart(3, '0')}`,
    name: req.body.name,
    departmentName: req.body.departmentName || 'Computer Engineering',
    totalBudget: Number(req.body.totalBudget) || 1000000,
    committedSpend: 0,
    actualSpend: 0,
    remainingBudget: Number(req.body.totalBudget) || 1000000,
    startDate: req.body.startDate || '2026-01-01',
    endDate: req.body.endDate || '2026-12-31',
    status: 'ACTIVE',
    manager: req.body.manager || 'Faculty HOD'
  };
  projectsStore.unshift(newProj);
  res.status(201).json({ success: true, data: newProj });
};

// 2.14 Cross-Module Aggregated Reports
export const getERPReports = (req: Request, res: Response) => {
  const totalAllocated = projectsStore.reduce((a, b) => a + b.totalBudget, 0);
  const totalCommitted = posStore.reduce((a, b) => a + b.grandTotal, 0);
  const totalPaid = paymentsStore.reduce((a, b) => a + b.amountPaid, 0);
  const stockValuation = inventoryStore.reduce((a, b) => a + b.totalValuation, 0);

  res.json({
    success: true,
    summary: {
      totalAllocated,
      totalCommitted,
      totalPaid,
      stockValuation,
      pendingPrCount: prsStore.filter((p) => p.status === 'PENDING_APPROVAL').length,
      openPoCount: posStore.filter((p) => p.status !== 'CLOSED' && p.status !== 'CANCELLED').length,
      lowStockCount: inventoryStore.filter((i) => i.status !== 'NORMAL').length
    },
    prStatusData: [
      { name: 'Approved', count: prsStore.filter((p) => p.status === 'APPROVED').length },
      { name: 'Pending', count: prsStore.filter((p) => p.status === 'PENDING_APPROVAL').length },
      { name: 'Rejected', count: prsStore.filter((p) => p.status === 'REJECTED').length }
    ],
    vendorSpendData: vendorsStore.map((v) => {
      const vendorPos = posStore.filter((p) => p.vendorId === v.id);
      const totalPoVal = vendorPos.reduce((acc, p) => acc + p.grandTotal, 0);
      return { vendorName: v.name, totalPoVal };
    })
  });
};

// Aliases and Helper Handlers for ERP Routes
export const createMasterData = createMasterDataRequest;
export const getPendingMasterApprovals = (req: Request, res: Response) => {
  res.json({ success: true, data: masterApprovalsStore.filter((a) => a.status === 'PENDING') });
};
export const approveMasterData = approveMasterDataChange;
export const approvePR = updatePRStatus;
export const approvePO = (req: Request, res: Response) => {
  const { id } = req.params;
  const po = posStore.find((p) => p.id === id);
  if (po) po.status = 'APPROVED';
  res.json({ success: true, data: po });
};
export const verifyGRN = (req: Request, res: Response) => {
  const { id } = req.params;
  const grn = grnsStore.find((g) => g.id === id);
  if (grn) grn.status = 'POSTED';
  res.json({ success: true, data: grn });
};
export const verifyInvoice = (req: Request, res: Response) => {
  const { id } = req.params;
  const inv = invoicesStore.find((i) => i.id === id);
  if (inv) inv.status = 'APPROVED_FOR_PAYMENT';
  res.json({ success: true, data: inv });
};
export const getPartPayments = (req: Request, res: Response) => {
  res.json({ success: true, data: [] });
};
export const createPartPayment = (req: Request, res: Response) => {
  res.status(201).json({ success: true, data: req.body });
};
export const getERPSummary = getERPReports;

