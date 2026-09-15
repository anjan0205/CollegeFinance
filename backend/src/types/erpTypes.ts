export type MasterDataCategory = 'VENDORS' | 'ITEMS' | 'DEPARTMENTS' | 'BUDGET_HEADS' | 'UOM' | 'STORES';
export type ERPStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SENT' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'POSTED' | 'PAID' | 'CLOSED' | 'CANCELLED' | 'DISPUTED';

export interface AuditHistory {
  timestamp: string;
  action: string;
  user: string;
  remarks?: string;
}

export interface Vendor {
  id: string;
  name: string;
  code: string;
  gstin: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  category: 'GOODS' | 'SERVICES' | 'BOTH';
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLACKLISTED';
}

export interface Item {
  id: string;
  itemCode: string;
  name: string;
  category: string;
  uom: string;
  hsnSacCode: string;
  reorderLevel: number;
  lastPurchasePrice: number;
  currentStock: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Department {
  id: string;
  code: string;
  name: string;
  hodName: string;
  budgetAllocated: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface BudgetHead {
  id: string;
  code: number;
  name: string;
  category: string;
  allocatedAmount: number;
  committedAmount: number;
  actualSpent: number;
  financialYear: string;
}

export interface UoM {
  id: string;
  code: string;
  description: string;
}

export interface StoreLocation {
  id: string;
  code: string;
  name: string;
  inCharge: string;
  location: string;
}

export interface MasterDataChangeRequest {
  id: string;
  entityType: MasterDataCategory;
  entityId?: string;
  requestType: 'ADD' | 'EDIT';
  proposedData: any;
  previousData?: any;
  createdBy: string;
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export interface Quotation {
  id: string;
  quotationNo: string;
  prId?: string;
  vendorId: string;
  vendorName: string;
  items: {
    itemId: string;
    itemName: string;
    qty: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  validityDate: string;
  deliveryDays: number;
  paymentTerms: string;
  status: 'REQUESTED' | 'RECEIVED' | 'SELECTED' | 'REJECTED';
  isWinning?: boolean;
  createdAt: string;
}

export interface PRItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  uom: string;
  qty: number;
  orderedQty: number;
  estimatedPrice: number;
  totalEstimated: number;
  remarks?: string;
}

export interface PurchaseRequisition {
  id: string;
  prNo: string;
  departmentId: string;
  departmentName: string;
  requestedBy: string;
  date: string;
  budgetHeadId: string;
  budgetHeadName: string;
  projectId?: string;
  projectName?: string;
  items: PRItem[];
  justification: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: ERPStatus;
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  history: AuditHistory[];
}

export interface POItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  uom: string;
  qtyOrdered: number;
  qtyReceived: number;
  unitPrice: number;
  taxRatePct: number;
  taxAmount: number;
  totalAmount: number;
}

export interface PurchaseOrder {
  id: string;
  poNo: string;
  prId: string;
  prNo: string;
  quotationId?: string;
  vendorId: string;
  vendorName: string;
  vendorGstin: string;
  projectId?: string;
  projectName?: string;
  date: string;
  deliveryDate: string;
  paymentTerms: string;
  deliveryAddress: string;
  items: POItem[];
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  status: ERPStatus;
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  history: AuditHistory[];
}

export interface GRNItem {
  itemId: string;
  itemName: string;
  qtyOrdered: number;
  qtyReceived: number;
  qtyAccepted: number;
  qtyRejected: number;
  unitPrice: number;
  rejectionReason?: string;
  batchNo?: string;
}

export interface GoodsReceiptNote {
  id: string;
  grnNo: string;
  poId: string;
  poNo: string;
  vendorName: string;
  storeId: string;
  storeName: string;
  dateReceived: string;
  receivedBy: string;
  items: GRNItem[];
  status: 'DRAFT' | 'VERIFIED' | 'POSTED';
  isDiscrepancyFlagged?: boolean;
  history: AuditHistory[];
}

export interface InventoryItem {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  category: string;
  storeId: string;
  storeName: string;
  uom: string;
  openingStock: number;
  receivedQty: number;
  issuedQty: number;
  currentStock: number;
  reorderLevel: number;
  unitCost: number;
  totalValuation: number;
  status: 'NORMAL' | 'LOW_STOCK' | 'CRITICAL';
}

export interface StockIssue {
  id: string;
  issueNo: string;
  departmentId: string;
  departmentName: string;
  requestedBy: string;
  storeId: string;
  storeName: string;
  date: string;
  items: {
    itemId: string;
    itemName: string;
    qtyRequested: number;
    qtyIssued: number;
    unitPrice: number;
  }[];
  purpose: string;
  status: 'REQUESTED' | 'APPROVED' | 'ISSUED' | 'REJECTED';
  issuedBy?: string;
  createdAt: string;
  history: AuditHistory[];
}

export interface InvoiceItem {
  itemId: string;
  itemName: string;
  qty: number;
  unitPrice: number;
  taxRatePct: number;
  amount: number;
}

export interface VendorInvoice {
  id: string;
  internalInvNo: string;
  vendorInvNo: string;
  poId: string;
  poNo: string;
  grnId?: string;
  grnNo?: string;
  vendorId: string;
  vendorName: string;
  invoiceDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  tdsDeduction: number;
  netPayable: number;
  paidAmount: number;
  balanceOutstanding: number;
  threeWayMatchPassed: boolean;
  mismatchReason?: string;
  status: 'RECEIVED' | 'VERIFIED' | 'APPROVED_FOR_PAYMENT' | 'PARTIALLY_PAID' | 'PAID' | 'DISPUTED';
  history: AuditHistory[];
}

export interface InvoicePayment {
  id: string;
  paymentNo: string;
  invoiceId: string;
  internalInvNo: string;
  vendorInvNo: string;
  vendorName: string;
  paymentDate: string;
  amountPaid: number;
  paymentMode: 'BANK_TRANSFER' | 'CHEQUE' | 'UPI' | 'NEFT_RTGS';
  txnReference: string;
  isAdvance?: boolean;
  status: 'SCHEDULED' | 'PROCESSED' | 'RECONCILED';
  notes?: string;
}

export interface DebitCreditNote {
  id: string;
  noteNo: string;
  type: 'DEBIT' | 'CREDIT';
  linkedGrnNo?: string;
  linkedInvoiceNo?: string;
  vendorName: string;
  date: string;
  reason: 'SHORT_SUPPLY' | 'DAMAGED_GOODS' | 'PRICE_CORRECTION' | 'RATE_DIFFERENCE' | 'RETURN';
  adjustedAmount: number;
  adjustedQty?: number;
  remarks: string;
  status: 'DRAFT' | 'APPROVED' | 'POSTED';
  createdAt: string;
  history: AuditHistory[];
}

export interface ProjectContainer {
  id: string;
  code: string;
  name: string;
  departmentName: string;
  totalBudget: number;
  committedSpend: number;
  actualSpend: number;
  remainingBudget: number;
  startDate: string;
  endDate: string;
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  manager: string;
}
