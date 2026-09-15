import React, { useState } from 'react';
import {
  User,
  Shield,
  Bell,
  Key,
  Smartphone,
  Save,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Laptop,
  Clock,
  Building
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const AccountSettings: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'sessions'>('profile');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || 'Dr. Requisitioner',
    email: user?.email || 'faculty@viit.ac.in',
    phone: '+91 98765 43210',
    department: user?.departmentCode || user?.departmentName || 'CSE',
    designation: 'Associate Professor',
    employeeId: 'VIIT-EMP-4091',
    notifyEmail: true,
    notifySms: false,
    notifyThresholds: true,
    weeklyReport: true
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const sessions = [
    { id: 1, device: 'Chrome on Windows 11', ip: '103.21.144.10', location: 'Pune, Maharashtra', current: true, time: 'Active Now' },
    { id: 2, device: 'Safari on iPhone 15 Pro', ip: '103.21.144.11', location: 'Pune, Maharashtra', current: false, time: '3 hours ago' },
    { id: 3, device: 'Firefox on Linux (Campus Lab 4)', ip: '192.168.1.45', location: 'VIIT Campus Intranet', current: false, time: 'Yesterday' }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account & Security Settings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your faculty profile, two-factor authentication, notification rules, and active sessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold rounded-full">
            {user?.role || 'DEPARTMENT_USER'}
          </span>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>Your account preferences have been saved successfully.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile Info</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'security'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Security & 2FA</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'notifications'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notification Alerts</span>
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'sessions'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Laptop className="w-4 h-4" />
          <span>Active Sessions</span>
        </button>
      </div>

      {/* TAB CONTENT: Profile */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md">
              {formData.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">{formData.name}</h3>
              <p className="text-xs text-slate-500 font-medium">{formData.email}</p>
              <span className="inline-block mt-1 text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                Employee ID: {formData.employeeId}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Institutional Email</label>
              <input
                type="email"
                disabled
                value={formData.email}
                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Contact Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Department</label>
              <input
                type="text"
                disabled
                value={formData.department}
                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 flex items-center gap-2 transition"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB CONTENT: Security & 2FA */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-indigo-600" />
                  <span>Two-Factor Authentication (2FA)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enforce an additional OTP check via Google Authenticator or SMS when approving high-value PRs.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  twoFactorEnabled
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {twoFactorEnabled ? 'Enabled' : 'Enable 2FA'}
              </button>
            </div>

            <div className="border-t border-slate-100 pt-5 space-y-4">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Change Password</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="password"
                  placeholder="Current Password"
                  className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
                <input
                  type="password"
                  placeholder="New Password"
                  className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <button
                type="button"
                onClick={() => alert('Password updated successfully!')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Notifications */}
      {activeTab === 'notifications' && (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base mb-2">Automated Notifications & Threshold Alerts</h3>

          <label className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-bold text-xs text-slate-800">Email Alerts on PR Approvals</p>
              <p className="text-[11px] text-slate-500">Receive instant updates when HOD or Finance signs your requisition.</p>
            </div>
            <input
              type="checkbox"
              checked={formData.notifyEmail}
              onChange={(e) => setFormData({ ...formData, notifyEmail: e.target.checked })}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
            />
          </label>

          <label className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-bold text-xs text-slate-800">80% Budget Threshold Alerts</p>
              <p className="text-[11px] text-slate-500">Alert the department before budget heads cross critical allocation limits.</p>
            </div>
            <input
              type="checkbox"
              checked={formData.notifyThresholds}
              onChange={(e) => setFormData({ ...formData, notifyThresholds: e.target.checked })}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
            />
          </label>

          <label className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-bold text-xs text-slate-800">Weekly Department Digest</p>
              <p className="text-[11px] text-slate-500">Summary of all transactions, pending receipts, and vendor invoices.</p>
            </div>
            <input
              type="checkbox"
              checked={formData.weeklyReport}
              onChange={(e) => setFormData({ ...formData, weeklyReport: e.target.checked })}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
            />
          </label>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 flex items-center gap-2 transition"
            >
              <Save className="w-4 h-4" />
              <span>Save Notification Preferences</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB CONTENT: Active Sessions */}
      {activeTab === 'sessions' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Active Logged-in Devices</h3>
              <p className="text-xs text-slate-500 mt-0.5">Revoke any suspicious session or sign out remotely.</p>
            </div>
            <button
              onClick={() => alert('All other sessions revoked.')}
              className="px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Revoke All Other Sessions</span>
            </button>
          </div>

          <div className="space-y-3">
            {sessions.map((s) => (
              <div key={s.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-700 shadow-sm">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-xs text-slate-900">{s.device}</p>
                      {s.current && (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          Current Device
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">{s.location} • {s.ip}</p>
                  </div>
                </div>

                <div className="text-right text-xs text-slate-400 font-medium">
                  {s.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
