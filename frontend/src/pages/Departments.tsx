import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formatINR, formatINRCompact } from '../utils/formatters';
import { DepartmentSummary } from '../types';
import { Building2, Search, ArrowRight, PieChart, FileText, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

export const Departments: React.FC = () => {
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchDepartments();
  }, []);

  async function fetchDepartments() {
    try {
      setLoading(true);
      const res = await api.get('/departments');
      if (res.data.success) {
        setDepartments(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredDepartments = departments.filter((dept) => {
    const matchesSearch =
      dept.code.toLowerCase().includes(search.toLowerCase()) ||
      dept.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category ? dept.category === category : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">College Departments</h1>
          <p className="text-xs text-slate-500 font-medium">Department-wise budget allocation, PR commitment, and expenditure tracking</p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg">
          {departments.length} Institutional Departments
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search Department Name or Code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-brand-500 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg py-2 px-3 focus:outline-hidden focus:border-brand-500"
          >
            <option value="">All Categories</option>
            <option value="Academic">Academic</option>
            <option value="Administrative">Administrative</option>
            <option value="Dean">Dean Offices</option>
            <option value="Central">Central Services</option>
          </select>
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="h-56 bg-slate-200 animate-pulse rounded-2xl"></div>
          ))
        ) : filteredDepartments.length > 0 ? (
          filteredDepartments.map((dept) => (
            <div
              key={dept.id}
              onClick={() => navigate(`/budget/departments/${dept.id}`)}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-brand-300 transition-all p-5 flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-800">
                    {dept.code}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    dept.statusTag === 'Exceeded' ? 'bg-rose-100 text-rose-800' :
                    dept.statusTag === 'Critical' ? 'bg-orange-100 text-orange-800' :
                    dept.statusTag === 'Warning' ? 'bg-amber-100 text-amber-800' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {dept.utilizationPct}% Utilized
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                  {dept.name}
                </h3>
                <span className="text-xs text-slate-400 font-medium">{dept.category} Department</span>

                {/* Progress Bar */}
                <div className="mt-4 space-y-1">
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        dept.utilizationPct >= 85 ? 'bg-rose-500' :
                        dept.utilizationPct >= 70 ? 'bg-amber-500' :
                        'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(dept.utilizationPct, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Metric Grid */}
                <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Allocated Budget</span>
                    <p className="font-bold text-slate-900 mt-0.5">{formatINRCompact(dept.allocatedBudget)}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">PR Committed</span>
                    <p className="font-bold text-amber-700 mt-0.5">{formatINRCompact(dept.prCommittedAmount)}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Remaining Budget</span>
                    <p className="font-bold text-emerald-700 mt-0.5">{formatINRCompact(dept.remainingBudget)}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Total PRs</span>
                    <p className="font-bold text-indigo-700 mt-0.5">{dept.prCount} PRs</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-brand-600 group-hover:text-brand-700">
                <span>View Overview & PRs</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-400 font-medium bg-white rounded-2xl border border-slate-200">
            No departments match your filter criteria.
          </div>
        )}
      </div>
    </div>
  );
};
