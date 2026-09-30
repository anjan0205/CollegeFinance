import React from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { canAccessRoute } from '../config/permissions';

export const DashboardLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Role-based route guard: block direct-URL access to modules the current role
  // is not permitted to reach (menu hiding alone is not enough). See
  // config/permissions.ts + docs/architecture.md §5.1.
  if (!canAccessRoute(user?.role, location.pathname)) {
    return <Navigate to="/403" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50/70">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
