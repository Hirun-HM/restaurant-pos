import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaDownload } from 'react-icons/fa';
import { MdInventory, MdWarning, MdCheckCircle } from 'react-icons/md';
import { InputField } from '../../../components/InputField';
import Select from '../../../components/Select';
import AnimatedNumber from '../../../components/AnimatedNumber';
import LoadingSpinner from '../../../components/LoadingSpinner';
import AdminService from '../../../services/adminService';
import { formatQuantity } from '../../../utils/numberFormat';

const STOCK_CATEGORIES = ['Vegetables', 'Meat', 'Seafood', 'Dairy', 'Spices', 'Beverage', 'Other'];

const generateDummyStocks = () => {
    return [
        {
            id: '1',
            name: 'Chicken Breast',
            category: 'Meat',
            currentQuantity: 15,
            minQuantity: 10,
            maxQuantity: 50,
            unit: 'kg',
            unitPrice: 850.00,
            supplier: 'Fresh Meat Co.',
            createdAt: '2024-01-15T08:30:00Z',
            lastUpdated: '2024-01-20T14:20:00Z'
        },
        {
            id: '2',
            name: 'Tomatoes',
            category: 'Vegetables',
            currentQuantity: 5,
            minQuantity: 15,
            maxQuantity: 40,
            unit: 'kg',
            unitPrice: 180.00,
            supplier: 'Green Valley Farm',
            createdAt: '2024-01-10T09:15:00Z',
            lastUpdated: '2024-01-22T11:45:00Z'
        },
        {
            id: '3',
            name: 'Salmon Fillet',
            category: 'Seafood',
            currentQuantity: 8,
            minQuantity: 5,
            maxQuantity: 25,
            unit: 'kg',
            unitPrice: 1250.00,
            supplier: 'Ocean Fresh Ltd.',
            createdAt: '2024-01-12T10:20:00Z',
            lastUpdated: '2024-01-21T16:30:00Z'
        },
        {
            id: '4',
            name: 'Fresh Milk',
            category: 'Dairy',
            currentQuantity: 25,
            minQuantity: 10,
            maxQuantity: 50,
            unit: 'l',
            unitPrice: 120.00,
            supplier: 'Highland Dairy',
            createdAt: '2024-01-08T07:45:00Z',
            lastUpdated: '2024-01-23T09:15:00Z'
        },
        {
            id: '5',
            name: 'Black Pepper',
            category: 'Spices',
            currentQuantity: 2,
            minQuantity: 3,
            maxQuantity: 10,
            unit: 'kg',
            unitPrice: 1800.00,
            supplier: 'Spice Masters',
            createdAt: '2024-01-05T12:00:00Z',
            lastUpdated: '2024-01-19T15:20:00Z'
        },
        {
            id: '6',
            name: 'Orange Juice',
            category: 'Beverage',
            currentQuantity: 30,
            minQuantity: 20,
            maxQuantity: 60,
            unit: 'bottles',
            unitPrice: 250.00,
            supplier: 'Fruit Fresh Co.',
            createdAt: '2024-01-14T11:30:00Z',
            lastUpdated: '2024-01-24T13:45:00Z'
        },
        {
            id: '7',
            name: 'Onions',
            category: 'Vegetables',
            currentQuantity: 20,
            minQuantity: 15,
            maxQuantity: 45,
            unit: 'kg',
            unitPrice: 150.00,
            supplier: 'Green Valley Farm',
            createdAt: '2024-01-09T08:15:00Z',
            lastUpdated: '2024-01-22T10:30:00Z'
        },
        {
            id: '8',
            name: 'Cheese',
            category: 'Dairy',
            currentQuantity: 12,
            minQuantity: 8,
            maxQuantity: 30,
            unit: 'kg',
            unitPrice: 950.00,
            supplier: 'Highland Dairy',
            createdAt: '2024-01-11T14:20:00Z',
            lastUpdated: '2024-01-23T16:10:00Z'
        }
    ];
};

export default function AdminStocks() {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Load stocks from API
    useEffect(() => {
        const fetchStocks = async () => {
            try {
                setLoading(true);
                setError(null);
                const stockData = await AdminService.getStockData();
                setStocks(stockData || []);
            } catch (error) {
                console.error('Error fetching stocks:', error);
                setError('Failed to load stock data');
                // Fallback to dummy data on error
                setStocks(generateDummyStocks());
            } finally {
                setLoading(false);
            }
        };

        fetchStocks();
    }, []);

    // Filter stocks based on search and category
    const filteredStocks = useMemo(() => {
        return stocks.filter(stock => {
            const matchesSearch = stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (stock.supplier || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || stock.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [stocks, searchTerm, selectedCategory]);

    // Get stock status
    const getStockStatus = useCallback((stock) => {
        const currentQty = stock.quantity || stock.currentQuantity || 0;
        const minQty = stock.minimumQuantity || stock.minQuantity || 0;
        const maxQty = stock.maximumQuantity || stock.maxQuantity || currentQty * 2;
        
        if (currentQty <= minQty) {
            return { status: 'low', color: 'text-red-600', icon: MdWarning };
        } else if (currentQty >= maxQty) {
            return { status: 'high', color: 'text-orange-600', icon: MdWarning };
        } else {
            return { status: 'normal', color: 'text-green-600', icon: MdCheckCircle };
        }
    }, []);

    // Stats
    const stats = useMemo(() => {
        const lowStockCount = stocks.filter(stock => 
            (stock.quantity || stock.currentQuantity) <= (stock.minimumQuantity || stock.minQuantity)
        ).length;
        const totalValue = stocks.reduce((sum, stock) => {
            const quantity = stock.quantity || stock.currentQuantity || 0;
            const price = stock.price || stock.sellingPrice || stock.unitPrice || 0;
            return sum + (quantity * price);
        }, 0);
        
        return {
            total: stocks.length,
            lowStock: lowStockCount,
            totalValue: totalValue
        };
    }, [stocks]);

    // Stats cards configuration
    const statsCards = useMemo(() => [
        {
            id: 'total',
            title: 'Total Items',
            value: stats.total,
            icon: MdInventory,
            iconColor: 'text-primaryColor',
            valueColor: 'text-other1',
            isNumber: true
        },
        {
            id: 'lowStock',
            title: 'Low Stock',
            value: stats.lowStock,
            icon: MdWarning,
            iconColor: 'text-red',
            valueColor: 'text-red',
            isNumber: true
        },
        {
            id: 'totalValue',
            title: 'Total Value',
            value: stats.totalValue,
            icon: FaDownload,
            iconColor: 'text-green',
            valueColor: 'text-green',
            isNumber: true,
            prefix: 'LKR ',
            formatDecimals: true
        }
    ], [stats]);

    // Table headers configuration
    const tableHeaders = useMemo(() => [
        { id: 'item', label: 'Item' },
        { id: 'category', label: 'Category' },
        { id: 'quantity', label: 'Quantity' },
        { id: 'status', label: 'Status' },
        { id: 'unitPrice', label: 'Unit Price' },
        { id: 'supplier', label: 'Supplier' }
    ], []);

    // Category options for select
    const categoryOptions = useMemo(() => [
        { value: 'All', label: 'All Categories' },
        ...STOCK_CATEGORIES.map(category => ({
            value: category,
            label: category
        }))
    ], []);

    // Table columns configuration
    const tableColumns = useMemo(() => [
        {
            id: 'item',
            render: (stock) => (
                <div className="font-medium text-other1">{stock.name}</div>
            )
        },
        {
            id: 'category',
            render: (stock) => (
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                    {stock.category}
                </span>
            )
        },
        {
            id: 'quantity',
            render: (stock) => {
                const currentQty = stock.quantity || stock.currentQuantity || 0;
                const minQty = stock.minimumQuantity || stock.minQuantity || 0;
                const maxQty = stock.maximumQuantity || stock.maxQuantity || currentQty * 2;
                
                return (
                    <div>
                        <div className="text-sm text-other1">
                            {formatQuantity(currentQty)} {stock.unit}
                        </div>
                        <div className="text-xs text-gray-500">
                            Min: {formatQuantity(minQty)} | Max: {formatQuantity(maxQty)}
                        </div>
                    </div>
                );
            }
        },
        {
            id: 'status',
            render: (stock) => {
                const status = getStockStatus(stock);
                const StatusIcon = status.icon;
                return (
                    <div className={`flex items-center gap-1 ${status.color}`}>
                        <StatusIcon className="h-4 w-4" />
                        <span className="text-sm capitalize">{status.status}</span>
                    </div>
                );
            }
        },
        {
            id: 'unitPrice',
            render: (stock) => {
                const price = stock.price || stock.sellingPrice || stock.unitPrice || 0;
                return (
                    <span className="text-sm text-other1">
                        LKR {price.toFixed(2)}
                    </span>
                );
            }
        },
        {
            id: 'supplier',
            render: (stock) => (
                <span className="text-sm text-other1">{stock.supplier || 'N/A'}</span>
            )
        }
    ], [getStockStatus]);

    // Show loading spinner
    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    // Show error state
    if (error && stocks.length === 0) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-center">
                    <MdWarning className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Stock Data</h2>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col p-3 sm:p-6">
            {/* Fixed Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-3xl font-bold text-other1">Stock Management</h1>
            </div>

            {/* Fixed Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-6">
                {statsCards.map((card, index) => {
                    const IconComponent = card.icon;
                    return (
                        <div key={card.id} className="bg-white rounded-lg shadow-md p-3 sm:p-6 border border-border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xs sm:text-sm font-medium text-darkestGray uppercase">{card.title}</h3>
                                    <p className={`text-lg sm:text-2xl font-bold mt-1 sm:mt-2 ${card.valueColor}`}>
                                        {card.isNumber ? (
                                            <AnimatedNumber 
                                                value={card.value}
                                                duration={2000}
                                                startDelay={index * 300}
                                                prefix={card.prefix || ''}
                                                formatValue={card.formatDecimals ? (val) => val.toFixed(2) : null}
                                            />
                                        ) : (
                                            card.value
                                        )}
                                    </p>
                                </div>
                                <IconComponent className={`h-6 w-6 sm:h-8 sm:w-8 ${card.iconColor}`} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Fixed Filters */}
            <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 border border-border mb-4 sm:mb-6">
                <div className="flex md:justify-between flex-col md:flex-row gap-3 sm:gap-4">
                    <div className="w-full md:w-1/4">
                        <InputField
                            type="text"
                            placeholder="Search stocks..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Select
                            value={selectedCategory}
                            onChange={(value) => setSelectedCategory(value)}
                            options={categoryOptions}
                            className="min-w-[140px] sm:min-w-[180px]"
                        />
                    </div>
                </div>
            </div>

            {/* Scrollable Stocks Table */}
            <div className="flex-1 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="h-full overflow-y-auto overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                {tableHeaders.map((header) => (
                                    <th 
                                        key={header.id}
                                        className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        {header.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredStocks.map((stock) => (
                                <tr key={stock.id} className="hover:bg-gray-50">
                                    {tableColumns.map((column) => (
                                        <td key={column.id} className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm font-medium">
                                            {column.render(stock)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
