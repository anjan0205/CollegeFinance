import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { User, UserRole } from '../types';
import { Users, UserPlus, Shield, Building, Mail, CheckCircle2 } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('DEPARTMENT_USER');
  const [departmentId, setDepartmentId] = useState('');
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchUsersAndDepartments();
  }, []);

  async function fetchUsersAndDepartments() {
    try {
      setLoading(true);
      const [uRes, dRes] = await Promise.all([
        api.get('/users'),
        api.get('/departments')
      ]);
      if (uRes.data.success) setUsers(uRes.data.data);
      if (dRes.data.success) setDepartments(dRes.data.data);
    } catch (e) {
      console.error('Failed to load user management data:', e);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSuccess(null);

    try {
      const res = await api.post('/users', { name, email, role, departmentId });
      if (res.data.success) {
        setCreateSuccess(`User '${name}' successfully created with role ${role}.`);
        setName('');
        setEmail('');
        setDepartmentId('');
        fetchUsersAndDepartments();
      }
    } catch (err: any) {
      alert(`User creation failed: ${err.response?.data?.message || 'Server error'}`);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-600" /> User & Role Access Management
          </h1>
          <p className="text-xs text-slate-500 font-medium">Maintain system user accounts, assigned roles (Admin, Finance, HOD, Dept User) & department scopes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create User Form */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-brand-600" /> Create System User
          </h2>

          {createSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {createSuccess}
            </div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. User Name"
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@vignan.ac.in"
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">System Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:border-brand-500"
              >
                <option value="ADMIN">Admin (Full Control)</option>
                <option value="FINANCE">Finance (Analytics & Imports)</option>
                <option value="HOD">HOD (Department Restricted)</option>
                <option value="DEPARTMENT_USER">Department User</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Assigned Department</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:border-brand-500"
              >
                <option value="">Global / All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer mt-2"
            >
              Save User Account
            </button>
          </form>
        </div>

        {/* Existing Users Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden lg:col-span-2">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800">
            System Accounts ({users.length})
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">User Name</th>
                  <th className="py-2.5 px-4">Email</th>
                  <th className="py-2.5 px-4">Assigned Role</th>
                  <th className="py-2.5 px-4">Scope Department</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-900">{u.name}</td>
                    <td className="py-2.5 px-4 text-slate-600 font-mono">{u.email}</td>
                    <td className="py-2.5 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'FINANCE' ? 'bg-blue-100 text-blue-800' :
                        u.role === 'HOD' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 font-medium">{u.departmentName || 'Global Access'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
