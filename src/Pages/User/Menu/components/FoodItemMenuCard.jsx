import React, { useState } from 'react';
import PropTypes from 'prop-types';

const FoodItemMenuCard = ({ item }) => {
    const [showIngredients, setShowIngredients] = useState(false);
    const [showNutrition, setShowNutrition] = useState(false);

    const formatCurrency = (amount) => {
        return `LKR ${parseFloat(amount || 0).toFixed(2)}`;
    };

    const calculateProfitPercentage = () => {
        if (!item.basePrice || item.basePrice <= 0) return '0';
        return (((item.price - item.basePrice) / item.basePrice) * 100).toFixed(1);
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">
                            {item.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                            {item.description || 'No description available'}
                        </p>
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-xl font-bold text-green-600">
                                    {formatCurrency(item.price)}
                                </span>
                                {item.basePrice && item.basePrice > 0 && (
                                    <span className="text-sm text-gray-500">
                                        Cost: {formatCurrency(item.basePrice)} • 
                                        Profit: {calculateProfitPercentage()}%
                                    </span>
                                )}
                            </div>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                🍽️ Food Item
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ingredients Section */}
            {item.ingredients && item.ingredients.length > 0 && (
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <button
                        onClick={() => setShowIngredients(!showIngredients)}
                        className="flex items-center justify-between w-full text-left"
                    >
                        <span className="text-sm font-medium text-gray-700">
                            🥘 Ingredients ({item.ingredients.length})
                        </span>
                        <span className="text-gray-400">
                            {showIngredients ? '▼' : '▶'}
                        </span>
                    </button>
                    
                    {showIngredients && (
                        <div className="mt-3 space-y-2">
                            {item.ingredients.map((ingredient, index) => (
                                <div key={`${ingredient.name}-${index}`} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">{ingredient.name}</span>
                                    <span className="text-gray-500">
                                        {ingredient.quantity} {ingredient.unit}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Nutritional Information */}
            {item.nutritionalInfo && (
                Object.values(item.nutritionalInfo).some(value => value > 0) && (
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                        <button
                            onClick={() => setShowNutrition(!showNutrition)}
                            className="flex items-center justify-between w-full text-left"
                        >
                            <span className="text-sm font-medium text-gray-700">
                                📊 Nutrition Info
                            </span>
                            <span className="text-gray-400">
                                {showNutrition ? '▼' : '▶'}
                            </span>
                        </button>
                        
                        {showNutrition && (
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                {item.nutritionalInfo.calories > 0 && (
                                    <div className="text-sm">
                                        <span className="text-gray-600">Calories:</span>
                                        <span className="ml-1 text-gray-800">{item.nutritionalInfo.calories}</span>
                                    </div>
                                )}
                                {item.nutritionalInfo.protein > 0 && (
                                    <div className="text-sm">
                                        <span className="text-gray-600">Protein:</span>
                                        <span className="ml-1 text-gray-800">{item.nutritionalInfo.protein}g</span>
                                    </div>
                                )}
                                {item.nutritionalInfo.carbs > 0 && (
                                    <div className="text-sm">
                                        <span className="text-gray-600">Carbs:</span>
                                        <span className="ml-1 text-gray-800">{item.nutritionalInfo.carbs}g</span>
                                    </div>
                                )}
                                {item.nutritionalInfo.fat > 0 && (
                                    <div className="text-sm">
                                        <span className="text-gray-600">Fat:</span>
                                        <span className="ml-1 text-gray-800">{item.nutritionalInfo.fat}g</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )
            )}

            {/* Allergens */}
            {item.allergens && item.allergens.length > 0 && (
                <div className="px-4 py-2 bg-yellow-50 border-b border-gray-100">
                    <span className="text-sm font-medium text-yellow-800">⚠️ Allergens:</span>
                    <span className="ml-2 text-sm text-yellow-700">
                        {item.allergens.join(', ')}
                    </span>
                </div>
            )}


        </div>
    );
};

FoodItemMenuCard.propTypes = {
    item: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        description: PropTypes.string,
        price: PropTypes.number.isRequired,
        basePrice: PropTypes.number,
        ingredients: PropTypes.arrayOf(PropTypes.shape({
            name: PropTypes.string.isRequired,
            quantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            unit: PropTypes.string.isRequired
        })),
        nutritionalInfo: PropTypes.shape({
            calories: PropTypes.number,
            protein: PropTypes.number,
            carbs: PropTypes.number,
            fat: PropTypes.number
        }),
        allergens: PropTypes.arrayOf(PropTypes.string)
    }).isRequired
};

export default FoodItemMenuCard;
