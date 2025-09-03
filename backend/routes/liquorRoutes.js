import express from 'express';
import {
  getAllLiquors,
  getLiquorItem,
  createLiquorItem,
  updateLiquorItem,
  deleteLiquorItem,
  updateLiquorPortions,
  addBottlesToStock,
  consumeLiquor,
  consumeLiquorEnhanced,
  processBillPayment,
  getLowStockLiquors,
  getLiquorAnalytics,
  getLiquorStats,
  autoDiscardLowVolumes
} from '../controllers/liquorController.js';

const router = express.Router();

// CRUD Operations
router.get('/', getAllLiquors);
router.get('/stats', getLiquorStats);
router.get('/low-stock', getLowStockLiquors);
router.get('/analytics', getLiquorAnalytics);
router.get('/:id', getLiquorItem);
router.post('/', createLiquorItem);
router.put('/:id', updateLiquorItem);
router.delete('/:id', deleteLiquorItem);

// Bill Payment Processing
router.post('/process-payment', processBillPayment);

// Portion Management
router.put('/:id/portions', updateLiquorPortions);

// Stock Management
router.post('/:id/add-bottles', addBottlesToStock);
router.post('/:id/consume', consumeLiquorEnhanced);
router.post('/:id/consume', consumeLiquor);
router.post('/consume-bulk', async (req, res) => {
  // Bulk liquor consumption for order processing
  try {
    const { consumptions } = req.body;
    const results = [];
    
    for (const consumption of consumptions) {
      const { liquorId, volumeConsumed, reason } = consumption;
      
      // Use the existing consumeLiquorEnhanced function
      const mockReq = {
        params: { id: liquorId },
        body: { 
          volume: volumeConsumed,
          reason: reason || 'Order processing',
          type: 'consumption'
        }
      };
      
      const mockRes = {
        status: (code) => ({
          json: (data) => ({ statusCode: code, ...data })
        })
      };
      
      try {
        const result = await consumeLiquorEnhanced(mockReq, mockRes);
        results.push({
          liquorId,
          success: true,
          volumeConsumed,
          result
        });
      } catch (error) {
        results.push({
          liquorId,
          success: false,
          error: error.message
        });
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Bulk liquor consumption processed',
      results
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing bulk liquor consumption',
      error: error.message
    });
  }
});

// Maintenance Operations  
router.post('/auto-discard', autoDiscardLowVolumes);

export default router;
