import { Request, Response } from 'express';
import { getSeedBudgetHeads, getSeedBudgetAllocations } from '../utils/seedData';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getMasterBudget(req: AuthenticatedRequest, res: Response) {
  try {
    const { search, category, page = 1, limit = 20, sortBy = 'code', sortOrder = 'asc' } = req.query;

    const budgetHeads = getSeedBudgetHeads();
    const allocations = getSeedBudgetAllocations();

    // Group allocations by budget head
    const headSummaryMap: Record<number, {
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
    }> = {};

    budgetHeads.forEach(bh => {
      headSummaryMap[bh.code] = {
        id: bh.id,
        code: bh.code,
        name: bh.name,
        category: bh.category,
        totalAllocated: 0,
        totalCommitted: 0,
        totalActualUtilized: 0,
        totalRemaining: 0,
        utilizationPct: 0,
        departmentCount: 0
      };
    });

    allocations.forEach(a => {
      if (headSummaryMap[a.budgetHeadCode]) {
        headSummaryMap[a.budgetHeadCode].totalAllocated += a.allocatedAmount;
        headSummaryMap[a.budgetHeadCode].totalCommitted += a.committedAmount;
        headSummaryMap[a.budgetHeadCode].totalActualUtilized += a.actualUtilizedAmount;
        if (a.allocatedAmount > 0 || a.committedAmount > 0) {
          headSummaryMap[a.budgetHeadCode].departmentCount += 1;
        }
      }
    });

    let items = Object.values(headSummaryMap).map(h => ({
      ...h,
      totalRemaining: h.totalAllocated - h.totalCommitted,
      utilizationPct: h.totalAllocated > 0 
        ? parseFloat(((h.totalCommitted / h.totalAllocated) * 100).toFixed(2)) 
        : 0
    }));

    // Filter by search
    if (search) {
      const q = String(search).toLowerCase();
      items = items.filter(i => 
        String(i.code).includes(q) || 
        i.name.toLowerCase().includes(q) || 
        i.category.toLowerCase().includes(q)
      );
    }

    // Filter by category
    if (category) {
      items = items.filter(i => i.category.toLowerCase() === String(category).toLowerCase());
    }

    // Sort
    items.sort((a: any, b: any) => {
      let valA = a[String(sortBy)];
      let valB = b[String(sortBy)];
      if (typeof valA === 'string') {
        return sortOrder === 'desc' ? valB.localeCompare(valA) : valA.localeCompare(valB);
      }
      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });

    // Pagination
    const pageNum = parseInt(String(page), 10);
    const limitNum = parseInt(String(limit), 10);
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedItems = items.slice(startIndex, startIndex + limitNum);

    const totalAllocatedAll = items.reduce((sum, i) => sum + i.totalAllocated, 0);
    const totalCommittedAll = items.reduce((sum, i) => sum + i.totalCommitted, 0);
    const totalRemainingAll = totalAllocatedAll - totalCommittedAll;
    const overallUtilizationPct = totalAllocatedAll > 0 
      ? parseFloat(((totalCommittedAll / totalAllocatedAll) * 100).toFixed(2)) 
      : 0;

    return res.json({
      success: true,
      data: paginatedItems,
      pagination: {
        total: items.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(items.length / limitNum)
      },
      totals: {
        totalAllocated: totalAllocatedAll,
        totalCommitted: totalCommittedAll,
        totalRemaining: totalRemainingAll,
        overallUtilizationPct
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to load master budget.' });
  }
}

export async function getBudgetHeadDetails(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const budgetHeadId = parseInt(id, 10);

    const budgetHeads = getSeedBudgetHeads();
    const allocations = getSeedBudgetAllocations();

    const head = budgetHeads.find(bh => bh.id === budgetHeadId || bh.code === budgetHeadId);
    if (!head) {
      return res.status(404).json({ success: false, message: 'Budget head not found.' });
    }

    const headAllocations = allocations.filter(a => a.budgetHeadId === head.id || a.budgetHeadCode === head.code);

    const totalAllocated = headAllocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
    const totalCommitted = headAllocations.reduce((sum, a) => sum + a.committedAmount, 0);
    const totalRemaining = totalAllocated - totalCommitted;
    const utilizationPct = totalAllocated > 0 
      ? parseFloat(((totalCommitted / totalAllocated) * 100).toFixed(2)) 
      : 0;

    return res.json({
      success: true,
      budgetHead: head,
      summary: {
        totalAllocated,
        totalCommitted,
        totalRemaining,
        utilizationPct
      },
      departmentBreakdown: headAllocations
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch budget head details.' });
  }
}

export function getBudgetHeadsList(req: AuthenticatedRequest, res: Response) {
  try {
    const heads = getSeedBudgetHeads();
    return res.json({ success: true, data: heads });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch budget heads.' });
  }
}

export function updateBudgetAllocation(req: AuthenticatedRequest, res: Response) {
  try {
    const { allocationId, allocatedAmount } = req.body;

    if (allocationId === undefined || allocatedAmount === undefined || isNaN(parseFloat(allocatedAmount))) {
      return res.status(400).json({ success: false, message: 'allocationId and valid numeric allocatedAmount are required.' });
    }

    const { updateAllocationAmount } = require('../utils/seedData');
    const updated = updateAllocationAmount(parseInt(allocationId, 10), parseFloat(allocatedAmount));

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Budget allocation record not found.' });
    }

    return res.json({
      success: true,
      message: 'Master budget allocation updated successfully.',
      data: updated
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update budget allocation.' });
  }
}

export function createBudgetAllocation(req: AuthenticatedRequest, res: Response) {
  try {
    const { departmentId, budgetHeadId, allocatedAmount, financialYear } = req.body;

    if (!departmentId || !budgetHeadId || allocatedAmount === undefined || isNaN(parseFloat(allocatedAmount))) {
      return res.status(400).json({
        success: false,
        message: 'departmentId, budgetHeadId, and numeric allocatedAmount are required.'
      });
    }

    const { createOrUpdateBudgetAllocation } = require('../utils/seedData');
    const allocation = createOrUpdateBudgetAllocation(
      parseInt(departmentId, 10),
      parseInt(budgetHeadId, 10),
      parseFloat(allocatedAmount),
      financialYear || '2026-27'
    );

    return res.status(201).json({
      success: true,
      message: `Budget allocation of ₹${allocatedAmount} for ${allocation.departmentName} updated successfully.`,
      data: allocation
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to create budget allocation.' });
  }
}

