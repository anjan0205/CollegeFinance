export type UserRole = 'ADMIN' | 'FINANCE' | 'HOD' | 'DEPARTMENT_USER' | 'PRINCIPAL' | 'CEO';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: number | null;
  departmentCode?: string | null;
  departmentName?: string | null;
}

export interface Department {
  id: number;
  code: string;
  name: string;
  category: string;
}

export interface BudgetHead {
  id: number;
  code: number;
  name: string;
  category: string;
  description?: string;
}

export interface DepartmentSummary {
  id: number;
  code: string;
  name: string;
  category: string;
  allocatedBudget: number;
  prCommittedAmount: number;
  actualUtilized: number;
  remainingBudget: number;
  utilizationPct: number;
  statusTag: 'Normal' | 'Warning' | 'Critical' | 'Exceeded';
  prCount: number;
}

export interface BudgetHeadItem {
  id: number;
  code: number;
  name: string;
  category: string;
  totalAllocated: number;
  totalCommitted: number;
  totalActualUtilized: number;
  totalRemaining: number;
  utilizationPct: number;
  departmentCount: number;
}

export interface BudgetAllocation {
  id: number;
  departmentId: number;
  departmentCode: string;
  departmentName: string;
  budgetHeadId: number;
  budgetHeadCode: number;
  budgetHeadName: string;
  sourceBudgetCode: string;
  financialYear: string;
  allocatedAmount: number;
  committedAmount: number;
  actualUtilizedAmount: number;
  remainingAmount: number;
  utilizationPercentage: number;
  alertStatus: 'Normal' | 'Warning' | 'Critical' | 'Exceeded';
}

export interface PRItem {
  id: number;
  prId: number;
  productName: string;
  productCode?: string;
  productType?: string;
  productDescription?: string;
  unitTypeName?: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  currentStock?: number;
  preferredVendor?: string;
  productRequiredBy?: string;
  itemRemarks?: string;
}

export interface PRRecord {
  id: number;
  prNumber: string;
  prDate: string;
  departmentId: number;
  departmentCode: string;
  departmentName: string;
  budgetHeadId: number;
  budgetHeadCode: number;
  budgetHeadName: string;
  requestedBy: string;
  purpose?: string;
  totalAmount: number;
  utilizedAmount?: number;
  remainingPRAmount?: number;
  invoicedPercentage?: number;
  invoices?: InvoiceRecord[];
  status: 'Open' | 'Approved' | 'Pending' | 'Rejected' | 'Closed';
  approvalStatus: 'Approved' | 'Pending' | 'Rejected';
  prPoStatus: 'Open' | 'Closed' | 'In-Process';
  approval1?: string;
  approval2?: string;
  approval3?: string;
  principalName?: string;
  principalEmail?: string;
  principalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  principalActionAt?: string;
  principalRemarks?: string;
  ceoName?: string;
  ceoEmail?: string;
  ceoStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  ceoActionAt?: string;
  ceoRemarks?: string;
  approvalStage?: 'PENDING_ADMIN' | 'PENDING_PRINCIPAL' | 'PENDING_CEO' | 'APPROVED' | 'REJECTED';
  emailLogs?: Array<{
    id: string;
    to: string;
    recipientRole: 'Principal' | 'CEO';
    subject: string;
    actionToken: string;
    sentAt: string;
    status: 'SENT' | 'DELIVERED' | 'CLICKED';
  }>;
  sourceBudgetCode: string;
  documentUrl?: string;
  documentName?: string;
  documentSize?: number;
  documentType?: string;
  attachments?: Array<{
    name: string;
    url: string;
    size?: number;
    type?: string;
    remarks?: string;
    uploadedAt?: string;
  }>;
  invoiceStatus?: 'UNINVOICED' | 'PARTIAL' | 'FULLY_INVOICED';
  items?: PRItem[];
}

export interface ImportBatch {
  id: number;
  batchType: 'BUDGET' | 'PR';
  filename: string;
  totalRows: number;
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  importedBy?: number;
  createdAt: string;
}

export interface ImportErrorRecord {
  id: number;
  batchId: number;
  rowNumber: number;
  prNumber?: string;
  errorMessage: string;
  rawData?: string;
}

export interface DashboardSummaryData {
  totalAllocated: number;
  totalCommitted: number;
  totalActualUtilized: number;
  totalRemaining: number;
  utilizationPct: number;
  totalPRs: number;
  approvedPRs: number;
  pendingPRs: number;
  rejectedPRs: number;
  openPRs: number;
  closedPRs: number;
}

export interface InvoiceRecord {
  id: number | string;
  invoiceNumber: string;
  invoiceDate: string;
  prId: number | string;
  prNumber: string;
  departmentId: number | string;
  departmentCode: string;
  departmentName: string;
  budgetHeadId: number | string;
  budgetHeadCode: number;
  budgetHeadName: string;
  vendorName: string;
  totalAmount: number;
  taxAmount?: number;
  status: 'Pending' | 'Approved' | 'Paid' | 'Rejected';
  paymentStatus: 'Unpaid' | 'Partial' | 'Paid';
  paymentDate?: string;
  remarks?: string;
  submittedBy: string;
  createdAt?: string;
}
