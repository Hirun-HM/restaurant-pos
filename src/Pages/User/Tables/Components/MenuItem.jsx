import React, { useCallback, memo, useState } from 'react'
import PropTypes from 'prop-types'
import { PrimaryButton } from '../../../../components/Button'
import { FaPlus, FaTimes } from 'react-icons/fa'

const MenuItem = memo(function MenuItem({item, onAddItem, selectedTable}) {
    const [showPortionModal, setShowPortionModal] = useState(false);
    
    // Check if this is a hard liquor that needs portion selection
    const isHardLiquor = item.category === 'Hard Liquor' || (item.type && item.type === 'hard_liquor');
    
    // Debug logging for new liquor items
    if (item.type && (item.type === 'hard_liquor' || item.type === 'beer' || item.type === 'cigarettes')) {
        console.log('MenuItem - Database item:', {
            name: item.name,
            type: item.type,
            category: item.category,
            portions: item.portions?.length || 0,
            stock: item.stock
        });
    }
    
    // Use real portions from database or fallback to default portions
    const getPortions = () => {
        if (item.portions && item.portions.length > 0) {
            // Use database portions
            return item.portions.map(portion => ({
                name: portion.name,
                ml: portion.volume,
                price: portion.price,
                isCustom: false
            }));
        } else {
            // Fallback to calculated portions based on bottle price (for backward compatibility)
            const liquorPortions = [
                { name: 'Full Bottle', ml: item.bottleVolume || 750, priceMultiplier: 1 },
                { name: 'Half Bottle', ml: (item.bottleVolume || 750) / 2, priceMultiplier: 0.5},
                { name: 'Quarter Bottle', ml: item.bottleVolume === 750 ? 180 : 250, priceMultiplier: item.bottleVolume === 750 ? 0.24 : 0.25},
                { name: '100ml', ml: 100, priceMultiplier: 0.15 },
                { name: '75ml', ml: 75, priceMultiplier: 0.12 },
                { name: '50ml', ml: 50, priceMultiplier: 0.08 },
                { name: '25ml', ml: 25, priceMultiplier: 0.05 }
            ];
            
            return liquorPortions.map(portion => ({
                name: portion.name,
                ml: portion.ml,
                price: Math.round(item.price * portion.priceMultiplier),
                isCustom: true
            }));
        }
    };

    const handleAddItem = useCallback(() => {
        if (isHardLiquor) {
            setShowPortionModal(true);
        } else {
            onAddItem(selectedTable.id, item);
        }
    }, [isHardLiquor, onAddItem, selectedTable.id, item]);

    const handlePortionSelect = useCallback((portion) => {
        const liquorItem = {
            ...item,
            id: `${item.id}_${portion.ml}ml`,
            name: `${item.name} (${portion.name})`,
            price: portion.price,
            portion: {
                type: portion.name,
                ml: portion.ml,
                price: portion.price
            },
            originalItemId: item.id
        };
        
        onAddItem(selectedTable.id, liquorItem);
        setShowPortionModal(false);
    }, [item, onAddItem, selectedTable.id]);

    const closeModal = useCallback(() => {
        setShowPortionModal(false);
    }, []);

    // Check if item has stock and display stock info
    const getStockDisplay = () => {
        if (item.stock && (item.stock.bottlesInStock !== undefined || item.stock.millilitersRemaining !== undefined)) {
            const bottles = item.stock.bottlesInStock || 0;
            const ml = item.stock.millilitersRemaining || 0;
            
            if (isHardLiquor && ml > 0) {
                return `${bottles} bottles, ${ml}ml remaining`;
            } else {
                return `${bottles} in stock`;
            }
        }
        return null;
    };

    // Check if item is out of stock
    const isOutOfStock = () => {
        if (item.stock) {
            const bottles = item.stock.bottlesInStock || 0;
            const ml = item.stock.millilitersRemaining || 0;
            return bottles === 0 && ml === 0;
        }
        return false;
    };

    return (
        <>
            <div key={item.id} className={`bg-white p-4 rounded-lg border border-gray-200 ${isOutOfStock() ? 'opacity-50' : ''}`}>
                <h4 className="font-semibold text-other1">{item.name}</h4>
                <p className="text-sm text-gray-600">{item.brand ? `${item.brand} - ` : ''}{item.category}</p>
                
                {/* Stock Information */}
                {getStockDisplay() && (
                    <p className="text-xs text-blue-600 mt-1">{getStockDisplay()}</p>
                )}
                {isOutOfStock() && (
                    <p className="text-xs text-red-500 mt-1">Out of Stock</p>
                )}
                
                <div className="flex justify-between items-center mt-2">
                    <span className="font-medium text-gray-800">
                        LKR {item.price}
                        {isHardLiquor && <span className="text-xs text-gray-500"> (bottle)</span>}
                    </span>
                    <PrimaryButton
                        onClick={handleAddItem}
                        className="flex items-center text-sm py-1 px-3"
                        disabled={isOutOfStock()}
                    >
                        <FaPlus className="mr-1" size={12} />
                        {isHardLiquor ? 'Select' : 'Add'}
                    </PrimaryButton>
                </div>
            </div>

            {/* Liquor Portion Selection Modal */}
            {showPortionModal && (
                <div className="fixed inset-0 bg-other1 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 max-w-90vw max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-other1">Select Portion - {item.name}</h3>
                            <button 
                                onClick={closeModal}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FaTimes />
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            {getPortions().map((portion) => (
                                <button
                                    key={`${portion.ml}_${portion.name}`}
                                    onClick={() => handlePortionSelect(portion)}
                                    className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primaryColor transition-colors"
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <span className="font-medium text-other1">{portion.name}</span>
                                            <span className="text-sm text-other1 ml-2">({portion.ml}ml)</span>
                                            {portion.isCustom && (
                                                <span className="text-xs text-gray-500 ml-2">(calculated)</span>
                                            )}
                                        </div>
                                        <span className="font-medium text-primaryColor">
                                            LKR {portion.price}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                        
                        <button 
                            onClick={closeModal}
                            className="w-full mt-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </>
    )
});

// Add PropTypes
MenuItem.propTypes = {
    item: PropTypes.object.isRequired,
    onAddItem: PropTypes.func.isRequired,
    selectedTable: PropTypes.object.isRequired
};

export default MenuItem;
