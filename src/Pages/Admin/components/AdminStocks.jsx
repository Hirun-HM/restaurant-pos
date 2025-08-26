import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaDownload } from 'react-icons/fa';
import { MdInventory, MdWarning, MdCheckCircle } from 'react-icons/md';
import Modal from '../../../components/Modal';
import LoadingSpinner from '../../../components/LoadingSpinner';

const STOCK_CATEGORIES = ['Vegetables', 'Meat', 'Seafood', 'Dairy', 'Spices', 'Beverage', 'Other'];
const STOCK_UNITS = ['kg', 'g', 'l', 'ml', 'pcs', 'boxes', 'cans', 'bottles'];

export default function AdminStocks() {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [editingStock, setEditingStock] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        currentQuantity: '',
        minQuantity: '',
        maxQuantity: '',
        unit: '',
        unitPrice: '',
        supplier: '',
        notes: ''
    });

    // Load stocks from localStorage
    useEffect(() => {
        const savedStocks = JSON.parse(localStorage.getItem('restaurant-stocks') || '[]');
        setStocks(savedStocks);
    }, []);

    // Save stocks to localStorage
    const saveStocks = useCallback((newStocks) => {
        localStorage.setItem('restaurant-stocks', JSON.stringify(newStocks));
        setStocks(newStocks);
    }, []);

    // Filter stocks based on search and category
    const filteredStocks = useMemo(() => {
        return stocks.filter(stock => {
            const matchesSearch = stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                stock.supplier.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || stock.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [stocks, searchTerm, selectedCategory]);

    // Get stock status
    const getStockStatus = useCallback((stock) => {
        if (stock.currentQuantity <= stock.minQuantity) {
            return { status: 'low', color: 'text-red-600', icon: MdWarning };
        } else if (stock.currentQuantity >= stock.maxQuantity) {
            return { status: 'high', color: 'text-orange-600', icon: MdWarning };
        } else {
            return { status: 'normal', color: 'text-green-600', icon: MdCheckCircle };
        }
    }, []);

    // Handle form submission
    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        setLoading(true);

        const stockData = {
            ...formData,
            currentQuantity: parseFloat(formData.currentQuantity),
            minQuantity: parseFloat(formData.minQuantity),
            maxQuantity: parseFloat(formData.maxQuantity),
            unitPrice: parseFloat(formData.unitPrice),
            lastUpdated: new Date().toISOString()
        };

        let newStocks;
        if (editingStock) {
            newStocks = stocks.map(stock => 
                stock.id === editingStock.id 
                    ? { ...stockData, id: editingStock.id }
                    : stock
            );
        } else {
            stockData.id = Date.now().toString();
            stockData.createdAt = new Date().toISOString();
            newStocks = [...stocks, stockData];
        }

        saveStocks(newStocks);
        setShowModal(false);
        setEditingStock(null);
        setFormData({
            name: '',
            category: '',
            currentQuantity: '',
            minQuantity: '',
            maxQuantity: '',
            unit: '',
            unitPrice: '',
            supplier: '',
            notes: ''
        });
        setLoading(false);
    }, [formData, editingStock, stocks, saveStocks]);

    // Handle edit
    const handleEdit = useCallback((stock) => {
        setEditingStock(stock);
        setFormData({
            name: stock.name,
            category: stock.category,
            currentQuantity: stock.currentQuantity.toString(),
            minQuantity: stock.minQuantity.toString(),
            maxQuantity: stock.maxQuantity.toString(),
            unit: stock.unit,
            unitPrice: stock.unitPrice.toString(),
            supplier: stock.supplier,
            notes: stock.notes || ''
        });
        setShowModal(true);
    }, []);

    // Handle delete
    const handleDelete = useCallback((stockId) => {
        if (window.confirm('Are you sure you want to delete this stock item?')) {
            const newStocks = stocks.filter(stock => stock.id !== stockId);
            saveStocks(newStocks);
        }
    }, [stocks, saveStocks]);

    // Stats
    const stats = useMemo(() => {
        const lowStockCount = stocks.filter(stock => stock.currentQuantity <= stock.minQuantity).length;
        const totalValue = stocks.reduce((sum, stock) => sum + (stock.currentQuantity * stock.unitPrice), 0);
        
        return {
            total: stocks.length,
            lowStock: lowStockCount,
            totalValue: totalValue
        };
    }, [stocks]);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-other1">Stock Management</h1>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6 border border-border">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-darkestGray uppercase">Total Items</h3>
                            <p className="text-2xl font-bold text-other1 mt-2">{stats.total}</p>
                        </div>
                        <MdInventory className="h-8 w-8 text-primaryColor" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 border border-border">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-darkestGray uppercase">Low Stock</h3>
                            <p className="text-2xl font-bold text-red mt-2">{stats.lowStock}</p>
                        </div>
                        <MdWarning className="h-8 w-8 text-red" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 border border-border">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-darkestGray uppercase">Total Value</h3>
                            <p className="text-2xl font-bold text-green mt-2">LKR {stats.totalValue.toFixed(2)}</p>
                        </div>
                        <FaDownload className="h-8 w-8 text-green" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-border">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-darkGray" />
                            <input
                                type="text"
                                placeholder="Search stocks..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-primaryColor focus:border-primaryColor"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <FaFilter className="text-darkGray" />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-4 py-2 border border-border rounded-lg focus:ring-primaryColor focus:border-primaryColor"
                        >
                            <option value="All">All Categories</option>
                            {STOCK_CATEGORIES.map(category => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Stocks Table */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredStocks.map((stock) => {
                                const status = getStockStatus(stock);
                                const StatusIcon = status.icon;
                                
                                return (
                                    <tr key={stock.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">{stock.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                                                {stock.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {stock.currentQuantity} {stock.unit}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Min: {stock.minQuantity} | Max: {stock.maxQuantity}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={`flex items-center gap-1 ${status.color}`}>
                                                <StatusIcon className="h-4 w-4" />
                                                <span className="text-sm capitalize">{status.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            LKR {stock.unitPrice.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {stock.supplier}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(stock)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    <FaEdit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(stock.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <FaTrash className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal for Add/Edit Stock */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="large">
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-other1 mb-4">
                        {editingStock ? 'Edit Stock Item' : 'Add New Stock Item'}
                    </h2>
                    
                    {loading && <LoadingSpinner />}
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-other1 mb-1">
                                    Item Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full px-3 py-2 border border-border rounded-md focus:ring-primaryColor focus:border-primaryColor"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-other1 mb-1">
                                    Category *
                                </label>
                                <select
                                    required
                                    value={formData.category}
                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                    className="w-full px-3 py-2 border border-border rounded-md focus:ring-primaryColor focus:border-primaryColor"
                                >
                                    <option value="">Select Category</option>
                                    {STOCK_CATEGORIES.map(category => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Current Quantity *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.currentQuantity}
                                    onChange={(e) => setFormData({...formData, currentQuantity: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Unit *
                                </label>
                                <select
                                    required
                                    value={formData.unit}
                                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select Unit</option>
                                    {STOCK_UNITS.map(unit => (
                                        <option key={unit} value={unit}>{unit}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Minimum Quantity *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.minQuantity}
                                    onChange={(e) => setFormData({...formData, minQuantity: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Maximum Quantity *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.maxQuantity}
                                    onChange={(e) => setFormData({...formData, maxQuantity: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Unit Price (LKR) *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.unitPrice}
                                    onChange={(e) => setFormData({...formData, unitPrice: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Supplier *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.supplier}
                                    onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Additional notes about this item..."
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-other1 bg-bgsecond rounded-md hover:bg-border transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-primaryColor text-white rounded-md hover:bg-other3 transition-colors disabled:opacity-50"
                            >
                                {editingStock ? 'Update' : 'Add'} Stock Item
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
}
