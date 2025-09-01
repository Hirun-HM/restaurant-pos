import express from 'express';
import {
    getAllStockItems,
    getStockItem,
    createStockItem,
    updateStockItem,
    updateStockQuantity,
    deleteStockItem,
    getLowStockItems,
    getStockAnalytics,
    getStockItemsByCategory,
    searchStockItems,
    bulkUpdateStock,
    getStockAuditLog
} from '../controllers/stockController.js';
import { 
    validateStockItem, 
    validateQuantityUpdate,
    validateStockId,
    validateSearchQuery,
    validateAnalyticsQuery,
    validateBulkUpdate
} from '../middleware/validation.js';

const router = express.Router();

// GET routes
router.get('/', validateSearchQuery, getAllStockItems);
router.get('/analytics', validateAnalyticsQuery, getStockAnalytics);
router.get('/low-stock', getLowStockItems);
router.get('/category/:category', getStockItemsByCategory);
router.get('/search', validateSearchQuery, searchStockItems);
router.get('/audit/:id', validateStockId, getStockAuditLog);
router.get('/:id', validateStockId, getStockItem);

// POST routes
router.post('/', validateStockItem, createStockItem);
router.post('/bulk-update', validateBulkUpdate, bulkUpdateStock);

// PUT routes
router.put('/:id', [validateStockId, validateStockItem], updateStockItem);
router.put('/:id/quantity', [validateStockId, validateQuantityUpdate], updateStockQuantity);

// DELETE routes
router.delete('/:id', validateStockId, deleteStockItem);

export default router;
