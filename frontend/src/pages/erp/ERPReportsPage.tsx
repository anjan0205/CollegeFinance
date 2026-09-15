import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Printer, ShieldCheck, ShoppingCart, ShoppingBag, PackageCheck, Receipt, Layers, CreditCard } from 'lucide-react';
import { erpService } from '../../services/erpService';
import { ERPSummaryMetrics } from '../../types/erpTypes';

export const ERPReportsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<ERPSummaryMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true);
      const data = await erpService.getERPSummary();
      setMetrics(data);
      setLoading(false);
    };
    loadSummary();
  }, []);

  const handleExportCSV = () => {
    if (!metrics) return;
    const csvContent = "data:text/csv;charset=utf-8," +
      "Metric,Value\n" +
      `Total Requisitions (PR),${metrics.totalPRs}\n` +
      `Total Purchase Orders (PO),${metrics.totalPOs}\n` +
      `Total Goods Receipts (GRN),${metrics.totalGRNs}\n` +
      `Total Invoices Processed,${metrics.totalInvoices}\n` +
      `Pending Checker Approvals,${metrics.pendingApprovalsCount}\n` +
      `Total Inventory Valuation,₹${metrics.totalInventoryValue}\n` +
      `Active Capital Projects,${metrics.activeProjectsCount}\n` +
      `Total Vendor Payments Released,₹${metrics.totalPaymentsProcessed}\n`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `VIIT_ERP_Summary_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold mb-1">
            <BarChart3 className="w-4 h-4" /> Procure-to-Pay (P2P) Executive Dashboard
          </div>
          <h1 className="text-2xl font-bold text-slate-900">ERP Analytics & Cross-Module Reports</h1>
          <p className="text-sm text-gray-500">
            Consolidated operational metrics across requisitions, purchase orders, inventory, and vendor payments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition text-sm"
          >
            <Download className="w-4 h-4" /> Export Summary Excel/CSV
          </button>
          <button
            onClick={() => window.print()}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition text-sm"
          >
            <Printer className="w-4 h-4" /> Print Executive Summary
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      {loading ? (
        <div className="p-12 text-center text-gray-500">Calculating ERP metrics...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-indigo-600">
              <ShoppingCart className="w-5 h-5" />
              <span className="text-xs font-bold bg-indigo-50 px-2 py-0.5 rounded">PR</span>
            </div>
            <span className="text-xs text-gray-400 font-semibold block">Total Requisitions</span>
            <span className="text-3xl font-black text-slate-900">{metrics?.totalPRs}</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-blue-600">
              <ShoppingBag className="w-5 h-5" />
              <span className="text-xs font-bold bg-blue-50 px-2 py-0.5 rounded">PO</span>
            </div>
            <span className="text-xs text-gray-400 font-semibold block">Active Purchase Orders</span>
            <span className="text-3xl font-black text-slate-900">{metrics?.totalPOs}</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-emerald-600">
              <Layers className="w-5 h-5" />
              <span className="text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded">VALUATION</span>
            </div>
            <span className="text-xs text-gray-400 font-semibold block">Stock Inventory Valuation</span>
            <span className="text-2xl font-black text-emerald-600">
              ₹{metrics?.totalInventoryValue.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-purple-600">
              <CreditCard className="w-5 h-5" />
              <span className="text-xs font-bold bg-purple-50 px-2 py-0.5 rounded">PAYMENTS</span>
            </div>
            <span className="text-xs text-gray-400 font-semibold block">Disbursed Payments</span>
            <span className="text-2xl font-black text-slate-900">
              ₹{metrics?.totalPaymentsProcessed.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )}

      {/* P2P Lifecycle Status Overview */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="font-extrabold text-lg text-slate-900">Procure-to-Pay (P2P) Pipeline Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs text-gray-500 font-semibold block mb-1">1. Master & Quotes</span>
            <span className="text-xl font-bold text-slate-800">Verified</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs text-gray-500 font-semibold block mb-1">2. PR Requisitions</span>
            <span className="text-xl font-bold text-indigo-600">{metrics?.totalPRs} Raised</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs text-gray-500 font-semibold block mb-1">3. PO Issued</span>
            <span className="text-xl font-bold text-blue-600">{metrics?.totalPOs} Issued</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs text-gray-500 font-semibold block mb-1">4. GRN Received</span>
            <span className="text-xl font-bold text-emerald-600">{metrics?.totalGRNs} Inspected</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs text-gray-500 font-semibold block mb-1">5. 3-Way Match & Pay</span>
            <span className="text-xl font-bold text-purple-600">{metrics?.totalInvoices} Cleared</span>
          </div>
        </div>
      </div>
    </div>
  );
};
