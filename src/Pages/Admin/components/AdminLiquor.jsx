import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaWineBottle } from 'react-icons/fa';
import { MdLocalBar, MdWarning, MdCheckCircle, MdOutlineWaterDrop } from 'react-icons/md';
import Modal from '../../../components/Modal';
import LoadingSpinner from '../../../components/LoadingSpinner';

const LIQUOR_CATEGORIES = ['Whiskey', 'Vodka', 'Gin', 'Rum', 'Brandy', 'Wine', 'Beer', 'Other'];
const BOTTLE_SIZES = ['750ml', '1000ml', '1750ml', '375ml', '200ml', '50ml'];

export default function AdminLiquor() {
    const [liquors, setLiquors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [editingLiquor, setEditingLiquor] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        bottleSize: '',
        totalBottles: '',
        remainingBottles: '',
        portionsPerBottle: '',
        portionSize: '',
        unitPrice: '',
        supplier: '',
        alcoholContent: '',
        notes: ''
    });

    // Load liquors from localStorage
    useEffect(() => {
        const savedLiquors = JSON.parse(localStorage.getItem('restaurant-liquor') || '[]');
        setLiquors(savedLiquors);
    }, []);

    // Save liquors to localStorage
    const saveLiquors = useCallback((newLiquors) => {
        localStorage.setItem('restaurant-liquor', JSON.stringify(newLiquors));
        setLiquors(newLiquors);
    }, []);

    // Filter liquors based on search and category
    const filteredLiquors = useMemo(() => {
        return liquors.filter(liquor => {
            const matchesSearch = liquor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                liquor.supplier.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || liquor.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [liquors, searchTerm, selectedCategory]);

    // Calculate liquor stats
    const calculateLiquorStats = useCallback((liquor) => {
        const totalPortions = liquor.totalBottles * liquor.portionsPerBottle;
        const remainingPortions = liquor.remainingBottles * liquor.portionsPerBottle;
        const usedPortions = totalPortions - remainingPortions;
        const usagePercentage = totalPortions > 0 ? (usedPortions / totalPortions) * 100 : 0;
        
        return {
            totalPortions,
            remainingPortions,
            usedPortions,
            usagePercentage
        };
    }, []);

    // Get liquor status
    const getLiquorStatus = useCallback((liquor) => {
        const stats = calculateLiquorStats(liquor);
        if (stats.remainingPortions <= 5) {
            return { status: 'critical', color: 'text-red-600', icon: MdWarning, bgColor: 'bg-red-50' };
        } else if (stats.remainingPortions <= 20) {
            return { status: 'low', color: 'text-orange-600', icon: MdWarning, bgColor: 'bg-orange-50' };
        } else {
            return { status: 'good', color: 'text-green-600', icon: MdCheckCircle, bgColor: 'bg-green-50' };
        }
    }, [calculateLiquorStats]);

    // Handle form submission
    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        setLoading(true);

        const liquorData = {
            ...formData,
            totalBottles: parseInt(formData.totalBottles),
            remainingBottles: parseFloat(formData.remainingBottles),
            portionsPerBottle: parseInt(formData.portionsPerBottle),
            portionSize: parseInt(formData.portionSize),
            unitPrice: parseFloat(formData.unitPrice),
            alcoholContent: parseFloat(formData.alcoholContent),
            lastUpdated: new Date().toISOString()
        };

        let newLiquors;
        if (editingLiquor) {
            newLiquors = liquors.map(liquor => 
                liquor.id === editingLiquor.id 
                    ? { ...liquorData, id: editingLiquor.id }
                    : liquor
            );
        } else {
            liquorData.id = Date.now().toString();
            liquorData.createdAt = new Date().toISOString();
            newLiquors = [...liquors, liquorData];
        }

        saveLiquors(newLiquors);
        setShowModal(false);
        setEditingLiquor(null);
        setFormData({
            name: '',
            category: '',
            bottleSize: '',
            totalBottles: '',
            remainingBottles: '',
            portionsPerBottle: '',
            portionSize: '',
            unitPrice: '',
            supplier: '',
            alcoholContent: '',
            notes: ''
        });
        setLoading(false);
    }, [formData, editingLiquor, liquors, saveLiquors]);

    // Handle edit
    const handleEdit = useCallback((liquor) => {
        setEditingLiquor(liquor);
        setFormData({
            name: liquor.name,
            category: liquor.category,
            bottleSize: liquor.bottleSize,
            totalBottles: liquor.totalBottles.toString(),
            remainingBottles: liquor.remainingBottles.toString(),
            portionsPerBottle: liquor.portionsPerBottle.toString(),
            portionSize: liquor.portionSize.toString(),
            unitPrice: liquor.unitPrice.toString(),
            supplier: liquor.supplier,
            alcoholContent: liquor.alcoholContent.toString(),
            notes: liquor.notes || ''
        });
        setShowModal(true);
    }, []);

    // Handle delete
    const handleDelete = useCallback((liquorId) => {
        if (window.confirm('Are you sure you want to delete this liquor item?')) {
            const newLiquors = liquors.filter(liquor => liquor.id !== liquorId);
            saveLiquors(newLiquors);
        }
    }, [liquors, saveLiquors]);

    // Calculate overall stats
    const overallStats = useMemo(() => {
        const totalItems = liquors.length;
        const lowStockItems = liquors.filter(liquor => {
            const stats = calculateLiquorStats(liquor);
            return stats.remainingPortions <= 20;
        }).length;
        
        const totalValue = liquors.reduce((sum, liquor) => {
            return sum + (liquor.remainingBottles * liquor.unitPrice);
        }, 0);

        const totalPortions = liquors.reduce((sum, liquor) => {
            return sum + calculateLiquorStats(liquor).remainingPortions;
        }, 0);

        return {
            totalItems,
            lowStockItems,
            totalValue,
            totalPortions
        };
    }, [liquors, calculateLiquorStats]);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-other1">Liquor Inventory</h1>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6 border border-border">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-darkestGray uppercase">Total Items</h3>
                            <p className="text-2xl font-bold text-other1 mt-2">{overallStats.totalItems}</p>
                        </div>
                        <MdLocalBar className="h-8 w-8 text-other1" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 border border-border">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-darkestGray uppercase">Low Stock</h3>
                            <p className="text-2xl font-bold text-other2 mt-2">{overallStats.lowStockItems}</p>
                        </div>
                        <MdWarning className="h-8 w-8 text-other2" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 border border-border">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-darkestGray uppercase">Total Value</h3>
                            <p className="text-2xl font-bold text-green mt-2">LKR {overallStats.totalValue.toFixed(2)}</p>
                        </div>
                        <FaWineBottle className="h-8 w-8 text-green" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 border border-border">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-darkestGray uppercase">Total Portions</h3>
                            <p className="text-2xl font-bold text-primaryColor mt-2">{overallStats.totalPortions}</p>
                        </div>
                        <MdOutlineWaterDrop className="h-8 w-8 text-primaryColor" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search liquor items..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <FaFilter className="text-gray-400" />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                        >
                            <option value="All">All Categories</option>
                            {LIQUOR_CATEGORIES.map(category => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Liquor Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLiquors.map((liquor) => {
                    const status = getLiquorStatus(liquor);
                    const stats = calculateLiquorStats(liquor);
                    const StatusIcon = status.icon;
                    
                    return (
                        <div key={liquor.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                            <div className={`p-4 ${status.bgColor}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <MdLocalBar className="h-6 w-6 text-purple-600" />
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{liquor.name}</h3>
                                            <p className="text-sm text-gray-600">{liquor.category}</p>
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-1 ${status.color}`}>
                                        <StatusIcon className="h-5 w-5" />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">Bottle Size:</span>
                                        <p className="font-medium">{liquor.bottleSize}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Alcohol %:</span>
                                        <p className="font-medium">{liquor.alcoholContent}%</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Remaining:</span>
                                        <p className="font-medium">{liquor.remainingBottles} bottles</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Portions Left:</span>
                                        <p className="font-medium">{stats.remainingPortions}</p>
                                    </div>
                                </div>

                                {/* Usage Progress Bar */}
                                <div>
                                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                                        <span>Usage</span>
                                        <span>{stats.usagePercentage.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${Math.min(stats.usagePercentage, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <div>
                                        <span className="text-lg font-bold text-green-600">
                                            LKR {liquor.unitPrice.toFixed(2)}
                                        </span>
                                        <p className="text-xs text-gray-500">per bottle</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEdit(liquor)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <FaEdit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(liquor.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <FaTrash className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredLiquors.length === 0 && (
                <div className="text-center py-12">
                    <MdLocalBar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No liquor items found</p>
                </div>
            )}

            {/* Modal for Add/Edit Liquor */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="large">
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                        {editingLiquor ? 'Edit Liquor Item' : 'Add New Liquor Item'}
                    </h2>
                    
                    {loading && <LoadingSpinner />}
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Liquor Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category *
                                </label>
                                <select
                                    required
                                    value={formData.category}
                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                >
                                    <option value="">Select Category</option>
                                    {LIQUOR_CATEGORIES.map(category => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Bottle Size *
                                </label>
                                <select
                                    required
                                    value={formData.bottleSize}
                                    onChange={(e) => setFormData({...formData, bottleSize: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                >
                                    <option value="">Select Size</option>
                                    {BOTTLE_SIZES.map(size => (
                                        <option key={size} value={size}>{size}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Alcohol Content (%) *
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    value={formData.alcoholContent}
                                    onChange={(e) => setFormData({...formData, alcoholContent: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Total Bottles *
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={formData.totalBottles}
                                    onChange={(e) => setFormData({...formData, totalBottles: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Remaining Bottles *
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    value={formData.remainingBottles}
                                    onChange={(e) => setFormData({...formData, remainingBottles: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Portions per Bottle *
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={formData.portionsPerBottle}
                                    onChange={(e) => setFormData({...formData, portionsPerBottle: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Portion Size (ml) *
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={formData.portionSize}
                                    onChange={(e) => setFormData({...formData, portionSize: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                placeholder="Additional notes about this liquor..."
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
                            >
                                {editingLiquor ? 'Update' : 'Add'} Liquor Item
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
}
