// Shared ERP seed datasets. Used by both the client engine
// (services/firebaseClientService.ts) to seed empty Firestore collections, and
// by erpService.ts as a true offline fallback when a request throws.
import {
  VendorMaster, ItemMaster, DepartmentMaster, CostCenterMaster, UoMMaster, StoreMaster,
  QuotationRecord, PORecord, GRNRecord, InventoryItem, StockIssueRecord,
  InvoiceRecord, PaymentRecord, PartPaymentRecord, DCNoteRecord, ProjectRecord
} from '../types/erpTypes';

export const SEED_MASTERS = {
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

export const SEED_QUOTATIONS: QuotationRecord[] = [
  {
    id: 'QUOTE-2026-001', prId: 'PR/2026/0001', prNumber: 'PR/2026/0001',
    vendorId: 'VEND-001', vendorName: 'Apex Tech Solutions', quoteNumber: 'APX-Q-991',
    totalAmount: 180000, validUntil: '2026-04-30', status: 'SELECTED',
    items: [{ itemId: 'ITEM-001', itemName: 'Epson High-Lumen Laser Projector', qty: 4, unitPrice: 45000, taxRate: 18, totalAmount: 180000 }],
    remarks: 'Includes 3 years onsite warranty and installation.'
  },
  {
    id: 'QUOTE-2026-002', prId: 'PR/2026/0001', prNumber: 'PR/2026/0001',
    vendorId: 'VEND-002', vendorName: 'Standard Scientific Supplies', quoteNumber: 'SSS-Q-441',
    totalAmount: 195000, validUntil: '2026-04-15', status: 'SUBMITTED',
    items: [{ itemId: 'ITEM-001', itemName: 'Epson High-Lumen Laser Projector', qty: 4, unitPrice: 48750, taxRate: 18, totalAmount: 195000 }],
    remarks: 'Standard 1 year warranty.'
  }
];

export const SEED_POS: PORecord[] = [
  {
    id: 'PO-1', poNumber: 'PO/2026/0042', prNumber: 'PR/2026/0001',
    vendorId: 'VEND-001', vendorName: 'Apex Tech Solutions', department: 'Computer Science & Engineering',
    poDate: '2026-02-14', deliveryDueDate: '2026-03-01', totalAmount: 180000, taxAmount: 32400, netAmount: 212400,
    status: 'PARTIALLY_RECEIVED', paymentTerms: '30 Days Credit',
    items: [{ itemId: 'ITEM-001', itemName: 'Epson High-Lumen Laser Projector', qtyOrdered: 4, qtyReceived: 2, unitPrice: 45000, taxRate: 18, totalAmount: 180000 }]
  }
];

export const SEED_GRNS: GRNRecord[] = [
  {
    id: 'GRN-1', grnNumber: 'GRN/2026/0018', poNumber: 'PO/2026/0042', vendorName: 'Apex Tech Solutions',
    storeName: 'IT Infrastructure Store Room', challanNumber: 'CH-APX-8821', receivedDate: '2026-02-22',
    receivedBy: 'P. Verma', inspectionStatus: 'PASSED', status: 'VERIFIED',
    remarks: '2 units received in excellent condition. Tested and accepted.',
    items: [{ itemId: 'ITEM-001', itemName: 'Epson High-Lumen Laser Projector', qtyReceived: 2, qtyAccepted: 2, qtyRejected: 0, remarks: 'Verified Serial Nos: EP-881, EP-882' }]
  }
];

export const SEED_INVENTORY: InventoryItem[] = [
  { id: 'INV-1', itemCode: 'IT-PRJ-01', itemName: 'Epson High-Lumen Laser Projector', category: 'Electronics', uom: 'NOS', storeLocation: 'IT Infrastructure Store Room', availableQty: 8, allocatedQty: 2, totalValue: 360000, reorderLevel: 5, lastReceivedDate: '2026-02-22' },
  { id: 'INV-2', itemCode: 'LAB-OSC-02', itemName: 'Digital Storage Oscilloscope 100MHz', category: 'Lab Equipment', uom: 'NOS', storeLocation: 'Central VIIT Store Warehouse', availableQty: 14, allocatedQty: 0, totalValue: 448000, reorderLevel: 10, lastReceivedDate: '2026-01-20' }
];

export const SEED_STOCK_ISSUES: StockIssueRecord[] = [
  {
    id: 'ISS-1', issueNumber: 'ISS/2026/0009', department: 'Computer Science & Engineering',
    issuedTo: 'Dr. A. B. Patil', storeLocation: 'IT Infrastructure Store Room', issueDate: '2026-02-25',
    purpose: 'Installed in Lab 4 Auditorium', status: 'ISSUED',
    items: [{ itemId: 'ITEM-001', itemName: 'Epson High-Lumen Laser Projector', qtyIssued: 2 }]
  }
];

export const SEED_INVOICES: InvoiceRecord[] = [
  {
    id: 'INV-REC-1', invoiceNumber: 'INV/2026/0014', vendorInvoiceNo: 'APX-INV-9901', poNumber: 'PO/2026/0042',
    grnNumber: 'GRN/2026/0018', vendorName: 'Apex Tech Solutions', invoiceDate: '2026-02-23', dueDate: '2026-03-25',
    amount: 180000, taxAmount: 32400, totalAmount: 212400, matched3Way: true, status: 'PARTIALLY_PAID',
    items: [{ description: 'Epson High-Lumen Laser Projector (Batch 1)', qty: 2, unitPrice: 45000, total: 90000 }]
  }
];

export const SEED_PAYMENTS: PaymentRecord[] = [
  {
    id: 'PAY-1', paymentNumber: 'PAY/2026/0008', invoiceNumber: 'INV/2026/0014', vendorName: 'Apex Tech Solutions',
    paymentDate: '2026-02-28', paymentMode: 'NEFT', referenceNumber: 'NEFT-AXIS-99210', amountPaid: 100000,
    status: 'PROCESSED', remarks: '50% advance delivery release payment.'
  }
];

export const SEED_PART_PAYMENTS: PartPaymentRecord[] = [
  { id: 'PP-1', poNumber: 'PO/2026/0042', invoiceNumber: 'INV/2026/0014', vendorName: 'Apex Tech Solutions', stageName: 'Stage 1: Initial Goods Received (50%)', percentage: 50, amount: 106200, dueDate: '2026-03-05', status: 'PAID', approvedBy: 'Finance Controller' },
  { id: 'PP-2', poNumber: 'PO/2026/0042', invoiceNumber: 'INV/2026/0014', vendorName: 'Apex Tech Solutions', stageName: 'Stage 2: Final Acceptance & Signoff (50%)', percentage: 50, amount: 106200, dueDate: '2026-03-25', status: 'PENDING_APPROVAL', approvedBy: undefined }
];

export const SEED_DC_NOTES: DCNoteRecord[] = [
  {
    id: 'DC-1', noteNumber: 'DC/2026/0002', type: 'DEBIT_NOTE', referenceDocType: 'GRN', referenceDocNumber: 'GRN/2026/0018',
    vendorName: 'Apex Tech Solutions', reason: 'Damaged HDMI cable assembly supplied in accessories box', amount: 2500,
    noteDate: '2026-02-24', status: 'APPROVED'
  }
];

export const SEED_PROJECTS: ProjectRecord[] = [
  { id: 'PROJ-1', code: 'PRJ-2026-AI-LAB', name: 'AI & Machine Learning High-Performance Computing Lab', department: 'Computer Science & Engineering', projectManager: 'Dr. A. B. Patil', budgetAllocated: 5000000, committedAmount: 212400, actualSpent: 100000, startDate: '2026-01-01', endDate: '2026-08-31', status: 'ACTIVE' },
  { id: 'PROJ-2', code: 'PRJ-2026-SOLAR-02', name: 'Rooftop Solar Energy Panel Installation Phase II', department: 'Electrical Engineering', projectManager: 'Prof. S. R. Varma', budgetAllocated: 3500000, committedAmount: 0, actualSpent: 0, startDate: '2026-03-01', endDate: '2026-11-30', status: 'PLANNED' }
];
