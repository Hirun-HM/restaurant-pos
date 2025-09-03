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
    getStockStats,
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
router.get('/stats', getStockStats);
router.get('/analytics', validateAnalyticsQuery, getStockAnalytics);
router.get('/low-stock', getLowStockItems);
router.get('/category/:category', getStockItemsByCategory);
router.get('/search', validateSearchQuery, searchStockItems);
router.get('/audit/:id', validateStockId, getStockAuditLog);
router.get('/:id', validateStockId, getStockItem);

// POST routes
router.post('/', validateStockItem, createStockItem);
router.post('/bulk-update', validateBulkUpdate, bulkUpdateStock);
router.post('/consume-bulk', async (req, res) => {
  // Bulk stock consumption for order processing
  const { stockManagement } = await import('../utils/stockManagement.js');
  const mongoose = await import('mongoose');
  
  const session = await mongoose.default.startSession();
  session.startTransaction();
  
  try {
    const { consumptions } = req.body;
    const results = [];
    
    for (const consumption of consumptions) {
      const { stockItemName, quantityConsumed, unit, reason } = consumption;
      
      try {
        const result = await stockManagement.consumeStock(
          stockItemName,
          quantityConsumed,
          unit || 'g',
          reason || 'Order processing',
          session
        );
        results.push({
          stockItemName,
          success: true,
          consumed: quantityConsumed,
          unit: unit || 'g',
          result
        });
      } catch (error) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Failed to consume stock for ${stockItemName}: ${error.message}`,
          error: error.message
        });
      }
    }
    
    await session.commitTransaction();
    
    res.status(200).json({
      success: true,
      message: 'Bulk stock consumption completed successfully',
      data: {
        consumptions: results.length,
        results
      }
    });
    
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: 'Failed to process bulk stock consumption',
      error: error.message
    });
  } finally {
    session.endSession();
  }
});

// PUT routes
router.put('/:id', [validateStockId, validateStockItem], updateStockItem);
router.put('/:id/quantity', [validateStockId, validateQuantityUpdate], updateStockQuantity);

// DELETE routes
router.delete('/:id', validateStockId, deleteStockItem);

export default router;
