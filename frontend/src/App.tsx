import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LegalLayout } from './layouts/LegalLayout';
import { CookieBanner } from './components/CookieBanner';

// Dynamic Lazy Loader Helper for Named Module Exports
const lazyNamed = <T extends Record<string, any>, K extends keyof T>(
  loader: () => Promise<T>,
  key: K
) => React.lazy(() => loader().then((m) => ({ default: m[key] })));

// Main Application Pages (Code-Split on Demand)
const Login = lazyNamed(() => import('./pages/Login'), 'Login');
const Dashboard = lazyNamed(() => import('./pages/Dashboard'), 'Dashboard');
const MasterBudget = lazyNamed(() => import('./pages/MasterBudget'), 'MasterBudget');
const Departments = lazyNamed(() => import('./pages/Departments'), 'Departments');
const DepartmentDetails = lazyNamed(() => import('./pages/DepartmentDetails'), 'DepartmentDetails');
const BudgetHeads = lazyNamed(() => import('./pages/BudgetHeads'), 'BudgetHeads');
const BudgetUtilization = lazyNamed(() => import('./pages/BudgetUtilization'), 'BudgetUtilization');
const PRManagement = lazyNamed(() => import('./pages/PRManagement'), 'PRManagement');
const POManagement = lazyNamed(() => import('./pages/POManagement'), 'POManagement');
const Reports = lazyNamed(() => import('./pages/Reports'), 'Reports');
const InvoiceManagement = lazyNamed(() => import('./pages/InvoiceManagement'), 'InvoiceManagement');
const UserManagement = lazyNamed(() => import('./pages/UserManagement'), 'UserManagement');
const Settings = lazyNamed(() => import('./pages/Settings'), 'Settings');
const AuditLog = lazyNamed(() => import('./pages/AuditLog'), 'AuditLog');

// ERP P2P & Inventory Pages (Code-Split on Demand)
const MasterDataPage = lazyNamed(() => import('./pages/erp/MasterDataPage'), 'MasterDataPage');
const AddVendorMasterPage = lazyNamed(() => import('./pages/erp/AddVendorMasterPage'), 'AddVendorMasterPage');
const MasterDataApprovalPage = lazyNamed(() => import('./pages/erp/MasterDataApprovalPage'), 'MasterDataApprovalPage');
const EmailApprovalActionPage = lazyNamed(() => import('./pages/erp/EmailApprovalActionPage'), 'EmailApprovalActionPage');
const QuotationManagementPage = lazyNamed(() => import('./pages/erp/QuotationManagementPage'), 'QuotationManagementPage');
const RFQManagementPage = lazyNamed(() => import('./pages/erp/RFQManagementPage'), 'RFQManagementPage');
const GRNDataPage = lazyNamed(() => import('./pages/erp/GRNDataPage'), 'GRNDataPage');
const InventoryRegisterPage = lazyNamed(() => import('./pages/erp/InventoryRegisterPage'), 'InventoryRegisterPage');
const StockIssuePage = lazyNamed(() => import('./pages/erp/StockIssuePage'), 'StockIssuePage');
const InvoiceDataPage = lazyNamed(() => import('./pages/erp/InvoiceDataPage'), 'InvoiceDataPage');
const InvoicePaymentsPage = lazyNamed(() => import('./pages/erp/InvoicePaymentsPage'), 'InvoicePaymentsPage');
const PartPaymentPage = lazyNamed(() => import('./pages/erp/PartPaymentPage'), 'PartPaymentPage');
const DCNotePage = lazyNamed(() => import('./pages/erp/DCNotePage'), 'DCNotePage');
const ProjectManagementPage = lazyNamed(() => import('./pages/erp/ProjectManagementPage'), 'ProjectManagementPage');
const ERPReportsPage = lazyNamed(() => import('./pages/erp/ERPReportsPage'), 'ERPReportsPage');

// Legal & Compliance Pages
const LegalHub = lazyNamed(() => import('./pages/legal/LegalHub'), 'LegalHub');
const LegalPolicyPage = lazyNamed(() => import('./pages/legal/LegalPolicyPage'), 'LegalPolicyPage');
const CookiePreferences = lazyNamed(() => import('./pages/legal/CookiePreferences'), 'CookiePreferences');

// Customer Lifecycle & Auth Pages
const Register = lazyNamed(() => import('./pages/lifecycle/Register'), 'Register');
const EmailVerification = lazyNamed(() => import('./pages/lifecycle/EmailVerification'), 'EmailVerification');
const ForgotPassword = lazyNamed(() => import('./pages/lifecycle/ForgotPassword'), 'ForgotPassword');
const ResetPassword = lazyNamed(() => import('./pages/lifecycle/ResetPassword'), 'ResetPassword');
const AccountSettings = lazyNamed(() => import('./pages/lifecycle/AccountSettings'), 'AccountSettings');

// Support & Help Pages
const Support = lazyNamed(() => import('./pages/support/Support'), 'Support');
const HelpCenter = lazyNamed(() => import('./pages/support/HelpCenter'), 'HelpCenter');

// UX States & Error Pages
const NotFound404 = lazyNamed(() => import('./pages/ux/NotFound404'), 'NotFound404');
const Forbidden403 = lazyNamed(() => import('./pages/ux/Forbidden403'), 'Forbidden403');
const ServerError500 = lazyNamed(() => import('./pages/ux/ServerError500'), 'ServerError500');
const Maintenance = lazyNamed(() => import('./pages/ux/Maintenance'), 'Maintenance');
const Offline = lazyNamed(() => import('./pages/ux/Offline'), 'Offline');
const SessionExpired = lazyNamed(() => import('./pages/ux/SessionExpired'), 'SessionExpired');
const UXStatesPlayground = lazyNamed(() => import('./pages/ux/UXStatesPlayground'), 'UXStatesPlayground');

// Instant Lightweight Route Fallback Loader
const PageLoadingFallback: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center p-8">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading module...</span>
    </div>
  </div>
);

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
        <Suspense fallback={<PageLoadingFallback />}>
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
              <Route path="audit" element={<AuditLog />} />
              <Route path="settings" element={<Settings />} />

              {/* Wildcard 404 inside dashboard */}
              <Route path="*" element={<NotFound404 />} />
            </Route>

            {/* Catch-all Wildcard for Top-level Unmatched URLs */}
            <Route path="*" element={<NotFound404 />} />
          </Routes>
        </Suspense>

        {/* Global Cookie Consent Banner */}
        <CookieBanner />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
