import { Router } from 'express';
import { login, getProfile } from '../controllers/authController';
import {
  getDashboardSummary,
  getDepartmentUtilization,
  getMonthlyPRTrend,
  getPRStatusDistribution,
  getTopSpendingDepartments,
  getBudgetAlerts
} from '../controllers/dashboardController';
import {
  getMasterBudget,
  getBudgetHeadDetails,
  getBudgetHeadsList,
  updateBudgetAllocation,
  createBudgetAllocation
} from '../controllers/budgetController';
import {
  getDepartments,
  getDepartmentById,
  getDepartmentBudget,
  getDepartmentPRs
} from '../controllers/departmentController';
import {
  getPRs,
  getPRById,
  updatePRStatus,
  createPR
} from '../controllers/prController';
import {
  getDepartmentReport,
  getBudgetHeadReport,
  getMonthlyReport,
  getPRStatusReport
} from '../controllers/reportController';
import {
  importPRData,
  importBudgetData,
  getImportHistory,
  getBatchErrors
} from '../controllers/importController';
import {
  getUsers,
  createUser,
  updateUser
} from '../controllers/userController';

import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { uploadExcel } from '../middleware/upload';

const router = Router();

// Public Authentication Route
router.post('/auth/login', login);

// Protected Routes (Require Token)
router.use(authenticateToken);

// User Profile
router.get('/auth/profile', getProfile);

// Dashboard APIs
router.get('/dashboard/summary', getDashboardSummary);
router.get('/dashboard/department-utilization', getDepartmentUtilization);
router.get('/dashboard/monthly-pr', getMonthlyPRTrend);
router.get('/dashboard/pr-status', getPRStatusDistribution);
router.get('/dashboard/top-spenders', getTopSpendingDepartments);
router.get('/dashboard/budget-alerts', getBudgetAlerts);

// Budget APIs
router.get('/budgets', getMasterBudget);
router.get('/budgets/:id', getBudgetHeadDetails);
router.get('/budget-heads', getBudgetHeadsList);
router.put('/budgets/allocation', authorizeRoles('ADMIN', 'FINANCE'), updateBudgetAllocation);
router.post('/budgets/allocation', authorizeRoles('ADMIN'), createBudgetAllocation);

// Department APIs
router.get('/departments', getDepartments);
router.get('/departments/:id', getDepartmentById);
router.get('/departments/:id/budget', getDepartmentBudget);
router.get('/departments/:id/prs', getDepartmentPRs);

// PR Management APIs (Admin Edit Options & Approval)
router.get('/prs', getPRs);
router.get('/prs/:id', getPRById);
router.post('/prs', authorizeRoles('ADMIN'), createPR);
router.patch('/prs/:id/status', authorizeRoles('ADMIN'), updatePRStatus);

// Reports APIs
router.get('/reports/departments', getDepartmentReport);
router.get('/reports/budget-heads', getBudgetHeadReport);
router.get('/reports/monthly', getMonthlyReport);
router.get('/reports/pr-status', getPRStatusReport);

// Data Import APIs (Admin & Finance only)
router.post('/import/pr', authorizeRoles('ADMIN', 'FINANCE'), uploadExcel.single('file'), importPRData);
router.post('/import/budget', authorizeRoles('ADMIN', 'FINANCE'), uploadExcel.single('file'), importBudgetData);
router.get('/import/history', authorizeRoles('ADMIN', 'FINANCE'), getImportHistory);
router.get('/import/:id/errors', authorizeRoles('ADMIN', 'FINANCE'), getBatchErrors);

// User Management APIs (Admin only)
router.get('/users', authorizeRoles('ADMIN'), getUsers);
router.post('/users', authorizeRoles('ADMIN'), createUser);
router.patch('/users/:id', authorizeRoles('ADMIN'), updateUser);

export default router;
