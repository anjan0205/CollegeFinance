import { Router } from 'express';
import * as erpController from '../controllers/erpController';

const router = Router();

// Master Data
router.get('/master', erpController.getMasterData);
router.post('/master', erpController.createMasterData);
router.get('/master/approvals', erpController.getPendingMasterApprovals);
router.post('/master/approve', erpController.approveMasterData);

// Quotations
router.get('/quotations', erpController.getQuotations);
router.post('/quotations', erpController.createQuotation);
router.post('/quotations/:id/select-winner', erpController.selectWinningQuotation);

// Purchase Requisitions (PR)
router.get('/prs', erpController.getPRs);
router.post('/prs', erpController.createPR);
router.post('/prs/:id/approve', erpController.approvePR);

// Purchase Orders (PO)
router.get('/pos', erpController.getPOs);
router.post('/pos', erpController.createPO);
router.post('/pos/:id/approve', erpController.approvePO);

// Goods Receipt Notes (GRN)
router.get('/grns', erpController.getGRNs);
router.post('/grns', erpController.createGRN);
router.post('/grns/:id/verify', erpController.verifyGRN);

// Inventory
router.get('/inventory', erpController.getInventory);

// Stock Issue
router.get('/stock-issues', erpController.getStockIssues);
router.post('/stock-issues', erpController.createStockIssue);

// Invoices
router.get('/invoices', erpController.getInvoices);
router.post('/invoices', erpController.createInvoice);
router.post('/invoices/:id/verify', erpController.verifyInvoice);

// Invoice Payments
router.get('/payments', erpController.getPayments);
router.post('/payments', erpController.createPayment);

// Part Payments
router.get('/part-payments', erpController.getPartPayments);
router.post('/part-payments', erpController.createPartPayment);

// Debit / Credit Notes
router.get('/dc-notes', erpController.getDCNotes);
router.post('/dc-notes', erpController.createDCNote);

// Projects
router.get('/projects', erpController.getProjects);
router.post('/projects', erpController.createProject);

// Summary & Aggregated Metrics
router.get('/summary', erpController.getERPSummary);

export default router;
