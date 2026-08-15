import { Response } from 'express';
import { getSeedDepartments, getSeedBudgetAllocations, getSeedBudgetHeads, getSeedPRRecords } from '../utils/seedData';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getDepartmentReport(req: AuthenticatedRequest, res: Response) {
  try {
    const departments = getSeedDepartments();
    const allocations = getSeedBudgetAllocations();
    const prs = getSeedPRRecords();

    const result = departments.map(dept => {
      const deptAlloc = allocations.filter(a => a.departmentId === dept.id || a.departmentCode.toUpperCase() === dept.code.toUpperCase());
      const deptPRs = prs.filter(p => p.departmentId === dept.id || p.departmentCode.toUpperCase() === dept.code.toUpperCase());

      const allocated = deptAlloc.reduce((sum, a) => sum + a.allocatedAmount, 0);
      const prCommitted = deptAlloc.reduce((sum, a) => sum + a.committedAmount, 0);
      const actualUtilized = deptAlloc.reduce((sum, a) => sum + a.actualUtilizedAmount, 0);
      const remaining = allocated - prCommitted;
      const utilizationPct = allocated > 0 ? parseFloat(((prCommitted / allocated) * 100).toFixed(2)) : 0;

      return {
        departmentCode: dept.code,
        departmentName: dept.name,
        category: dept.category,
        allocatedBudget: allocated,
        prCommittedAmount: prCommitted,
        actualUtilizedAmount: actualUtilized,
        remainingBudget: remaining,
        utilizationPercentage: utilizationPct,
        prCount: deptPRs.length
      };
    });

    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to generate department report.' });
  }
}

export async function getBudgetHeadReport(req: AuthenticatedRequest, res: Response) {
  try {
    const heads = getSeedBudgetHeads();
    const allocations = getSeedBudgetAllocations();

    const result = heads.map(head => {
      const headAlloc = allocations.filter(a => a.budgetHeadId === head.id || a.budgetHeadCode === head.code);

      const allocated = headAlloc.reduce((sum, a) => sum + a.allocatedAmount, 0);
      const prCommitted = headAlloc.reduce((sum, a) => sum + a.committedAmount, 0);
      const actualUtilized = headAlloc.reduce((sum, a) => sum + a.actualUtilizedAmount, 0);
      const remaining = allocated - prCommitted;
      const utilizationPct = allocated > 0 ? parseFloat(((prCommitted / allocated) * 100).toFixed(2)) : 0;

      return {
        budgetCode: head.code,
        budgetHeadName: head.name,
        category: head.category,
        allocatedBudget: allocated,
        prCommittedAmount: prCommitted,
        actualUtilizedAmount: actualUtilized,
        remainingBudget: remaining,
        utilizationPercentage: utilizationPct
      };
    });

    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to generate budget head report.' });
  }
}

export async function getMonthlyReport(req: AuthenticatedRequest, res: Response) {
  try {
    const prs = getSeedPRRecords();
    const monthMap: Record<string, { month: string; prCount: number; totalPRValue: number }> = {};

    prs.forEach(pr => {
      const monthKey = pr.prDate.substring(0, 7);
      if (!monthMap[monthKey]) {
        const parts = monthKey.split('-');
        const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
        const monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
        monthMap[monthKey] = { month: monthName, prCount: 0, totalPRValue: 0 };
      }
      monthMap[monthKey].prCount += 1;
      monthMap[monthKey].totalPRValue += pr.totalAmount;
    });

    return res.json({ success: true, data: Object.values(monthMap) });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to generate monthly report.' });
  }
}

export async function getPRStatusReport(req: AuthenticatedRequest, res: Response) {
  try {
    const prs = getSeedPRRecords();
    
    const summary = {
      approved: { count: 0, totalValue: 0 },
      pending: { count: 0, totalValue: 0 },
      rejected: { count: 0, totalValue: 0 },
      open: { count: 0, totalValue: 0 },
      closed: { count: 0, totalValue: 0 }
    };

    prs.forEach(p => {
      if (p.approvalStatus === 'Approved') {
        summary.approved.count += 1;
        summary.approved.totalValue += p.totalAmount;
      } else if (p.approvalStatus === 'Pending') {
        summary.pending.count += 1;
        summary.pending.totalValue += p.totalAmount;
      } else if (p.approvalStatus === 'Rejected') {
        summary.rejected.count += 1;
        summary.rejected.totalValue += p.totalAmount;
      }

      if (p.status === 'Closed' || p.prPoStatus === 'Closed') {
        summary.closed.count += 1;
        summary.closed.totalValue += p.totalAmount;
      } else {
        summary.open.count += 1;
        summary.open.totalValue += p.totalAmount;
      }
    });

    return res.json({ success: true, data: summary });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to generate PR status report.' });
  }
}
