import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import TableCard from './Components/TableCard';
import OrderSummary from './Components/OrderSummary';
import ConfirmationModal from '../../../components/ConfirmationModal';
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
            alert('❌ Failed to create bill. Please try again.');
        }
    }, []);

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
        setBillToClose(tableId);
        setShowCloseModal(true);
    }, []);

    const confirmCloseBill = useCallback(async () => {
        if (!billToClose || !bills[billToClose]) return;

        const bill = bills[billToClose];

        try {
            // Process order payment and consume stock
            const orderData = {
                orderId: bill.orderId, // Pass the existing order ID
                tableId: billToClose,
                items: bill.items,
                total: bill.total,
                serviceCharge: bill.serviceCharge || false,
                paymentMethod: 'cash',
                customerId: null
            };

            console.log('🔍 Processing payment for table:', billToClose);

            // Call the order service to process payment and consume stock
            const result = await orderService.processOrderPayment(orderData);
            
            console.log('Payment result:', result?.success ? 'SUCCESS' : 'FAILED');
            
            // Handle successful payment
            if (result && result.success === true) {
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

                // Build success message
                let successMessage = `✅ Payment processed successfully!\n\nOrder ID: ${result.data?.orderId}\nStock items consumed: ${result.data?.stockConsumptions || 0}`;
                
                // Add information about missed ingredients if any
                if (result.data?.missedIngredients && result.data.missedIngredients.length > 0) {
                    successMessage += `\n\n⚠️ Note: Some ingredients were not available in stock:\n${result.data.missedIngredients.map(ing => `• ${ing.name} (${ing.reason || 'Not in stock'})`).join('\n')}`;
                    successMessage += `\n\nOnly available ingredients were deducted from stock.`;
                } else {
                    successMessage += `\n\nAll ingredients were processed successfully.`;
                }
                
                successMessage += `\n\nTable ${selectedTable?.tableNumber || billToClose} is now available.`;

                // Show success alert
                alert(successMessage);

                // Clear selected table and close modal
                setSelectedTable(null);
                setBillToClose(null);
                setShowCloseModal(false);
            } else {
                // Handle failed response - this should not happen with the updated backend
                console.error('❌ Unexpected response format:', result);
                throw new Error(result?.message || 'Unexpected response from server');
            }

        } catch (error) {
            console.error('❌ Error processing order payment:', error);
            
            // Show user-friendly error message
            const errorMessage = error.message || 'Unknown error occurred';
            
            // Check if this is a network error
            if (errorMessage.includes('fetch') || errorMessage.includes('Network') || errorMessage.includes('Failed to fetch')) {
                alert(`❌ Network Error: Unable to connect to server.\n\nPlease check:\n• Backend server is running\n• Internet connection\n• Then try again.`);
            } else {
                alert(`❌ Payment processing failed: ${errorMessage}\n\nNote: If some ingredients are missing from stock, the system will only deduct available ingredients and process the payment successfully.\n\nPlease try again or contact support if the issue persists.`);
            }
            
            // Don't close the modal on error, let user try again
        }
    }, [billToClose, bills]);

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

    // Force refresh function to sync with database
    const forceRefresh = useCallback(async () => {
        try {
            console.log('🔄 Force refreshing - clearing cache and syncing with database...');
            
            // Clear localStorage
            localStorage.removeItem('restaurant-bills');
            
            // Reset bills state
            setBills({});
            setSelectedTable(null);
            
            // Try to fetch any active orders from database
            const response = await fetch('http://localhost:3001/api/orders/debug');
            if (response.ok) {
                const data = await response.json();
                console.log('📊 Orders from database:', data);
                
                // Filter for active orders (not completed, paid, or cancelled)
                const activeOrders = data.orders?.filter(order => 
                    order.status && !['completed', 'paid', 'cancelled'].includes(order.status)
                ) || [];
                
                if (activeOrders.length > 0) {
                    console.log('📋 Found active orders:', activeOrders);
                    const newBills = {};
                    
                    // We need to fetch full order details for active orders
                    for (const order of activeOrders) {
                        try {
                            const fullOrderResponse = await fetch(`http://localhost:3001/api/orders/${order.id}`);
                            if (fullOrderResponse.ok) {
                                const fullOrder = await fullOrderResponse.json();
                                const tableId = fullOrder.data.tableNumber || fullOrder.data.tableId;
                                if (tableId) {
                                    newBills[tableId] = {
                                        orderId: fullOrder.data._id,
                                        items: fullOrder.data.items || [],
                                        total: fullOrder.data.total || 0,
                                        status: fullOrder.data.status || 'created'
                                    };
                                }
                            }
                        } catch (fetchError) {
                            console.log(`⚠️ Could not fetch details for order ${order.id}:`, fetchError.message);
                        }
                    }
                    
                    setBills(newBills);
                    console.log('✅ Rebuilt bills state from database:', newBills);
                } else {
                    console.log('✅ No active orders found in database');
                }
                
                alert(`✅ Cache cleared and synced with database!\n\nFound ${activeOrders.length} active orders`);
            } else {
                console.log('⚠️ Could not fetch orders from database');
                alert('⚠️ Could not connect to database. Cache cleared locally.');
            }
        } catch (error) {
            console.error('❌ Error during force refresh:', error);
            alert('⚠️ Refresh completed but there may have been connection issues');
        }
    }, []);

    return (
        <div className='flex flex-col md:flex-row gap-2 h-full md:h-[78vh] mt-5'>
            {/* for tables */}
            <div className='p-6 w-full md:w-1/3 overflow-y-auto bg-fourthColor rounded-[32px]'>
                <div className="flex justify-between items-center mb-4">
                    <h1 className='text-[24px] font-[500] text-other1'>Table List</h1>
                    <div className="flex gap-2">
                        {/* Force refresh button */}
                        <button 
                            onClick={forceRefresh}
                            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                            title="Sync with database and clear cache"
                        >
                            🔄 Refresh
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
                message={`Are you sure you want to close the bill for Table ${selectedTable?.tableNumber}? This action cannot be undone and the table will be available for new orders.`}
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
