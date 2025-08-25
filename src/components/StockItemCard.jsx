import React from 'react';

export default function StockItemCard({ item, onEdit, onDelete }) {
    const getStatusColor = (quantity) => {
        if (quantity === 0) return 'bg-red text-white';
        if (quantity < 10) return 'bg-primaryColor text-black';
        return 'bg-green text-white';
    };

    const getStatusText = (quantity) => {
        if (quantity === 0) return 'Out of Stock';
        if (quantity < 10) return 'Low Stock';
        return 'In Stock';
    };

    return (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-lg">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.category}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.quantity)}`}>
                    {getStatusText(item.quantity)}
                </div>
            </div>
            
            <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Quantity:</span>
                    <span className="font-medium">{item.quantity} {item.unit}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Price:</span>
                    <span className="font-medium">${item.price}</span>
                </div>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => onEdit(item)}
                    className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-blue-700 transition-colors duration-200"
                >
                    Update Stock
                </button>
                <button
                    onClick={() => onDelete(item.id)}
                    className="bg-red text-white py-2 px-3 rounded-lg text-sm hover:bg-red-600 transition-colors duration-200"
                >
                    Delete
                </button>
            </div>
        </div>
    );
}
