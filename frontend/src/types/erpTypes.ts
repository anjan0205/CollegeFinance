export type ApprovalStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'PENDING_HOD' | 'PENDING_FINANCE' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface VendorMaster {
  id: string;
  name: string;
  code: string;
  category: string;
  contactPerson: string;
  email: string;
  phone: string;
  gstNo: string;
  address: string;
  rating: number;
  status: ApprovalStatus;
  createdAt: string;
}

export interface ItemMaster {
  id: string;
  itemCode: string;
  name: string;
  category: string;
  subcategory: string;
  uom: string;
  minStock: number;
  reorderLevel: number;
  currentStock: number;
  unitPrice: number;
  hsnSacCode: string;
  status: ApprovalStatus;
}

export interface DepartmentMaster {
  id: string;
  code: string;
  name: string;
  hodName: string;
  budgetCode: string;
  status: ApprovalStatus;
}

export interface CostCenterMaster {
  id: string;
  code: string;
  name: string;
  department: string;
  status: ApprovalStatus;
}

export interface UoMMaster {
  id: string;
  code: string;
  name: string;
  status: ApprovalStatus;
}

export interface StoreMaster {
  id: string;
  code: string;
  name: string;
  location: string;
  manager: string;
  status: ApprovalStatus;
}

export interface QuotationItem {
  itemId: string;
  itemName: string;
  qty: number;
  unitPrice: number;
  taxRate: number;
  totalAmount: number;
}

export interface QuotationRecord {
  id: string;
  prId: string;
  prNumber: string;
  vendorId: string;
  vendorName: string;
  quoteNumber: string;
  totalAmount: number;
  validUntil: string;
  status: 'SUBMITTED' | 'UNDER_EVALUATION' | 'SELECTED' | 'REJECTED';
  items: QuotationItem[];
  remarks?: string;
}

export interface PRItem {
  itemId: string;
  itemName: string;
  qty: number;
  estimatedUnitPrice: number;
  uom: string;
  totalEstimate: number;
}

export interface PRRecord {
  id: string;
  prNumber: string;
  department: string;
  budgetHead: string;
  requesterName: string;
  purpose: string;
  totalAmount: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: ApprovalStatus;
  createdAt: string;
  items: PRItem[];
  projectId?: string;
}

export interface POItem {
  itemId: string;
  itemName: string;
  qtyOrdered: number;
  qtyReceived: number;
  unitPrice: number;
  taxRate: number;
  totalAmount: number;
}

export type POStatus = 'ISSUED' | 'PARTIALLY_RECEIVED' | 'FULFILLED' | 'CANCELLED' | 'APPROVED' | 'ON_HOLD' | 'REJECTED' | 'CLOSED';

export interface PORecord {
  id: string;
  poNumber: string;
  prNumber: string;
  vendorId: string;
  vendorName: string;
  department: string;
  poDate: string;
  deliveryDueDate: string;
  totalAmount: number;
  taxAmount: number;
  netAmount: number;
  status: POStatus;
  items: POItem[];
  paymentTerms?: string;
  holdReason?: string;
  rejectionReason?: string;
}

export interface GRNItem {
  itemId: string;
  itemName: string;
  qtyReceived: number;
  qtyAccepted: number;
  qtyRejected: number;
  remarks?: string;
}

export interface GRNRecord {
  id: string;
  grnNumber: string;
  poNumber: string;
  vendorName: string;
  storeName: string;
  challanNumber?: string;
  receivedDate: string;
  receivedBy: string;
  inspectionStatus: 'PENDING' | 'PASSED' | 'FAILED_REJECTED';
  status: 'VERIFIED' | 'DRAFT';
  items: GRNItem[];
  remarks?: string;
}

export interface InventoryItem {
  id: string;
  itemCode: string;
  itemName: string;
  category: string;
  uom: string;
  storeLocation: string;
  availableQty: number;
  allocatedQty: number;
  totalValue: number;
  reorderLevel: number;
  lastReceivedDate: string;
}

export interface StockIssueRecord {
  id: string;
  issueNumber: string;
  department: string;
  issuedTo: string;
  storeLocation: string;
  issueDate: string;
  purpose: string;
  status: 'ISSUED' | 'PENDING';
  items: { itemId: string; itemName: string; qtyIssued: number }[];
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  vendorInvoiceNo: string;
  poNumber: string;
  grnNumber: string;
  vendorName: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  matched3Way: boolean;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'PARTIALLY_PAID' | 'FULLY_PAID' | 'REJECTED';
  items: { description: string; qty: number; unitPrice: number; total: number }[];
}

export interface PaymentRecord {
  id: string;
  paymentNumber: string;
  invoiceNumber: string;
  vendorName: string;
  paymentDate: string;
  paymentMode: string;
  referenceNumber: string;
  amountPaid: number;
  status: 'PROCESSED' | 'PENDING';
  remarks?: string;
}

export interface PartPaymentRecord {
  id: string;
  poNumber: string;
  invoiceNumber: string;
  vendorName: string;
  stageName: string;
  percentage: number;
  amount: number;
  dueDate: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'PAID';
  approvedBy?: string;
}

export interface DCNoteRecord {
  id: string;
  noteNumber: string;
  type: 'DEBIT_NOTE' | 'CREDIT_NOTE';
  referenceDocType: 'GRN' | 'INVOICE';
  referenceDocNumber: string;
  vendorName: string;
  reason: string;
  amount: number;
  noteDate: string;
  status: 'APPROVED' | 'DRAFT';
}

export interface ProjectRecord {
  id: string;
  code: string;
  name: string;
  department: string;
  projectManager: string;
  budgetAllocated: number;
  committedAmount: number;
  actualSpent: number;
  startDate: string;
  endDate: string;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
}

export interface ERPSummaryMetrics {
  totalPRs: number;
  totalPOs: number;
  totalGRNs: number;
  totalInvoices: number;
  pendingApprovalsCount: number;
  totalInventoryValue: number;
  activeProjectsCount: number;
  totalPaymentsProcessed: number;
}
