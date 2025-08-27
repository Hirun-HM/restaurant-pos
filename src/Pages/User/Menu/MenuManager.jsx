import React, { useState, useCallback, useMemo, memo } from 'react';
import { PrimaryButton, SecondaryButton } from '../../../components/Button';
import { FaPlus, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import MenuForm from './components/MenuForm';
import MenuItemCard from './components/MenuItemCard';
import Modal, { ConfirmModal } from '../../../components/Modal';
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
    
    // Liquor
    { id: 11, name: 'Beer', price: 350, category: 'Liquor', description: 'Chilled beer bottle' },
    { id: 12, name: 'Whiskey', price: 1200, category: 'Liquor', description: 'Premium whiskey bottle' },
    { id: 13, name: 'Vodka', price: 1000, category: 'Liquor', description: 'Premium vodka bottle' },
    { id: 14, name: 'Arrack', price: 800, category: 'Liquor', description: 'Local arrack bottle' },
    
    // Cigarettes
    { id: 15, name: 'Dunhill Blue', price: 850, category: 'Cigarettes', description: 'Dunhill Blue cigarettes pack' },
    { id: 16, name: 'John Player Gold Leaf', price: 920, category: 'Cigarettes', description: 'John Player Gold Leaf pack' },
    { id: 17, name: 'Marlboro', price: 950, category: 'Cigarettes', description: 'Marlboro cigarettes pack' },
    
    // Bites
    { id: 18, name: 'Chicken Wings', price: 280, category: 'Bites', description: 'Crispy chicken wings' },
    { id: 19, name: 'Fish Cutlets', price: 150, category: 'Bites', description: 'Fried fish cutlets' },
    { id: 20, name: 'Deviled Chicken', price: 320, category: 'Bites', description: 'Spicy deviled chicken pieces' },
    { id: 21, name: 'Prawn Crackers', price: 180, category: 'Bites', description: 'Crispy prawn crackers' },
    { id: 22, name: 'Vadai', price: 120, category: 'Bites', description: 'Traditional vadai snack' },
    
    // Beverage
    { id: 23, name: 'Chicken Sandwich', price: 250, category: 'Beverage', description: 'Grilled chicken sandwich' },
    { id: 24, name: 'Club Sandwich', price: 350, category: 'Beverage', description: 'Multi-layer club sandwich' },
    { id: 25, name: 'Fish Sandwich', price: 280, category: 'Beverage', description: 'Fresh fish sandwich' },
    { id: 26, name: 'Egg Sandwich', price: 180, category: 'Beverage', description: 'Boiled egg sandwich' },
    
    // Others
    { id: 4, name: 'Coca Cola', price: 120, category: 'Others', description: 'Chilled Coca Cola' },
    { id: 5, name: 'Orange Juice', price: 150, category: 'Others', description: 'Fresh orange juice' },
    { id: 8, name: 'Ice Cream', price: 200, category: 'Others', description: 'Vanilla ice cream' },
    { id: 27, name: 'Coffee', price: 100, category: 'Others', description: 'Hot coffee' },
    { id: 28, name: 'Tea', price: 80, category: 'Others', description: 'Ceylon tea' },
    { id: 29, name: 'Fresh Lime', price: 120, category: 'Others', description: 'Fresh lime juice' }
];

export default memo(function MenuManager() {
    // Memoize initial menu items to prevent recreation
    const initialMenuData = useMemo(() => {
        const saved = localStorage.getItem('restaurant-menu-items');
        if (saved) {
            const parsedData = JSON.parse(saved);
            // Migrate old "Sandy" categories to "Beverage"
            const migratedData = parsedData.map(item => ({
                ...item,
                category: item.category === 'Sandy' ? 'Beverage' : item.category
            }));
            return migratedData;
        }
        return initialMenuItems;
    }, []);

    const [menuItems, setMenuItems] = useState(initialMenuData);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, itemId: null, itemName: '' });
    
    // One-time migration effect to update localStorage with migrated data
    React.useEffect(() => {
        const saved = localStorage.getItem('restaurant-menu-items');
        if (saved) {
            const parsedData = JSON.parse(saved);
            const hasOldSandyCategory = parsedData.some(item => item.category === 'Sandy');
            if (hasOldSandyCategory) {
                const migratedData = parsedData.map(item => ({
                    ...item,
                    category: item.category === 'Sandy' ? 'Beverage' : item.category
                }));
                localStorage.setItem('restaurant-menu-items', JSON.stringify(migratedData));
                setMenuItems(migratedData);
            }
        }
    }, []); // Run only once on mount
    
    // Save to localStorage whenever menu items change
    React.useEffect(() => {
        localStorage.setItem('restaurant-menu-items', JSON.stringify(menuItems));
    }, [menuItems]);
    
    // Memoize categories
    const categories = useMemo(() => {
        return ['All', ...new Set(menuItems.map(item => item.category))];
    }, [menuItems]);
    
    // Memoize filtered items
    const filteredItems = useMemo(() => {
        return menuItems.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                item.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [menuItems, searchTerm, selectedCategory]);
    
    // Memoized handlers to prevent unnecessary re-renders
    const handleSearchChange = useCallback((e) => {
        setSearchTerm(e.target.value);
    }, []);

    const handleCategoryChange = useCallback((category) => {
        setSelectedCategory(category);
    }, []);
    
    // Memoize category buttons
    const categoryButtons = useMemo(() => {
        return categories.map(category => (
            <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                    selectedCategory === category
                        ? 'bg-primaryColor text-white'
                        : 'bg-white text-other1 border border-gray-300 hover:bg-gray-100'
                }`}
            >
                {category}
            </button>
        ));
    }, [categories, selectedCategory, handleCategoryChange]);
    
    const handleAddItem = useCallback(() => {
        setEditingItem(null);
        setShowForm(true);
    }, []);
    
    const handleEditItem = useCallback((item) => {
        setEditingItem(item);
        setShowForm(true);
    }, []);
    
    const handleDeleteItem = useCallback((itemId) => {
        const item = menuItems.find(item => item.id === itemId);
        setDeleteConfirm({ 
            show: true, 
            itemId: itemId, 
            itemName: item?.name || 'this item' 
        });
    }, [menuItems]);
    
    const confirmDelete = useCallback(() => {
        if (deleteConfirm.itemId) {
            setMenuItems(prev => prev.filter(item => item.id !== deleteConfirm.itemId));
        }
        setDeleteConfirm({ show: false, itemId: null, itemName: '' });
    }, [deleteConfirm.itemId]);
    
    const cancelDelete = useCallback(() => {
        setDeleteConfirm({ show: false, itemId: null, itemName: '' });
    }, []);

    // Memoize delete confirmation state to prevent object recreation
    const deleteConfirmState = useMemo(() => deleteConfirm, [deleteConfirm]);

    // Memoize empty state component
    const emptyState = useMemo(() => (
        <div className="flex items-center justify-center h-64">
            <div className="text-center">
                <div className="text-6xl mb-4">🍽️</div>
                <h2 className="text-xl font-semibold text-gray-600 mb-2">No menu items found</h2>
                <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
        </div>
    ), []);

    // Memoize menu items grid
    const menuItemsGrid = useMemo(() => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map(item => (
                <MenuItemCard
                    key={item.id}
                    item={item}
                    onEdit={handleEditItem}
                    onDelete={handleDeleteItem}
                />
            ))}
        </div>
    ), [filteredItems, handleEditItem, handleDeleteItem]);
    
    const handleFormSubmit = useCallback((formData) => {
        if (editingItem) {
            // Update existing item
            setMenuItems(prev => prev.map(item => 
                item.id === editingItem.id ? { ...formData, id: editingItem.id } : item
            ));
        } else {
            // Add new item
            const newId = Math.max(...menuItems.map(item => item.id)) + 1;
            setMenuItems(prev => [...prev, { ...formData, id: newId }]);
        }
        setShowForm(false);
        setEditingItem(null);
    }, [editingItem, menuItems]);
    
    const handleFormCancel = useCallback(() => {
        setShowForm(false);
        setEditingItem(null);
    }, []);
    
    return (
        <div className="p-6 space-y-6 flex flex-col h-full md:h-[78vh]">
            {/* Header Section */}
            <div className="">
                <div className="flex flex-row md:items-center md:justify-between gap-4">
                    <h1 className="text-2xl font-bold text-other1">Menu Management</h1>
                    <div className='w-1/2 flex justify-end'>
                        <PrimaryButton onClick={handleAddItem} className="items-center gap-2">
                            Add New Item
                        </PrimaryButton>
                    </div>
                </div>
                
                {/* Search and Filter Section */}
                <div className="flex flex-col md:flex-row gap-4 mt-4">
                    {/* Search Bar */}
                    <div className="relative flex-1">
                        <div className='w-full md:w-1/2'>
                            <InputField 
                                placeholder="Search menu items..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                            />
                        </div>
                    </div>
                    
                    {/* Category Filter */}
                    <div className="w-full md:w-1/2 justify-center md:justify-end flex flex-wrap gap-2 overflow-x-auto">
                        {categoryButtons}
                    </div>
                </div>
            </div>
            
            {/* Content Section */}
            <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto">
                    {menuItemsGrid}
                    
                    {filteredItems.length === 0 && emptyState}
                </div>
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
            
            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteConfirmState.show}
                onClose={cancelDelete}
                onConfirm={confirmDelete}
                title="Delete Menu Item"
                message={`Are you sure you want to delete "${deleteConfirmState.itemName}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                confirmButtonClass="bg-red-500 hover:bg-red-600"
            />
        </div>
    );
});
