import Stock from '../models/Stock.js';
import StockAuditLog from '../models/StockAuditLog.js';
import mongoose from 'mongoose';

// Get all stock items
export const getAllStockItems = async (req, res) => {
  try {
    const { category, lowStock, search, page = 1, limit = 50 } = req.query;
    
    // Build query
    let query = { isActive: true };
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Execute query with pagination
    const stockItems = await Stock.find(query)
      .sort({ category: 1, name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    // Filter for low stock if requested
    let filteredItems = stockItems;
    if (lowStock === 'true') {
      filteredItems = stockItems.filter(item => item.isLowStock);
    }
    
    // Get total count for pagination
    const total = await Stock.countDocuments(query);
    
    // Calculate summary statistics
    const totalValue = stockItems.reduce((sum, item) => sum + item.totalValue, 0);
    const lowStockCount = stockItems.filter(item => item.isLowStock).length;
    
    res.json({
      success: true,
      data: filteredItems,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      },
      summary: {
        totalItems: stockItems.length,
        totalValue: totalValue,
        lowStockCount: lowStockCount,
        categories: await getStockByCategory()
      }
    });
  } catch (error) {
    console.error('Error fetching stock items:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stock items',
      error: error.message
    });
  }
};

// Get single stock item
export const getStockItem = async (req, res) => {
  try {
    const stockItem = await Stock.findById(req.params.id);
    
    if (!stockItem) {
      return res.status(404).json({
        success: false,
        message: 'Stock item not found'
      });
    }
    
    res.json({
      success: true,
      data: stockItem
    });
  } catch (error) {
    console.error('Error fetching stock item:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stock item',
      error: error.message
    });
  }
};

// Create new stock item
export const createStockItem = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const stockData = { ...req.body };
    
    // Round quantity to avoid floating-point precision issues
    if (stockData.quantity !== undefined) {
      stockData.quantity = Math.round(stockData.quantity * 100) / 100;
    }
    if (stockData.price !== undefined) {
      stockData.price = Math.round(stockData.price * 100) / 100;
    }
    if (stockData.buyingPrice !== undefined) {
      stockData.buyingPrice = Math.round(stockData.buyingPrice * 100) / 100;
    }
    if (stockData.minimumQuantity !== undefined) {
      stockData.minimumQuantity = Math.round(stockData.minimumQuantity * 100) / 100;
    }
    
    const stockItem = new Stock(stockData);
    await stockItem.save({ session });

    // Create audit log
    await StockAuditLog.create([{
      stockId: stockItem._id,
      userId: req.user?._id,
      action: 'create',
      newState: stockItem.toJSON(),
      reason: 'Initial creation'
    }], { session });

    await session.commitTransaction();
    
    res.status(201).json({
      success: true,
      message: 'Stock item created successfully',
      data: stockItem
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating stock item:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Stock item with this barcode already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating stock item',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// Update stock item
export const updateStockItem = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Round quantity to avoid floating-point precision issues
    if (updateData.quantity !== undefined) {
      updateData.quantity = Math.round(updateData.quantity * 100) / 100;
    }
    if (updateData.price !== undefined) {
      updateData.price = Math.round(updateData.price * 100) / 100;
    }
    if (updateData.buyingPrice !== undefined) {
      updateData.buyingPrice = Math.round(updateData.buyingPrice * 100) / 100;
    }
    if (updateData.minimumQuantity !== undefined) {
      updateData.minimumQuantity = Math.round(updateData.minimumQuantity * 100) / 100;
    }
    
    // Store original for comparison and audit
    const original = await Stock.findById(id).session(session);
    if (!original) {
      return res.status(404).json({
        success: false,
        message: 'Stock item not found'
      });
    }
    
    const stockItem = await Stock.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true, session }
    );

    // Create audit log
    await StockAuditLog.create([{
      stockId: stockItem._id,
      userId: req.user?._id,
      action: 'update',
      previousState: original.toJSON(),
      newState: stockItem.toJSON(),
      reason: updateData.reason || 'General update'
    }], { session });

    await session.commitTransaction();
    
    res.json({
      success: true,
      message: 'Stock item updated successfully',
      data: stockItem
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating stock item:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating stock item',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// Update stock quantity
export const updateStockQuantity = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { quantity, operation, reason } = req.body;
    
    const stock = await Stock.findById(id).session(session);
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Stock item not found'
      });
    }

    const previousQuantity = stock.quantity;
    let newQuantity;

    if (operation === 'add') {
      newQuantity = stock.quantity + quantity;
    } else {
      newQuantity = stock.quantity - quantity;
      if (newQuantity < 0) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock quantity'
        });
      }
    }

    // Round to avoid floating-point precision issues
    newQuantity = Math.round(newQuantity * 100) / 100;

    const updatedStock = await Stock.findByIdAndUpdate(
      id,
      { 
        $set: { 
          quantity: newQuantity,
          lastUpdated: new Date()
        }
      },
      { new: true, session }
    );

    // Create audit log
    await StockAuditLog.create([{
      stockId: stock._id,
      userId: req.user?._id,
      action: `quantity_${operation}`,
      previousState: { quantity: previousQuantity },
      newState: { quantity: newQuantity },
      quantityChange: operation === 'add' ? quantity : -quantity,
      reason
    }], { session });

    await session.commitTransaction();
    
    res.json({
      success: true,
      message: 'Stock quantity updated successfully',
      data: updatedStock
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating stock quantity:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating stock quantity',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// Delete stock item
export const deleteStockItem = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    
    const stock = await Stock.findById(id).session(session);
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Stock item not found'
      });
    }

    // Soft delete by setting isActive to false
    const deletedStock = await Stock.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true, session }
    );

    // Create audit log
    await StockAuditLog.create([{
      stockId: stock._id,
      userId: req.user?._id,
      action: 'delete',
      previousState: stock.toJSON(),
      reason: req.body.reason || 'Stock item deleted'
    }], { session });

    await session.commitTransaction();
    
    res.json({
      success: true,
      message: 'Stock item deleted successfully',
      data: deletedStock
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error deleting stock item:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting stock item',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// Get low stock items
export const getLowStockItems = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const query = {
      isActive: true,
      $expr: { $lte: ['$quantity', '$minimumQuantity'] }
    };
    
    const stockItems = await Stock.find(query)
      .sort({ quantity: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Stock.countDocuments(query);
    
    res.json({
      success: true,
      data: stockItems,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching low stock items',
      error: error.message
    });
  }
};

// Get stock items by category
export const getStockItemsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 50, sort = 'name', order = 'asc' } = req.query;

    const query = { 
      category,
      isActive: true
    };

    // Add sorting
    const sortOption = {};
    sortOption[sort] = order === 'asc' ? 1 : -1;

    // Execute query with pagination
    const stockItems = await Stock.find(query)
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count
    const total = await Stock.countDocuments(query);

    // Calculate category statistics
    const stats = await Stock.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$quantity', '$price'] } },
          averagePrice: { $avg: '$price' },
          totalQuantity: { $sum: '$quantity' },
          lowStockCount: {
            $sum: {
              $cond: [{ $lte: ['$quantity', '$minimumQuantity'] }, 1, 0]
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        items: stockItems,
        stats: stats[0] || {
          totalValue: 0,
          averagePrice: 0,
          totalQuantity: 0,
          lowStockCount: 0
        }
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching category stock items:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category stock items',
      error: error.message
    });
  }
};

// Search stock items
export const searchStockItems = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 50 } = req.query;
    
    let query = { isActive: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      query.category = category;
    }
    
    const stockItems = await Stock.find(query)
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Stock.countDocuments(query);
    
    res.json({
      success: true,
      data: stockItems,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error searching stock items:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching stock items',
      error: error.message
    });
  }
};

// Get stock analytics
export const getStockAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    
    let matchStage = { isActive: true };
    
    if (startDate || endDate) {
      matchStage.lastUpdated = {};
      if (startDate) matchStage.lastUpdated.$gte = new Date(startDate);
      if (endDate) matchStage.lastUpdated.$lte = new Date(endDate);
    }
    
    if (category) {
      matchStage.category = category;
    }
    
    const analytics = await Stock.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$quantity', '$price'] } },
          averagePrice: { $avg: '$price' },
          totalQuantity: { $sum: '$quantity' },
          lowStockCount: {
            $sum: {
              $cond: [{ $lte: ['$quantity', '$minimumQuantity'] }, 1, 0]
            }
          }
        }
      }
    ]);
    
    // Get analytics by category
    const categoryAnalytics = await Stock.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$quantity', '$price'] } },
          averagePrice: { $avg: '$price' },
          totalQuantity: { $sum: '$quantity' },
          lowStockCount: {
            $sum: {
              $cond: [{ $lte: ['$quantity', '$minimumQuantity'] }, 1, 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        overall: analytics[0] || {
          totalItems: 0,
          totalValue: 0,
          averagePrice: 0,
          totalQuantity: 0,
          lowStockCount: 0
        },
        byCategory: categoryAnalytics
      }
    });
  } catch (error) {
    console.error('Error fetching stock analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stock analytics',
      error: error.message
    });
  }
};

// Bulk update stock items
export const bulkUpdateStock = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const updates = req.body;
    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        const stock = await Stock.findById(update.id).session(session);
        
        if (!stock) {
          errors.push({ id: update.id, error: 'Stock item not found' });
          continue;
        }

        // Calculate new quantity based on operation
        let newQuantity;
        if (update.operation === 'add') {
          newQuantity = stock.quantity + update.quantity;
        } else if (update.operation === 'subtract') {
          newQuantity = stock.quantity - update.quantity;
          if (newQuantity < 0) {
            errors.push({ id: update.id, error: 'Insufficient stock quantity' });
            continue;
          }
        } else {
          newQuantity = update.quantity; // 'set' operation
        }

        // Update the stock item
        const updatedStock = await Stock.findByIdAndUpdate(
          update.id,
          { 
            $set: { 
              quantity: newQuantity,
              lastUpdated: new Date()
            }
          },
          { new: true, session }
        );

        // Create audit log
        await StockAuditLog.create([{
          stockId: stock._id,
          userId: req.user?._id,
          action: `quantity_${update.operation || 'set'}`,
          previousState: { quantity: stock.quantity },
          newState: { quantity: newQuantity },
          quantityChange: update.operation === 'subtract' ? -update.quantity : update.quantity,
          reason: update.reason
        }], { session });

        results.push({
          id: update.id,
          success: true,
          previousQuantity: stock.quantity,
          newQuantity: updatedStock.quantity,
          reason: update.reason || null
        });

      } catch (error) {
        errors.push({ id: update.id, error: error.message });
      }
    }

    // If there were any errors, rollback the transaction
    if (errors.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Some updates failed',
        results,
        errors
      });
    }

    // Commit the transaction if everything was successful
    await session.commitTransaction();
    res.json({
      success: true,
      message: 'Bulk update completed successfully',
      results
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error in bulk update:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing bulk update',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// Get audit log for a stock item
export const getStockAuditLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, page = 1, limit = 50 } = req.query;

    // Verify stock item exists
    const stockItem = await Stock.findById(id);
    if (!stockItem) {
      return res.status(404).json({
        success: false,
        message: 'Stock item not found'
      });
    }

    // Build query
    let query = { stockId: id };
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Execute query with pagination
    const auditLogs = await StockAuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'username'); // Assuming you have user information

    // Get total count
    const total = await StockAuditLog.countDocuments(query);

    res.json({
      success: true,
      data: auditLogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching stock audit log:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stock audit log',
      error: error.message
    });
  }
};

// Helper function to get stock by category
const getStockByCategory = async () => {
  try {
    const categories = await Stock.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$quantity', '$price'] } },
          lowStockCount: {
            $sum: {
              $cond: [{ $lte: ['$quantity', '$minimumQuantity'] }, 1, 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    return categories.reduce((acc, cat) => {
      acc[cat._id] = {
        count: cat.count,
        totalValue: cat.totalValue,
        lowStockCount: cat.lowStockCount
      };
      return acc;
    }, {});
  } catch (error) {
    console.error('Error getting stock by category:', error);
    return {};
  }
};

// Get stock statistics for admin dashboard
export const getStockStats = async (req, res) => {
  try {
    const stats = await Stock.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$quantity', '$price'] } },
          lowStockCount: {
            $sum: {
              $cond: [{ $lte: ['$quantity', '$minimumQuantity'] }, 1, 0]
            }
          },
          totalQuantity: { $sum: '$quantity' },
          averagePrice: { $avg: '$price' }
        }
      }
    ]);

    const categoryStats = await Stock.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$quantity', '$price'] } }
        }
      }
    ]);

    const result = stats[0] || {
      totalItems: 0,
      totalValue: 0,
      lowStockCount: 0,
      totalQuantity: 0,
      averagePrice: 0
    };

    res.json({
      success: true,
      data: {
        ...result,
        categoryBreakdown: categoryStats
      }
    });
  } catch (error) {
    console.error('Error getting stock stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock statistics',
      error: error.message
    });
  }
};
