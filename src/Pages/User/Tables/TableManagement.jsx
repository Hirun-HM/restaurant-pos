import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import TableCard from './Components/TableCard';
import OrderSummary from './Components/OrderSummary';
import ConfirmationModal from '../../../components/ConfirmationModal';
import { sriLankanDishes } from '../../../const/const';

export default function TableManagement({tableList = []}) {
    const navigate = useNavigate();
    
    // Load menu items from localStorage (managed by MenuManager)
    const menuItems = useMemo(() => {
        const saved = localStorage.getItem('restaurant-menu-items');
        if (saved) {
            const parsedData = JSON.parse(saved);
            // Migrate old "Sandy" categories to "Beverage"
            const migratedData = parsedData.map(item => ({
                ...item,
                category: item.category === 'Sandy' ? 'Beverage' : item.category
            }));
            return migratedData;
        }
        
        // Fallback to default items if nothing saved
        return [
            // Foods
            { id: 1, name: 'Chicken Rice', price: 450, category: 'Foods' },
            { id: 2, name: 'Fried Rice', price: 380, category: 'Foods' },
            { id: 3, name: 'Kottu', price: 500, category: 'Foods' },
            { id: 6, name: 'Fish Curry', price: 650, category: 'Foods' },
            { id: 7, name: 'Vegetable Curry', price: 350, category: 'Foods' },
            { id: 9, name: 'Chicken Curry', price: 550, category: 'Foods' },
            { id: 10, name: 'Noodles', price: 420, category: 'Foods' },
            

            
            // Bites
            { id: 18, name: 'Chicken Wings', price: 280, category: 'Bites' },
            { id: 19, name: 'Fish Cutlets', price: 150, category: 'Bites' },
            { id: 20, name: 'Deviled Chicken', price: 320, category: 'Bites' },
            { id: 21, name: 'Prawn Crackers', price: 180, category: 'Bites' },
            { id: 22, name: 'Vadai', price: 120, category: 'Bites' },
            
            // Beverage
            { id: 23, name: 'Chicken Sandwich', price: 250, category: 'Beverage' },
            { id: 24, name: 'Club Sandwich', price: 350, category: 'Beverage' },
            { id: 25, name: 'Fish Sandwich', price: 280, category: 'Beverage' },
            { id: 26, name: 'Egg Sandwich', price: 180, category: 'Beverage' },
            
            // Others
            { id: 4, name: 'Coca Cola', price: 120, category: 'Others' },
            { id: 5, name: 'Orange Juice', price: 150, category: 'Others' },
            { id: 8, name: 'Ice Cream', price: 200, category: 'Others' },
            { id: 27, name: 'Coffee', price: 100, category: 'Others' },
            { id: 28, name: 'Tea', price: 80, category: 'Others' },
            { id: 29, name: 'Fresh Lime', price: 120, category: 'Others' }
        ];
    }, []);

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

    const handleCreateBill = useCallback((tableId) => {
        const newBill = {
            id: Date.now(),
            tableId: tableId,
            items: [],
            total: 0,
            serviceCharge: false, // Default to not include service charge
            createdAt: new Date(),
            status: 'active'
        };
        setBills(prevBills => ({
            ...prevBills,
            [tableId]: newBill
        }));
    }, []);

    const handleAddItemToBill = useCallback((tableId, menuItem, quantity = 1) => {
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

            return {
                ...prevBills,
                [tableId]: {
                    ...prevBills[tableId],
                    items: updatedItems,
                    total
                }
            };
        });
    }, []);

    const handleRemoveItemFromBill = useCallback((tableId, itemId) => {
        setBills(prevBills => {
            if (!prevBills[tableId]) return prevBills;

            const updatedItems = prevBills[tableId].items.filter(item => item.id !== itemId);
            const total = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            return {
                ...prevBills,
                [tableId]: {
                    ...prevBills[tableId],
                    items: updatedItems,
                    total
                }
            };
        });
    }, []);

    const handleUpdateItemQuantity = useCallback((tableId, itemId, newQuantity) => {
        setBills(prevBills => {
            if (!prevBills[tableId] || newQuantity <= 0) return prevBills;

            const updatedItems = prevBills[tableId].items.map(item => 
                item.id === itemId 
                    ? { ...item, quantity: newQuantity }
                    : item
            );

            const total = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            return {
                ...prevBills,
                [tableId]: {
                    ...prevBills[tableId],
                    items: updatedItems,
                    total
                }
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

    const confirmCloseBill = useCallback(() => {
        if (billToClose) {
            setBills(prevBills => ({
                ...prevBills,
                [billToClose]: {
                    ...prevBills[billToClose],
                    status: 'closed',
                    closedAt: new Date()
                }
            }));
            setSelectedTable(null);
            setBillToClose(null);
        }
    }, [billToClose]);

    const cancelCloseBill = useCallback(() => {
        setShowCloseModal(false);
        setBillToClose(null);
    }, []);

    // Navigation functions
    const navigateToWelcome = useCallback(() => {
        navigate('/');
    }, [navigate]);

    const navigateToUserDashboard = useCallback(() => {
        navigate('/user/dashboard');
    }, [navigate]);

    const navigateToAdminDashboard = useCallback(() => {
        navigate('/admin/dashboard');
    }, [navigate]);

    const handleLogout = useCallback(() => {
        // Clear any user session data if needed
        navigateToWelcome();
    }, [navigateToWelcome]);

    // Function to clear old closed bills (optional - can be called to clean up storage)
    const clearOldBills = () => {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const updatedBills = {};
        
        Object.keys(bills).forEach(tableId => {
            const bill = bills[tableId];
            if (bill.status === 'active' || (bill.closedAt && new Date(bill.closedAt) > oneDayAgo)) {
                updatedBills[tableId] = bill;
            }
        });
        
        setBills(updatedBills);
    };

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

    return (
        <div className='flex flex-col md:flex-row gap-2 h-full md:h-[78vh] mt-5'>
            {/* for tables */}
            <div className='p-6 w-full md:w-1/3 overflow-y-auto bg-fourthColor rounded-[32px]'>
                <div className="flex justify-between items-center mb-4">
                    <h1 className='text-[24px] font-[500] text-other1'>Table List</h1>
                    {/* Development helper - remove in production */}
                    <button 
                        onClick={clearAllBills}
                        className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                        title="Clear all bills (Development only)"
                    >
                        Clear All
                    </button>
                </div>
                <div className='grid grid-cols-1 gap-2 md:grid-cols-2'>
                    {
                        tableList.map((table) => (
                            <TableCard
                                key={table.id}
                                tableNumber={table.tableNumber}
                                isSelected={selectedTable?.id === table.id}
                                hasBill={bills[table.id] && bills[table.id].status === 'active'}
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
