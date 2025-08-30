import React, { useState, useEffect } from 'react';
import { useStock } from '../../../hooks/useStock';
import StockForm from './components/StockForm';
import StockItemCard from './components/StockItemCard';
import LoadingSpinner from '../../../components/LoadingSpinner';

export default function StockManagerWithAPI() {
    const {
        stockItems,
        loading,
        error,
        totals,
        fetchStockItems,
        createStock,
        updateStock,
        deleteStock,
        getItemsByCategory,
        clearError
    } = useStock();

    const [editingItem, setEditingItem] = useState(null);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch stock items on component mount
    useEffect(() => {
        fetchStockItems();
    }, [fetchStockItems]);

    // Handle stock form submission
    const handleStockSubmit = async (formData) => {
        try {
            if (formData.mode === 'new') {
                // Create new stock item
                const stockData = {
                    name: formData.name,
                    category: formData.category,
                    quantity: parseFloat(formData.quantity),
                    unit: formData.unit,
                    price: parseFloat(formData.price),
                    minimumQuantity: parseFloat(formData.minimumQuantity || 5),
                    supplier: formData.supplier || '',
                    description: formData.description || '',
                    expiryDate: formData.expiryDate || null
                };
                
                await createStock(stockData);
            } else {
                // Update existing stock item
                const stockData = {
                    name: formData.name,
                    category: formData.category,
                    quantity: parseFloat(formData.quantity),
                    unit: formData.unit,
                    price: parseFloat(formData.price),
                    minimumQuantity: parseFloat(formData.minimumQuantity || 5),
                    supplier: formData.supplier || '',
                    description: formData.description || '',
                    expiryDate: formData.expiryDate || null
                };
                
                await updateStock(formData.id, stockData);
            }
            
            setEditingItem(null);
            
            // Show success message (you can implement toast notifications)
            console.log('Stock item saved successfully');
            
        } catch (error) {
            console.error('Error saving stock item:', error);
            // You can implement toast notifications here
        }
    };

    // Handle edit item
    const handleEditItem = (item) => {
        setEditingItem(item);
        // Scroll to top of the page
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    // Handle delete item
    const handleDeleteItem = async (itemId) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                await deleteStock(itemId);
                console.log('Stock item deleted successfully');
            } catch (error) {
                console.error('Error deleting stock item:', error);
            }
        }
    };

    // Handle cancel edit
    const handleCancelEdit = () => {
        setEditingItem(null);
    };

    // Filter items based on category and search
    const filteredItems = stockItems.filter(item => {
        const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
        const matchesSearch = searchTerm === '' || 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesCategory && matchesSearch;
    });

    // Group items by category for display
    const getItemsByFilteredCategory = (category) => {
        return filteredItems.filter(item => item.category === category);
    };

    const categories = [
        { key: 'ingredients', name: 'Ingredients', items: getItemsByFilteredCategory('ingredients') },
        { key: 'food', name: 'Food Items', items: getItemsByFilteredCategory('food') },
        { key: 'drinks', name: 'Drinks & Beverages', items: getItemsByFilteredCategory('drinks') },
        { key: 'supplies', name: 'Kitchen Supplies', items: getItemsByFilteredCategory('supplies') }
    ];

    if (loading && stockItems.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl font-bold text-other1">Stock Management</h1>
                <div className="text-sm text-text space-y-1">
                    <div>Total Items: {totals.totalItems}</div>
                    <div>Total Value: LKR {totals.totalValue.toFixed(2)}</div>
                    <div>Low Stock: {totals.lowStockCount}</div>
                </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Search stock items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Categories</option>
                        <option value="ingredients">Ingredients</option>
                        <option value="food">Food Items</option>
                        <option value="drinks">Drinks & Beverages</option>
                        <option value="supplies">Kitchen Supplies</option>
                    </select>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
                    <span>{error}</span>
                    <button
                        onClick={clearError}
                        className="text-red-700 hover:text-red-900"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Stock Form */}
            <StockForm
                existingItems={stockItems}
                editingItem={editingItem}
                onSubmit={handleStockSubmit}
                onCancel={editingItem ? handleCancelEdit : null}
                loading={loading}
            />

            {/* Loading Overlay */}
            {loading && stockItems.length > 0 && (
                <div className="text-center py-4">
                    <LoadingSpinner />
                    <p className="text-gray-500 mt-2">Updating stock...</p>
                </div>
            )}

            {/* Stock Items Display */}
            <div className="space-y-6">
                {categoryFilter === 'all' ? (
                    // Show all categories
                    categories.map(category => (
                        category.items.length > 0 && (
                            <div key={category.key}>
                                <h2 className="text-lg font-semibold text-gray-800 mb-3 capitalize">
                                    {category.name} ({category.items.length})
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {category.items.map(item => (
                                        <StockItemCard
                                            key={item._id}
                                            item={item}
                                            onEdit={handleEditItem}
                                            onDelete={handleDeleteItem}
                                        />
                                    ))}
                                </div>
                            </div>
                        )
                    ))
                ) : (
                    // Show filtered category
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 mb-3 capitalize">
                            {categories.find(c => c.key === categoryFilter)?.name} ({filteredItems.length})
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredItems.map(item => (
                                <StockItemCard
                                    key={item._id}
                                    item={item}
                                    onEdit={handleEditItem}
                                    onDelete={handleDeleteItem}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Empty State */}
            {filteredItems.length === 0 && !loading && (
                <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                        <div className="text-6xl">📦</div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        {searchTerm || categoryFilter !== 'all' ? 'No Matching Items' : 'No Stock Items'}
                    </h3>
                    <p className="text-gray-500">
                        {searchTerm || categoryFilter !== 'all' 
                            ? 'Try adjusting your search or filter criteria.'
                            : 'Start by adding your first stock item above.'
                        }
                    </p>
                </div>
            )}
        </div>
    );
}
