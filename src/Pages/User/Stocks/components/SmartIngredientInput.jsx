import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { InputField } from '../../../../components/InputField';
import Select from '../../../../components/Select';
import { SecondaryButton } from '../../../../components/Button';
import { formatQuantity } from '../../../../utils/numberFormat';

const SmartIngredientInput = ({ 
    ingredient, 
    index, 
    stockItems = [], 
    onIngredientChange, 
    onRemove,
    availableUnits = []
}) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredStockItems, setFilteredStockItems] = useState([]);
    const suggestionRef = useRef(null);

    // Filter stock items based on ingredient name input
    useEffect(() => {
        if (ingredient.name && stockItems.length > 0) {
            const filtered = stockItems.filter(item =>
                item.name.toLowerCase().includes(ingredient.name.toLowerCase()) ||
                item.category.toLowerCase().includes(ingredient.name.toLowerCase())
            ).slice(0, 5); // Limit to 5 suggestions
            
            setFilteredStockItems(filtered);
            setShowSuggestions(filtered.length > 0 && ingredient.name.length > 0);
        } else {
            setFilteredStockItems([]);
            setShowSuggestions(false);
        }
    }, [ingredient.name, stockItems]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNameChange = (e) => {
        const value = e.target.value;
        onIngredientChange(index, 'name', value);
    };

    const handleSuggestionSelect = (stockItem) => {
        // Auto-fill ingredient details from stock item
        onIngredientChange(index, 'name', stockItem.name);
        onIngredientChange(index, 'unit', stockItem.unit);
        
        // Estimate cost based on stock item price (could be refined)
        const estimatedCost = stockItem.price || 0;
        onIngredientChange(index, 'cost', estimatedCost);
        
        setShowSuggestions(false);
    };

    const handleFocus = () => {
        if (ingredient.name && filteredStockItems.length > 0) {
            setShowSuggestions(true);
        }
    };

    return (
        <div className="bg-white p-4 rounded border relative">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                {/* Ingredient Name with Suggestions */}
                <div className="relative" ref={suggestionRef}>
                    <InputField
                        label="Ingredient Name *"
                        type="text"
                        value={ingredient.name || ''}
                        onChange={handleNameChange}
                        onFocus={handleFocus}
                        placeholder="Type ingredient name..."
                        required
                        autoComplete="off"
                    />
                    
                    {/* Suggestions Dropdown */}
                    {showSuggestions && filteredStockItems.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            <div className="p-2 text-xs text-gray-500 border-b">
                                💡 From Stock Items:
                            </div>
                            {filteredStockItems.map((item) => (
                                <button
                                    key={item._id}
                                    type="button"
                                    onClick={() => handleSuggestionSelect(item)}
                                    className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-b-0 focus:outline-none focus:bg-blue-50"
                                >
                                    <div className="font-medium text-gray-900">{item.name}</div>
                                    <div className="text-sm text-gray-500">
                                        {item.category} • {item.unit} • LKR {item.price}/unit
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        Stock: {formatQuantity(item.quantity)} {item.unit}
                                    </div>
                                </button>
                            ))}
                            <div className="p-2 text-xs text-gray-500 border-t bg-gray-50">
                                💡 Select from stock or continue typing for custom ingredient
                            </div>
                        </div>
                    )}
                </div>

                {/* Quantity */}
                <InputField
                    label="Quantity *"
                    type="number"
                    value={ingredient.quantity || ''}
                    onChange={(e) => onIngredientChange(index, 'quantity', e.target.value)}
                    step="0.1"
                    min="0"
                    required
                    placeholder="0.0"
                />

                {/* Unit */}
                <Select
                    label="Unit *"
                    value={ingredient.unit || ''}
                    onChange={(value) => onIngredientChange(index, 'unit', value)}
                    options={availableUnits}
                    required
                />

                {/* Remove Button */}
                <SecondaryButton
                    type="button"
                    onClick={() => onRemove(index)}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                >
                    🗑️
                </SecondaryButton>
            </div>

            {/* Cost Estimation (Optional, can be hidden) */}
            <div className="mt-2 text-xs text-gray-500">
                {ingredient.cost && ingredient.cost > 0 && (
                    <div>Estimated cost: LKR {ingredient.cost} per {ingredient.unit}</div>
                )}
            </div>
        </div>
    );
};

SmartIngredientInput.propTypes = {
    ingredient: PropTypes.shape({
        name: PropTypes.string,
        quantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        unit: PropTypes.string,
        cost: PropTypes.number
    }).isRequired,
    index: PropTypes.number.isRequired,
    stockItems: PropTypes.arrayOf(PropTypes.shape({
        _id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        category: PropTypes.string.isRequired,
        unit: PropTypes.string.isRequired,
        price: PropTypes.number,
        quantity: PropTypes.number
    })),
    onIngredientChange: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired,
    availableUnits: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired
    }))
};

SmartIngredientInput.defaultProps = {
    stockItems: [],
    availableUnits: []
};

export default SmartIngredientInput;
