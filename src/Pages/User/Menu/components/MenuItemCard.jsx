import React, { memo } from 'react';
import { PrimaryButton, SecondaryButton } from '../../../../components/Button';
import { FaEdit, FaTrash } from 'react-icons/fa';

const MenuItemCard = memo(function MenuItemCard({ item, onEdit, onDelete }) {
    const getCategoryColor = (category) => {
        const colors = {
            'Foods': 'bg-green-100 text-green-800',
            'Liquor': 'bg-purple-100 text-purple-800',
            'Cigarettes': 'bg-gray-100 text-gray-800',
            'Bites': 'bg-orange-100 text-orange-800',
            'Beverage': 'bg-yellow-100 text-yellow-800',
            'Others': 'bg-blue-100 text-blue-800'
        };
        return colors[category] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            {/* Item Header */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <h3 className="font-semibold text-other1 text-lg mb-1">{item.name}</h3>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getCategoryColor(item.category)}`}>
                        {item.category}
                    </span>
                </div>
                <div className="text-right">
                    <div className="text-lg font-bold text-primaryColor">
                        LKR {item.price.toLocaleString()}
                    </div>
                </div>
            </div>
            
            {/* Description */}
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {item.description}
            </p>
            
            {/* Item Details */}
            <div className="mb-4 space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                    <span>Item ID:</span>
                    <span>#{item.id}</span>
                </div>
                {item.category === 'Liquor' && !item.name.toLowerCase().includes('beer') && (
                    <div className="text-xs text-blue-600">
                        ✨ Portion tracking available
                    </div>
                )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
                <PrimaryButton
                    onClick={() => onEdit(item)}
                    className="flex-1 flex items-center justify-center gap-2 text-sm py-2"
                >
                    <FaEdit size={12} />
                    Edit
                </PrimaryButton>
                <SecondaryButton
                    onClick={() => onDelete(item.id)}
                    className="flex-1 flex items-center justify-center gap-2 text-sm py-2 bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                >
                    <FaTrash size={12} />
                    Delete
                </SecondaryButton>
            </div>
        </div>
    );
});

export default MenuItemCard;
