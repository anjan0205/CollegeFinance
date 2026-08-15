import { Response } from 'express';
import { getSeedPRRecords } from '../utils/seedData';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getPRs(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      search,
      department,
      budgetCode,
      status,
      approvalStatus,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      page = 1,
      limit = 20,
      sortBy = 'prDate',
      sortOrder = 'desc'
    } = req.query;

    const userRole = req.user?.role;
    const userDeptId = req.user?.departmentId;

    let prs = getSeedPRRecords();

    // HOD or Department User scope restriction
    if ((userRole === 'HOD' || userRole === 'DEPARTMENT_USER') && userDeptId) {
      prs = prs.filter(p => p.departmentId === userDeptId);
    }

    // Global Search (PR Number, Requested By, Purpose, Dept Code, Product Name)
    if (search) {
      const q = String(search).toLowerCase();
      prs = prs.filter(p => 
        p.prNumber.toLowerCase().includes(q) ||
        p.requestedBy.toLowerCase().includes(q) ||
        p.departmentCode.toLowerCase().includes(q) ||
        p.departmentName.toLowerCase().includes(q) ||
        (p.purpose && p.purpose.toLowerCase().includes(q)) ||
        p.items?.some(i => i.productName.toLowerCase().includes(q))
      );
    }

    // Department Filter
    if (department && department !== 'ALL') {
      const deptStr = String(department).toUpperCase();
      prs = prs.filter(p => 
        p.departmentCode.toUpperCase() === deptStr || 
        String(p.departmentId) === deptStr
      );
    }

    // Budget Code Filter
    if (budgetCode && budgetCode !== 'ALL') {
      prs = prs.filter(p => 
        String(p.budgetHeadCode) === String(budgetCode) || 
        p.sourceBudgetCode.includes(String(budgetCode))
      );
    }

    // Status Filter
    if (status && status !== 'ALL') {
      prs = prs.filter(p => p.status.toLowerCase() === String(status).toLowerCase());
    }

    // Approval Status Filter
    if (approvalStatus && approvalStatus !== 'ALL') {
      prs = prs.filter(p => p.approvalStatus.toLowerCase() === String(approvalStatus).toLowerCase());
    }

    // Date Range Filter
    if (startDate) {
      prs = prs.filter(p => p.prDate >= String(startDate));
    }
    if (endDate) {
      prs = prs.filter(p => p.prDate <= String(endDate));
    }

    // Amount Filter
    if (minAmount) {
      prs = prs.filter(p => p.totalAmount >= parseFloat(String(minAmount)));
    }
    if (maxAmount) {
      prs = prs.filter(p => p.totalAmount <= parseFloat(String(maxAmount)));
    }

    // Sorting
    prs.sort((a: any, b: any) => {
      let valA = a[String(sortBy)];
      let valB = b[String(sortBy)];

      if (valA === undefined) valA = '';
      if (valB === undefined) valB = '';

      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    // Pagination
    const pageNum = parseInt(String(page), 10);
    const limitNum = parseInt(String(limit), 10);
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedItems = prs.slice(startIndex, startIndex + limitNum);

    const totalAmountSum = prs.reduce((sum, p) => sum + p.totalAmount, 0);

    return res.json({
      success: true,
      data: paginatedItems,
      pagination: {
        total: prs.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(prs.length / limitNum)
      },
      summary: {
        totalFilteredPRs: prs.length,
        totalAmount: totalAmountSum
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch PR records.' });
  }
}

export async function getPRById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const prs = getSeedPRRecords();

    let pr = prs.find(p => String(p.id) === id || p.prNumber.toLowerCase() === id.toLowerCase());
    
    if (!pr) {
      return res.status(404).json({ success: false, message: 'PR record not found.' });
    }

    // Check user department access
    const userRole = req.user?.role;
    const userDeptId = req.user?.departmentId;
    if ((userRole === 'HOD' || userRole === 'DEPARTMENT_USER') && userDeptId && pr.departmentId !== userDeptId) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only view PRs for your department.' });
    }

    return res.json({
      success: true,
      data: pr
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch PR details.' });
  }
}

export async function updatePRStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { approvalStatus, status } = req.body;

    const prId = parseInt(id, 10);
    if (isNaN(prId)) {
      return res.status(400).json({ success: false, message: 'Invalid PR ID parameter.' });
    }

    const { updatePRStatusRecord } = require('../utils/seedData');
    const updatedPR = updatePRStatusRecord(prId, approvalStatus, status);

    if (!updatedPR) {
      return res.status(404).json({ success: false, message: 'PR record not found.' });
    }

    return res.json({
      success: true,
      message: `PR status updated to '${updatedPR.approvalStatus}' successfully.`,
      data: updatedPR
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update PR status.' });
  }
}

export async function createPR(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      departmentId,
      budgetHeadId,
      requestedBy,
      purpose,
      items,
      prDate,
      approvalStatus,
      status
    } = req.body;

    if (!departmentId || !budgetHeadId) {
      return res.status(400).json({
        success: false,
        message: 'departmentId and budgetHeadId are required to create a PR.'
      });
    }

    const { createPRRecord } = require('../utils/seedData');
    const newPR = createPRRecord({
      departmentId: parseInt(departmentId, 10),
      budgetHeadId: parseInt(budgetHeadId, 10),
      requestedBy: requestedBy || req.user?.name || 'System Admin',
      purpose: purpose || 'Manual PR Application',
      items: Array.isArray(items) ? items : [],
      prDate,
      approvalStatus,
      status
    });

    return res.status(201).json({
      success: true,
      message: `New Purchase Requisition ${newPR.prNumber} created and assigned to department successfully.`,
      data: newPR
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to create new PR record.' });
  }
}

