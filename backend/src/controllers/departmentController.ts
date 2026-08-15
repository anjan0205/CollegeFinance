import { Request, Response } from 'express';
import { getSeedDepartments, getSeedBudgetAllocations, getSeedPRRecords } from '../utils/seedData';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getDepartments(req: AuthenticatedRequest, res: Response) {
  try {
    const userRole = req.user?.role;
    const userDeptId = req.user?.departmentId;

    let departments = getSeedDepartments();
    const allocations = getSeedBudgetAllocations();
    const prs = getSeedPRRecords();

    // HOD or Dept User restriction
    if ((userRole === 'HOD' || userRole === 'DEPARTMENT_USER') && userDeptId) {
      departments = departments.filter(d => d.id === userDeptId);
    }

    const deptSummaries = departments.map(dept => {
      const deptAllocations = allocations.filter(a => a.departmentId === dept.id || a.departmentCode.toUpperCase() === dept.code.toUpperCase());
      const deptPRs = prs.filter(p => p.departmentId === dept.id || p.departmentCode.toUpperCase() === dept.code.toUpperCase());

      const allocatedBudget = deptAllocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
      const prCommittedAmount = deptAllocations.reduce((sum, a) => sum + a.committedAmount, 0);
      const actualUtilized = deptAllocations.reduce((sum, a) => sum + a.actualUtilizedAmount, 0);
      const remainingBudget = allocatedBudget - prCommittedAmount;
      const utilizationPct = allocatedBudget > 0 
        ? parseFloat(((prCommittedAmount / allocatedBudget) * 100).toFixed(2)) 
        : 0;

      let statusTag: 'Normal' | 'Warning' | 'Critical' | 'Exceeded' = 'Normal';
      if (utilizationPct > 100) statusTag = 'Exceeded';
      else if (utilizationPct >= 85) statusTag = 'Critical';
      else if (utilizationPct >= 70) statusTag = 'Warning';

      return {
        id: dept.id,
        code: dept.code,
        name: dept.name,
        category: dept.category,
        allocatedBudget,
        prCommittedAmount,
        actualUtilized,
        remainingBudget,
        utilizationPct,
        statusTag,
        prCount: deptPRs.length
      };
    });

    return res.json({ success: true, data: deptSummaries });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch departments.' });
  }
}

export async function getDepartmentById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const deptId = parseInt(id, 10);

    const departments = getSeedDepartments();
    const allocations = getSeedBudgetAllocations();
    const prs = getSeedPRRecords();

    const dept = departments.find(d => d.id === deptId || d.code.toLowerCase() === id.toLowerCase());
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    const deptAllocations = allocations.filter(a => a.departmentId === dept.id || a.departmentCode.toUpperCase() === dept.code.toUpperCase());
    const deptPRs = prs.filter(p => p.departmentId === dept.id || p.departmentCode.toUpperCase() === dept.code.toUpperCase());

    const allocatedBudget = deptAllocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
    const prCommittedAmount = deptAllocations.reduce((sum, a) => sum + a.committedAmount, 0);
    const actualUtilized = deptAllocations.reduce((sum, a) => sum + a.actualUtilizedAmount, 0);
    const remainingBudget = allocatedBudget - prCommittedAmount;
    const utilizationPct = allocatedBudget > 0 
      ? parseFloat(((prCommittedAmount / allocatedBudget) * 100).toFixed(2)) 
      : 0;

    return res.json({
      success: true,
      department: dept,
      overview: {
        allocatedBudget,
        prCommittedAmount,
        actualUtilized,
        remainingBudget,
        utilizationPct,
        prCount: deptPRs.length
      },
      budgetBreakdown: deptAllocations,
      prs: deptPRs
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch department details.' });
  }
}

export async function getDepartmentBudget(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const deptId = parseInt(id, 10);
    const allocations = getSeedBudgetAllocations();

    const deptAllocations = allocations.filter(
      a => a.departmentId === deptId || a.departmentCode.toLowerCase() === id.toLowerCase()
    );

    return res.json({ success: true, data: deptAllocations });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch department budget.' });
  }
}

export async function getDepartmentPRs(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const deptId = parseInt(id, 10);
    const prs = getSeedPRRecords();

    const deptPRs = prs.filter(
      p => p.departmentId === deptId || p.departmentCode.toLowerCase() === id.toLowerCase()
    );

    return res.json({ success: true, data: deptPRs });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch department PRs.' });
  }
}
