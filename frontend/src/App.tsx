import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LegalLayout } from './layouts/LegalLayout';
import { CookieBanner } from './components/CookieBanner';

// Main Application Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { MasterBudget } from './pages/MasterBudget';
import { Departments } from './pages/Departments';
import { DepartmentDetails } from './pages/DepartmentDetails';
import { BudgetHeads } from './pages/BudgetHeads';
import { BudgetUtilization } from './pages/BudgetUtilization';
import { PRManagement } from './pages/PRManagement';
import { POManagement } from './pages/POManagement';
import { Reports } from './pages/Reports';
import { InvoiceManagement } from './pages/InvoiceManagement';
import { UserManagement } from './pages/UserManagement';
import { Settings } from './pages/Settings';

// ERP P2P & Inventory Pages
import { MasterDataPage } from './pages/erp/MasterDataPage';
import { AddVendorMasterPage } from './pages/erp/AddVendorMasterPage';
import { MasterDataApprovalPage } from './pages/erp/MasterDataApprovalPage';
import { EmailApprovalActionPage } from './pages/erp/EmailApprovalActionPage';
import { QuotationManagementPage } from './pages/erp/QuotationManagementPage';
import { RFQManagementPage } from './pages/erp/RFQManagementPage';
import { GRNDataPage } from './pages/erp/GRNDataPage';
import { InventoryRegisterPage } from './pages/erp/InventoryRegisterPage';
import { StockIssuePage } from './pages/erp/StockIssuePage';
import { InvoiceDataPage } from './pages/erp/InvoiceDataPage';
import { InvoicePaymentsPage } from './pages/erp/InvoicePaymentsPage';
import { PartPaymentPage } from './pages/erp/PartPaymentPage';
import { DCNotePage } from './pages/erp/DCNotePage';
import { ProjectManagementPage } from './pages/erp/ProjectManagementPage';
import { ERPReportsPage } from './pages/erp/ERPReportsPage';

// Legal & Compliance Pages
import { LegalHub } from './pages/legal/LegalHub';
import { LegalPolicyPage } from './pages/legal/LegalPolicyPage';
import { CookiePreferences } from './pages/legal/CookiePreferences';

// Customer Lifecycle & Auth Pages
import { Register } from './pages/lifecycle/Register';
import { EmailVerification } from './pages/lifecycle/EmailVerification';
import { ForgotPassword } from './pages/lifecycle/ForgotPassword';
import { ResetPassword } from './pages/lifecycle/ResetPassword';
import { AccountSettings } from './pages/lifecycle/AccountSettings';

// Support & Help Pages
import { Support } from './pages/support/Support';
import { HelpCenter } from './pages/support/HelpCenter';

// UX States & Error Pages
import { NotFound404 } from './pages/ux/NotFound404';
import { Forbidden403 } from './pages/ux/Forbidden403';
import { ServerError500 } from './pages/ux/ServerError500';
import { Maintenance } from './pages/ux/Maintenance';
import { Offline } from './pages/ux/Offline';
import { SessionExpired } from './pages/ux/SessionExpired';
import { UXStatesPlayground } from './pages/ux/UXStatesPlayground';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-sm font-semibold">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-white rounded-full animate-spin" />
          <p className="font-bold">Loading VIIT Finance System...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Lifecycle */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Standalone UX & System Pages */}
          <Route path="/404" element={<NotFound404 />} />
          <Route path="/403" element={<Forbidden403 />} />
          <Route path="/500" element={<ServerError500 />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/offline" element={<Offline />} />
          <Route path="/session-expired" element={<SessionExpired />} />

          {/* Direct Email Action Gateway (Public Access from Email) */}
          <Route path="/master-approval/action" element={<EmailApprovalActionPage />} />
          <Route path="/erp/master-approval/action" element={<EmailApprovalActionPage />} />

          {/* Legal Layout & Pages */}
          <Route path="/legal" element={<LegalLayout />}>
            <Route index element={<LegalHub />} />
            <Route path="cookie-preferences" element={<CookiePreferences />} />
            <Route path=":slug" element={<LegalPolicyPage />} />
          </Route>

          {/* Main Dashboard Layout Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* Budget Routes */}
            <Route path="budget/master" element={<MasterBudget />} />
            <Route path="budget/departments" element={<Departments />} />
            <Route path="budget/departments/:id" element={<DepartmentDetails />} />
            <Route path="budget/heads" element={<BudgetHeads />} />
            <Route path="budget/utilization" element={<BudgetUtilization />} />

            {/* PR Management Routes */}
            <Route path="prs/all" element={<PRManagement />} />
            <Route path="prs/approved" element={<PRManagement />} />
            <Route path="prs/pending" element={<PRManagement />} />
            <Route path="prs/closed" element={<PRManagement />} />
            <Route path="prs/rejected" element={<PRManagement />} />
            <Route path="prs/analysis" element={<PRManagement />} />

            {/* PO Management Routes */}
            <Route path="pos" element={<POManagement />} />
            <Route path="pos/raise" element={<POManagement />} />
            <Route path="pos/direct" element={<POManagement />} />
            <Route path="pos/my-pos" element={<POManagement />} />
            <Route path="pos/all" element={<POManagement />} />
            <Route path="pos/on-hold" element={<POManagement />} />
            <Route path="pos/rejected" element={<POManagement />} />
            <Route path="pos/close" element={<POManagement />} />
            <Route path="pos/closed" element={<POManagement />} />
            <Route path="pos/import" element={<POManagement />} />
            <Route path="pos/modify" element={<POManagement />} />

            {/* Invoices Route */}
            <Route path="invoices" element={<InvoiceManagement />} />

            {/* Account & Security Settings */}
            <Route path="account/settings" element={<AccountSettings />} />

            {/* Support & Help Center */}
            <Route path="support" element={<Support />} />
            <Route path="help" element={<HelpCenter />} />

            {/* UX States Gallery */}
            <Route path="ux-states" element={<UXStatesPlayground />} />

            {/* ERP P2P & Inventory Module Routes */}
            <Route path="erp/master-data" element={<MasterDataPage />} />
            <Route path="erp/master-data/add-vendor" element={<AddVendorMasterPage />} />
            <Route path="erp/add-vendor" element={<AddVendorMasterPage />} />
            <Route path="erp/master-approval" element={<MasterDataApprovalPage />} />
            <Route path="erp/quotations" element={<QuotationManagementPage />} />
            <Route path="erp/rfq" element={<RFQManagementPage />} />
            <Route path="erp/pr-data" element={<Navigate to="/prs/all" replace />} />
            <Route path="erp/po-data" element={<Navigate to="/pos/raise" replace />} />
            <Route path="erp/grn-data" element={<GRNDataPage />} />
            <Route path="erp/inventory" element={<InventoryRegisterPage />} />
            <Route path="erp/stock-issue" element={<StockIssuePage />} />
            <Route path="erp/invoice-data" element={<InvoiceDataPage />} />
            <Route path="erp/payments" element={<InvoicePaymentsPage />} />
            <Route path="erp/part-payments" element={<PartPaymentPage />} />
            <Route path="erp/dc-notes" element={<DCNotePage />} />
            <Route path="erp/projects" element={<ProjectManagementPage />} />
            <Route path="erp/reports" element={<ERPReportsPage />} />

            {/* Reports & Admin */}
            <Route path="reports" element={<Reports />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="settings" element={<Settings />} />

            {/* Wildcard 404 inside dashboard */}
            <Route path="*" element={<NotFound404 />} />
          </Route>

          {/* Catch-all Wildcard for Top-level Unmatched URLs */}
          <Route path="*" element={<NotFound404 />} />
        </Routes>

        {/* Global Cookie Consent Banner */}
        <CookieBanner />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
