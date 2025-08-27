import React, { useCallback, memo, useState } from 'react'
import { PrimaryButton } from '../../../../components/Button'
import { FaPlus, FaTimes } from 'react-icons/fa'

const MenuItem = memo(function MenuItem({item, onAddItem, selectedTable}) {
    const [showPortionModal, setShowPortionModal] = useState(false);
    
    // Only hard liquors get portion selection, not beer
    const isHardLiquor = item.category === 'Liquor' && !item.name.toLowerCase().includes('beer');
    
    const liquorPortions = [
        { name: 'Bottle', ml: 750, priceMultiplier: 1 },
        { name: 'Half', ml: 375, priceMultiplier: 0.5},
        { name: '1/4', ml: 180, priceMultiplier: 0.25},
        { name: '100ml Shot', ml: 100, priceMultiplier: 0.15 },
        { name: '75ml Shot', ml: 75, priceMultiplier: 0.12 },
        { name: '50ml Shot', ml: 50, priceMultiplier: 0.08 },
        { name: '25ml Shot', ml: 25, priceMultiplier: 0.05 }
    ];

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
            price: Math.round(item.price * portion.priceMultiplier),
            portion: {
                type: portion.name,
                ml: portion.ml,
                priceMultiplier: portion.priceMultiplier
            },
            originalItemId: item.id
        };
        
        onAddItem(selectedTable.id, liquorItem);
        setShowPortionModal(false);
    }, [item, onAddItem, selectedTable.id]);

    const closeModal = useCallback(() => {
        setShowPortionModal(false);
    }, []);

    return (
        <>
            <div key={item.id} className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800">{item.name}</h4>
                <p className="text-sm text-gray-600">{item.category}</p>
                <div className="flex justify-between items-center mt-2">
                    <span className="font-medium text-gray-800">
                        LKR {item.price}
                        {isHardLiquor && <span className="text-xs text-gray-500"> (bottle)</span>}
                    </span>
                    <PrimaryButton
                        onClick={handleAddItem}
                        className="flex items-center text-sm py-1 px-3"
                    >
                        <FaPlus className="mr-1" size={12} />
                        {isHardLiquor ? 'Select' : 'Add'}
                    </PrimaryButton>
                </div>
            </div>

            {/* Liquor Portion Selection Modal */}
            {showPortionModal && (
                <div className="fixed inset-0 bg-other1 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 max-w-90vw">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Select Portion - {item.name}</h3>
                            <button 
                                onClick={closeModal}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FaTimes />
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            {liquorPortions.map((portion) => (
                                <button
                                    key={portion.ml}
                                    onClick={() => handlePortionSelect(portion)}
                                    className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primaryColor transition-colors"
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <span className="font-medium">{portion.name}</span>
                                            <span className="text-sm text-gray-600 ml-2">({portion.ml}ml)</span>
                                        </div>
                                        <span className="font-medium text-primaryColor">
                                            LKR {Math.round(item.price * portion.priceMultiplier)}
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

export default MenuItem;
