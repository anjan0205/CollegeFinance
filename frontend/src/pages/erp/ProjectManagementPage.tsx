import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Search, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { erpService } from '../../services/erpService';
import { ProjectRecord } from '../../types/erpTypes';

export const ProjectManagementPage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<any>({
    code: 'PRJ-2026-EXP-01',
    name: 'New Campus Expansion Project',
    department: 'Central Infrastructure',
    projectManager: 'Dr. A. B. Patil',
    budgetAllocated: 10000000,
    startDate: '2026-04-01',
    endDate: '2026-12-31'
  });

  const loadData = async () => {
    setLoading(true);
    const res = await erpService.getProjects();
    setProjects(res);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await erpService.createProject(formData);
    setShowAddModal(false);
    loadData();
  };

  const filteredProjects = projects.filter(proj =>
    proj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proj.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proj.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold mb-1">
            <Briefcase className="w-4 h-4" /> Capital Projects & Budget Containers
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Project Management</h1>
          <p className="text-sm text-gray-500">
            Track multi-year capital projects, allocated project budgets, committed orders, and actual expenditure.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Register Capital Project
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search Project Code, Name, Dept..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 p-12 text-center text-gray-500">Loading project containers...</div>
        ) : (
          filteredProjects.map((proj) => {
            const utilization = Math.min(100, Math.round(((proj.committedAmount + proj.actualSpent) / proj.budgetAllocated) * 100));

            return (
              <div key={proj.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                    {proj.code}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    proj.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {proj.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">{proj.name}</h3>
                  <p className="text-xs text-gray-500 font-medium">Dept: {proj.department} | PM: {proj.projectManager}</p>
                </div>

                {/* Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-500">Budget Consumed / Committed</span>
                    <span className="text-indigo-600">{utilization}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${utilization}%` }} />
                  </div>
                </div>

                {/* Financial Summary Box */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center text-xs">
                  <div>
                    <span className="text-gray-400 block">Allocated</span>
                    <span className="font-black text-slate-900">₹{(proj.budgetAllocated / 100000).toFixed(1)}L</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Committed</span>
                    <span className="font-bold text-amber-700">₹{(proj.committedAmount / 100000).toFixed(1)}L</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Actual Paid</span>
                    <span className="font-bold text-emerald-700">₹{(proj.actualSpent / 100000).toFixed(1)}L</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border">
            <h3 className="text-lg font-bold text-slate-900">Register Capital Project</h3>
            <form onSubmit={handleAddSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block font-semibold mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Department</label>
                <input
                  type="text"
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Project Manager</label>
                <input
                  type="text"
                  required
                  value={formData.projectManager}
                  onChange={(e) => setFormData({ ...formData, projectManager: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Allocated Budget (₹)</label>
                <input
                  type="number"
                  required
                  value={formData.budgetAllocated}
                  onChange={(e) => setFormData({ ...formData, budgetAllocated: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold"
                >
                  Save Project Container
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
