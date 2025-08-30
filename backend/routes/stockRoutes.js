import express from 'express';
import {
    getAllStockItems,
    getStockItem,
    createStockItem,
    updateStockItem,
    updateStockQuantity,
    deleteStockItem,
    getLowStockItems,
    getStockAnalytics
} from '../controllers/stockController.js';

const router = express.Router();

// GET routes
router.get('/', getAllStockItems);                    // Get all stock items with filters
router.get('/analytics', getStockAnalytics);         // Get stock analytics
router.get('/low-stock', getLowStockItems);          // Get low stock items
router.get('/:id', getStockItem);                    // Get single stock item

// POST routes
router.post('/', createStockItem);                   // Create new stock item

// PUT routes
router.put('/:id', updateStockItem);                 // Update stock item
router.put('/:id/quantity', updateStockQuantity);    // Update stock quantity (add/subtract)

// DELETE routes
router.delete('/:id', deleteStockItem);              // Delete stock item (soft delete)

export default router;
