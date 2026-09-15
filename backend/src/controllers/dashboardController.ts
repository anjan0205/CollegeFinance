import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getSeedBudgetAllocations, getSeedPRRecords, getSeedDepartments } from '../utils/seedData';

function isHODOrDeptUser(role?: string): boolean {
  return role === 'HOD' || role === 'DEPARTMENT_USER';
}

function matchesUserDepartment(
  deptId: number | string,
  deptCode?: string,
  userDeptId?: number | string,
  userDeptCode?: string
): boolean {
  if (userDeptId && String(deptId) === String(userDeptId)) return true;
  if (userDeptCode && deptCode && deptCode.trim().toUpperCase() === userDeptCode.trim().toUpperCase()) return true;
  return false;
}

export async function getDashboardSummary(req: AuthenticatedRequest, res: Response) {
  try {
    const userRole = req.user?.role;
    const userDeptId = req.user?.departmentId;
    const userDeptCode = req.user?.departmentCode;

    let allocations = getSeedBudgetAllocations();
    let prs = getSeedPRRecords();

    // HOD or Department User scope restriction
    if (isHODOrDeptUser(userRole)) {
      allocations = allocations.filter(a => matchesUserDepartment(a.departmentId, a.departmentCode, userDeptId, userDeptCode));
      prs = prs.filter(p => matchesUserDepartment(p.departmentId, p.departmentCode, userDeptId, userDeptCode));
    }

    const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
    const totalCommitted = allocations.reduce((sum, a) => sum + a.committedAmount, 0);
    const totalActualUtilized = allocations.reduce((sum, a) => sum + a.actualUtilizedAmount, 0);
    const totalRemaining = totalAllocated - totalCommitted - totalActualUtilized;

    const utilizationPct = totalAllocated > 0 
      ? parseFloat((((totalCommitted + totalActualUtilized) / totalAllocated) * 100).toFixed(2)) 
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
    const userRole = req.user?.role;
    const userDeptId = req.user?.departmentId;
    const userDeptCode = req.user?.departmentCode;

    let allocations = getSeedBudgetAllocations();
    let departments = getSeedDepartments();

    if (isHODOrDeptUser(userRole)) {
      allocations = allocations.filter(a => matchesUserDepartment(a.departmentId, a.departmentCode, userDeptId, userDeptCode));
      departments = departments.filter(d => matchesUserDepartment(d.id, d.code, userDeptId, userDeptCode));
    }

    const deptMap: Record<string, { code: string; name: string; allocated: number; committed: number; actualUtilized: number; remaining: number }> = {};

    departments.forEach(d => {
      deptMap[d.code] = { code: d.code, name: d.name, allocated: 0, committed: 0, actualUtilized: 0, remaining: 0 };
    });

    allocations.forEach(a => {
      if (!deptMap[a.departmentCode]) {
        deptMap[a.departmentCode] = { code: a.departmentCode, name: a.departmentName, allocated: 0, committed: 0, actualUtilized: 0, remaining: 0 };
      }
      deptMap[a.departmentCode].allocated += a.allocatedAmount;
      deptMap[a.departmentCode].committed += a.committedAmount;
      deptMap[a.departmentCode].actualUtilized += a.actualUtilizedAmount || 0;
    });

    const result = Object.values(deptMap)
      .filter(d => d.allocated > 0 || d.committed > 0 || d.actualUtilized > 0)
      .map(d => ({
        ...d,
        remaining: d.allocated - d.committed - d.actualUtilized,
        utilizationPct: d.allocated > 0 ? parseFloat((((d.committed + d.actualUtilized) / d.allocated) * 100).toFixed(2)) : 0
      }))
      .sort((a, b) => b.allocated - a.allocated);

    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch department utilization.' });
  }
}

export async function getMonthlyPRTrend(req: AuthenticatedRequest, res: Response) {
  try {
    const userRole = req.user?.role;
    const userDeptId = req.user?.departmentId;
    const userDeptCode = req.user?.departmentCode;

    let prs = getSeedPRRecords();
    if (isHODOrDeptUser(userRole)) {
      prs = prs.filter(p => matchesUserDepartment(p.departmentId, p.departmentCode, userDeptId, userDeptCode));
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthMap: Record<string, { monthKey: string; month: string; prCount: number; prAmount: number }> = {};

    // Seed standard financial year months April to September 2026 in order
    ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'].forEach(key => {
      const parts = key.split('-');
      const monthName = monthNames[parseInt(parts[1], 10) - 1];
      monthMap[key] = { monthKey: key, month: `${monthName} ${parts[0]}`, prCount: 0, prAmount: 0 };
    });

    prs.forEach(pr => {
      if (!pr.prDate) return;
      const monthKey = pr.prDate.substring(0, 7);
      if (!monthMap[monthKey]) {
        const parts = monthKey.split('-');
        const monthIndex = parseInt(parts[1], 10) - 1;
        const monthName = monthNames[monthIndex] || parts[1];
        monthMap[monthKey] = { monthKey, month: `${monthName} ${parts[0]}`, prCount: 0, prAmount: 0 };
      }
      monthMap[monthKey].prCount += 1;
      monthMap[monthKey].prAmount += pr.totalAmount;
    });

    // Sort strictly chronologically by YYYY-MM monthKey
    const result = Object.values(monthMap).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch monthly PR trend.' });
  }
}

export async function getPRStatusDistribution(req: AuthenticatedRequest, res: Response) {
  try {
    const userRole = req.user?.role;
    const userDeptId = req.user?.departmentId;
    const userDeptCode = req.user?.departmentCode;

    let prs = getSeedPRRecords();
    if (isHODOrDeptUser(userRole)) {
      prs = prs.filter(p => matchesUserDepartment(p.departmentId, p.departmentCode, userDeptId, userDeptCode));
    }
    
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
    const userRole = req.user?.role;
    const userDeptId = req.user?.departmentId;
    const userDeptCode = req.user?.departmentCode;

    let allocations = getSeedBudgetAllocations();
    if (isHODOrDeptUser(userRole)) {
      allocations = allocations.filter(a => matchesUserDepartment(a.departmentId, a.departmentCode, userDeptId, userDeptCode));
    }

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
    const userRole = req.user?.role;
    const userDeptId = req.user?.departmentId;
    const userDeptCode = req.user?.departmentCode;

    let allocations = getSeedBudgetAllocations();
    if (isHODOrDeptUser(userRole)) {
      allocations = allocations.filter(a => matchesUserDepartment(a.departmentId, a.departmentCode, userDeptId, userDeptCode));
    }

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
