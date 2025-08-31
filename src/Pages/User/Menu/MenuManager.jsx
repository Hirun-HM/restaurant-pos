import React, { useState, useCallback, useMemo, memo } from 'react';
import { PrimaryButton, SecondaryButton } from '../../../components/Button';
import { FaSync } from 'react-icons/fa';
import MenuForm from './Components/MenuForm';
import MenuItemCard from './Components/MenuItemCard';
import LiquorMenuCard from './components/LiquorMenuCardEnhanced';
import LiquorService from '../../../services/liquorService';
import Modal from '../../../components/Modal';
import { InputField } from '../../../components/InputField';

// Initial menu items (this would come from a database in a real app)
const initialMenuItems = [
    // Foods
    { id: 1, name: 'Chicken Rice', price: 450, category: 'Foods', description: 'Delicious chicken rice with spices' },
    { id: 2, name: 'Fried Rice', price: 380, category: 'Foods', description: 'Traditional fried rice with vegetables' },
    { id: 3, name: 'Kottu', price: 500, category: 'Foods', description: 'Sri Lankan kottu roti with chicken' },
    { id: 6, name: 'Fish Curry', price: 650, category: 'Foods', description: 'Fresh fish curry with rice' },
    { id: 7, name: 'Vegetable Curry', price: 350, category: 'Foods', description: 'Mixed vegetable curry' },
    { id: 9, name: 'Chicken Curry', price: 550, category: 'Foods', description: 'Spicy chicken curry with rice' },
    { id: 10, name: 'Noodles', price: 420, category: 'Foods', description: 'Stir-fried noodles with vegetables' },
    
    // Bites
    { id: 18, name: 'Chicken Wings', price: 280, category: 'Bites', description: 'Crispy chicken wings' },
    { id: 19, name: 'Fish Cutlets', price: 150, category: 'Bites', description: 'Fried fish cutlets' },
    { id: 20, name: 'Deviled Chicken', price: 320, category: 'Bites', description: 'Spicy deviled chicken pieces' },
    { id: 21, name: 'Prawn Crackers', price: 180, category: 'Bites', description: 'Crispy prawn crackers' },
    { id: 22, name: 'Vadai', price: 120, category: 'Bites', description: 'Traditional vadai snack' },
    
    // Others (beverages, desserts, and refreshments only)
    { id: 4, name: 'Coca Cola', price: 120, category: 'Others', description: 'Chilled Coca Cola' },
    { id: 5, name: 'Orange Juice', price: 150, category: 'Others', description: 'Fresh orange juice' },
    { id: 8, name: 'Ice Cream', price: 200, category: 'Others', description: 'Vanilla ice cream' },
    { id: 27, name: 'Coffee', price: 100, category: 'Others', description: 'Hot coffee' },
    { id: 28, name: 'Tea', price: 80, category: 'Others', description: 'Ceylon tea' },
    { id: 29, name: 'Fresh Lime', price: 120, category: 'Others', description: 'Fresh lime juice' },
    { id: 30, name: 'Ice Cubes', price: 50, category: 'Others', description: 'Fresh ice cubes' },
    { id: 31, name: 'Water Bottle', price: 80, category: 'Others', description: 'Pure drinking water' }
];

// Allowed categories for Menu Manager
const ALLOWED_CATEGORIES = ['Foods', 'Liquor', 'Cigarettes', 'Bites', 'Others'];

export default memo(function MenuManager() {
    // Memoize initial menu items to prevent recreation
    const initialMenuData = useMemo(() => {
        const saved = localStorage.getItem('restaurant-menu-items');
        if (saved) {
            try {
                const parsedData = JSON.parse(saved);
                // Filter only allowed categories and migrate old categories
                const filteredData = parsedData
                    .map(item => ({
                        ...item,
                        category: item.category === 'Sandy' ? 'Beverage' : item.category
                    }))
                    .filter(item => ALLOWED_CATEGORIES.includes(item.category));
                return filteredData;
            } catch (error) {
                console.error('Error parsing menu items:', error);
                return initialMenuItems.filter(item => ALLOWED_CATEGORIES.includes(item.category));
            }
        }
        return initialMenuItems.filter(item => ALLOWED_CATEGORIES.includes(item.category));
    }, []);

    const [menuItems, setMenuItems] = useState(initialMenuData);
    const [liquorItems, setLiquorItems] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    
    // One-time migration effect to update localStorage with filtered data
    React.useEffect(() => {
        try {
            // Clear all menu-related data and initialize with default items
            localStorage.clear();
            localStorage.setItem('restaurant-menu-items', JSON.stringify(initialMenuItems));
            setMenuItems(initialMenuItems);

        } catch (error) {
            console.error('Error initializing menu data:', error);
            // Fallback to default items if localStorage fails
            setMenuItems(initialMenuItems);
        }
    }, []); // Run only once on mount

    // Fetch liquor items from API
    React.useEffect(() => {
        fetchLiquorItems();
    }, []);

    const fetchLiquorItems = async () => {
        try {
            const response = await LiquorService.getAllLiquors();
            setLiquorItems(response.data || []);
        } catch (error) {
            console.error('Error fetching liquor items:', error);
            setLiquorItems([]);
        }
    };
    
    // Save to localStorage whenever menu items change
    React.useEffect(() => {
        localStorage.setItem('restaurant-menu-items', JSON.stringify(menuItems));
    }, [menuItems]);
    
    // Memoize categories (show all allowed categories)
    const categories = useMemo(() => {
        return ['All', ...ALLOWED_CATEGORIES];
    }, []);
    
    // Memoize filtered items (combine menu items and liquor items)
    const filteredItems = useMemo(() => {
        // Convert liquor items to menu format
        const liquorMenuItems = liquorItems.map(item => {
            // Map item types to appropriate categories
            let category;
            if (item.type === 'cigarettes') {
                category = 'Cigarettes';
            } else if (item.type === 'beer' || item.type === 'hard_liquor' || item.type === 'wine' || 
                       item.type === 'whiskey' || item.type === 'vodka' || item.type === 'rum' || 
                       item.type === 'gin' || item.type === 'brandy' || item.type === 'tequila') {
                category = 'Liquor';
            } else {
                category = 'Others'; // fallback for unknown types
            }
            
            return {
                id: `liquor_${item._id}`,
                name: item.name,
                brand: item.brand,
                category: category,
                type: item.type,
                description: item.type === 'cigarettes' 
                    ? `${item.brand} ${item.type}` 
                    : `${item.brand} ${item.type} - ${item.bottleVolume}ml`,
                price: item.pricePerBottle,
                pricePerBottle: item.pricePerBottle, // Add this for compatibility with LiquorMenuCard
                bottleVolume: item.bottleVolume,
                bottlesInStock: item.bottlesInStock,
                portions: item.portions || [],
                alcoholPercentage: item.alcoholPercentage,
                totalVolumeRemaining: item.totalVolumeRemaining,
                totalSoldVolume: item.totalSoldVolume,
                wastedVolume: item.wastedVolume,
                isFromAPI: true,
                _id: item._id
            };
        });

        // Combine regular menu items with liquor items
        const allItems = [...menuItems, ...liquorMenuItems];

        return allItems.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                item.brand?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [menuItems, liquorItems, searchTerm, selectedCategory]);
    
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
    
    const handleAddItem = useCallback(() => {
        setEditingItem(null);
        setShowForm(true);
    }, []);
    
    const handleEditItem = useCallback((item) => {
        if (item.isFromAPI) {
            // For API items (liquor), show different handling
            alert('Liquor items can be edited in Stock Management');
        } else {
            setEditingItem(item);
            setShowForm(true);
        }
    }, []);
    
    const handleDeleteItem = useCallback((item) => {
        if (typeof item === 'object' && item.isFromAPI) {
            // For API items (liquor), show different handling  
            alert('Liquor items can be deleted from Stock Management');
        } else {
            // Handle both old (itemId) and new (item object) formats
            const idToDelete = typeof item === 'object' ? item.id : item;
            setMenuItems(prev => prev.filter(menuItem => menuItem.id !== idToDelete));
        }
    }, []);
    
    const handleFormSubmit = useCallback((formData) => {
        // Ensure only allowed categories can be added
        if (!ALLOWED_CATEGORIES.includes(formData.category)) {
            console.warn(`Category "${formData.category}" is not allowed in Menu Manager`);
            return;
        }

        // Process form data based on category
        let processedData = { ...formData };

        // Get stock items once for both Liquor and Cigarettes
        const stockKey = localStorage.getItem('restaurant-stock-items');
        const stockItems = stockKey ? JSON.parse(stockKey) : [];

        // Handle Liquor items
        if (formData.category === 'Liquor') {
            processedData = {
                ...processedData,
                portionTracking: true,
                volume: formData.volume || 750, // Default to 750ml if not specified
                volumeUnit: 'ml',
                stockId: formData.name.toLowerCase().replace(/\s+/g, '_') + '_stock'
            };

            // Create or update corresponding stock item if it doesn't exist
            const stockExists = stockItems.some(item => item.id === processedData.stockId);
            
            if (!stockExists) {
                // Add new stock item for liquor
                const newStockItem = {
                    id: processedData.stockId,
                    name: formData.name,
                    category: formData.category,
                    quantity: 0, // Initial stock
                    unit: 'ml',
                    price: formData.price,
                    volume: processedData.volume
                };
                localStorage.setItem('restaurant-stock-items', 
                    JSON.stringify([...stockItems, newStockItem]));
            }
        } 
        // Handle Cigarette items
        else if (formData.category === 'Cigarettes') {
            processedData = {
                ...processedData,
                portionTracking: true,
                unitsPerPack: formData.unitsPerPack || 20, // Default to 20 cigarettes per pack
                stockId: formData.name.toLowerCase().replace(/\s+/g, '_') + '_stock'
            };

            // Create or update corresponding stock item if it doesn't exist
            const stockExists = stockItems.some(item => item.id === processedData.stockId);

            if (!stockExists) {
                // Add new stock item based on category
                const newStockItem = {
                    id: processedData.stockId,
                    name: formData.name,
                    category: formData.category,
                    quantity: 0, // Initial stock
                    unit: formData.category === 'Liquor' ? 'ml' : 'packs',
                    price: formData.price,
                    ...(formData.category === 'Cigarettes' && {
                        unitsPerPack: processedData.unitsPerPack
                    })
                };
                localStorage.setItem('restaurant-stock-items', 
                    JSON.stringify([...stockItems, newStockItem]));
            }
        }

        if (editingItem) {
            // Update existing item
            setMenuItems(prev => prev.map(item => 
                item.id === editingItem.id 
                    ? { ...processedData, id: editingItem.id } 
                    : item
            ));

            // If this is a liquor item, update the stock item name if it changed
            if (processedData.category === 'Liquor' && editingItem.name !== processedData.name) {
                const stockKey = localStorage.getItem('restaurant-stock-items');
                if (stockKey) {
                    const stockItems = JSON.parse(stockKey);
                    const updatedStockItems = stockItems.map(item => 
                        item.id === editingItem.stockId 
                            ? { ...item, name: processedData.name }
                            : item
                    );
                    localStorage.setItem('restaurant-stock-items', JSON.stringify(updatedStockItems));
                }
            }
        } else {
            // Add new item
            const newId = Math.max(...menuItems.map(item => item.id), 0) + 1;
            setMenuItems(prev => [...prev, { ...processedData, id: newId }]);
        }

        setShowForm(false);
        setEditingItem(null);
    }, [editingItem, menuItems]);
    
    const handleFormCancel = useCallback(() => {
        setShowForm(false);
        setEditingItem(null);
    }, []);
    
    return (
        <div className="p-8 min-h-screen bg-gray-50">
            {/* Enhanced Header Section */}
            <div className="mb-8">
                {/* Title and Actions Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-other1">Menu Management</h1>
                        <p className="text-gray-600">Manage your restaurant's menu items and categories</p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <SecondaryButton 
                            onClick={fetchLiquorItems}
                            className="flex items-center gap-2 px-6 py-3"
                            title="Refresh liquor data"
                        >
                            <FaSync className="w-4 h-4" />
                            Refresh
                        </SecondaryButton>
                        <PrimaryButton 
                            onClick={handleAddItem} 
                            className="flex items-center gap-2 px-6 py-3"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add New Item
                        </PrimaryButton>
                    </div>
                </div>

                {/* Search and Filter Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
                    {/* Search Bar */}
                    <div className="flex flex-col md:flex-row gap-6 items-end">
                        <div className="flex-1 space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Search Menu Items
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <InputField 
                                    placeholder="Search by name, description, or brand..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        
                        {/* Results Count */}
                        <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                            <span className="font-medium">{filteredItems.length}</span> items found
                        </div>
                    </div>
                    
                    {/* Category Filter */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                            Filter by Category
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {categoryButtons}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Content Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 min-h-[600px]">
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
                                if (item.isFromAPI && item.category === 'Liquor') {
                                    return (
                                        <LiquorMenuCard
                                            key={item.id}
                                            liquorItem={item}
                                            onUpdatePortions={handleUpdateLiquorPortions}
                                            onEdit={() => handleEditItem(item)}
                                            onDelete={() => handleDeleteItem(item)}
                                        />
                                    );
                                } else {
                                    return (
                                        <MenuItemCard
                                            key={item.id}
                                            item={item}
                                            onEdit={handleEditItem}
                                            onDelete={handleDeleteItem}
                                        />
                                    );
                                }
                            })}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Add/Edit Modal */}
            <Modal
                isOpen={showForm}
                onClose={handleFormCancel}
                title={editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                size="lg"
            >
                <MenuForm
                    item={editingItem}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                />
            </Modal>
        </div>
    );
});
