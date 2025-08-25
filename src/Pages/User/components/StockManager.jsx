
import React, { useState } from 'react';
import StockForm from './StockForm';
import StockItemCard from './StockItemCard';

export default function StockManager() {
    const [stockItems, setStockItems] = useState([
        { id: 1, name: 'Chicken Breast', category: 'ingredients', quantity: 15, unit: 'kg', price: 8.99 },
        { id: 2, name: 'Coca Cola', category: 'drinks', quantity: 24, unit: 'bottle', price: 1.50 },
        { id: 3, name: 'Pizza Dough', category: 'ingredients', quantity: 5, unit: 'kg', price: 3.50 },
        { id: 4, name: 'Tomato Sauce', category: 'ingredients', quantity: 8, unit: 'l', price: 4.25 },
        { id: 5, name: 'Mozzarella Cheese', category: 'ingredients', quantity: 3, unit: 'kg', price: 12.99 },
        { id: 6, name: 'Orange Juice', category: 'drinks', quantity: 0, unit: 'bottle', price: 2.99 }
    ]);

    const [editingItem, setEditingItem] = useState(null);

    const handleStockSubmit = (formData) => {
        if (formData.mode === 'new') {
            // Add new item
            const newItem = {
                id: Math.max(...stockItems.map(item => item.id), 0) + 1,
                name: formData.name,
                category: formData.category,
                quantity: formData.quantity,
                unit: formData.unit,
                price: formData.price
            };
            setStockItems([...stockItems, newItem]);
        } else {
            // Update existing item
            setStockItems(stockItems.map(item => 
                item.id === formData.id 
                    ? { ...item, quantity: item.quantity + formData.quantity, price: formData.price }
                    : item
            ));
        }
        setEditingItem(null);
    };

    const handleEditItem = (item) => {
        setEditingItem(item);
        // Scroll to top of the page
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const handleDeleteItem = (itemId) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            setStockItems(stockItems.filter(item => item.id !== itemId));
        }
    };

    const handleCancelEdit = () => {
        setEditingItem(null);
    };

    // Filter items by category for display
    const getItemsByCategory = (category) => {
        return stockItems.filter(item => item.category === category);
    };

    const categories = [
        { key: 'ingredients', name: 'Ingredients', items: getItemsByCategory('ingredients') },
        { key: 'food', name: 'Food Items', items: getItemsByCategory('food') },
        { key: 'drinks', name: 'Drinks & Beverages', items: getItemsByCategory('drinks') },
        { key: 'supplies', name: 'Kitchen Supplies', items: getItemsByCategory('supplies') }
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Stock Management</h1>
                <div className="text-sm text-gray-600">
                    Total Items: {stockItems.length}
                </div>
            </div>

            {/* Stock Form */}
            <StockForm
                existingItems={stockItems}
                editingItem={editingItem}
                onSubmit={handleStockSubmit}
                onCancel={editingItem ? handleCancelEdit : null}
            />

            {/* Stock Items Display */}
            <div className="space-y-6">
                {categories.map(category => (
                    category.items.length > 0 && (
                        <div key={category.key}>
                            <h2 className="text-lg font-semibold text-gray-800 mb-3 capitalize">
                                {category.name} ({category.items.length})
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {category.items.map(item => (
                                    <StockItemCard
                                        key={item.id}
                                        item={item}
                                        onEdit={handleEditItem}
                                        onDelete={handleDeleteItem}
                                    />
                                ))}
                            </div>
                        </div>
                    )
                ))}
            </div>

            {/* Empty State */}
            {stockItems.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                        <div className="text-6xl">📦</div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Stock Items</h3>
                    <p className="text-gray-500">Start by adding your first stock item above.</p>
                </div>
            )}
        </div>
    );
}
