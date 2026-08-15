import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { MasterBudget } from './pages/MasterBudget';
import { Departments } from './pages/Departments';
import { DepartmentDetails } from './pages/DepartmentDetails';
import { BudgetHeads } from './pages/BudgetHeads';
import { BudgetUtilization } from './pages/BudgetUtilization';
import { PRManagement } from './pages/PRManagement';
import { Reports } from './pages/Reports';
import { DataImport } from './pages/DataImport';
import { UserManagement } from './pages/UserManagement';
import { Settings } from './pages/Settings';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-sm font-semibold">
        Loading College Budget System...
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
          <Route path="/login" element={<Login />} />

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
            <Route path="prs/rejected" element={<PRManagement />} />
            <Route path="prs/analysis" element={<PRManagement />} />

            {/* Reports */}
            <Route path="reports" element={<Reports />} />

            {/* Admin & Finance */}
            <Route path="data-import" element={<DataImport />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="settings" element={<Settings />} />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
