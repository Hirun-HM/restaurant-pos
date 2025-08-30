import Stock from '../models/Stock.js';
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

// Get stock items by category
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
  try {
    const stockItem = new Stock(req.body);
    await stockItem.save();
    
    res.status(201).json({
      success: true,
      message: 'Stock item created successfully',
      data: stockItem
    });
  } catch (error) {
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
  }
};

// Update stock item
export const updateStockItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Store original quantity for comparison
    const original = await Stock.findById(id);
    if (!original) {
      return res.status(404).json({
        success: false,
        message: 'Stock item not found'
      });
    }
    
    // If quantity is being updated, store original for middleware
    if (updateData.quantity !== undefined) {
      updateData._original = { quantity: original.quantity };
    }
    
    const stockItem = await Stock.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: 'Stock item updated successfully',
      data: stockItem
    });
  } catch (error) {
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
  }
};

// Update stock quantity (restock or consume)
export const updateStockQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, operation } = req.body; // operation: 'add' or 'subtract'
    
    if (!quantity || !operation) {
      return res.status(400).json({
        success: false,
        message: 'Quantity and operation are required'
      });
    }
    
    const stockItem = await Stock.findById(id);
    if (!stockItem) {
      return res.status(404).json({
        success: false,
        message: 'Stock item not found'
      });
    }
    
    const originalQuantity = stockItem.quantity;
    let newQuantity;
    
    if (operation === 'add') {
      newQuantity = originalQuantity + quantity;
    } else if (operation === 'subtract') {
      newQuantity = Math.max(0, originalQuantity - quantity);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid operation. Use "add" or "subtract"'
      });
    }
    
    stockItem.quantity = newQuantity;
    stockItem._original = { quantity: originalQuantity };
    await stockItem.save();
    
    res.json({
      success: true,
      message: `Stock ${operation === 'add' ? 'added' : 'consumed'} successfully`,
      data: stockItem,
      quantityChange: {
        operation,
        amount: quantity,
        previousQuantity: originalQuantity,
        newQuantity: newQuantity
      }
    });
  } catch (error) {
    console.error('Error updating stock quantity:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating stock quantity',
      error: error.message
    });
  }
};

// Delete stock item (soft delete)
export const deleteStockItem = async (req, res) => {
  try {
    const stockItem = await Stock.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!stockItem) {
      return res.status(404).json({
        success: false,
        message: 'Stock item not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Stock item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting stock item:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting stock item',
      error: error.message
    });
  }
};

// Get low stock items
export const getLowStockItems = async (req, res) => {
  try {
    const stockItems = await Stock.find({ isActive: true });
    const lowStockItems = stockItems.filter(item => item.isLowStock);
    
    res.json({
      success: true,
      data: lowStockItems,
      count: lowStockItems.length
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

// Get stock analytics
export const getStockAnalytics = async (req, res) => {
  try {
    const analytics = await Stock.aggregate([
      { $match: { isActive: true } },
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
    
    const categoryAnalytics = await Stock.aggregate([
      { $match: { isActive: true } },
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
