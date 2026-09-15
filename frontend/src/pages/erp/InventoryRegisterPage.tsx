import React, { useState, useEffect } from 'react';
import { Layers, Search, AlertCircle, Warehouse, TrendingUp } from 'lucide-react';
import { erpService } from '../../services/erpService';
import { InventoryItem } from '../../types/erpTypes';

export const InventoryRegisterPage: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setLoading(true);
    const res = await erpService.getInventory();
    setInventory(res);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredInventory = inventory.filter(item =>
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.storeLocation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValue = filteredInventory.reduce((s, i) => s + i.totalValue, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold mb-1">
            <Layers className="w-4 h-4" /> Stock Valuation & Ledger
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Register</h1>
          <p className="text-sm text-gray-500">
            Real-time multi-store stock ledger, low-stock alerts, and financial valuation.
          </p>
        </div>
        <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center gap-4 border border-slate-800">
          <div>
            <span className="text-xs uppercase text-slate-400 font-semibold block">Total Stock Valuation</span>
            <span className="text-2xl font-black text-emerald-400">₹{totalValue.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search stock by Item Name, Code, Store..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Stock Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 p-12 text-center text-gray-500">Loading stock inventory...</div>
        ) : (
          filteredInventory.map((item) => {
            const isLowStock = item.availableQty <= item.reorderLevel;

            return (
              <div
                key={item.id}
                className={`bg-white p-5 rounded-2xl border shadow-sm space-y-3 transition ${
                  isLowStock ? 'border-amber-400 bg-amber-50/20' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-gray-400">{item.itemCode}</span>
                  <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-semibold flex items-center gap-1">
                    <Warehouse className="w-3 h-3" /> {item.storeLocation}
                  </span>
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">{item.itemName}</h3>
                    <span className="text-xs text-gray-500">Category: {item.category}</span>
                  </div>
                  {isLowStock && (
                    <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Reorder Alert
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center text-xs">
                  <div>
                    <span className="text-gray-400 block">Available</span>
                    <span className="font-black text-slate-900 text-base">{item.availableQty} {item.uom}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Allocated</span>
                    <span className="font-bold text-amber-700 text-base">{item.allocatedQty} {item.uom}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Total Value</span>
                    <span className="font-bold text-emerald-700 text-base">₹{item.totalValue.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
