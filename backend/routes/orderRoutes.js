import express from 'express';
import Order from '../models/Order.js';
import { 
    createOrder,
    updateOrder,
    processOrderPayment, 
    validateStockAvailability, 
    bulkConsumeStock,
    getOrderStats,
    getRevenueData,
    getAnalyticsData,
    getProfitData,
    getFoodLiquorBreakdown,
    getActiveTableCount,
    getActiveBillsCount,
    getDebugOrders,
    getCompletedOrders
} from '../controllers/orderController.js';

const router = express.Router();

// Create a new order (existing functionality)
router.post('/', createOrder);

// Process order payment and handle stock deduction
router.post('/process-payment', processOrderPayment);

// Validate stock availability for order items
router.post('/validate-stock', validateStockAvailability);

// Bulk stock consumption for food items (utility endpoint)
router.post('/consume-stock-bulk', bulkConsumeStock);

// Admin analytics endpoints (must come before /:id route)
router.get('/stats', getOrderStats);
router.get('/revenue', getRevenueData);
router.get('/analytics', getAnalyticsData);
router.get('/profit', getProfitData);
router.get('/breakdown', getFoodLiquorBreakdown);

// Active table and bills count endpoints
router.get('/active-table-count', getActiveTableCount);
router.get('/active-bills-count', getActiveBillsCount);

// Get completed orders for history
router.get('/completed', getCompletedOrders);

// Debug endpoint to see all orders
router.get('/debug', getDebugOrders);

// Get a specific order by ID (must come AFTER all specific routes)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching order',
            error: error.message
        });
    }
});

// Update an existing order
router.put('/:id', updateOrder);

export default router;
