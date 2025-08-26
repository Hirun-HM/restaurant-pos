import React, { useState, useCallback, useMemo, memo } from 'react';
import { PrimaryButton, SecondaryButton } from '../../../../components/Button';
import { FaPlus, FaMinus, FaTrash, FaReceipt } from 'react-icons/fa';
import MenuItem from './MenuItem';
import ConfirmationModal from '../../../../components/ConfirmationModal';

const OrderSummary = memo(function OrderSummary({
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
    const [showPaymentModal, setShowPaymentModal] = useState(false);

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

    // Memoize date formatting function
    const formatBillDate = useCallback((date) => {
        return new Date(date).toLocaleString();
    }, []);

    // Callback for printing bill
    const handlePrintBill = useCallback(() => {
        if (!bill || !selectedTable) return;
        
        // Create print content
        const printContent = `
            <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="margin: 0; font-size: 24px;">Restaurant Bill</h2>
                    <p style="margin: 5px 0;">Table ${selectedTable.tableNumber}</p>
                    <p style="margin: 5px 0; font-size: 12px;">${formatBillDate(bill.createdAt)}</p>
                </div>
                
                <div style="border-top: 2px solid #000; padding-top: 10px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 1px solid #000;">
                                <th style="text-align: left; padding: 5px 0;">Item</th>
                                <th style="text-align: center; padding: 5px 0;">Qty</th>
                                <th style="text-align: right; padding: 5px 0;">Price</th>
                                <th style="text-align: right; padding: 5px 0;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${bill.items.map(item => `
                                <tr>
                                    <td style="padding: 3px 0; font-size: 12px;">
                                        ${item.name}
                                    </td>
                                    <td style="text-align: center; padding: 3px 0;">${item.quantity}</td>
                                    <td style="text-align: right; padding: 3px 0;">LKR ${item.price}</td>
                                    <td style="text-align: right; padding: 3px 0;">LKR ${(item.price * item.quantity).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div style="border-top: 2px solid #000; padding-top: 10px; margin-top: 15px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>Subtotal:</span>
                        <span>LKR ${billCalculations.subtotal.toFixed(2)}</span>
                    </div>
                    ${bill.serviceCharge ? `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>Service Charge (10%):</span>
                            <span>LKR ${billCalculations.serviceCharge.toFixed(2)}</span>
                        </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; border-top: 1px solid #000; padding-top: 5px;">
                        <span>Total:</span>
                        <span>LKR ${billCalculations.total.toFixed(2)}</span>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 20px; font-size: 12px;">
                    <p>Thank you for dining with us!</p>
                    <p>Items: ${billCalculations.itemCount}</p>
                </div>
            </div>
        `;
        
        // Open print window
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Bill - Table ${selectedTable.tableNumber}</title>
                    <style>
                        @media print {
                            body { margin: 0; }
                        }
                    </style>
                </head>
                <body>
                    ${printContent}
                    <script>
                        window.onload = function() {
                            window.print();
                            window.onafterprint = function() {
                                window.close();
                            }
                        }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    }, [bill, selectedTable, billCalculations, formatBillDate]);

    // Callback for payment completion
    const handlePaymentComplete = useCallback(() => {
        setShowPaymentModal(true);
    }, []);

    const confirmPayment = useCallback(() => {
        if (selectedTable) {
            handleCloseBill();
        }
    }, [selectedTable, handleCloseBill]);

    const cancelPayment = useCallback(() => {
        setShowPaymentModal(false);
    }, []);

    // Memoize bill status checks
    const billStatus = useMemo(() => {
        return {
            hasActiveBill: bill && bill.status === 'active',
            hasItems: bill && bill.items && bill.items.length > 0,
            isNoBill: !bill || bill.status === 'closed'
        };
    }, [bill]);

    // Memoize the no table selected content
    const noTableContent = useMemo(() => (
        <div className="h-full flex items-center justify-center">
            <div className="text-center">
                <div className="text-6xl mb-4">🍽️</div>
                <h2 className="text-xl font-semibold mb-2">Select a Table</h2>
                <p className="text-text">Click on a table to view or create orders</p>
            </div>
        </div>
    ), []);

    // Memoize the no active bill content
    const noActiveBillContent = useMemo(() => (
        <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center text-center">
                <div className="text-6xl mb-4">📋</div>
                <h2 className="text-xl font-semibold mb-4">No Active Bill</h2>
                <p className="text-text mb-6">Create a new bill for Table {selectedTable?.tableNumber}</p>
                <PrimaryButton onClick={handleCreateBill} className='flex items-center gap-1'>
                    <FaReceipt className="mr-2" />
                    Create New Bill
                </PrimaryButton>
            </div>
        </div>
    ), [selectedTable?.tableNumber, handleCreateBill]);

    // Memoize the empty cart content
    const emptyCartContent = useMemo(() => (
        <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
                <div className="text-4xl mb-2">🛒</div>
                <p className="text-text">No items added yet</p>
            </div>
        </div>
    ), []);

    if (!selectedTable) {
        return noTableContent;
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-[24px] font-[500]">
                    Table {selectedTable.tableNumber} - Order Summary
                </h1>
                {billStatus.hasActiveBill && (
                    <SecondaryButton onClick={handleCloseBill}>
                        Close Bill
                    </SecondaryButton>
                )}
            </div>

            {billStatus.isNoBill ? (
                // No active bill - show create bill option
                noActiveBillContent
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
                    <div className="w-full overflow-y-auto md:w-80 bg-white rounded-lg p-4 border border-gray-200 flex flex-col">
                        <h3 className="text-lg font-semibold mb-3">Current Bill</h3>
                        
                        {!billStatus.hasItems ? (
                            emptyCartContent
                        ) : (
                            <>
                                {/* Bill Items */}
                                <div className="flex-1 overflow-y-auto mb-4">
                                    {bill.items.map(item => (
                                        <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                                            <div className="flex-1">
                                                <h5 className="font-medium text-sm">{item.name}</h5>
                                                <p className="text-xs text-gray-600">
                                                    LKR {item.price} each
                                                </p>
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

                                {/* Action Buttons */}
                                <div className="mt-4 space-y-2">
                                    <PrimaryButton 
                                        onClick={() => handlePrintBill()}
                                        className="w-full flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a1 1 0 001-1v-4a1 1 0 00-1-1H9a1 1 0 00-1 1v4a1 1 0 001 1zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                        </svg>
                                        Print Receipt
                                    </PrimaryButton>
                                    
                                    <SecondaryButton 
                                        onClick={() => handlePaymentComplete()}
                                        className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 border-green-500 hover:border-green-600"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Payment Complete
                                    </SecondaryButton>
                                </div>

                                {/* Bill Info */}
                                <div className="mt-4 text-xs text-gray-500">
                                    <p>Bill Created: {formatBillDate(bill.createdAt)}</p>
                                    <p>Items: {billCalculations.itemCount}</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Payment Confirmation Modal */}
            <ConfirmationModal
                isOpen={showPaymentModal}
                onClose={cancelPayment}
                onConfirm={confirmPayment}
                title="Complete Payment"
                message={selectedTable && billCalculations ? 
                    `Complete payment for Table ${selectedTable.tableNumber}?\n\nTotal: LKR ${billCalculations.total.toFixed(2)}\n\nThis will close the bill and cannot be undone.` :
                    'Complete this payment?'
                }
                confirmText="Complete Payment"
                cancelText="Cancel"
                type="info"
            />
        </div>
    );
});

export default OrderSummary;
