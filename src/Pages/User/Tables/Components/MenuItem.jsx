import React, { useCallback, memo } from 'react'
import { PrimaryButton } from '../../../../components/Button'
import { FaPlus } from 'react-icons/fa'

const MenuItem = memo(function MenuItem({item, onAddItem, selectedTable}) {
    const handleAddItem = useCallback(() => {
        onAddItem(selectedTable.id, item);
    }, [onAddItem, selectedTable.id, item]);

    return (
        <div key={item.id} className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800">{item.name}</h4>
            <p className="text-sm text-gray-600">{item.category}</p>
            <div className="flex justify-between items-center mt-2">
                <span className="font-medium text-gray-800">LKR {item.price}</span>
                <PrimaryButton
                    onClick={handleAddItem}
                    className="flex items-center text-sm py-1 px-3"
                >
                    <FaPlus className="mr-1" size={12} />
                    Add
                </PrimaryButton>
            </div>
        </div>
    )
});

export default MenuItem;
