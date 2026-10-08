import { Router } from 'express';
import * as erpController from '../controllers/erpController';
import * as rfqController from '../controllers/rfqController';
import { ApprovalEngine } from '../services/approvalEngine';
import { authenticateToken, authorizeRoles, AuthenticatedRequest } from '../middleware/auth';
import { ensureERPStateHydrated, saveERPState } from '../controllers/erpController';
import { RequestHandler } from 'express';
import { getFirestoreDb, isFirebaseEnabled } from '../config/firebase';

const router = Router();

router.use(authenticateToken);
router.use(async (_req, _res, next) => {
  try {
    await ensureERPStateHydrated();
    next();
  } catch (error) {
    next(error);
  }
});

/** Persist only after a controller has produced a successful JSON result. */
const persistMutation = (action: string, handler: RequestHandler): RequestHandler => (req: AuthenticatedRequest, res, next) => {
  const sendJson = res.json.bind(res);
  res.json = ((body: any) => {
    if (!body?.success || res.statusCode >= 400) return sendJson(body);
    saveERPState(req.user?.email || 'system', action)
      .then(() => sendJson(body))
      .catch(next);
    return res;
  }) as typeof res.json;
  handler(req, res, next);
};

// Master Data
router.get('/master', erpController.getMasterData);
router.post('/master', authorizeRoles('ADMIN', 'FINANCE', 'HOD', 'DEPARTMENT_USER'), persistMutation('ERP_MASTER_SUBMITTED', erpController.createMasterData));
router.get('/master/approvals', erpController.getPendingMasterApprovals);
router.post('/master/approve', authorizeRoles('ADMIN', 'FINANCE', 'PRINCIPAL', 'CEO'), persistMutation('ERP_MASTER_DECIDED', erpController.approveMasterData));

// Approval Matrix Engine
router.get('/approval-matrix', (req, res) => {
  const readRules = async () => {
    if (isFirebaseEnabled()) {
      const db = getFirestoreDb();
      if (!db) throw new Error('Firebase is enabled, but Firestore is unavailable.');
      const snapshot = await db.collection('systemConfig').doc('approvalMatrix').get();
      const rules = snapshot.data()?.rules;
      if (Array.isArray(rules)) ApprovalEngine.updateMatrixRules(rules);
    }
    res.status(200).json({ success: true, data: ApprovalEngine.getMatrixRules() });
  };
  readRules().catch((error) => res.status(500).json({ success: false, message: error.message }));
});
router.post('/approval-matrix', authorizeRoles('ADMIN'), async (req, res) => {
  const { rules } = req.body;
  if (rules && Array.isArray(rules)) {
    try {
      if (isFirebaseEnabled()) {
        const db = getFirestoreDb();
        if (!db) throw new Error('Firebase is enabled, but Firestore is unavailable.');
        const batch = db.batch();
        batch.set(db.collection('systemConfig').doc('approvalMatrix'), { rules, updatedAt: new Date().toISOString() });
        batch.set(db.collection('auditLogs').doc(), {
          action: 'APPROVAL_MATRIX_UPDATED', entityType: 'APPROVAL_MATRIX',
          entityId: 'approvalMatrix', createdAt: new Date().toISOString(), channel: 'PORTAL'
        });
        await batch.commit();
      }
      ApprovalEngine.updateMatrixRules(rules);
      return res.status(200).json({ success: true, data: ApprovalEngine.getMatrixRules() });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message || 'Unable to persist the approval matrix.' });
    }
  }
  return res.status(400).json({ success: false, message: 'Invalid matrix rules format' });
});

// RFQs (Request for Quotations)
router.get('/rfqs', rfqController.getRFQs);
router.get('/rfqs/:id', rfqController.getRFQById);
router.post('/rfqs', authorizeRoles('ADMIN', 'FINANCE', 'HOD'), rfqController.createRFQ);
router.post('/rfqs/quote', authorizeRoles('ADMIN', 'FINANCE'), rfqController.submitQuote);
router.post('/rfqs/select-vendor', authorizeRoles('ADMIN', 'FINANCE'), rfqController.selectWinningQuote);

// Quotations
router.get('/quotations', erpController.getQuotations);
router.post('/quotations', authorizeRoles('ADMIN', 'FINANCE'), persistMutation('ERP_QUOTATION_CREATED', erpController.createQuotation));
router.post('/quotations/:id/select-winner', authorizeRoles('ADMIN', 'FINANCE'), persistMutation('ERP_QUOTATION_SELECTED', erpController.selectWinningQuotation));

// Purchase Requisitions (PR)
router.get('/prs', erpController.getPRs);
router.post('/prs', authorizeRoles('ADMIN', 'HOD', 'DEPARTMENT_USER'), persistMutation('ERP_PR_CREATED', erpController.createPR));
router.post('/prs/:id/approve', authorizeRoles('ADMIN', 'FINANCE', 'HOD', 'PRINCIPAL', 'CEO'), persistMutation('ERP_PR_DECIDED', erpController.approvePR));

// Purchase Orders (PO)
router.get('/pos', erpController.getPOs);
router.post('/pos', authorizeRoles('ADMIN', 'FINANCE'), persistMutation('ERP_PO_CREATED', erpController.createPO));
router.post('/pos/:id/approve', authorizeRoles('ADMIN', 'FINANCE', 'PRINCIPAL', 'CEO'), persistMutation('ERP_PO_APPROVED', erpController.approvePO));

// Goods Receipt Notes (GRN)
router.get('/grns', erpController.getGRNs);
router.post('/grns', authorizeRoles('ADMIN', 'STORE'), persistMutation('ERP_GRN_CREATED', erpController.createGRN));
router.post('/grns/:id/verify', authorizeRoles('ADMIN', 'STORE', 'FINANCE'), persistMutation('ERP_GRN_VERIFIED', erpController.verifyGRN));

// Inventory
router.get('/inventory', erpController.getInventory);

// Stock Issue
router.get('/stock-issues', erpController.getStockIssues);
router.post('/stock-issues', authorizeRoles('ADMIN', 'STORE'), persistMutation('ERP_STOCK_ISSUED', erpController.createStockIssue));

// Invoices
router.get('/invoices', erpController.getInvoices);
router.post('/invoices', authorizeRoles('ADMIN', 'FINANCE'), persistMutation('ERP_INVOICE_CREATED', erpController.createInvoice));
router.post('/invoices/:id/verify', authorizeRoles('ADMIN', 'FINANCE'), persistMutation('ERP_INVOICE_VERIFIED', erpController.verifyInvoice));

// Invoice Payments
router.get('/payments', erpController.getPayments);
router.post('/payments', authorizeRoles('ADMIN', 'FINANCE'), persistMutation('ERP_PAYMENT_PROCESSED', erpController.createPayment));

// Part Payments
router.get('/part-payments', erpController.getPartPayments);
router.post('/part-payments', authorizeRoles('ADMIN', 'FINANCE'), persistMutation('ERP_PART_PAYMENT_CREATED', erpController.createPartPayment));

// Debit / Credit Notes
router.get('/dc-notes', erpController.getDCNotes);
router.post('/dc-notes', authorizeRoles('ADMIN', 'FINANCE'), persistMutation('ERP_DC_NOTE_CREATED', erpController.createDCNote));

// Projects
router.get('/projects', erpController.getProjects);
router.post('/projects', authorizeRoles('ADMIN', 'FINANCE', 'HOD'), persistMutation('ERP_PROJECT_CREATED', erpController.createProject));

// Summary & Aggregated Metrics
router.get('/summary', erpController.getERPSummary);

export default router;

