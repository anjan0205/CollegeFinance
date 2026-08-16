export type UserRole = 'ADMIN' | 'FINANCE' | 'HOD' | 'DEPARTMENT_USER';

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
  sourceBudgetCode?: string;
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
