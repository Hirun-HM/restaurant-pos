import React, { useState } from 'react';
import LiquorForm from './LiquorForm';
import LiquorItemCard from './LiquorItemCard';

export default function LiquorManager() {
    const [liquorItems, setLiquorItems] = useState([
        { id: 1, name: 'Budweiser', category: 'beer', quantity: 48, unit: 'bottle', pricePerUnit: 3.50 },
        { id: 2, name: 'Corona Extra', category: 'beer', quantity: 24, unit: 'bottle', pricePerUnit: 4.25 },
        { id: 3, name: 'Jack Daniels', category: 'hard_liquor', quantity: 6, unit: 'bottle', pricePerUnit: 45.99 },
        { id: 4, name: 'Johnnie Walker Black', category: 'hard_liquor', quantity: 3, unit: 'bottle', pricePerUnit: 65.00 },
        { id: 6, name: 'John Player Gold Leaf (12)', category: 'cigarette', cigaretteType: 'john_player_gold_leaf_12', quantity: 15, unit: 'pack', pricePerUnit: 920.00 },
        { id: 7, name: 'John Player Gold Leaf (20)', category: 'cigarette', cigaretteType: 'john_player_gold_leaf_20', quantity: 0, unit: 'pack', pricePerUnit: 900.00 }
    ]);

    const [editingItem, setEditingItem] = useState(null);

    const handleLiquorSubmit = (formData) => {
        if (formData.mode === 'new') {
            // Add new item
            const newItem = {
                id: Math.max(...liquorItems.map(item => item.id), 0) + 1,
                name: formData.name,
                category: formData.category,
                cigaretteType: formData.cigaretteType,
                quantity: formData.quantity,
                unit: formData.unit,
                pricePerUnit: formData.pricePerUnit
            };
            setLiquorItems([...liquorItems, newItem]);
        } else {
            // Update existing item
            setLiquorItems(liquorItems.map(item => 
                item.id === formData.id 
                    ? { ...item, quantity: item.quantity + formData.quantity, pricePerUnit: formData.pricePerUnit }
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
            setLiquorItems(liquorItems.filter(item => item.id !== itemId));
        }
    };

    const handleCancelEdit = () => {
        setEditingItem(null);
    };

    // Filter items by category for display
    const getItemsByCategory = (category) => {
        return liquorItems.filter(item => item.category === category);
    };

    const categories = [
        { key: 'beer', name: 'Beer', items: getItemsByCategory('beer') },
        { key: 'hard_liquor', name: 'Hard Liquor', items: getItemsByCategory('hard_liquor') },
        { 
            key: 'cigarette', 
            name: 'Cigarettes', 
            items: getItemsByCategory('cigarette'),
            subcategories: [
                { key: 'dunhill_blue', name: 'Dunhill Blue', items: getItemsByCategory('cigarette').filter(item => item.cigaretteType === 'dunhill_blue') },
                { key: 'dunhill_tube', name: 'Dunhill Tube', items: getItemsByCategory('cigarette').filter(item => item.cigaretteType === 'dunhill_tube') },
                { key: 'john_player_gold_leaf_20', name: 'John Player Gold Leaf (20\'s)', items: getItemsByCategory('cigarette').filter(item => item.cigaretteType === 'john_player_gold_leaf_20') },
                { key: 'john_player_gold_leaf_12', name: 'John Player Gold Leaf (12\'s)', items: getItemsByCategory('cigarette').filter(item => item.cigaretteType === 'john_player_gold_leaf_12') },
                { key: 'john_player_gold_pro', name: 'John Player Gold Pro', items: getItemsByCategory('cigarette').filter(item => item.cigaretteType === 'john_player_gold_pro') }
            ]
        }
    ];

    // Calculate total inventory value
    const totalValue = liquorItems.reduce((total, item) => total + (item.quantity * item.pricePerUnit), 0);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Liquor Management</h1>
                <div className="text-sm text-gray-600">
                    <div>Total Items: {liquorItems.length}</div>
                    <div>Total Value: LKR {totalValue.toFixed(2)}</div>
                </div>
            </div>

            {/* Liquor Form */}
            <LiquorForm
                existingItems={liquorItems}
                editingItem={editingItem}
                onSubmit={handleLiquorSubmit}
                onCancel={editingItem ? handleCancelEdit : null}
            />

            {/* Liquor Items Display */}
            <div className="space-y-6">
                {categories.map(category => {
                    if (category.key === 'cigarette') {
                        // Special handling for cigarettes with subcategories
                        return (
                            <div key={category.key}>
                                <h2 className="text-lg font-semibold text-gray-800 mb-3">
                                    {category.name} ({category.items.length})
                                </h2>
                                {category.subcategories.map(subcategory => (
                                    subcategory.items.length > 0 && (
                                        <div key={subcategory.key} className="ml-4 mb-4">
                                            <h3 className="text-md font-medium text-gray-700 mb-2">
                                                {subcategory.name} ({subcategory.items.length})
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {subcategory.items.map(item => (
                                                    <LiquorItemCard
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
                        );
                    } else {
                        // Regular categories (beer, hard_liquor)
                        return (
                            category.items.length > 0 && (
                                <div key={category.key}>
                                    <h2 className="text-lg font-semibold text-gray-800 mb-3">
                                        {category.name} ({category.items.length})
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {category.items.map(item => (
                                            <LiquorItemCard
                                                key={item.id}
                                                item={item}
                                                onEdit={handleEditItem}
                                                onDelete={handleDeleteItem}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )
                        );
                    }
                })}
            </div>

            {/* Empty State */}
            {liquorItems.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                        <div className="text-6xl">🍺</div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Liquor Items</h3>
                    <p className="text-gray-500">Start by adding your first liquor item above.</p>
                </div>
            )}
        </div>
    );
}
