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
  autoDiscardLowVolumes
} from '../controllers/liquorController.js';

const router = express.Router();

// CRUD Operations
router.get('/', getAllLiquors);
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

// Maintenance Operations  
router.post('/auto-discard', autoDiscardLowVolumes);

export default router;
