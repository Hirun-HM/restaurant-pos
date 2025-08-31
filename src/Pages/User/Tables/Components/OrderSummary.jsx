import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { PrimaryButton, SecondaryButton } from '../../../../components/Button';
import { FaPlus, FaMinus, FaTrash, FaReceipt } from 'react-icons/fa';
import MenuItem from './MenuItem';
import ConfirmationModal from '../../../../components/ConfirmationModal';
import { useLiquor } from '../../../../hooks/useLiquor';
import { stockConsumptionService } from '../../../../services/stockConsumptionService';

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
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [paymentResult, setPaymentResult] = useState(null);
    
    // Use the custom liquor hook
    const { 
        liquorItems, 
        loading: isLoadingLiquor, 
        error: liquorError, 
        fetchLiquorItems 
    } = useLiquor();

    // Fetch liquor items from database
    useEffect(() => {
        fetchLiquorItems();
    }, [fetchLiquorItems]);

    // Debug logging
    useEffect(() => {
        console.log('OrderSummary - Liquor data:', {
            liquorItems: liquorItems.length,
            loading: isLoadingLiquor,
            error: liquorError
        });
    }, [liquorItems, isLoadingLiquor, liquorError]);

    // Transform liquor items to match our menu item format
    const transformedLiquorItems = useMemo(() => {
        return liquorItems.map(item => {
            let category;
            switch (item.type) {
                case 'hard_liquor':
                    category = 'Hard Liquor';
                    break;
                case 'beer':
                    category = 'Beer';
                    break;
                case 'wine':
                    category = 'Wine';
                    break;
                case 'cigarettes':
                    category = 'Cigarettes';
                    break;
                default:
                    category = 'Other';
            }

            return {
                id: item._id,
                name: item.name,
                brand: item.brand,
                price: item.pricePerBottle || 0,
                category: category,
                type: item.type,
                bottleVolume: item.bottleVolume,
                portions: item.portions || [],
                alcoholPercentage: item.alcoholPercentage,
                stock: {
                    bottlesInStock: item.bottlesInStock || 0,
                    millilitersRemaining: item.totalVolumeRemaining || item.currentBottleVolume || 0
                }
            };
        });
    }, [liquorItems]);

    // Combine menu items (food, etc.) with liquor items from database
    const allMenuItems = useMemo(() => {
        // Filter out old liquor items from localStorage to avoid duplicates
        const nonLiquorMenuItems = menuItems.filter(item => 
            item.category !== 'Liquor' && item.category !== 'Cigarettes'
        );
        return [...nonLiquorMenuItems, ...transformedLiquorItems];
    }, [menuItems, transformedLiquorItems]);

    // Memoize categories to prevent recalculation on every render
    const categories = useMemo(() => {
        const allCategories = ['All', ...new Set(allMenuItems.map(item => item.category))];
        // Ensure liquor categories are in a specific order
        const orderedCategories = ['All'];
        const liquorCategories = ['Hard Liquor', 'Beer', 'Wine', 'Cigarettes'];
        const otherCategories = allCategories.filter(cat => 
            cat !== 'All' && !liquorCategories.includes(cat)
        );
        
        liquorCategories.forEach(cat => {
            if (allCategories.includes(cat)) {
                orderedCategories.push(cat);
            }
        });
        
        orderedCategories.push(...otherCategories);
        return orderedCategories;
    }, [allMenuItems]);

    // Memoize filtered menu items
    const filteredMenuItems = useMemo(() => {
        return selectedCategory === 'All' 
            ? allMenuItems 
            : allMenuItems.filter(item => item.category === selectedCategory);
    }, [selectedCategory, allMenuItems]);

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

    // Memoize quantity control buttons configuration
    const quantityControlButtons = useMemo(() => [
        {
            id: 'decrease',
            icon: FaMinus,
            onClick: (itemId, quantity) => handleUpdateQuantity(itemId, quantity - 1),
            className: "p-1 text-red-500 hover:bg-red-50 rounded",
            size: 10
        },
        {
            id: 'increase',
            icon: FaPlus,
            onClick: (itemId, quantity) => handleUpdateQuantity(itemId, quantity + 1),
            className: "p-1 text-green-500 hover:bg-green-50 rounded",
            size: 10
        },
        {
            id: 'delete',
            icon: FaTrash,
            onClick: (itemId) => handleRemoveItem(itemId),
            className: "p-1 text-red-500 hover:bg-red-50 rounded ml-2",
            size: 10
        }
    ], [handleUpdateQuantity, handleRemoveItem]);

    // Memoized render function for quantity controls
    const renderQuantityControls = useCallback((item) => {
        return (
            <div className="flex items-center gap-2">
                {quantityControlButtons.map((button) => {
                    const IconComponent = button.icon;
                    
                    if (button.id === 'decrease' || button.id === 'increase') {
                        return (
                            <button
                                key={button.id}
                                onClick={() => button.onClick(item.id, item.quantity)}
                                className={button.className}
                            >
                                <IconComponent size={button.size} />
                            </button>
                        );
                    } else if (button.id === 'delete') {
                        return (
                            <button
                                key={button.id}
                                onClick={() => button.onClick(item.id)}
                                className={button.className}
                            >
                                <IconComponent size={button.size} />
                            </button>
                        );
                    }
                    return null;
                })}
                <span className="w-8 text-center text-sm font-medium text-other1">{item.quantity}</span>
            </div>
        );
    }, [quantityControlButtons]);

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
                
                <div style="border-top: 2px solid #003151; padding-top: 10px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 1px solid #003151;">
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
                
                <div style="border-top: 2px solid #003151; padding-top: 10px; margin-top: 15px;">
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
                    <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; border-top: 1px solid #003151; padding-top: 5px;">
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

    // Callback for payment completion
    const confirmPayment = useCallback(async () => {
        if (selectedTable && bill) {
            setIsProcessingPayment(true);
            try {
                // Process stock consumption for liquor items
                const billData = {
                    billId: bill.id,
                    tableNumber: selectedTable.tableNumber,
                    items: bill.items,
                    total: billCalculations.total,
                    serviceCharge: bill.serviceCharge
                };
                
                const result = await stockConsumptionService.processBillPayment(billData);
                setPaymentResult(result);
                
                // Show success message and close bill
                console.log('Stock consumption processed:', result);
                handleCloseBill();
                
                // Refresh liquor items to show updated stock
                fetchLiquorItems();
                
            } catch (error) {
                console.error('Error processing payment:', error);
                alert('Error processing payment and updating stock. Please try again.');
            } finally {
                setIsProcessingPayment(false);
            }
        }
        setShowPaymentModal(false);
    }, [selectedTable, bill, billCalculations, handleCloseBill, fetchLiquorItems]);

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
                <h2 className="text-xl font-semibold text-other1 mb-2">Select a Table</h2>
                <p className="text-text">Click on a table to view or create orders</p>
            </div>
        </div>
    ), []);

    // Memoize the no active bill content
    const noActiveBillContent = useMemo(() => (
        <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center text-center">
                <div className="text-6xl mb-4">📋</div>
                <h2 className="text-xl font-semibold text-other1 mb-4">No Active Bill</h2>
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
                <h1 className="text-[24px] font-[500] text-other1">
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
                        <h3 className="text-lg font-semibold text-other1 mb-3">Menu Items</h3>
                        
                        {/* Category Filter */}
                        <div className="flex gap-2 mb-4 overflow-x-auto">
                            {categories.map(category => (
                                <button
                                    key={category}
                                    onClick={() => handleCategorySelect(category)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                                        selectedCategory === category
                                            ? 'bg-primaryColor text-white'
                                            : 'bg-white text-other1 hover:bg-gray-100'
                                    }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>

                        {/* Menu Items Grid */}
                        <div className="flex-1 overflow-y-auto">
                            {isLoadingLiquor ? (
                                <div className="flex items-center justify-center h-32">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primaryColor mx-auto"></div>
                                        <p className="text-sm text-gray-600 mt-2">Loading liquor items...</p>
                                    </div>
                                </div>
                            ) : liquorError ? (
                                <div className="flex items-center justify-center h-32">
                                    <div className="text-center">
                                        <p className="text-sm text-red-600">{liquorError}</p>
                                        <button 
                                            onClick={() => window.location.reload()}
                                            className="text-xs text-blue-600 hover:underline mt-1"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                </div>
                            ) : filteredMenuItems.length === 0 ? (
                                <div className="flex items-center justify-center h-32">
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600">No items found in this category</p>
                                    </div>
                                </div>
                            ) : (
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
                            )}
                        </div>
                    </div>

                    {/* Current Bill Section */}
                    <div className="w-full overflow-y-auto md:w-80 bg-white rounded-lg p-4 border border-gray-200 flex flex-col">
                        <h3 className="text-lg font-semibold text-other1 mb-3">Current Bill</h3>
                        
                        {!billStatus.hasItems ? (
                            emptyCartContent
                        ) : (
                            <>
                                {/* Bill Items */}
                                <div className="flex-1 overflow-y-auto mb-4">
                                    {bill.items.map(item => (
                                        <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                                            <div className="flex-1">
                                                <h5 className="font-medium text-other1 text-sm">{item.name}</h5>
                                                <p className="text-xs text-gray-600">
                                                    LKR {item.price} each
                                                </p>
                                            </div>
                                            {renderQuantityControls(item)}
                                        </div>
                                    ))}
                                </div>

                                {/* Bill Total */}
                                <div className="border-t border-gray-200 pt-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-gray-600">Subtotal:</span>
                                        <span className="font-medium text-other1">LKR {billCalculations.subtotal.toFixed(2)}</span>
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
                                        <span className="font-medium text-other1">
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

// PropTypes validation
OrderSummary.propTypes = {
    selectedTable: PropTypes.object,
    bill: PropTypes.object,
    menuItems: PropTypes.array.isRequired,
    onCreateBill: PropTypes.func.isRequired,
    onAddItem: PropTypes.func.isRequired,
    onRemoveItem: PropTypes.func.isRequired,
    onUpdateQuantity: PropTypes.func.isRequired,
    onToggleServiceCharge: PropTypes.func.isRequired,
    onCloseBill: PropTypes.func.isRequired
};

export default OrderSummary;
