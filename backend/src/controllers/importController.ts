import { Response } from 'express';
import { processPRExcelImport, getImportBatches, getImportErrors } from '../services/excelImportService';
import { AuthenticatedRequest } from '../middleware/auth';

export async function importPRData(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No Excel file provided. Please attach a file.' });
    }

    const userId = req.user?.id;
    const filePath = req.file.path;
    const filename = req.file.originalname;

    const result = await processPRExcelImport(filePath, filename, userId);

    return res.json({
      success: true,
      message: 'Excel import completed successfully.',
      batch: result.batch,
      errors: result.errors
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: `Excel import failed: ${err.message}`
    });
  }
}

export async function importBudgetData(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No Excel file provided.' });
    }

    const userId = req.user?.id;
    const filePath = req.file.path;
    const filename = req.file.originalname;

    const result = await processPRExcelImport(filePath, filename, userId);

    return res.json({
      success: true,
      message: 'Master budget import completed.',
      batch: { ...result.batch, batchType: 'BUDGET' },
      errors: result.errors
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: `Budget import failed: ${err.message}` });
  }
}

export async function getImportHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const history = getImportBatches();
    return res.json({ success: true, data: history });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch import history.' });
  }
}

export async function getBatchErrors(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const batchId = parseInt(id, 10);
    const errors = getImportErrors(batchId);
    return res.json({ success: true, data: errors });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch import errors.' });
  }
}
