import express from 'express';
import { 
    createOrder, 
    processOrderPayment, 
    validateStockAvailability, 
    bulkConsumeStock,
    getOrderStats,
    getRevenueData,
    getAnalyticsData,
    getProfitData,
    getFoodLiquorBreakdown
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

// Admin analytics endpoints
router.get('/stats', getOrderStats);
router.get('/revenue', getRevenueData);
router.get('/analytics', getAnalyticsData);
router.get('/profit', getProfitData);
router.get('/breakdown', getFoodLiquorBreakdown);

export default router;
