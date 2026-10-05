import api from './api';
import {
  DCNoteRecord,
  ERPSummaryMetrics,
  GRNRecord,
  InventoryItem,
  InvoiceRecord,
  PaymentRecord,
  ProjectRecord,
  StockIssueRecord
} from '../types/erpTypes';

type ApiRecord = Record<string, any>;

function requireData<T>(data: unknown): T {
  if (data === undefined || data === null) throw new Error('ERP API returned no data.');
  return data as T;
}

function list<T>(path: string): Promise<T[]> {
  return api.get(path).then((res) => {
    if (!Array.isArray(res.data?.data)) throw new Error(`ERP API returned an invalid list for ${path}.`);
    return res.data.data as T[];
  });
}

function create<T>(path: string, data: unknown): Promise<T> {
  return api.post(path, data).then((res) => requireData<T>(res.data?.data));
}

/** Convert API failures into safe, actionable messages for ERP workflow pages. */
export function getERPErrorMessage(error: unknown): string {
  const responseMessage = (error as any)?.response?.data?.message;
  const message = responseMessage || (error instanceof Error ? error.message : undefined);
  return typeof message === 'string' && message.trim()
    ? message
    : 'Unable to complete the ERP request. Please try again.';
}

// The Express domain model deliberately uses canonical accounting names (for
// example, `currentStock` and `internalInvNo`). These mappers preserve that API
// contract while supplying the display model used by the existing ERP screens.
const mapGRN = (record: ApiRecord): GRNRecord => ({
  id: String(record.id),
  grnNumber: record.grnNo,
  poNumber: record.poNo,
  vendorName: record.vendorName,
  storeName: record.storeName,
  challanNumber: record.challanNumber,
  receivedDate: record.dateReceived,
  receivedBy: record.receivedBy,
  inspectionStatus: record.isDiscrepancyFlagged ? 'FAILED_REJECTED' : 'PASSED',
  status: record.status === 'DRAFT' ? 'DRAFT' : 'VERIFIED',
  items: (record.items || []).map((item: ApiRecord) => ({
    itemId: String(item.itemId),
    itemName: String(item.itemName),
    qtyReceived: Number(item.qtyReceived || 0),
    qtyAccepted: Number(item.qtyAccepted || 0),
    qtyRejected: Number(item.qtyRejected || 0),
    remarks: item.remarks || item.rejectionReason
  })),
  remarks: record.remarks
});

const mapInventory = (record: ApiRecord): InventoryItem => ({
  id: String(record.id),
  itemCode: String(record.itemCode),
  itemName: String(record.itemName),
  category: String(record.category),
  uom: String(record.uom),
  storeLocation: record.storeName,
  availableQty: Number(record.currentStock || 0),
  allocatedQty: Number(record.issuedQty || 0),
  totalValue: Number(record.totalValuation || 0),
  reorderLevel: Number(record.reorderLevel || 0),
  lastReceivedDate: record.lastReceivedDate || ''
});

const mapStockIssue = (record: ApiRecord): StockIssueRecord => ({
  id: String(record.id),
  issueNumber: record.issueNo,
  department: record.departmentName,
  issuedTo: record.requestedBy,
  storeLocation: record.storeName,
  issueDate: record.date,
  purpose: record.purpose,
  status: record.status === 'ISSUED' ? 'ISSUED' : 'PENDING',
  items: (record.items || []).map((item: ApiRecord) => ({
    itemId: String(item.itemId),
    itemName: String(item.itemName),
    qtyIssued: Number(item.qtyIssued || 0)
  }))
});

const mapInvoice = (record: ApiRecord): InvoiceRecord => ({
  id: String(record.id),
  invoiceNumber: record.internalInvNo,
  vendorInvoiceNo: record.vendorInvNo,
  poNumber: record.poNo,
  grnNumber: record.grnNo || '—',
  vendorName: record.vendorName,
  invoiceDate: record.invoiceDate,
  dueDate: record.dueDate,
  amount: record.subtotal,
  taxAmount: Number(record.taxAmount || 0),
  totalAmount: Number(record.netPayable || 0),
  matched3Way: record.threeWayMatchPassed,
  status: record.status === 'PAID'
    ? 'FULLY_PAID'
    : record.status === 'PARTIALLY_PAID'
      ? 'PARTIALLY_PAID'
      : record.status === 'DISPUTED'
        ? 'REJECTED'
        : record.status === 'APPROVED_FOR_PAYMENT'
          ? 'APPROVED'
          : 'PENDING_APPROVAL',
  items: (record.items || []).map((item: ApiRecord) => ({
    description: item.itemName,
    qty: item.qty,
    unitPrice: item.unitPrice,
    total: item.amount
  }))
});

const mapPayment = (record: ApiRecord): PaymentRecord => ({
  id: String(record.id),
  paymentNumber: record.paymentNo,
  invoiceNumber: record.internalInvNo,
  vendorName: record.vendorName,
  paymentDate: record.paymentDate,
  paymentMode: record.paymentMode,
  referenceNumber: record.txnReference,
  amountPaid: Number(record.amountPaid || 0),
  status: record.status === 'PROCESSED' ? 'PROCESSED' : 'PENDING',
  remarks: record.notes
});

const mapDCNote = (record: ApiRecord): DCNoteRecord => ({
  id: String(record.id),
  noteNumber: record.noteNo,
  type: record.type === 'DEBIT' ? 'DEBIT_NOTE' : 'CREDIT_NOTE',
  referenceDocType: record.linkedInvoiceNo ? 'INVOICE' : 'GRN',
  referenceDocNumber: record.linkedInvoiceNo || record.linkedGrnNo || '—',
  vendorName: record.vendorName,
  reason: record.reason,
  amount: record.adjustedAmount,
  noteDate: record.date,
  status: record.status === 'DRAFT' ? 'DRAFT' : 'APPROVED'
});

const mapProject = (record: ApiRecord): ProjectRecord => ({
  id: String(record.id),
  code: record.code,
  name: record.name,
  department: record.departmentName,
  projectManager: record.manager,
  budgetAllocated: Number(record.totalBudget || 0),
  committedAmount: Number(record.committedSpend || 0),
  actualSpent: Number(record.actualSpend || 0),
  startDate: record.startDate,
  endDate: record.endDate,
  status: record.status === 'PLANNING' ? 'PLANNED' : record.status
});

/**
 * ERP API client. There are intentionally no client-side write fallbacks: a
 * caller only receives a success result after the authenticated backend has
 * accepted and persisted the transaction.
 */
export const erpService = {
  getMasterData: (type: string) => list<any>(`/erp/master?type=${encodeURIComponent(type)}`),
  createMasterData: (type: string, data: any) => create<any>('/erp/master', { type, data }),
  getPendingMasterApprovals: () => list<any>('/erp/master/approvals'),
  approveMasterData: (_type: string, id: string, action: 'APPROVE' | 'REJECT', remarks?: string) => create<any>('/erp/master/approve', { id, action, remarks }),

  getQuotations: () => list<any>('/erp/quotations'),
  createQuotation: (data: any) => create<any>('/erp/quotations', data),
  selectWinningQuotation: (id: string, remarks?: string) => create<any>(`/erp/quotations/${id}/select-winner`, { remarks }),

  getPRs: () => list<any>('/erp/prs'),
  createPR: (data: any) => create<any>('/erp/prs', data),
  approvePR: (id: string, action: 'APPROVE' | 'REJECT', remarks?: string) => create<any>(`/erp/prs/${id}/approve`, { action, remarks }),

  getPOs: () => list<any>('/erp/pos'),
  createPO: (data: any) => create<any>('/erp/pos', data),
  getGRNs: () => list<ApiRecord>('/erp/grns').then((records) => records.map(mapGRN)),
  createGRN: (data: any) => create<any>('/erp/grns', {
    ...data,
    poNo: data.poNumber,
    storeName: data.storeName,
    items: data.items || []
  }).then(mapGRN),
  getInventory: () => list<ApiRecord>('/erp/inventory').then((records) => records.map(mapInventory)),
  getStockIssues: () => list<ApiRecord>('/erp/stock-issues').then((records) => records.map(mapStockIssue)),
  createStockIssue: (data: any) => create<any>('/erp/stock-issues', {
    ...data,
    departmentName: data.department,
    requestedBy: data.issuedTo,
    storeName: data.storeLocation,
    items: (data.items || []).map((item: ApiRecord) => ({
      ...item,
      qtyRequested: item.qtyIssued
    }))
  }).then(mapStockIssue),
  getInvoices: () => list<ApiRecord>('/erp/invoices').then((records) => records.map(mapInvoice)),
  createInvoice: (data: any) => create<any>('/erp/invoices', data).then(mapInvoice),
  getPayments: () => list<ApiRecord>('/erp/payments').then((records) => records.map(mapPayment)),
  createPayment: async (data: any) => {
    const invoices = await list<ApiRecord>('/erp/invoices');
    const invoice = invoices.find((record) => record.id === data.invoiceId || record.internalInvNo === data.invoiceNumber);
    if (!invoice) {
      throw new Error(`Invoice ${data.invoiceNumber || 'selection'} was not found.`);
    }

    return create<ApiRecord>('/erp/payments', {
      ...data,
      invoiceId: invoice.id,
      txnReference: data.referenceNumber,
      notes: data.remarks
    }).then(mapPayment);
  },
  getPartPayments: () => list<any>('/erp/part-payments'),
  createPartPayment: (data: any) => create<any>('/erp/part-payments', data),
  getDCNotes: () => list<ApiRecord>('/erp/dc-notes').then((records) => records.map(mapDCNote)),
  createDCNote: (data: any) => create<any>('/erp/dc-notes', {
    ...data,
    type: data.type === 'DEBIT_NOTE' ? 'DEBIT' : 'CREDIT',
    linkedGrnNo: data.referenceDocType === 'GRN' ? data.referenceDocNumber : undefined,
    linkedInvoiceNo: data.referenceDocType === 'INVOICE' ? data.referenceDocNumber : undefined,
    adjustedAmount: data.amount
  }).then(mapDCNote),
  getProjects: () => list<ApiRecord>('/erp/projects').then((records) => records.map(mapProject)),
  createProject: (data: any) => create<any>('/erp/projects', {
    ...data,
    departmentName: data.department,
    manager: data.projectManager,
    totalBudget: data.budgetAllocated
  }).then(mapProject),
  getERPSummary: () => api.get('/erp/summary').then((res) => requireData<ERPSummaryMetrics>(res.data?.data))
};