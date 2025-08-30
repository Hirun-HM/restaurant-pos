import React, { memo } from 'react';
import { MenuItemCard } from './MenuItemCard';

export default memo(function MenuList({ items, onEdit, onDelete }) {
    // Group items by category
    const groupedItems = items.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {});

    // Order categories
    const orderedCategories = ['Foods', 'Liquor', 'Cigarettes', 'Bites', 'Others'];

    return (
        <div className="space-y-8">
            {orderedCategories.map(category => {
                const categoryItems = groupedItems[category] || [];
                if (categoryItems.length === 0) return null;

                return (
                    <div key={category} className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">{category}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {categoryItems.map(item => (
                                <MenuItemCard
                                    key={item.id}
                                    item={item}
                                    onEdit={() => onEdit(item)}
                                    onDelete={() => onDelete(item.id)}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
});
