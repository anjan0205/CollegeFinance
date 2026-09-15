import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw, FileText, Download, ShieldCheck } from 'lucide-react';
import * as XLSX from 'xlsx';

export const DataImport: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'PR' | 'BUDGET'>('PR');
  const [uploading, setUploading] = useState(false);
  const [resultSummary, setResultSummary] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchImportHistory();
  }, []);

  async function fetchImportHistory() {
    try {
      const res = await api.get('/import/history');
      if (res.data.success) {
        setHistory(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load import history:', e);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResultSummary(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setResultSummary(null);
    }
  };

  const handleUploadSubmit = async () => {
    if (!file) return;

    setUploading(true);
    setResultSummary(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const endpoint = importType === 'PR' ? '/import/pr' : '/import/budget';
      const res = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setResultSummary(res.data);
        fetchImportHistory();
      }
    } catch (err: any) {
      alert(`Import failed: ${err.response?.data?.message || 'Server error during parsing.'}`);
    } finally {
      setUploading(false);
    }
  };

  const downloadErrorReport = (errors: any[]) => {
    if (!errors || errors.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(errors);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Import Errors');
    XLSX.writeFile(workbook, `Import_Error_Report_${new Date().toISOString().substring(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Upload className="w-5 h-5 text-cyan-600" /> Excel Data Import & Normalization Center
          </h1>
          <p className="text-xs text-slate-500 font-medium">Import Master Budget allocations and PR tracking records from raw Excel workbooks</p>
        </div>
      </div>

      {/* Import Type Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          onClick={() => setImportType('PR')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            importType === 'PR' ? 'bg-brand-50 border-brand-500 shadow-xs' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${importType === 'PR' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Import PR Tracking Excel</h3>
              <p className="text-xs text-slate-500">Upload PR report workbooks (PR No, Requested Date, Dept, Amount, Remarks)</p>
            </div>
          </div>
        </div>

        <div
          onClick={() => setImportType('BUDGET')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            importType === 'BUDGET' ? 'bg-brand-50 border-brand-500 shadow-xs' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${importType === 'BUDGET' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Import Master Budget Excel</h3>
              <p className="text-xs text-slate-500">Upload Master Budget proposal workbooks (122 Budget Heads x 32 Depts)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Drag and Drop File Upload Area */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-xl p-8 text-center transition-colors bg-slate-50/50 hover:bg-brand-50/30 flex flex-col items-center justify-center cursor-pointer"
        >
          <input
            type="file"
            id="excel-file-input"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="excel-file-input" className="cursor-pointer flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-slate-800">
              {file ? file.name : 'Click to select or drag & drop Excel workbook'}
            </span>
            <span className="text-xs text-slate-400 mt-1">Supports .xlsx, .xls, .csv up to 25 MB</span>
          </label>
        </div>

        {file && (
          <div className="flex items-center justify-between bg-slate-100 p-3 rounded-lg text-xs font-medium text-slate-700">
            <span>Selected File: <strong className="text-slate-900">{file.name}</strong> ({Math.round(file.size / 1024)} KB)</span>
            <button
              onClick={handleUploadSubmit}
              disabled={uploading}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {uploading ? 'Processing & Normalizing...' : 'Start Upload & Process'}
            </button>
          </div>
        )}
      </div>

      {/* Import Result Summary Modal / Panel */}
      {resultSummary && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4">
          <div className="flex items-center gap-3 text-emerald-600 font-bold text-base">
            <CheckCircle2 className="w-6 h-6" />
            <span>Import Execution Completed!</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Rows</span>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{resultSummary.batch.totalRows}</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase">Imported (New)</span>
              <p className="text-xl font-bold text-emerald-900 mt-0.5">{resultSummary.batch.importedCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <span className="text-[11px] font-semibold text-blue-700 uppercase">Updated (Duplicate)</span>
              <p className="text-xl font-bold text-blue-900 mt-0.5">{resultSummary.batch.updatedCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Skipped</span>
              <p className="text-xl font-bold text-slate-700 mt-0.5">{resultSummary.batch.skippedCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
              <span className="text-[11px] font-semibold text-rose-700 uppercase">Errors</span>
              <p className="text-xl font-bold text-rose-900 mt-0.5">{resultSummary.batch.errorCount}</p>
            </div>
          </div>

          {resultSummary.errors && resultSummary.errors.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> Logged Validation Errors ({resultSummary.errors.length})
                </span>
                <button
                  onClick={() => downloadErrorReport(resultSummary.errors)}
                  className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Download Error Log Report
                </button>
              </div>

              <div className="max-h-40 overflow-y-auto border border-rose-200 rounded-lg p-2 bg-rose-50/50 text-xs space-y-1 font-mono">
                {resultSummary.errors.map((err: any) => (
                  <div key={err.id} className="text-rose-800">
                    Row {err.rowNumber} [{err.prNumber || 'N/A'}]: {err.errorMessage}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Past Import History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800">
          Import Batch History Logs
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Batch ID</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Filename</th>
                <th className="py-2.5 px-4 text-right">Total Rows</th>
                <th className="py-2.5 px-4 text-right">Imported</th>
                <th className="py-2.5 px-4 text-right">Updated</th>
                <th className="py-2.5 px-4 text-right">Errors</th>
                <th className="py-2.5 px-4">Imported At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {history.length > 0 ? (
                history.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-800">#BATCH-{batch.id}</td>
                    <td className="py-2.5 px-4 font-semibold text-brand-700">{batch.batchType}</td>
                    <td className="py-2.5 px-4 text-slate-900 font-medium">{batch.filename}</td>
                    <td className="py-2.5 px-4 text-right font-bold">{batch.totalRows}</td>
                    <td className="py-2.5 px-4 text-right text-emerald-700 font-bold">{batch.importedCount}</td>
                    <td className="py-2.5 px-4 text-right text-blue-700 font-bold">{batch.updatedCount}</td>
                    <td className="py-2.5 px-4 text-right text-rose-700 font-bold">{batch.errorCount}</td>
                    <td className="py-2.5 px-4 text-slate-500">{new Date(batch.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400 font-medium">
                    No import batches logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
