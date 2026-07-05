/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Grid, 
  Layers, 
  Trash2, 
  AlertTriangle, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  Package, 
  Edit,
  Tag
} from 'lucide-react';
import { Product } from '../types';

interface ProductsViewProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateStock: (id: string, amount: number) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateProduct: (product: Product) => void;
}

export default function ProductsView({ products, onAddProduct, onUpdateStock, onDeleteProduct, onUpdateProduct }: ProductsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [hsnCode, setHsnCode] = useState('');
  const [gstRate, setGstRate] = useState<number>(18);
  const [unit, setUnit] = useState('PCS');
  const [stockQuantity, setStockQuantity] = useState<number>(100);
  const [lowStockAlert, setLowStockAlert] = useState<number>(15);
  const [purchaseRate, setPurchaseRate] = useState<number>(0);
  const [salesRate, setSalesRate] = useState<number>(0);
  const [category, setCategory] = useState('Electricals');
  const [group, setGroup] = useState('Lighting');

  // Edit Form states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editHsnCode, setEditHsnCode] = useState('');
  const [editGstRate, setEditGstRate] = useState<number>(18);
  const [editUnit, setEditUnit] = useState('PCS');
  const [editStockQuantity, setEditStockQuantity] = useState<number>(0);
  const [editLowStockAlert, setEditLowStockAlert] = useState<number>(0);
  const [editPurchaseRate, setEditPurchaseRate] = useState<number>(0);
  const [editSalesRate, setEditSalesRate] = useState<number>(0);
  const [editCategory, setEditCategory] = useState('');
  const [editGroup, setEditGroup] = useState('');

  // Delete State
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const startEditing = (prod: Product) => {
    setEditingProduct(prod);
    setEditName(prod.name);
    setEditHsnCode(prod.hsnCode);
    setEditGstRate(prod.gstRate);
    setEditUnit(prod.unit || 'PCS');
    setEditStockQuantity(prod.stockQuantity);
    setEditLowStockAlert(prod.lowStockAlert);
    setEditPurchaseRate(prod.purchaseRate);
    setEditSalesRate(prod.salesRate);
    setEditCategory(prod.category || 'Electricals');
    setEditGroup(prod.group || 'Lighting');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editName || !editHsnCode || !editSalesRate) {
      alert('Please fill in Name, HSN Code and Sales Rate.');
      return;
    }

    const updated: Product = {
      ...editingProduct,
      name: editName,
      hsnCode: editHsnCode,
      gstRate: editGstRate,
      unit: editUnit,
      stockQuantity: editStockQuantity,
      lowStockAlert: editLowStockAlert,
      purchaseRate: editPurchaseRate,
      salesRate: editSalesRate,
      category: editCategory,
      group: editGroup
    };

    onUpdateProduct(updated);
    setEditingProduct(null);
  };

  // Categories list
  const categoriesList = ['All', ...Array.from(new Set(products.map(p => p.category || 'Other')))];

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !hsnCode || !salesRate) {
      alert('Fill in mandatory fields.');
      return;
    }

    const newPr: Product = {
      id: `prod-${Date.now()}`,
      name,
      hsnCode,
      gstRate,
      unit,
      stockQuantity,
      lowStockAlert,
      purchaseRate,
      salesRate,
      category,
      group
    };

    onAddProduct(newPr);
    setIsAdding(false);
    
    // reset form fields
    setName('');
    setHsnCode('');
    setPurchaseRate(0);
    setSalesRate(0);
  };

  // Filtered list
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || (p.category || 'Other') === selectedCategory;
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.hsnCode.includes(searchTerm) || 
      (p.group || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl shadow-sm border border-slate-700/50">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-1.5">
            <Package className="h-5 w-5 text-orange-400" />
            Product & Inventory Master
          </h2>
          <p className="text-xs text-slate-400">
            Define item catalogues, HSN parameters, GST tax bands (18%, 28%), and monitor stock depletion parameters.
          </p>
        </div>

        <button
          id="btn-add-product"
          onClick={() => setIsAdding(!isAdding)}
          className="bg-orange-500 hover:bg-orange-600 font-bold text-white text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5"
        >
          {isAdding ? 'View Inventory List' : 'Add New Product SKU'}
        </button>
      </div>

      {isAdding ? (
        /* CREATION PORTAL */
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
          <h3 className="text-sm font-extrabold text-slate-900 border-b pb-2">Create Product SKU</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Product Name *</label>
              <input
                id="form-p-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500 font-semibold"
                placeholder="e.g. Havells 12W LED Recessed Panel"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">HSN Code (GST Compliance) *</label>
              <input
                id="form-p-hsn"
                type="text"
                required
                maxLength={8}
                value={hsnCode}
                onChange={(e) => setHsnCode(e.target.value.replace(/\D/g, ''))}
                className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-orange-500"
                placeholder="e.g. 8539"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">GST Tax Rate *</label>
              <select
                id="form-p-gst"
                value={gstRate}
                onChange={(e) => setGstRate(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs focus:outline-none focus:border-orange-500 font-bold"
              >
                <option value={5}>5% GST (Essential electrical parts)</option>
                <option value={12}>12% GST (Appliances/Machinery)</option>
                <option value={18}>18% Standard GST (Lighting, wire, components)</option>
                <option value={28}>28% Luxury GST (Motors, heavy cables)</option>
                <option value={0}>0% Exempted</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Standard Sales Price (₹) *</label>
              <input
                id="form-p-sales"
                type="number"
                required
                value={salesRate}
                onChange={(e) => setSalesRate(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-orange-500 font-bold"
                placeholder="299"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Procurement Purchase Price (₹)</label>
              <input
                id="form-p-purchase"
                type="number"
                value={purchaseRate}
                onChange={(e) => setPurchaseRate(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-orange-500"
                placeholder="180"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Inventory Stock Unit</label>
              <input
                id="form-p-unit"
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value.toUpperCase())}
                className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500 uppercase font-black"
                placeholder="e.g. PCS, BOX, KGS"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Initial Stock Level</label>
              <input
                id="form-p-stock"
                type="number"
                required
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Low-Stock Trigger Buffer</label>
              <input
                id="form-p-buffer"
                type="number"
                required
                value={lowStockAlert}
                onChange={(e) => setLowStockAlert(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category / Section</label>
              <input
                id="form-p-cat"
                type="text"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500"
                placeholder="e.g. Electricals"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Product Sub-Group</label>
              <input
                id="form-p-group"
                type="text"
                required
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500"
                placeholder="e.g. Bulbs"
              />
            </div>
          </div>

          <div className="pt-4 border-t flex gap-2">
            <button
              id="btn-save-product-sku"
              type="submit"
              className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 font-bold text-white text-xs rounded-xl transition-all shadow"
            >
              Add Product to Database
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all"
            >
              Back to List
            </button>
          </div>
        </form>
      ) : (
        /* MAIN LIST CARD CONTROLLER */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b pb-4">
            {/* Category Side filters inside catalog */}
            <div className="flex items-center gap-1.5 self-start overflow-x-auto w-full md:w-auto pb-1.5 md:pb-0 scrollbar-none">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <Tag className="h-3 w-3" /> Filters:
              </span>
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-xs rounded-xl transition-all font-bold select-none ${
                    selectedCategory === cat 
                      ? 'bg-slate-900 text-white shadow-sm' 
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Quick search SKUs */}
            <div className="relative w-full md:w-64">
              <Search className="absolute inset-y-0 left-0 pl-3 h-9 w-9 text-slate-400 flex items-center justify-center pointer-events-none" />
              <input
                id="product-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-orange-500 font-medium"
                placeholder="HSN, group, name..."
              />
            </div>
          </div>

          {/* Table display */}
          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs text-slate-700">
              <thead className="bg-slate-50 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3 text-center">HSN</th>
                  <th className="px-4 py-3 text-center">GST</th>
                  <th className="px-4 py-3 text-right">Purchase Price</th>
                  <th className="px-4 py-3 text-right">Selling Price</th>
                  <th className="px-4 py-3 text-center">Category Details</th>
                  <th className="px-4 py-3 text-center">Stock Level</th>
                  <th className="px-4 py-3 text-right">Quantity Controls</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50 font-medium">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-slate-400 font-normal">
                      No stock items match your filter criteria or search keyword.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((prod) => {
                    const isLowStock = prod.stockQuantity <= prod.lowStockAlert;
                    return (
                      <tr key={prod.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{prod.name}</p>
                          <p className="text-[10px] text-slate-400 font-normal">Group: {prod.group || 'N/A'}</p>
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-slate-500">{prod.hsnCode}</td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-slate-650">{prod.gstRate}%</td>
                        <td className="px-4 py-3 text-right font-mono">₹{prod.purchaseRate.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">₹{prod.salesRate.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                            {prod.category}
                          </span>
                        </td>
                        
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`font-mono font-black text-sm px-2 py-0.5 rounded ${
                              isLowStock ? 'text-red-650 bg-red-50' : 'text-emerald-700 bg-emerald-50'
                            }`}>
                              {prod.stockQuantity} {prod.unit}
                            </span>
                            {isLowStock && (
                              <span className="text-[9px] text-orange-600 font-bold flex items-center gap-0.5 mt-1">
                                <AlertTriangle className="h-3 w-3" /> Reorder Alert!
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border gap-0.5">
                            <button
                              id={`stock-dec-${prod.id}`}
                              onClick={() => onUpdateStock(prod.id, -1)}
                              className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-500 hover:text-black rounded-lg text-[10px] font-extrabold shadow-sm transition-colors"
                              title="Deduct Stock"
                            >
                              -1
                            </button>
                            <button
                              id={`stock-inc-${prod.id}`}
                              onClick={() => onUpdateStock(prod.id, 5)}
                              className="px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-[10px] font-extrabold shadow-sm transition-colors"
                              title="Add Restock count (+5)"
                            >
                              +5
                            </button>
                          </div>
                        </td>

                         <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              id={`btn-edit-prod-${prod.id}`}
                              onClick={() => startEditing(prod)}
                              className="p-1 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                              title="Edit / Review Product SKU"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              id={`btn-del-prod-${prod.id}`}
                              onClick={() => setProductToDelete(prod)}
                              className="p-1 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                              title="Remove Product"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-100 overflow-hidden animate-fadeIn">
            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Edit className="h-4.5 w-4.5 text-orange-500" />
                  Edit Product SKU & Ledger Parameters
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="text-slate-400 hover:text-slate-600 font-extrabold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Product Name *</label>
                  <input
                    id="edit-form-p-name"
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">HSN Code (GST Compliance) *</label>
                  <input
                    id="edit-form-p-hsn"
                    type="text"
                    required
                    maxLength={8}
                    value={editHsnCode}
                    onChange={(e) => setEditHsnCode(e.target.value.replace(/\D/g, ''))}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">GST Tax Rate *</label>
                  <select
                    id="edit-form-p-gst"
                    value={editGstRate}
                    onChange={(e) => setEditGstRate(Number(e.target.value))}
                    className="block w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs focus:outline-none focus:border-orange-500 font-bold"
                  >
                    <option value={5}>5% GST (Essential electrical parts)</option>
                    <option value={12}>12% GST (Appliances/Machinery)</option>
                    <option value={18}>18% Standard GST (Lighting, wire, components)</option>
                    <option value={28}>28% Luxury GST (Motors, heavy cables)</option>
                    <option value={0}>0% Exempted</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Standard Sales Price (₹) *</label>
                  <input
                    id="edit-form-p-sales"
                    type="number"
                    required
                    value={editSalesRate}
                    onChange={(e) => setEditSalesRate(Number(e.target.value))}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-orange-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Procurement Purchase Price (₹)</label>
                  <input
                    id="edit-form-p-purchase"
                    type="number"
                    value={editPurchaseRate}
                    onChange={(e) => setEditPurchaseRate(Number(e.target.value))}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Inventory Stock Unit</label>
                  <input
                    id="edit-form-p-unit"
                    type="text"
                    required
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value.toUpperCase())}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500 uppercase font-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Current Stock Level</label>
                  <input
                    id="edit-form-p-stock"
                    type="number"
                    required
                    value={editStockQuantity}
                    onChange={(e) => setEditStockQuantity(Number(e.target.value))}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-orange-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Low-Stock Trigger Buffer</label>
                  <input
                    id="edit-form-p-buffer"
                    type="number"
                    required
                    value={editLowStockAlert}
                    onChange={(e) => setEditLowStockAlert(Number(e.target.value))}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category / Section</label>
                  <input
                    id="edit-form-p-cat"
                    type="text"
                    required
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Product Sub-Group</label>
                  <input
                    id="edit-form-p-group"
                    type="text"
                    required
                    value={editGroup}
                    onChange={(e) => setEditGroup(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500 font-semibold"
                  />
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-update-product-sku-save"
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 font-extrabold text-white text-xs rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Programmatic Client-Side Confirmation Modal to handle standard Sandboxed iframe limits */}
      {productToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden select-none">
            <div className="bg-red-50 p-5 flex items-start gap-4">
              <div className="bg-red-100 p-2.5 rounded-full text-red-600 shrink-0">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-950 uppercase tracking-tight">
                  Delete Product SKU Catalog Item
                </h3>
                <p className="text-[11px] text-slate-800 leading-normal mt-1.5">
                  Are you absolutely sure you want to permanently delete <strong className="text-red-750 font-black">"{productToDelete.name}"</strong> from your catalog?
                </p>
                <p className="text-[10px] text-slate-500 leading-normal mt-2">
                  ⚠️ This will purge this SKU item and any current stock parameter records associated with it. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="bg-slate-50 px-5 py-3.5 flex justify-end gap-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-950 border border-slate-200 font-extrabold py-2 px-4 rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteProduct(productToDelete.id);
                  setProductToDelete(null);
                }}
                className="bg-red-600 hover:bg-red-750 text-white font-extrabold py-2 px-4 rounded-xl text-xs shadow-md transition cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
