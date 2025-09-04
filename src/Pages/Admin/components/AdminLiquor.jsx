import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaWineBottle } from 'react-icons/fa';
import { MdLocalBar, MdWarning, MdCheckCircle, MdOutlineWaterDrop } from 'react-icons/md';
import Select from '../../../components/Select';
import { InputField } from '../../../components/InputField';
import AnimatedNumber from '../../../components/AnimatedNumber';
import LoadingSpinner from '../../../components/LoadingSpinner';
import AdminService from '../../../services/adminService';
import { formatQuantity } from '../../../utils/numberFormat';

const LIQUOR_CATEGORIES = ['beer', 'hard_liquor', 'wine', 'cigarettes', 'Other'];

// Generate dummy liquor data for fallback
const generateDummyLiquors = () => [
    {
        id: 1,
        name: 'Premium Whiskey',
        brand: 'Premium Brand',
        type: 'hard_liquor',
        bottleVolume: 750,
        alcoholPercentage: 40,
        bottlesInStock: 6,
        totalBottles: 10,
        pricePerBottle: 150.00,
        portionSize: 30,
        totalVolumeRemaining: 4650, // 6 full bottles (4500ml) + current bottle (150ml remaining)
        currentBottleVolume: 650, // Current bottle has 650ml remaining (100ml used from 750ml bottle)
        totalSoldItems: 100,
        wastedVolume: 50
    },
    {
        id: 2,
        name: 'Local Beer',
        brand: 'Lion Lager',
        type: 'beer',
        bottleVolume: 625,
        alcoholPercentage: 4.8,
        bottlesInStock: 15,
        totalBottles: 24,
        pricePerBottle: 250.00,
        portionSize: 625,
        totalVolumeRemaining: 9375, // 15 full bottles remaining
        currentBottleVolume: 625, // Current bottle is full
        totalSoldItems: 9,
        wastedVolume: 0
    }
];

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
        // Better fallback for totalBottles - assume some bottles were consumed if we have remaining bottles
        const totalBottles = liquor.totalBottles || liquor.maxQuantity || Math.max(remainingBottles + 2, 10);
        const usedBottles = totalBottles - remainingBottles;
        
        // Calculate volume-based usage for current bottle
        const bottleVolume = liquor.bottleVolume || liquor.volume || 750;
        const currentBottleVolume = liquor.currentBottleVolume || bottleVolume;
        const totalVolumeRemaining = liquor.totalVolumeRemaining || (remainingBottles * bottleVolume);
        
        // Calculate usage percentage based on current bottle volume consumption
        let usagePercentage = 0;
        if (remainingBottles > 0 && currentBottleVolume < bottleVolume) {
            // If we have a partially used bottle, calculate based on volume consumed from current bottle
            const volumeConsumed = bottleVolume - currentBottleVolume;
            usagePercentage = (volumeConsumed / bottleVolume) * 100;
        } else if (usedBottles > 0) {
            // If no current bottle info, fall back to bottle-based calculation
            usagePercentage = (usedBottles / totalBottles) * 100;
        }
        
        // Debug logging
        console.log('Liquor Stats Debug:', {
            name: liquor.name,
            remainingBottles,
            totalBottles,
            usedBottles,
            bottleVolume,
            currentBottleVolume,
            volumeConsumed: bottleVolume - currentBottleVolume,
            usagePercentage
        });
        
        // Calculate portions based on volume
        const defaultPortionSize = liquor.type === 'beer' ? bottleVolume : 30; // Beer is served as full bottle
        const portionSize = liquor.portionSize || defaultPortionSize;
        const portionsPerBottle = liquor.type === 'beer' ? 1 : Math.floor(bottleVolume / portionSize);
        const totalPortions = totalBottles * portionsPerBottle;
        const remainingPortions = Math.floor(totalVolumeRemaining / portionSize);
        
        return {
            totalBottles,
            remainingBottles,
            usedBottles,
            usagePercentage,
            totalPortions,
            remainingPortions,
            portionsPerBottle,
            volumeConsumed: bottleVolume - currentBottleVolume
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
                                            <p className="font-medium truncate">{formatQuantity(liquor.bottleVolume || liquor.volume || 750)}ml</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Alcohol %:</span>
                                            <p className="font-medium">{formatQuantity(liquor.alcoholPercentage || liquor.alcoholContent || 0)}%</p>
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

                                    {/* Sales and Analytics Information - Same as User Side */}
                                    {liquor.type !== 'beer' && liquor.type !== 'cigarettes' && (
                                        <div className="bg-gray-50 rounded-lg p-3 mt-4">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-white p-2 rounded border">
                                                    <div className="text-sm text-gray-600">Total Remaining</div>
                                                    <div className="text-md font-semibold text-green-600">
                                                        {formatQuantity(liquor.totalVolumeRemaining || (stats.remainingBottles * (liquor.bottleVolume || liquor.volume || 750)))}ml
                                                    </div>
                                                </div>
                                                <div className="bg-white p-2 rounded border">
                                                    <div className="text-sm text-gray-600">Current Bottle</div>
                                                    <div className="text-md font-semibold text-yellow-600">
                                                        {formatQuantity(liquor.currentBottleVolume || (liquor.bottleVolume || liquor.volume || 750))}ml
                                                    </div>
                                                </div>
                                                <div className="bg-white p-2 rounded border">
                                                    <div className="text-sm text-gray-600">Total Sold</div>
                                                    <div className="text-md font-semibold text-purple-600">
                                                        {liquor.totalSoldItems || (stats.totalPortions - stats.remainingPortions) || 0}
                                                    </div>
                                                </div>
                                                <div className="bg-white p-2 rounded border">
                                                    <div className="text-sm text-gray-600">Total Wasted</div>
                                                    <div className="text-md font-semibold text-red-600">
                                                        {formatQuantity(liquor.wastedVolume || 0)}ml
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Usage Progress Bar */}
                                    <div>
                                        <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-1">
                                            <span>Current Bottle Usage</span>
                                            <span>{stats.usagePercentage.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-primaryColor h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${Math.min(stats.usagePercentage, 100)}%` }}
                                            ></div>
                                        </div>
                                        {stats.volumeConsumed > 0 && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                {formatQuantity(stats.volumeConsumed)}ml used from current bottle
                                            </div>
                                        )}
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
