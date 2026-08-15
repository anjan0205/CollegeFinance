export type UserRole = 'ADMIN' | 'FINANCE' | 'HOD' | 'DEPARTMENT_USER';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: number | null;
  departmentCode?: string | null;
  departmentName?: string | null;
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
  status: 'Open' | 'Approved' | 'Pending' | 'Rejected' | 'Closed';
  approvalStatus: 'Approved' | 'Pending' | 'Rejected';
  prPoStatus: 'Open' | 'Closed' | 'In-Process';
  approval1?: string;
  approval2?: string;
  approval3?: string;
  sourceBudgetCode: string;
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
