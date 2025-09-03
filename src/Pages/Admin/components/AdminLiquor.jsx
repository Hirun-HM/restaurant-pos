import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaWineBottle } from 'react-icons/fa';
import { MdLocalBar, MdWarning, MdCheckCircle, MdOutlineWaterDrop } from 'react-icons/md';
import Select from '../../../components/Select';
import { InputField } from '../../../components/InputField';
import AnimatedNumber from '../../../components/AnimatedNumber';
import LoadingSpinner from '../../../components/LoadingSpinner';
import AdminService from '../../../services/adminService';

const LIQUOR_CATEGORIES = ['beer', 'hard_liquor', 'wine', 'cigarettes', 'Other'];

const generateDummyLiquors = () => {
    return [
        {
            id: '1',
            name: 'Jack Daniels',
            category: 'Whiskey',
            bottleSize: '750ml',
            totalBottles: 20,
            remainingBottles: 12,
            portionsPerBottle: 25,
            portionSize: 30,
            unitPrice: 4500.00,
            supplier: 'Premium Spirits Ltd.',
            alcoholContent: 40.0,
            notes: 'Premium Tennessee whiskey',
            createdAt: '2024-01-10T09:00:00Z',
            lastUpdated: '2024-01-25T14:30:00Z'
        },
        {
            id: '2',
            name: 'Absolut Vodka',
            category: 'Vodka',
            bottleSize: '1000ml',
            totalBottles: 15,
            remainingBottles: 3,
            portionsPerBottle: 33,
            portionSize: 30,
            unitPrice: 3200.00,
            supplier: 'Global Liquor Co.',
            alcoholContent: 40.0,
            notes: 'Swedish premium vodka',
            createdAt: '2024-01-08T11:15:00Z',
            lastUpdated: '2024-01-24T16:45:00Z'
        },
        {
            id: '3',
            name: 'Bombay Sapphire',
            category: 'Gin',
            bottleSize: '750ml',
            totalBottles: 10,
            remainingBottles: 7,
            portionsPerBottle: 25,
            portionSize: 30,
            unitPrice: 3800.00,
            supplier: 'Premium Spirits Ltd.',
            alcoholContent: 47.0,
            notes: 'London dry gin with botanicals',
            createdAt: '2024-01-12T13:20:00Z',
            lastUpdated: '2024-01-23T10:15:00Z'
        },
        {
            id: '4',
            name: 'Bacardi White Rum',
            category: 'Rum',
            bottleSize: '750ml',
            totalBottles: 18,
            remainingBottles: 15,
            portionsPerBottle: 25,
            portionSize: 30,
            unitPrice: 2800.00,
            supplier: 'Island Imports',
            alcoholContent: 37.5,
            notes: 'Light Caribbean rum',
            createdAt: '2024-01-05T08:45:00Z',
            lastUpdated: '2024-01-22T12:30:00Z'
        },
        {
            id: '5',
            name: 'Hennessy VS',
            category: 'Brandy',
            bottleSize: '750ml',
            totalBottles: 8,
            remainingBottles: 2,
            portionsPerBottle: 25,
            portionSize: 30,
            unitPrice: 6500.00,
            supplier: 'Luxury Spirits',
            alcoholContent: 40.0,
            notes: 'French cognac',
            createdAt: '2024-01-15T15:30:00Z',
            lastUpdated: '2024-01-25T09:20:00Z'
        },
        {
            id: '6',
            name: 'Cabernet Sauvignon',
            category: 'Wine',
            bottleSize: '750ml',
            totalBottles: 25,
            remainingBottles: 18,
            portionsPerBottle: 5,
            portionSize: 150,
            unitPrice: 1800.00,
            supplier: 'Wine Estate Co.',
            alcoholContent: 13.5,
            notes: 'Full-bodied red wine',
            createdAt: '2024-01-07T10:00:00Z',
            lastUpdated: '2024-01-24T14:45:00Z'
        },
        {
            id: '7',
            name: 'Corona Extra',
            category: 'Beer',
            bottleSize: '375ml',
            totalBottles: 50,
            remainingBottles: 35,
            portionsPerBottle: 1,
            portionSize: 375,
            unitPrice: 350.00,
            supplier: 'Beer Distribution Co.',
            alcoholContent: 4.5,
            notes: 'Mexican lager beer',
            createdAt: '2024-01-03T12:15:00Z',
            lastUpdated: '2024-01-23T18:20:00Z'
        },
        {
            id: '8',
            name: 'Chardonnay',
            category: 'Wine',
            bottleSize: '750ml',
            totalBottles: 20,
            remainingBottles: 14,
            portionsPerBottle: 5,
            portionSize: 150,
            unitPrice: 2200.00,
            supplier: 'Wine Estate Co.',
            alcoholContent: 12.5,
            notes: 'Crisp white wine',
            createdAt: '2024-01-09T14:30:00Z',
            lastUpdated: '2024-01-25T11:10:00Z'
        }
    ];
};

export default function AdminLiquor() {
    const [liquors, setLiquors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Load liquors from API
    useEffect(() => {
        const fetchLiquors = async () => {
            try {
                setLoading(true);
                setError(null);
                const liquorData = await AdminService.getLiquorData();
                setLiquors(liquorData || []);
            } catch (error) {
                console.error('Error fetching liquors:', error);
                setError('Failed to load liquor data');
                // Fallback to dummy data on error
                setLiquors(generateDummyLiquors());
            } finally {
                setLoading(false);
            }
        };

        fetchLiquors();
    }, []);

    // Filter liquors based on search and category
    const filteredLiquors = useMemo(() => {
        return liquors.filter(liquor => {
            const matchesSearch = liquor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (liquor.brand || '').toLowerCase().includes(searchTerm.toLowerCase());
            const liquorCategory = liquor.type || liquor.category || 'Other';
            const matchesCategory = selectedCategory === 'All' || 
                                  liquorCategory.toLowerCase() === selectedCategory.toLowerCase();
            return matchesSearch && matchesCategory;
        });
    }, [liquors, searchTerm, selectedCategory]);

    // Calculate liquor stats
    const calculateLiquorStats = useCallback((liquor) => {
        // For API data, use bottlesInStock from API response
        const remainingBottles = liquor.bottlesInStock || liquor.remainingBottles || liquor.currentQuantity || 0;
        const totalBottles = liquor.totalBottles || liquor.maxQuantity || remainingBottles;
        const usedBottles = totalBottles - remainingBottles;
        const usagePercentage = totalBottles > 0 ? (usedBottles / totalBottles) * 100 : 0;
        
        // Calculate portions based on volume
        const bottleVolume = liquor.bottleVolume || liquor.volume || 750;
        const defaultPortionSize = liquor.type === 'beer' ? bottleVolume : 30; // Beer is served as full bottle
        const portionSize = liquor.portionSize || defaultPortionSize;
        const portionsPerBottle = liquor.type === 'beer' ? 1 : Math.floor(bottleVolume / portionSize);
        const totalPortions = totalBottles * portionsPerBottle;
        const remainingPortions = remainingBottles * portionsPerBottle;
        
        return {
            totalBottles,
            remainingBottles,
            usedBottles,
            usagePercentage,
            totalPortions,
            remainingPortions,
            portionsPerBottle
        };
    }, []);

    // Get liquor status
    const getLiquorStatus = useCallback((liquor) => {
        const stats = calculateLiquorStats(liquor);
        if (stats.remainingBottles <= 2) {
            return { status: 'critical', color: 'text-red-600', icon: MdWarning, bgColor: 'bg-red-50' };
        } else if (stats.remainingBottles <= 5) {
            return { status: 'low', color: 'text-orange-600', icon: MdWarning, bgColor: 'bg-orange-50' };
        } else {
            return { status: 'good', color: 'text-green-600', icon: MdCheckCircle, bgColor: 'bg-green-50' };
        }
    }, [calculateLiquorStats]);

    // Calculate overall stats
    const overallStats = useMemo(() => {
        const totalItems = liquors.length;
        const lowStockItems = liquors.filter(liquor => {
            const stats = calculateLiquorStats(liquor);
            return stats.remainingBottles <= 5;
        }).length;
        
        const totalValue = liquors.reduce((sum, liquor) => {
            const remainingBottles = liquor.bottlesInStock || liquor.remainingBottles || liquor.currentQuantity || 0;
            const price = liquor.pricePerBottle || liquor.sellingPrice || liquor.unitPrice || 0;
            return sum + (remainingBottles * price);
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

    // Category options for select
    const categoryOptions = useMemo(() => [
        { value: 'All', label: 'All Categories' },
        { value: 'beer', label: 'Beer' },
        { value: 'hard_liquor', label: 'Hard Liquor' },
        { value: 'wine', label: 'Wine' },
        { value: 'cigarettes', label: 'Cigarettes' },
        { value: 'Other', label: 'Other' }
    ], []);

    // Stats cards configuration
    const statsCards = useMemo(() => [
        {
            id: 'totalItems',
            title: 'Total Items',
            value: overallStats.totalItems,
            icon: MdLocalBar,
            iconColor: 'text-other1',
            valueColor: 'text-other1',
            isNumber: true
        },
        {
            id: 'lowStock',
            title: 'Low Stock',
            value: overallStats.lowStockItems,
            icon: MdWarning,
            iconColor: 'text-other2',
            valueColor: 'text-other2',
            isNumber: true
        },
        {
            id: 'totalValue',
            title: 'Total Value',
            value: overallStats.totalValue,
            icon: FaWineBottle,
            iconColor: 'text-green',
            valueColor: 'text-green',
            isNumber: true,
            prefix: 'LKR ',
            formatDecimals: true
        },
        {
            id: 'totalPortions',
            title: 'Total Portions',
            value: overallStats.totalPortions,
            icon: MdOutlineWaterDrop,
            iconColor: 'text-primaryColor',
            valueColor: 'text-primaryColor',
            isNumber: true
        }
    ], [overallStats]);

    // Show loading spinner
    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    // Show error state
    if (error && liquors.length === 0) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-center">
                    <MdWarning className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Liquor Data</h2>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col p-3 sm:p-6">
            {/* Fixed Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-3xl font-bold text-other1">Liquor Inventory</h1>
            </div>

            {/* Fixed Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-6 mb-4 sm:mb-6">
                {statsCards.map((card, index) => {
                    const IconComponent = card.icon;
                    return (
                        <div key={card.id} className="bg-white rounded-lg shadow-md p-2 sm:p-6 border border-border">
                            <div className="flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-xs sm:text-sm font-medium text-darkestGray uppercase truncate">{card.title}</h3>
                                    <p className={`text-sm sm:text-2xl font-bold mt-1 sm:mt-2 ${card.valueColor} truncate`}>
                                        {card.isNumber ? (
                                            <AnimatedNumber 
                                                value={card.value}
                                                duration={2000}
                                                startDelay={index * 250}
                                                prefix={card.prefix || ''}
                                                formatValue={card.formatDecimals ? (val) => val.toFixed(2) : null}
                                            />
                                        ) : (
                                            typeof card.value === 'string' && card.value.includes('LKR') ? 
                                                <span className="block sm:inline">
                                                    <span className="hidden sm:inline">{card.value}</span>
                                                    <span className="sm:hidden">{card.value.replace('LKR ', '₨')}</span>
                                                </span>
                                                : card.value
                                        )}
                                    </p>
                                </div>
                                <IconComponent className={`h-4 w-4 sm:h-8 sm:w-8 ${card.iconColor} flex-shrink-0 ml-1 sm:ml-0`} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Fixed Filters */}
            <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 border border-gray-200 mb-4 sm:mb-6">
                <div className="flex flex-col md:justify-between md:flex-row gap-3 sm:gap-4">
                    <div className="w-full md:w-1/4">
                        <InputField
                            type="text"
                            placeholder="Search liquor items..."
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

            {/* Scrollable Liquor Grid */}
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 pb-4 sm:pb-6">
                    {filteredLiquors.map((liquor) => {
                        const status = getLiquorStatus(liquor);
                        const stats = calculateLiquorStats(liquor);
                        const StatusIcon = status.icon;
                        
                        return (
                            <div key={liquor.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                                <div className={`p-3 sm:p-4 ${status.bgColor}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <MdLocalBar className="h-5 w-5 sm:h-6 sm:w-6 text-primaryColor flex-shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-semibold text-other1 text-sm sm:text-base truncate">{liquor.name}</h3>
                                                <p className="text-xs sm:text-sm text-gray-600 truncate">
                                                    {liquor.type || liquor.category || 'Other'} - {liquor.brand || 'No Brand'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`flex items-center gap-1 ${status.color} flex-shrink-0`}>
                                            <StatusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                                    <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                                        <div>
                                            <span className="text-gray-500">Volume:</span>
                                            <p className="font-medium truncate">{liquor.bottleVolume || liquor.volume || 750}ml</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Alcohol %:</span>
                                            <p className="font-medium">{liquor.alcoholPercentage || liquor.alcoholContent || 0}%</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Remaining:</span>
                                            <p className="font-medium">{stats.remainingBottles} bottles</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Portions Left:</span>
                                            <p className="font-medium">{stats.remainingPortions}</p>
                                        </div>
                                    </div>

                                    {/* Usage Progress Bar */}
                                    <div>
                                        <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-1">
                                            <span>Usage</span>
                                            <span>{stats.usagePercentage.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-primaryColor h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${Math.min(stats.usagePercentage, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <div>
                                            <span className="text-base sm:text-lg font-bold text-green-600">
                                                <span className="hidden sm:inline">LKR {(liquor.pricePerBottle || liquor.sellingPrice || liquor.unitPrice || 0).toFixed(2)}</span>
                                                <span className="sm:hidden">₨{(liquor.pricePerBottle || liquor.sellingPrice || liquor.unitPrice || 0).toFixed(0)}</span>
                                            </span>
                                            <p className="text-xs text-gray-500">per bottle</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredLiquors.length === 0 && (
                    <div className="text-center py-8 sm:py-12">
                        <MdLocalBar className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                        <p className="text-gray-500 text-sm sm:text-base">No liquor items found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
