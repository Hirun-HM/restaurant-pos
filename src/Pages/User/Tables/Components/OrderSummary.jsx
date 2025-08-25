import React, { useState, useCallback, useMemo } from 'react';
import { PrimaryButton, SecondaryButton } from '../../../../components/Button';
import { FaPlus, FaMinus, FaTrash, FaReceipt } from 'react-icons/fa';
import MenuItem from './MenuItem';

export default function OrderSummary({
    selectedTable,
    bill,
    menuItems,
    onCreateBill,
    onAddItem,
    onRemoveItem,
    onUpdateQuantity,
    onToggleServiceCharge,
    onCloseBill
}) {
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Memoize categories to prevent recalculation on every render
    const categories = useMemo(() => {
        return ['All', ...new Set(menuItems.map(item => item.category))];
    }, [menuItems]);

    // Memoize filtered menu items
    const filteredMenuItems = useMemo(() => {
        return selectedCategory === 'All' 
            ? menuItems 
            : menuItems.filter(item => item.category === selectedCategory);
    }, [selectedCategory, menuItems]);

    // Callback for category selection
    const handleCategorySelect = useCallback((category) => {
        setSelectedCategory(category);
    }, []);

    // Callback for bill creation
    const handleCreateBill = useCallback(() => {
        if (selectedTable) {
            onCreateBill(selectedTable.id);
        }
    }, [selectedTable, onCreateBill]);

    // Callback for closing bill
    const handleCloseBill = useCallback(() => {
        if (selectedTable) {
            onCloseBill(selectedTable.id);
        }
    }, [selectedTable, onCloseBill]);

    // Callback for toggling service charge
    const handleToggleServiceCharge = useCallback(() => {
        if (selectedTable) {
            onToggleServiceCharge(selectedTable.id);
        }
    }, [selectedTable, onToggleServiceCharge]);

    // Callback for updating item quantity
    const handleUpdateQuantity = useCallback((itemId, newQuantity) => {
        if (selectedTable) {
            onUpdateQuantity(selectedTable.id, itemId, newQuantity);
        }
    }, [selectedTable, onUpdateQuantity]);

    // Callback for removing item
    const handleRemoveItem = useCallback((itemId) => {
        if (selectedTable) {
            onRemoveItem(selectedTable.id, itemId);
        }
    }, [selectedTable, onRemoveItem]);

    // Memoize bill calculations
    const billCalculations = useMemo(() => {
        if (!bill) return null;
        
        const subtotal = bill.total;
        const serviceCharge = bill.serviceCharge ? subtotal * 0.1 : 0;
        const total = subtotal + serviceCharge;
        const itemCount = bill.items.reduce((sum, item) => sum + item.quantity, 0);
        
        return {
            subtotal,
            serviceCharge,
            total,
            itemCount
        };
    }, [bill]);

    if (!selectedTable) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">🍽️</div>
                    <h2 className="text-xl font-semibold mb-2">Select a Table</h2>
                    <p className="text-text">Click on a table to view or create orders</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-[24px] font-[500]">
                    Table {selectedTable.tableNumber} - Order Summary
                </h1>
                {bill && bill.status === 'active' && (
                    <SecondaryButton onClick={handleCloseBill}>
                        Close Bill
                    </SecondaryButton>
                )}
            </div>

            {!bill || bill.status === 'closed' ? (
                // No active bill - show create bill option
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-6xl mb-4">📋</div>
                        <h2 className="text-xl font-semibold mb-4">No Active Bill</h2>
                        <p className="text-text mb-6">Create a new bill for Table {selectedTable.tableNumber}</p>
                            <PrimaryButton onClick={handleCreateBill} className='flex items-center gap-1'>
                            <FaReceipt className="mr-2" />
                            Create New Bill
                        </PrimaryButton>
                    </div>
                </div>
            ) : (
                // Active bill exists - show order management
                <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
                    {/* Menu Items Section */}
                    <div className="flex-1 flex flex-col">
                        <h3 className="text-lg font-semibold mb-3">Menu Items</h3>
                        
                        {/* Category Filter */}
                        <div className="flex gap-2 mb-4 overflow-x-auto">
                            {categories.map(category => (
                                <button
                                    key={category}
                                    onClick={() => handleCategorySelect(category)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                                        selectedCategory === category
                                            ? 'bg-primaryColor text-white'
                                            : 'bg-white text-black hover:bg-gray-100'
                                    }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>

                        {/* Menu Items Grid */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {filteredMenuItems.map(item => (
                                    <MenuItem 
                                        key={item.id}
                                        item={item} 
                                        onAddItem={onAddItem} 
                                        selectedTable={selectedTable}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Current Bill Section */}
                    <div className="w-full md:w-80 bg-white rounded-lg p-4 border border-gray-200 flex flex-col">
                        <h3 className="text-lg font-semibold mb-3">Current Bill</h3>
                        
                        {bill.items.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-4xl mb-2">🛒</div>
                                    <p className="text-text">No items added yet</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Bill Items */}
                                <div className="flex-1 overflow-y-auto mb-4">
                                    {bill.items.map(item => (
                                        <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                                            <div className="flex-1">
                                                <h5 className="font-medium text-sm">{item.name}</h5>
                                                <p className="text-xs text-gray-600">LKR {item.price} each</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                                                >
                                                    <FaMinus size={10} />
                                                </button>
                                                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                                <button
                                                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                                    className="p-1 text-green-500 hover:bg-green-50 rounded"
                                                >
                                                    <FaPlus size={10} />
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    className="p-1 text-red-500 hover:bg-red-50 rounded ml-2"
                                                >
                                                    <FaTrash size={10} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Bill Total */}
                                <div className="border-t border-gray-200 pt-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-gray-600">Subtotal:</span>
                                        <span className="font-medium">LKR {billCalculations.subtotal.toFixed(2)}</span>
                                    </div>
                                    
                                    {/* Service Charge Toggle */}
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-600">Service Charge (10%):</span>
                                            <input
                                                type="checkbox"
                                                checked={bill.serviceCharge}
                                                onChange={handleToggleServiceCharge}
                                                className="w-4 h-4 appearance-none rounded 
                                                            border border-gray-300 bg-white
                                                            checked:bg-primaryColor checked:border-primaryColor
                                                            focus:ring-0 focus:outline-none
                                                            relative flex items-center justify-center
                                                            checked:after:content-['✓'] 
                                                            checked:after:absolute 
                                                            checked:after:text-white 
                                                            checked:after:text-xs 
                                                            checked:after:font-bold
                                                            checked:after:left-1/2 
                                                            checked:after:top-1/2
                                                            checked:after:transform 
                                                            checked:after:-translate-x-1/2 
                                                            checked:after:-translate-y-1/2"
                                                />                                            
                                        </div>
                                        <span className="font-medium">
                                            LKR {billCalculations.serviceCharge.toFixed(2)}
                                        </span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center text-lg font-bold border-t border-gray-200 pt-2">
                                        <span>Total:</span>
                                        <span className="text-primaryColor">
                                            LKR {billCalculations.total.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                {/* Bill Info */}
                                <div className="mt-4 text-xs text-gray-500">
                                    <p>Bill Created: {new Date(bill.createdAt).toLocaleString()}</p>
                                    <p>Items: {billCalculations.itemCount}</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
