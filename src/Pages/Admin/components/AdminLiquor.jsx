import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaWineBottle } from 'react-icons/fa';
import { MdLocalBar, MdWarning, MdCheckCircle, MdOutlineWaterDrop, MdSmokingRooms } from 'react-icons/md';
import { InputField } from '../../../components/InputField';
import AnimatedNumber from '../../../components/AnimatedNumber';
import LoadingSpinner from '../../../components/LoadingSpinner';
import AdminService from '../../../services/adminService';
import { formatQuantity } from '../../../utils/numberFormat';

// Admin Liquor Item Card Component (without edit buttons)
const AdminLiquorItemCard = React.memo(({ item }) => {
    // Memoize low stock calculation
    const isLowStock = useMemo(() => 
        (item.bottlesInStock || item.quantity || 0) <= 5,
        [item.bottlesInStock, item.quantity]
    );

    // Memoize type color calculation
    const typeColor = useMemo(() => {
        const type = item.type || item.category || '';
        switch (type.toLowerCase()) {
            case 'beer': return 'bg-yellow-100 text-yellow-800';
            case 'hard_liquor': return 'bg-amber-100 text-amber-800';
            case 'whiskey': return 'bg-amber-100 text-amber-800';
            case 'vodka': return 'bg-blue-100 text-blue-800';
            case 'rum': return 'bg-orange-100 text-orange-800';
            case 'gin': return 'bg-green-100 text-green-800';
            case 'wine': return 'bg-purple-100 text-purple-800';
            case 'cigarettes': case 'cigarette': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }, [item.type, item.category]);

    const itemType = item.type || item.category || 'Other';
    const bottleVolume = item.bottleVolume || item.volume || 750;
    const currentStock = item.bottlesInStock || item.quantity || 0;
    const pricePerUnit = item.pricePerBottle || item.sellingPrice || item.unitPrice || 0;

    return (
        <div className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow h-[28rem] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{item.name}</h3>
                        <p className="text-sm text-gray-600 line-clamp-1">{item.brand || 'No Brand'}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${typeColor}`}>
                                {itemType.toUpperCase()}
                            </span>
                            {isLowStock && (
                                <span className="px-2 py-1 text-xs rounded-full font-medium bg-red-100 text-red-800">
                                    LOW STOCK
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 overflow-y-auto">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <div className="text-sm text-gray-600">Price per {itemType === 'cigarettes' ? 'pack' : 'bottle'}</div>
                        <div className="text-lg font-semibold text-green-600">
                            LKR {pricePerUnit.toFixed(2)}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-600">In Stock</div>
                        <div className={`text-lg font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                            {itemType === 'cigarettes' ? (
                                <div>
                                    <div>{currentStock} packs</div>
                                    <div className="text-sm text-gray-500">
                                        ({currentStock * 20} individual)
                                    </div>
                                </div>
                            ) : (
                                `${currentStock} bottles`
                            )}
                        </div>
                    </div>
                </div>

                {/* Type Specific Information */}
                {itemType !== 'cigarettes' && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <div className="text-sm text-gray-600">Volume</div>
                            <div className="text-lg font-semibold text-gray-900">
                                {formatQuantity(bottleVolume)}ml
                            </div>
                        </div>
                        {(item.alcoholPercentage || item.alcoholContent) && (
                            <div>
                                <div className="text-sm text-gray-600">Alcohol %</div>
                                <div className="text-lg font-semibold text-blue-600">
                                    {formatQuantity(item.alcoholPercentage || item.alcoholContent)}%
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Category Specific Information */}
                {itemType === 'cigarettes' && (
                    <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <div className="text-sm text-gray-600">Cigarettes per Pack</div>
                                <div className="text-lg font-semibold text-orange-600">
                                    20 pieces
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-600">Individual Price</div>
                                <div className="text-lg font-semibold text-green-600">
                                    LKR {(pricePerUnit / 20).toFixed(2)}
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white p-2 rounded border">
                                <div className="text-sm text-gray-600">Packs Sold</div>
                                <div className="text-md font-semibold text-purple-600">
                                    {item.totalSoldItems || 0} packs
                                </div>
                            </div>
                            <div className="bg-white p-2 rounded border">
                                <div className="text-sm text-gray-600">Individual Sales</div>
                                <div className="text-md font-semibold text-blue-600">
                                    {item.individualCigaretteSales || 0} pieces
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sales and Analytics Information */}
                {itemType !== 'beer' && itemType !== 'cigarettes' && (
                    <div className="bg-gray-50 rounded-lg p-3 mt-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white p-2 rounded border">
                                <div className="text-sm text-gray-600">Total Remaining</div>
                                <div className="text-md font-semibold text-green-600">
                                    {formatQuantity(item.totalVolumeRemaining || (currentStock * bottleVolume))}ml
                                </div>
                            </div>
                            <div className="bg-white p-2 rounded border">
                                <div className="text-sm text-gray-600">Current Bottle</div>
                                <div className="text-md font-semibold text-yellow-600">
                                    {formatQuantity(item.currentBottleVolume || bottleVolume)}ml
                                </div>
                            </div>
                            <div className="bg-white p-2 rounded border">
                                <div className="text-sm text-gray-600">Total Sold</div>
                                <div className="text-md font-semibold text-purple-600">
                                    {item.totalSoldItems || 0}
                                </div>
                            </div>
                            <div className="bg-white p-2 rounded border">
                                <div className="text-sm text-gray-600">Total Wasted</div>
                                <div className="text-md font-semibold text-red-600">
                                    {formatQuantity(item.wastedVolume || 0)}ml
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer - Admin view (no edit buttons) */}
            <div className="p-4 border-t mt-auto bg-gray-50">
                <div className="flex justify-center items-center text-sm text-gray-500">
                    <MdLocalBar className="w-4 h-4 mr-1" />
                    Admin View - Read Only
                </div>
            </div>
        </div>
    );
});


export default function AdminLiquor() {
    const [liquors, setLiquors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'liquor', 'beer', 'cigarettes'

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

    // Filter liquors based on search and active tab
    const filteredLiquors = useMemo(() => {
        return liquors.filter(liquor => {
            // Search filter
            const matchesSearch = liquor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (liquor.brand || '').toLowerCase().includes(searchTerm.toLowerCase());
            
            if (!matchesSearch) return false;

            // Tab filter
            const itemType = (liquor.type || liquor.category || '').toLowerCase();
            
            switch (activeTab) {
                case 'liquor':
                    return itemType === 'hard_liquor' || itemType === 'wine' || (itemType !== 'beer' && itemType !== 'cigarettes' && itemType !== 'cigarette');
                case 'beer':
                    return itemType === 'beer';
                case 'cigarettes':
                    return itemType === 'cigarettes' || itemType === 'cigarette';
                case 'all':
                default:
                    return true;
            }
        });
    }, [liquors, searchTerm, activeTab]);

    // Calculate overall stats based on active tab
    const overallStats = useMemo(() => {
        const filteredData = filteredLiquors;
        
        const totalItems = filteredData.length;
        const lowStockItems = filteredData.filter(liquor => {
            const stock = liquor.bottlesInStock || liquor.quantity || 0;
            return stock <= 5;
        }).length;
        
        const totalValue = filteredData.reduce((sum, liquor) => {
            const remainingBottles = liquor.bottlesInStock || liquor.remainingBottles || liquor.currentQuantity || 0;
            const price = liquor.pricePerBottle || liquor.sellingPrice || liquor.unitPrice || 0;
            return sum + (remainingBottles * price);
        }, 0);

        // Calculate portions differently based on type
        const totalPortions = filteredData.reduce((sum, liquor) => {
            const itemType = (liquor.type || liquor.category || '').toLowerCase();
            const stock = liquor.bottlesInStock || liquor.quantity || 0;
            
            if (itemType === 'cigarettes' || itemType === 'cigarette') {
                return sum + (stock * 20); // 20 cigarettes per pack
            } else if (itemType === 'beer') {
                return sum + stock; // 1 portion per beer
            } else {
                // Hard liquor - calculate based on volume and portion size
                const bottleVolume = liquor.bottleVolume || liquor.volume || 750;
                const portionSize = liquor.portionSize || 30;
                const portionsPerBottle = Math.floor(bottleVolume / portionSize);
                return sum + (stock * portionsPerBottle);
            }
        }, 0);

        return {
            totalItems,
            lowStockItems,
            totalValue,
            totalPortions
        };
    }, [filteredLiquors]);

    // Stats cards configuration based on active tab
    const statsCards = useMemo(() => {
        const baseCards = [
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
            }
        ];

        // Add different fourth card based on active tab
        if (activeTab === 'cigarettes') {
            baseCards.push({
                id: 'totalCigarettes',
                title: 'Total Cigarettes',
                value: overallStats.totalPortions,
                icon: MdSmokingRooms,
                iconColor: 'text-red-600',
                valueColor: 'text-red-600',
                isNumber: true
            });
        } else {
            baseCards.push({
                id: 'totalPortions',
                title: activeTab === 'beer' ? 'Total Bottles' : 'Total Portions',
                value: overallStats.totalPortions,
                icon: activeTab === 'beer' ? FaWineBottle : MdOutlineWaterDrop,
                iconColor: 'text-primaryColor',
                valueColor: 'text-primaryColor',
                isNumber: true
            });
        }

        return baseCards;
    }, [overallStats, activeTab]);

    // Tab configuration
    const tabs = [
        { key: 'all', label: 'All', icon: MdLocalBar },
        { key: 'liquor', label: 'Liquor', icon: FaWineBottle },
        { key: 'beer', label: 'Beer', icon: MdLocalBar },
        { key: 'cigarettes', label: 'Cigarettes', icon: MdLocalBar }
    ];

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
                <div>
                    <h1 className="text-xl sm:text-3xl font-bold text-other1">Inventory Management</h1>
                    <p className="text-sm text-gray-600 mt-1">Monitor and track all beverage and tobacco inventory</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-4 sm:mb-6">
                {tabs.map((tab) => {
                    const IconComponent = tab.icon;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === tab.key
                                    ? 'border-primaryColor text-primaryColor'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <IconComponent className="w-4 h-4 mr-2" />
                            {tab.label}
                        </button>
                    );
                })}
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

            {/* Scrollable Items Grid */}
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 pb-4 sm:pb-6">
                    {filteredLiquors.map((item) => (
                        <AdminLiquorItemCard
                            key={item.id || item._id}
                            item={item}
                        />
                    ))}
                </div>

                {filteredLiquors.length === 0 && (
                    <div className="text-center py-8 sm:py-12">
                        <MdLocalBar className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                        <p className="text-gray-500 text-sm sm:text-base">
                            No {activeTab === 'all' ? 'items' : activeTab} found
                        </p>
                        <p className="text-gray-400 text-xs sm:text-sm mt-1">
                            {searchTerm 
                                ? 'Try adjusting your search term'
                                : `${activeTab === 'all' ? 'Items' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} will appear here when available`}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
