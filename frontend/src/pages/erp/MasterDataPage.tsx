import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Plus, Search, Filter, ShieldCheck, CheckCircle2, Clock, UserPlus } from 'lucide-react';
import { erpService } from '../../services/erpService';

type MasterType = 'vendors' | 'items' | 'departments' | 'costCenters' | 'uoms' | 'stores';

export const MasterDataPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MasterType>('vendors');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const loadData = async () => {
    setLoading(true);
    const result = await erpService.getMasterData(activeTab);
    setData(result);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await erpService.createMasterData(activeTab, formData);
    setShowAddModal(false);
    setFormData({});
    loadData();
  };

  const handleAddMasterClick = () => {
    if (activeTab === 'vendors') {
      navigate('/erp/master-data/add-vendor');
    } else {
      setShowAddModal(true);
    }
  };

  const filteredData = data.filter(item =>
    JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold mb-1">
            <Database className="w-4 h-4" /> ERP Master Repositories
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Master Data Registry</h1>
          <p className="text-sm text-gray-500">
            Maintain institutional Vendors, Items, Departments, Cost Centers, UoM, and Warehouses with strict Maker-Checker rules.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/erp/master-data/add-vendor')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Add Vendor Master
          </button>
          {activeTab !== 'vendors' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Master Item
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {[
          { key: 'vendors', label: 'Vendors' },
          { key: 'items', label: 'Items / Catalog' },
          { key: 'departments', label: 'Departments' },
          { key: 'costCenters', label: 'Cost Centers' },
          { key: 'uoms', label: 'Units of Measure' },
          { key: 'stores', label: 'Stores & Warehouses' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as MasterType)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
              activeTab === tab.key
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <span className="text-xs font-semibold text-gray-500">
          Showing {filteredData.length} records
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading master registry...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-gray-200 text-slate-700 font-bold text-xs uppercase">
                <tr>
                  <th className="py-3.5 px-4">Code / ID</th>
                  <th className="py-3.5 px-4">Name / Title</th>
                  <th className="py-3.5 px-4">Details</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400 text-sm">
                      No master records found.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {item.id || item.code || item.itemCode}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {item.name}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-600">
                        {activeTab === 'vendors' && `${item.category || ''} | GST: ${item.gstNo || 'N/A'}`}
                        {activeTab === 'items' && `Category: ${item.category} | UOM: ${item.uom} | Price: ₹${item.unitPrice?.toLocaleString('en-IN')}`}
                        {activeTab === 'departments' && `HOD: ${item.hodName} | Budget: ${item.budgetCode}`}
                        {activeTab === 'costCenters' && `Dept: ${item.department}`}
                        {activeTab === 'uoms' && item.name}
                        {activeTab === 'stores' && `Manager: ${item.manager} | Location: ${item.location}`}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          item.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.status === 'APPROVED' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                          {item.status || 'APPROVED'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border">
            <h3 className="text-lg font-bold text-slate-900 capitalize">
              Add New {activeTab.replace(/s$/, '')}
            </h3>
            <form onSubmit={handleAddSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block font-semibold mb-1">Name</label>
                <input
                  type="text"
                  required
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              {activeTab === 'vendors' && (
                <>
                  <div>
                    <label className="block font-semibold mb-1">GST Number</label>
                    <input
                      type="text"
                      onChange={(e) => setFormData({ ...formData, gstNo: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Contact Email</label>
                    <input
                      type="email"
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                </>
              )}
              {activeTab === 'items' && (
                <>
                  <div>
                    <label className="block font-semibold mb-1">Unit Price (₹)</label>
                    <input
                      type="number"
                      onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Category</label>
                    <input
                      type="text"
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                </>
              )}
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
                  Submit for Checker Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
