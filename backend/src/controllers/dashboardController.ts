import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getSeedBudgetAllocations, getSeedPRRecords, getSeedDepartments } from '../utils/seedData';

export async function getDashboardSummary(req: AuthenticatedRequest, res: Response) {
  try {
    const userRole = req.user?.role;
    const userDeptId = req.user?.departmentId;

    let allocations = getSeedBudgetAllocations();
    let prs = getSeedPRRecords();

    // HOD or Department User filter
    if ((userRole === 'HOD' || userRole === 'DEPARTMENT_USER') && userDeptId) {
      allocations = allocations.filter(a => a.departmentId === userDeptId);
      prs = prs.filter(p => p.departmentId === userDeptId);
    }

    const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
    const totalCommitted = allocations.reduce((sum, a) => sum + a.committedAmount, 0);
    const totalActualUtilized = allocations.reduce((sum, a) => sum + a.actualUtilizedAmount, 0);
    const totalRemaining = totalAllocated - totalCommitted;

    const utilizationPct = totalAllocated > 0 
      ? parseFloat(((totalCommitted / totalAllocated) * 100).toFixed(2)) 
      : 0;

    const totalPRs = prs.length;
    const approvedPRs = prs.filter(p => p.approvalStatus === 'Approved').length;
    const pendingPRs = prs.filter(p => p.approvalStatus === 'Pending').length;
    const rejectedPRs = prs.filter(p => p.approvalStatus === 'Rejected').length;
    const openPRs = prs.filter(p => p.status === 'Open').length;
    const closedPRs = prs.filter(p => p.status === 'Closed' || p.prPoStatus === 'Closed').length;

    return res.json({
      success: true,
      data: {
        totalAllocated,
        totalCommitted,
        totalActualUtilized,
        totalRemaining,
        utilizationPct,
        totalPRs,
        approvedPRs,
        pendingPRs,
        rejectedPRs,
        openPRs,
        closedPRs
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to compute dashboard summary.' });
  }
}

export async function getDepartmentUtilization(req: AuthenticatedRequest, res: Response) {
  try {
    const allocations = getSeedBudgetAllocations();
    const departments = getSeedDepartments();

    const deptMap: Record<string, { code: string; name: string; allocated: number; committed: number; remaining: number }> = {};

    departments.forEach(d => {
      deptMap[d.code] = { code: d.code, name: d.name, allocated: 0, committed: 0, remaining: 0 };
    });

    allocations.forEach(a => {
      if (!deptMap[a.departmentCode]) {
        deptMap[a.departmentCode] = { code: a.departmentCode, name: a.departmentName, allocated: 0, committed: 0, remaining: 0 };
      }
      deptMap[a.departmentCode].allocated += a.allocatedAmount;
      deptMap[a.departmentCode].committed += a.committedAmount;
    });

    const result = Object.values(deptMap)
      .filter(d => d.allocated > 0 || d.committed > 0)
      .map(d => ({
        ...d,
        remaining: d.allocated - d.committed,
        utilizationPct: d.allocated > 0 ? parseFloat(((d.committed / d.allocated) * 100).toFixed(2)) : 0
      }))
      .sort((a, b) => b.allocated - a.allocated);

    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch department utilization.' });
  }
}

export async function getMonthlyPRTrend(req: AuthenticatedRequest, res: Response) {
  try {
    const prs = getSeedPRRecords();
    const monthMap: Record<string, { month: string; prCount: number; prAmount: number }> = {
      '2026-04': { month: 'April 2026', prCount: 0, prAmount: 0 },
      '2026-05': { month: 'May 2026', prCount: 0, prAmount: 0 },
      '2026-06': { month: 'June 2026', prCount: 0, prAmount: 0 },
      '2026-07': { month: 'July 2026', prCount: 0, prAmount: 0 }
    };

    prs.forEach(pr => {
      const monthKey = pr.prDate.substring(0, 7);
      if (!monthMap[monthKey]) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const parts = monthKey.split('-');
        const monthName = monthNames[parseInt(parts[1], 10) - 1] || parts[1];
        monthMap[monthKey] = { month: `${monthName} ${parts[0]}`, prCount: 0, prAmount: 0 };
      }
      monthMap[monthKey].prCount += 1;
      monthMap[monthKey].prAmount += pr.totalAmount;
    });

    const result = Object.values(monthMap);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch monthly PR trend.' });
  }
}

export async function getPRStatusDistribution(req: AuthenticatedRequest, res: Response) {
  try {
    const prs = getSeedPRRecords();
    
    const statusMap: Record<string, { status: string; count: number; totalAmount: number }> = {
      Approved: { status: 'Approved', count: 0, totalAmount: 0 },
      Pending: { status: 'Pending', count: 0, totalAmount: 0 },
      Rejected: { status: 'Rejected', count: 0, totalAmount: 0 },
      Open: { status: 'Open', count: 0, totalAmount: 0 },
      Closed: { status: 'Closed', count: 0, totalAmount: 0 }
    };

    prs.forEach(pr => {
      if (pr.approvalStatus === 'Approved') {
        statusMap['Approved'].count += 1;
        statusMap['Approved'].totalAmount += pr.totalAmount;
      } else if (pr.approvalStatus === 'Pending') {
        statusMap['Pending'].count += 1;
        statusMap['Pending'].totalAmount += pr.totalAmount;
      } else if (pr.approvalStatus === 'Rejected') {
        statusMap['Rejected'].count += 1;
        statusMap['Rejected'].totalAmount += pr.totalAmount;
      }

      if (pr.status === 'Closed' || pr.prPoStatus === 'Closed') {
        statusMap['Closed'].count += 1;
        statusMap['Closed'].totalAmount += pr.totalAmount;
      } else {
        statusMap['Open'].count += 1;
        statusMap['Open'].totalAmount += pr.totalAmount;
      }
    });

    return res.json({ success: true, data: Object.values(statusMap) });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch PR status distribution.' });
  }
}

export async function getTopSpendingDepartments(req: AuthenticatedRequest, res: Response) {
  try {
    const allocations = getSeedBudgetAllocations();
    const deptMap: Record<string, { code: string; name: string; committedAmount: number; allocatedAmount: number; utilizationPct: number }> = {};

    allocations.forEach(a => {
      if (!deptMap[a.departmentCode]) {
        deptMap[a.departmentCode] = {
          code: a.departmentCode,
          name: a.departmentName,
          committedAmount: 0,
          allocatedAmount: 0,
          utilizationPct: 0
        };
      }
      deptMap[a.departmentCode].committedAmount += a.committedAmount;
      deptMap[a.departmentCode].allocatedAmount += a.allocatedAmount;
    });

    const result = Object.values(deptMap)
      .map(d => ({
        ...d,
        utilizationPct: d.allocatedAmount > 0 ? parseFloat(((d.committedAmount / d.allocatedAmount) * 100).toFixed(2)) : 0
      }))
      .sort((a, b) => b.committedAmount - a.committedAmount)
      .slice(0, 10);

    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch top spending departments.' });
  }
}

export async function getBudgetAlerts(req: AuthenticatedRequest, res: Response) {
  try {
    const allocations = getSeedBudgetAllocations();

    const alerts = {
      normal: allocations.filter(a => a.alertStatus === 'Normal'),
      warning: allocations.filter(a => a.alertStatus === 'Warning'),
      critical: allocations.filter(a => a.alertStatus === 'Critical'),
      exceeded: allocations.filter(a => a.alertStatus === 'Exceeded')
    };

    return res.json({
      success: true,
      summary: {
        normalCount: alerts.normal.length,
        warningCount: alerts.warning.length,
        criticalCount: alerts.critical.length,
        exceededCount: alerts.exceeded.length
      },
      flagged: [
        ...alerts.exceeded,
        ...alerts.critical,
        ...alerts.warning
      ].slice(0, 50)
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch budget alerts.' });
  }
}
