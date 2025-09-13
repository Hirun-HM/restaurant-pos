import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import { PrimaryButton, SecondaryButton } from '../../../components/Button';
import { FaSync } from 'react-icons/fa';
import FoodItemMenuCard from './components/FoodItemMenuCard';
import LiquorMenuCard from './components/LiquorMenuCardEnhanced';
import LiquorService from '../../../services/liquorService';
import { useFoodItems } from '../../../hooks/useFoodItems';
import { InputField } from '../../../components/InputField';
import LoadingSpinner from '../../../components/LoadingSpinner';

// Allowed categories for Menu Manager (now only API-based items)
const ALLOWED_CATEGORIES = ['Foods', 'Liquor', 'Cigarettes', 'Ice Cubes', 'Sandy Bottles', 'Bites', 'Others'];

// Map food item categories to menu categories
const FOOD_CATEGORY_MAPPING = {
    'Rice Dishes': 'Foods',
    'Noodles': 'Foods', 
    'Main Course': 'Foods',
    'Appetizers': 'Bites',
    'Desserts': 'Others',
    'Beverages': 'Others',
    'Others': 'Others'
};

export default memo(function MenuManager() {
    // Add food items hook
    const { foodItems, loading: foodItemsLoading, fetchFoodItems } = useFoodItems();

    const [liquorItems, setLiquorItems] = useState([]);
    const [liquorItemsLoading, setLiquorItemsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    
    // Load food items when component mounts
    useEffect(() => {
        fetchFoodItems().catch(error => {
            console.error('Error fetching food items:', error);
        });
    }, [fetchFoodItems]);

    // Fetch liquor items from API
    React.useEffect(() => {
        fetchLiquorItems();
    }, []);

    const fetchLiquorItems = async () => {
        setLiquorItemsLoading(true);
        try {
            const response = await LiquorService.getAllLiquors();
            console.log('Raw liquor API response:', response); // Debug log
            console.log('Liquor data array:', response.data); // Debug log
            
            if (response.data && response.data.length > 0) {
                const types = [...new Set(response.data.map(item => item.type))];
                console.log('Liquor types found:', types); // Debug log
                
                // Check specifically for cigarettes
                const cigarettes = response.data.filter(item => item.type === 'cigarettes');
                console.log('Cigarettes found:', cigarettes.length, cigarettes); // Debug log
            }
            
            setLiquorItems(response.data || []);
        } catch (error) {
            console.error('Error fetching liquor items:', error);
            setLiquorItems([]);
        } finally {
            setLiquorItemsLoading(false);
        }
    };

    // Refresh all data from APIs
    const refreshAllData = async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                fetchLiquorItems(),
                fetchFoodItems()
            ]);
            console.log('All menu data refreshed successfully');
        } catch (error) {
            console.error('Error refreshing menu data:', error);
        } finally {
            setRefreshing(false);
        }
    };
    
    // Memoize categories (show all allowed categories)
    const categories = useMemo(() => {
        return ['All', ...ALLOWED_CATEGORIES];
    }, []);
    
    // Memoize filtered items (combine food items and liquor items only - no static items)
    const filteredItems = useMemo(() => {
        // Convert food items to menu format
        const foodMenuItems = foodItems.map(item => ({
            id: `food_${item._id}`,
            name: item.name,
            category: FOOD_CATEGORY_MAPPING[item.category] || 'Foods',
            description: item.description,
            price: item.sellingPrice,
            basePrice: item.basePrice,
            ingredients: item.ingredients || [],
            nutritionalInfo: item.nutritionalInfo,
            allergens: item.allergens,
            isFromFoodAPI: true,
            _id: item._id,
            type: 'food_item'
        }));

        // Convert liquor items to menu format
        const liquorMenuItems = liquorItems.map(item => {
            // Map item types to appropriate categories
            let category;
            if (item.type === 'cigarettes') {
                category = 'Cigarettes';
            } else if (item.type === 'ice_cubes') {
                category = 'Ice Cubes';
            } else if (item.type === 'sandy_bottles') {
                category = 'Sandy Bottles';
            } else if (item.type === 'beer' || item.type === 'hard_liquor' || item.type === 'wine') {
                category = 'Liquor';
            } else if (item.type === 'other') {
                category = 'Others';
            } else {
                // Fallback for any unknown liquor types
                category = 'Liquor';
            }
            
            return {
                id: `liquor_${item._id}`,
                name: item.name,
                brand: item.brand,
                category: category,
                type: item.type,
                description: item.type === 'cigarettes' 
                    ? `${item.brand} ${item.name} - Pack of ${item.cigarettesPerPack || 20}` 
                    : item.type === 'ice_cubes'
                    ? `${item.brand} ${item.name} - Ice Cube Bowls`
                    : item.type === 'sandy_bottles'
                    ? `${item.brand} ${item.name} - Sandy Bottles`
                    : item.type === 'hard_liquor'
                    ? `${item.brand} ${item.name} - ${item.bottleVolume}ml (${item.alcoholPercentage}% alcohol)`
                    : `${item.brand} ${item.name}${item.bottleVolume ? ` - ${item.bottleVolume}ml` : ''}`,
                price: item.pricePerBottle,
                pricePerBottle: item.pricePerBottle,
                bottleVolume: item.bottleVolume,
                bottlesInStock: item.bottlesInStock,
                portions: item.portions || [],
                alcoholPercentage: item.alcoholPercentage,
                cigarettesPerPack: item.cigarettesPerPack,
                cigaretteIndividualPrice: item.cigaretteIndividualPrice,
                totalVolumeRemaining: item.totalVolumeRemaining,
                totalSoldVolume: item.totalSoldVolume,
                wastedVolume: item.wastedVolume,
                isFromAPI: true,
                _id: item._id
            };
        });

        // Combine only API-based items (food items and liquor items)
        const allItems = [...foodMenuItems, ...liquorMenuItems];
        
        // Debug logging for ice cubes and sandy bottles
        const iceCubesItems = allItems.filter(item => item.category === 'Ice Cubes');
        const sandyBottlesItems = allItems.filter(item => item.category === 'Sandy Bottles');
        const cigaretteItems = allItems.filter(item => item.category === 'Cigarettes');
        
        console.log('Ice Cubes menu items:', iceCubesItems); // Debug log
        console.log('Sandy Bottles menu items:', sandyBottlesItems); // Debug log
        console.log('Cigarette menu items:', cigaretteItems); // Debug log
        
        console.log('All menu items:', allItems.length); // Debug log
        console.log('Food items:', foodMenuItems.length); // Debug log  
        console.log('Liquor items:', liquorMenuItems.length); // Debug log

        return allItems.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                item.brand?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
            
            // Debug log for ice cubes and sandy bottles filtering
            if (item.category === 'Ice Cubes' || item.category === 'Sandy Bottles') {
                console.log(`${item.category} filter check:`, {
                    item: item.name,
                    category: item.category,
                    matchesSearch,
                    matchesCategory,
                    selectedCategory,
                    willShow: matchesSearch && matchesCategory
                });
            }
            
            // Debug log for cigarette filtering
            if (item.category === 'Cigarettes') {
                console.log('Cigarette filter check:', {
                    item: item.name,
                    matchesSearch,
                    matchesCategory,
                    selectedCategory,
                    willShow: matchesSearch && matchesCategory
                });
            }
            
            return matchesSearch && matchesCategory;
        });
    }, [foodItems, liquorItems, searchTerm, selectedCategory]);
    
    // Memoized handlers to prevent unnecessary re-renders
    const handleSearchChange = useCallback((e) => {
        setSearchTerm(e.target.value);
    }, []);

    const handleCategoryChange = useCallback((category) => {
        setSelectedCategory(category);
    }, []);

    const handleUpdateLiquorPortions = async (liquorId, portions) => {
        try {
            // Update the portions with new prices
            await LiquorService.updateLiquorPortions(liquorId, { portions });
            // Refresh liquor items
            await fetchLiquorItems();
        } catch (error) {
            console.error('Error updating portions:', error);
        }
    };

    // Memoize category buttons
    const categoryButtons = useMemo(() => {
        return categories.map(category => (
            selectedCategory === category ? (
                <PrimaryButton
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className="!px-4 !py-2 text-sm font-medium whitespace-nowrap"
                >
                    {category}
                </PrimaryButton>
            ) : (
                <SecondaryButton
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className="!px-4 !py-2 text-sm font-medium whitespace-nowrap"
                >
                    {category}
                </SecondaryButton>
            )
        ));
    }, [categories, selectedCategory, handleCategoryChange]);

    // Show loading spinner during initial load
    const isInitialLoading = (foodItemsLoading && foodItems.length === 0) || (liquorItemsLoading && liquorItems.length === 0);
    
    if (isInitialLoading) {
        return <LoadingSpinner />;
    }
    
    return (
        <div className="p-8 min-h-screen bg-gray-50">
            {/* Enhanced Header Section */}
            <div className="mb-8">
                {/* Title and Actions Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-other1">Menu Management</h1>
                        <p className="text-gray-600">View your restaurant's menu items from Food Items and Liquor Stock</p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <SecondaryButton 
                            onClick={refreshAllData}
                            className="flex items-center gap-2 px-6 py-3"
                            title="Refresh all menu data from APIs"
                            disabled={foodItemsLoading || liquorItemsLoading || refreshing}
                        >
                            <FaSync className={`w-4 h-4 ${refreshing || foodItemsLoading || liquorItemsLoading ? 'animate-spin' : ''}`} />
                            {refreshing ? 'Refreshing...' : 'Refresh All'}
                        </SecondaryButton>
                    </div>
                </div>

                {/* Search and Filter Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
                    {/* Search Bar */}
                    <div className="flex flex-col md:flex-row gap-6 items-end">
                        <div className="flex-1 space-y-2">
                            <label htmlFor="menu-search" className="block text-sm font-medium text-gray-700">
                                Search Menu Items
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <InputField 
                                    id="menu-search"
                                    placeholder="Search by name, description, or brand..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        
                        {/* Results Count */}
                        <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg flex items-center gap-2">
                            <span className="font-medium">{filteredItems.length}</span> items found
                            {(liquorItemsLoading || foodItemsLoading) && (
                                <FaSync className="w-3 h-3 animate-spin text-gray-500" />
                            )}
                        </div>
                    </div>
                    
                    {/* Category Filter */}
                    <fieldset className="space-y-3">
                        <legend className="block text-sm font-medium text-gray-700">
                            Filter by Category
                        </legend>
                        <div className="flex flex-wrap gap-3">
                            {categoryButtons}
                        </div>
                    </fieldset>
                </div>
            </div>
            
            {/* Content Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 min-h-[600px] relative">
                {/* Loading overlay for refresh */}
                {refreshing && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-2xl">
                        <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-lg shadow-lg">
                            <FaSync className="w-5 h-5 animate-spin text-primaryColor" />
                            <span className="text-gray-700 font-medium">Refreshing menu data...</span>
                        </div>
                    </div>
                )}
                
                {filteredItems.length === 0 ? (
                    <div className="flex items-center justify-center h-96">
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                                <span className="text-4xl">🍽️</span>
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-xl font-semibold text-gray-600">No menu items found</h2>
                                <p className="text-gray-500">Try adjusting your search or category filters</p>
                            </div>
                            {searchTerm && (
                                <PrimaryButton 
                                    onClick={() => setSearchTerm('')}
                                    className="px-4 py-2 text-sm"
                                >
                                    Clear Search
                                </PrimaryButton>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Items Grid Header */}
                        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                            <h2 className="text-lg font-semibold text-gray-800">
                                {selectedCategory === 'All' ? 'All Menu Items' : `${selectedCategory} Items`}
                            </h2>
                            <div className="text-sm text-gray-600">
                                Showing {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                        
                        {/* Items Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3  gap-6 pb-6">
                            {filteredItems.map(item => {
                                // Use different components based on item type
                                if (item.isFromAPI && (item.category === 'Liquor' || item.category === 'Cigarettes' || item.category === 'Ice Cubes' || item.category === 'Sandy Bottles' || item.category === 'Others')) {
                                    return (
                                        <LiquorMenuCard
                                            key={item.id}
                                            liquorItem={item}
                                            onUpdatePortions={handleUpdateLiquorPortions}
                                            // Remove edit/delete from menu view - these should be done in stock management
                                        />
                                    );
                                } else if (item.isFromFoodAPI && item.type === 'food_item') {
                                    return (
                                        <FoodItemMenuCard
                                            key={item.id}
                                            item={item}
                                        />
                                    );
                                }
                                // No fallback since we only show API items
                                return null;
                            })}
                        </div>
                    </div>
                )}
            </div>
            
        </div>
    );
});
