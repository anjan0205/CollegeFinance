import { Response } from 'express';
import { getSeedInvoices, createInvoiceRecord, updateInvoiceStatusRecord } from '../utils/seedData';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getInvoices(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      search,
      department,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    const userRole = req.user?.role;
    const userDeptId = req.user?.departmentId;
    const userDeptCode = req.user?.departmentCode;

    let invoices = getSeedInvoices();

    // HOD or Department User scope restriction
    if (userRole === 'HOD' || userRole === 'DEPARTMENT_USER') {
      invoices = invoices.filter(inv => {
        if (userDeptId && String(inv.departmentId) === String(userDeptId)) return true;
        if (userDeptCode && inv.departmentCode && inv.departmentCode.trim().toUpperCase() === userDeptCode.trim().toUpperCase()) return true;
        return false;
      });
    }

    // Global Search (Invoice Number, Vendor Name, PR Number, Remarks, Dept Code)
    if (search) {
      const q = String(search).toLowerCase();
      invoices = invoices.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.vendorName.toLowerCase().includes(q) ||
        inv.prNumber.toLowerCase().includes(q) ||
        inv.departmentCode.toLowerCase().includes(q) ||
        inv.departmentName.toLowerCase().includes(q) ||
        (inv.remarks && inv.remarks.toLowerCase().includes(q))
      );
    }

    // Department Filter
    if (department && department !== 'ALL') {
      const deptStr = String(department).toUpperCase();
      invoices = invoices.filter(inv =>
        inv.departmentCode.toUpperCase() === deptStr ||
        String(inv.departmentId) === deptStr
      );
    }

    // Status Filter
    if (status && status !== 'ALL') {
      invoices = invoices.filter(inv => inv.status.toLowerCase() === String(status).toLowerCase());
    }

    // Date Range Filter
    if (startDate) {
      invoices = invoices.filter(inv => inv.invoiceDate >= String(startDate));
    }
    if (endDate) {
      invoices = invoices.filter(inv => inv.invoiceDate <= String(endDate));
    }

    // Sorting (Newest first)
    invoices.sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime());

    // Pagination
    const pageNum = parseInt(String(page), 10);
    const limitNum = parseInt(String(limit), 10);
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedItems = invoices.slice(startIndex, startIndex + limitNum);

    const totalAmountSum = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    return res.json({
      success: true,
      data: paginatedItems,
      pagination: {
        total: invoices.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(invoices.length / limitNum) || 1
      },
      summary: {
        totalFilteredInvoices: invoices.length,
        totalAmount: totalAmountSum
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch invoice records.' });
  }
}

export async function getInvoiceById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const invoices = getSeedInvoices();

    const inv = invoices.find(i => String(i.id) === id || i.invoiceNumber.toLowerCase() === id.toLowerCase());

    if (!inv) {
      return res.status(404).json({ success: false, message: 'Invoice record not found.' });
    }

    // Scope restriction
    const userRole = req.user?.role;
    const userDeptId = req.user?.departmentId;
    if ((userRole === 'HOD' || userRole === 'DEPARTMENT_USER') && userDeptId && inv.departmentId !== userDeptId) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only view invoices for your department.' });
    }

    return res.json({
      success: true,
      data: inv
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch invoice details.' });
  }
}

export async function createInvoice(req: AuthenticatedRequest, res: Response) {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only Administrators can upload or create vendor invoices.'
      });
    }

    const {
      invoiceNumber,
      invoiceDate,
      prId,
      vendorName,
      totalAmount,
      taxAmount,
      remarks
    } = req.body;

    if (!prId || !vendorName || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'prId, vendorName, and totalAmount are required to create an invoice.'
      });
    }

    const newInvoice = await createInvoiceRecord({
      invoiceNumber,
      invoiceDate,
      prId,
      vendorName,
      totalAmount: parseFloat(totalAmount),
      taxAmount: taxAmount ? parseFloat(taxAmount) : 0,
      remarks,
      submittedBy: req.user?.name || 'Department User'
    });

    return res.status(201).json({
      success: true,
      message: `Invoice ${newInvoice.invoiceNumber} submitted successfully.`,
      data: newInvoice
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to create new invoice record.' });
  }
}

export async function updateInvoiceStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status parameter is required.' });
    }

    const updated = await updateInvoiceStatusRecord(id, status, paymentStatus);

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Invoice record not found.' });
    }

    return res.json({
      success: true,
      message: `Invoice status updated to '${updated.status}' successfully.`,
      data: updated
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update invoice status.' });
  }
}
