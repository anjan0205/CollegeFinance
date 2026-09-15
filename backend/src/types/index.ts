export type UserRole = 'ADMIN' | 'FINANCE' | 'HOD' | 'DEPARTMENT_USER' | 'PRINCIPAL' | 'CEO';

export interface User {
  id: number | string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: number | string | null;
  departmentCode?: string | null;
  departmentName?: string | null;
}

export interface Department {
  id: number | string;
  code: string;
  name: string;
  category: string;
}

export interface BudgetHead {
  id: number | string;
  code: number;
  name: string;
  category: string;
  description?: string;
}

export interface BudgetAllocation {
  id: number | string;
  departmentId: number | string;
  departmentCode: string;
  departmentName: string;
  budgetHeadId: number | string;
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
  id: number | string;
  prId: number | string;
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
  id: number | string;
  prNumber: string;
  prDate: string;
  departmentId: number | string;
  departmentCode: string;
  departmentName: string;
  budgetHeadId: number | string;
  budgetHeadCode: number;
  budgetHeadName: string;
  requestedBy: string;
  purpose: string;
  totalAmount: number;
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
  sourceBudgetCode?: string;
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
  items: PRItem[];
}

export interface ImportBatch {
  id: number | string;
  batchType: string;
  filename: string;
  totalRows: number;
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  importedBy?: number | string | null;
  createdAt?: string;
}

export interface ImporterErrorRecord {
  id: number | string;
  batchId: number | string;
  rowNumber: number;
  prNumber?: string | null;
  errorMessage: string;
  rawData?: string | null;
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
