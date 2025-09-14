import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import TableCard from './Components/TableCard';
import OrderSummary from './Components/OrderSummary';
import ConfirmationModal from '../../../components/ConfirmationModal';
import MessageModal from './Components/MessageModal';
import PaymentHistory from './Components/PaymentHistory';
import { useFoodItems } from '../../../hooks/useFoodItems';
import { useLiquor } from '../../../hooks/useLiquor';
import { orderService } from '../../../services/orderService';

export default function TableManagement({tableList = []}) {
    // Use custom hooks to fetch real menu data from API
    const { 
        getTransformedFoodItemsForMenu, 
        fetchFoodItems
    } = useFoodItems();
    
    const { 
        liquorItems, 
        fetchLiquorItems
    } = useLiquor();

    // Fetch menu data on component mount
    useEffect(() => {
        const fetchMenuData = async () => {
            try {
                await Promise.all([
                    fetchFoodItems(),
                    fetchLiquorItems()
                ]);
            } catch (error) {
                console.error('Error fetching menu data:', error);
            }
        };

        fetchMenuData();
    }, [fetchFoodItems, fetchLiquorItems]);

    // Combine food items and liquor items for the menu
    const menuItems = useMemo(() => {
        const foodItems = getTransformedFoodItemsForMenu();
        
        // Transform liquor items to match menu format
        const transformedLiquorItems = liquorItems.map(item => {
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
                case 'bites':
                    category = 'Bites';
                    break;
                default:
                    category = 'Other';
            }

            // For bites items, use plate-based pricing and stock
            if (item.type === 'bites') {
                return {
                    id: item._id,
                    name: item.name,
                    brand: item.brand,
                    price: item.pricePerPlate || 0,
                    category: category,
                    type: item.type,
                    stock: {
                        platesInStock: item.platesInStock || 0
                    },
                    isAvailable: (item.platesInStock || 0) > 0
                };
            }

            // For other liquor items, use bottle-based pricing and stock
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
                // Cigarette-specific fields
                cigaretteIndividualPrice: item.cigaretteIndividualPrice,
                cigarettesPerPack: item.cigarettesPerPack || 20,
                stock: {
                    bottlesInStock: item.bottlesInStock || 0,
                    millilitersRemaining: item.totalVolumeRemaining || item.currentBottleVolume || 0
                },
                isAvailable: (item.bottlesInStock || 0) > 0
            };
        });

        return [...foodItems, ...transformedLiquorItems];
    }, [getTransformedFoodItemsForMenu, liquorItems]);

    // Always start with no table selected (reset on page refresh)
    const [selectedTable, setSelectedTable] = useState(null);
    
    // State for confirmation modal
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [showClearAllModal, setShowClearAllModal] = useState(false);
    const [billToClose, setBillToClose] = useState(null);
    
    // State for message modal
    const [messageModal, setMessageModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });
    
    // State for payment history modal
    const [showPaymentHistory, setShowPaymentHistory] = useState(false);
    
    // Load bills from localStorage on component mount
    const [bills, setBills] = useState(() => {
        try {
            const savedBills = localStorage.getItem('restaurant-bills');
            return savedBills ? JSON.parse(savedBills) : {};
        } catch (error) {
            console.error('Error loading bills from localStorage:', error);
            return {};
        }
    });

    // Sync with database state on component mount
    useEffect(() => {
        const syncWithDatabase = async () => {
            try {
                // Check if we have any cached bills
                const cachedBills = Object.keys(bills);
                if (cachedBills.length > 0) {
                    console.log('🔄 Syncing cached bills with database...');
                    
                    // Verify each cached bill exists in database
                    for (const tableId of cachedBills) {
                        const bill = bills[tableId];
                        if (bill.orderId) {
                            try {
                                // Try to fetch the order from database
                                const response = await fetch(`http://localhost:3001/api/orders/${bill.orderId}`);
                                if (!response.ok) {
                                    console.log(`⚠️ Order ${bill.orderId} not found in database, removing from cache`);
                                    // Remove invalid bill from cache
                                    setBills(prevBills => {
                                        const newBills = { ...prevBills };
                                        delete newBills[tableId];
                                        return newBills;
                                    });
                                }
                            } catch (error) {
                                console.log(`⚠️ Error checking order ${bill.orderId}, removing from cache:`, error.message);
                                // Remove invalid bill from cache
                                setBills(prevBills => {
                                    const newBills = { ...prevBills };
                                    delete newBills[tableId];
                                    return newBills;
                                });
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error syncing with database:', error);
            }
        };

        // Run sync after component mounts
        const timer = setTimeout(syncWithDatabase, 1000);
        return () => clearTimeout(timer);
    }, []); // Empty dependency array - run only on mount

    useEffect(() => {
        try {
            localStorage.setItem('restaurant-bills', JSON.stringify(bills));
        } catch (error) {
            console.error('Error saving bills to localStorage:', error);
        }
    }, [bills]);

    // Helper function to show message modal
    const showMessage = useCallback((title, message, type = 'info') => {
        setMessageModal({
            isOpen: true,
            title,
            message,
            type
        });
    }, []);

    const closeMessageModal = useCallback(() => {
        setMessageModal({
            isOpen: false,
            title: '',
            message: '',
            type: 'info'
        });
        
        // Ensure that the close bill modal is closed and state is reset
        if (showCloseModal) {
            setShowCloseModal(false);
            setBillToClose(null);
        }
    }, [showCloseModal]);

    const handleTableClick = useCallback((table) => {
        setSelectedTable(table);
    }, []);

    const handleCreateBill = useCallback(async (tableId) => {
        try {
            // Create order in database immediately with status "created"
            const orderResponse = await orderService.createOrder(tableId);
            
            if (orderResponse && orderResponse.success) {
                const newBill = {
                    id: Date.now(),
                    orderId: orderResponse.data._id, // Store the database order ID
                    tableId: tableId,
                    items: [],
                    total: 0,
                    serviceCharge: false,
                    createdAt: new Date(),
                    status: 'created' // This matches the database status
                };
                setBills(prevBills => ({
                    ...prevBills,
                    [tableId]: newBill
                }));
            } else {
                throw new Error('Failed to create order in database');
            }
        } catch (error) {
            console.error('Error creating bill:', error);
            showMessage(
                'Failed to Create Bill',
                'Failed to create bill. Please try again.',
                'error'
            );
        }
    }, [showMessage]);

    const handleAddItemToBill = useCallback(async (tableId, menuItem, quantity = 1) => {
        setBills(prevBills => {
            if (!prevBills[tableId]) return prevBills;

            const existingItemIndex = prevBills[tableId].items.findIndex(item => item.id === menuItem.id);
            let updatedItems;

            if (existingItemIndex >= 0) {
                // Update existing item quantity
                updatedItems = prevBills[tableId].items.map((item, index) => 
                    index === existingItemIndex 
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                // Add new item
                updatedItems = [...prevBills[tableId].items, { ...menuItem, quantity }];
            }

            const total = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            const updatedBill = {
                ...prevBills[tableId],
                items: updatedItems,
                total,
                status: updatedItems.length > 0 ? 'pending' : 'created' // Change status when items are added
            };

            // Update order in database asynchronously
            if (prevBills[tableId].orderId) {
                orderService.updateOrder(prevBills[tableId].orderId, updatedItems, total)
                    .catch(error => {
                        console.error('Error updating order in database:', error);
                        // Don't show error to user for now, just log it
                    });
            }

            return {
                ...prevBills,
                [tableId]: updatedBill
            };
        });
    }, []);

    const handleRemoveItemFromBill = useCallback(async (tableId, itemId) => {
        setBills(prevBills => {
            if (!prevBills[tableId]) return prevBills;

            const updatedItems = prevBills[tableId].items.filter(item => item.id !== itemId);
            const total = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            const updatedBill = {
                ...prevBills[tableId],
                items: updatedItems,
                total,
                status: updatedItems.length > 0 ? 'pending' : 'created' // Update status based on items
            };

            // Update order in database asynchronously
            if (prevBills[tableId].orderId) {
                orderService.updateOrder(prevBills[tableId].orderId, updatedItems, total)
                    .catch(error => {
                        console.error('Error updating order in database:', error);
                    });
            }

            return {
                ...prevBills,
                [tableId]: updatedBill
            };
        });
    }, []);

    const handleUpdateItemQuantity = useCallback(async (tableId, itemId, newQuantity) => {
        setBills(prevBills => {
            if (!prevBills[tableId] || newQuantity <= 0) return prevBills;

            const updatedItems = prevBills[tableId].items.map(item => 
                item.id === itemId 
                    ? { ...item, quantity: newQuantity }
                    : item
            );

            const total = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            const updatedBill = {
                ...prevBills[tableId],
                items: updatedItems,
                total,
                status: updatedItems.length > 0 ? 'pending' : 'created' // Update status based on items
            };

            // Update order in database asynchronously
            if (prevBills[tableId].orderId) {
                orderService.updateOrder(prevBills[tableId].orderId, updatedItems, total)
                    .catch(error => {
                        console.error('Error updating order in database:', error);
                    });
            }

            return {
                ...prevBills,
                [tableId]: updatedBill
            };
        });
    }, []);

    const handleToggleServiceCharge = useCallback((tableId) => {
        setBills(prevBills => {
            if (!prevBills[tableId]) return prevBills;

            return {
                ...prevBills,
                [tableId]: {
                    ...prevBills[tableId],
                    serviceCharge: !prevBills[tableId].serviceCharge
                }
            };
        });
    }, []);

    const handleCloseBill = useCallback((tableId) => {
        // No validation required - cashiers can close bills even without items
        console.log('🔍 Closing bill for table:', tableId);
        const bill = bills[tableId];
        console.log('🔍 Bill details:', {
            hasItems: bill?.items?.length > 0,
            itemCount: bill?.items?.length || 0,
            status: bill?.status
        });
        
        setBillToClose(tableId);
        setShowCloseModal(true);
    }, [bills]);

    const confirmCloseBill = useCallback(async () => {
        if (!billToClose || !bills[billToClose]) return;

        const bill = bills[billToClose];

        console.log('🔍 Current bill structure:', JSON.stringify(bill, null, 2));

        try {
            // Process order payment and consume stock (allowing empty bills)
            // Enhanced items with proper liquor and bites identification
            const enhancedItems = (bill.items || []).map(item => {
                // Check if this is a liquor item
                const isLiquorItem = item.type && ['hard_liquor', 'beer', 'wine', 'cigarettes'].includes(item.type);
                // Check if this is a bites item
                const isBitesItem = item.type === 'bites';
                
                if (isLiquorItem) {
                    // For liquor items, ensure we have all necessary properties
                    const enhancedItem = {
                        ...item,
                        // Determine the original liquor ID for database lookup
                        originalItemId: item.originalItemId || (
                            item.id && item.id.includes('_') 
                                ? item.id.split('_')[0] // Extract original ID from composite ID
                                : item.id // Use the ID as is if it's not composite
                        ),
                        // Add portion information if available
                        portion: item.selectedPortion || item.portion,
                        // Add liquor-specific properties
                        bottleVolume: item.bottleVolume,
                        portions: item.portions,
                        // Determine if this is a full bottle or portion sale
                        isFullBottle: item.id?.includes('_full') || item.isFullBottle,
                        // For cigarettes, check if individual sale
                        isIndividual: item.id?.includes('_individual') || 
                                    (item.type === 'cigarettes' && item.price !== item.pricePerBottle && !item.id?.includes('_pack'))
                    };
                    
                    console.log(`🍺 Enhanced liquor item: ${item.name}`, {
                        originalId: item.id,
                        extractedId: enhancedItem.originalItemId,
                        type: item.type,
                        isFullBottle: enhancedItem.isFullBottle,
                        isIndividual: enhancedItem.isIndividual,
                        portion: enhancedItem.portion
                    });
                    
                    return enhancedItem;
                }
                
                if (isBitesItem) {
                    // For bites items, return with proper structure for stock consumption
                    const enhancedBitesItem = {
                        ...item,
                        originalItemId: item.id, // Use the ID directly for bites
                        type: 'bites',
                        // Bites are sold by plate count
                        platesInStock: item.stock?.platesInStock || item.platesInStock || 0
                    };
                    
                    console.log(`🍽️ Enhanced bites item: ${item.name}`, {
                        originalId: item.id,
                        type: item.type,
                        quantity: item.quantity,
                        platesInStock: enhancedBitesItem.platesInStock
                    });
                    
                    return enhancedBitesItem;
                }
                
                // For food items, return as-is
                return item;
            });

            const orderData = {
                orderId: bill.orderId, // Pass the existing order ID
                tableId: String(billToClose), // Ensure it's a string
                items: enhancedItems,
                total: bill.total,
                serviceCharge: bill.serviceCharge || false,
                paymentMethod: 'cash',
                customerId: null
            };

            console.log('🔍 Processing payment for table:', billToClose);

            // Call the order service to process payment and consume stock
            const result = await orderService.processOrderPayment(orderData);
            
            console.log('🔍 Sent order data:', JSON.stringify(orderData, null, 2));
            console.log('Payment result:', result?.success ? 'SUCCESS' : 'FAILED');
            
            // Handle successful payment
            if (result && result.success === true) {
                // Clear selected table and close modal FIRST
                setSelectedTable(null);
                setBillToClose(null);
                setShowCloseModal(false);
                
                // Update bill status to closed
                setBills(prevBills => ({
                    ...prevBills,
                    [billToClose]: {
                        ...prevBills[billToClose],
                        status: 'closed',
                        closedAt: new Date(),
                        orderId: result.data?.orderId || `ORDER-${Date.now()}`,
                        stockConsumptions: result.data?.stockConsumptions || 0,
                        liquorConsumptions: result.data?.liquorConsumptions || 0
                    }
                }));

                // Build success message with both stock and liquor consumption details
                let successMessage;
                
                // Check if this is an empty bill
                const isEmpty = !enhancedItems || enhancedItems.length === 0;
                
                // Define stock and liquor counts for use throughout the function
                const stockCount = result.data?.stockConsumptions || 0;
                const liquorCount = result.data?.liquorConsumptions || 0;
                
                if (isEmpty) {
                    successMessage = `Bill closed successfully!\n\nOrder ID: ${result.data?.orderId}\n\nThis was an empty bill - no items were ordered.\nNo stock consumption or revenue recorded.`;
                } else {
                    successMessage = `Payment processed successfully!\n\nOrder ID: ${result.data?.orderId}`;
                }
                
                // Add stock consumption info (only for non-empty bills)
                if (!isEmpty) {
                    if (stockCount > 0) {
                        successMessage += `\nFood stock items consumed: ${stockCount}`;
                    }
                    
                    // Add liquor consumption info
                    if (liquorCount > 0) {
                        successMessage += `\nLiquor items consumed: ${liquorCount}`;
                    }
                    
                    if (stockCount === 0 && liquorCount === 0) {
                        successMessage += `\nNo stock consumption required`;
                    }
                }
                
                // Add information about missed ingredients if any
                if (result.data?.missedIngredients && result.data.missedIngredients.length > 0) {
                    successMessage += `\n\nNote: Some ingredients were not available in stock:\n${result.data.missedIngredients.map(ing => `• ${ing.name} (${ing.reason || 'Not in stock'})`).join('\n')}`;
                    successMessage += `\n\nOnly available ingredients were deducted from stock.`;
                } else if (stockCount > 0) {
                    successMessage += `\n\nAll food ingredients were processed successfully.`;
                }
                
                // Add liquor consumption details if available
                if (result.data?.liquorConsumptionDetails && result.data.liquorConsumptionDetails.length > 0) {
                    successMessage += `\n\nLiquor consumption details:`;
                    result.data.liquorConsumptionDetails.forEach(detail => {
                        if (detail.error) {
                            successMessage += `\n• ${detail.itemName}: ${detail.error}`;
                        } else {
                            successMessage += `\n• ${detail.itemName}: ${detail.note}`;
                        }
                    });
                }
                
                successMessage += `\n\nTable ${selectedTable?.tableNumber || billToClose} is now available.`;

                // Show success modal with appropriate title
                const modalTitle = isEmpty ? 'Bill Closed' : 'Payment Successful';
                showMessage(
                    modalTitle,
                    successMessage,
                    'success'
                );
            } else {
                // Handle failed response - this should not happen with the updated backend
                console.error('❌ Unexpected response format:', result);
                throw new Error(result?.message || 'Unexpected response from server');
            }

        } catch (error) {
            console.error('❌ Error processing order payment:', error);
            
            // Show user-friendly error message
            let errorMessage = error.message || 'Unknown error occurred';
            let errorDetails = '';
            
            // Try to get more detailed error information
            if (error.response && error.response.data) {
                errorMessage = error.response.data.message || errorMessage;
                if (error.response.data.error) {
                    errorDetails = `\n\nTechnical details: ${error.response.data.error}`;
                }
            }
            
            // Check if this is a network error
            if (errorMessage.includes('fetch') || errorMessage.includes('Network') || errorMessage.includes('Failed to fetch')) {
                showMessage(
                    'Network Error',
                    `Unable to connect to server.\n\nPlease check:\n• Backend server is running\n• Internet connection\n• Then try again.`,
                    'error'
                );
            } else {
                showMessage(
                    'Payment Processing Failed',
                    `Payment processing failed: ${errorMessage}${errorDetails}\n\nPlease check the console for more details and try again.`,
                    'error'
                );
            }
            
            // Don't close the modal on error, let user try again
        }
    }, [billToClose, bills, selectedTable, showMessage]);

    const cancelCloseBill = useCallback(() => {
        setShowCloseModal(false);
        setBillToClose(null);
    }, []);

    // Memoize current bill to prevent unnecessary re-renders
    const currentBill = useMemo(() => {
        return selectedTable ? bills[selectedTable.id] : null;
    }, [selectedTable, bills]);

    // Memoize clear all bills function
    const clearAllBills = useCallback(() => {
        setShowClearAllModal(true);
    }, []);

    const confirmClearAllBills = useCallback(() => {
        setBills({});
        setSelectedTable(null);
        localStorage.removeItem('restaurant-bills');
        setShowClearAllModal(false);
    }, []);

    const cancelClearAllBills = useCallback(() => {
        setShowClearAllModal(false);
    }, []);

    const handleShowPaymentHistory = useCallback(() => {
        setShowPaymentHistory(true);
    }, []);

    const handleClosePaymentHistory = useCallback(() => {
        setShowPaymentHistory(false);
    }, []);



    return (
        <div className='flex flex-col md:flex-row gap-2 h-full md:h-[78vh] mt-5'>
            {/* for tables */}
            <div className='p-6 w-full md:w-1/3 overflow-y-auto bg-fourthColor rounded-[32px]'>
                <div className="flex justify-between items-center mb-4">
                    <h1 className='text-[24px] font-[500] text-other1'>Table List</h1>
                    <div className="flex gap-2">
                        {/* Payment History Button */}
                        <button 
                            onClick={handleShowPaymentHistory}
                            className="text-sm bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                            title="View payment history"
                        >
                            <span>📊</span>
                            History
                        </button>
                        {/* Development helper - remove in production */}
                        <button 
                            onClick={clearAllBills}
                            className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                            title="Clear all bills (Development only)"
                        >
                            Clear All
                        </button>
                    </div>
                </div>
                <div className='grid grid-cols-1 gap-2 md:grid-cols-2'>
                    {
                        tableList.map((table) => (
                            <TableCard
                                key={table.id}
                                tableNumber={table.tableNumber}
                                isSelected={selectedTable?.id === table.id}
                                hasBill={bills[table.id] && (bills[table.id].status === 'created' || bills[table.id].status === 'pending')}
                                onClick={() => handleTableClick(table)}
                            />
                        ))
                    }
                </div>
            </div>

            {/* for order summary */}
            <div className='p-6 w-full md:flex-1 overflow-hidden bg-fourthColor rounded-[32px]'>
                <OrderSummary
                    selectedTable={selectedTable}
                    bill={currentBill}
                    menuItems={menuItems}
                    onCreateBill={handleCreateBill}
                    onAddItem={handleAddItemToBill}
                    onRemoveItem={handleRemoveItemFromBill}
                    onUpdateQuantity={handleUpdateItemQuantity}
                    onToggleServiceCharge={handleToggleServiceCharge}
                    onCloseBill={handleCloseBill}
                />
            </div>

            {/* Close Bill Confirmation Modal */}
            <ConfirmationModal
                isOpen={showCloseModal}
                onClose={cancelCloseBill}
                onConfirm={confirmCloseBill}
                title="Close Bill"
                message={`Are you sure you want to close the bill for Table ${selectedTable?.tableNumber}? ${
                    bills[billToClose]?.items?.length > 0 
                        ? 'This will process the payment and consume stock. This action cannot be undone and the table will be available for new orders.'
                        : 'This bill has no items. The table will be available for new orders without any payment or stock consumption.'
                }`}
                confirmText="Close Bill"
                cancelText="Cancel"
                type="warning"
            />

            {/* Clear All Bills Confirmation Modal */}
            <ConfirmationModal
                isOpen={showClearAllModal}
                onClose={cancelClearAllBills}
                onConfirm={confirmClearAllBills}
                title="Clear All Bills"
                message="Are you sure you want to clear all bills? This action cannot be undone and will remove all active and closed bills from the system."
                confirmText="Clear All"
                cancelText="Cancel"
                type="danger"
            />

            {/* Message Modal */}
            <MessageModal
                isOpen={messageModal.isOpen}
                onClose={closeMessageModal}
                title={messageModal.title}
                message={messageModal.message}
                type={messageModal.type}
            />

            {/* Payment History Modal */}
            <PaymentHistory
                isOpen={showPaymentHistory}
                onClose={handleClosePaymentHistory}
            />
        </div>
    )
}

TableManagement.propTypes = {
    tableList: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            tableNumber: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
        })
    )
};
