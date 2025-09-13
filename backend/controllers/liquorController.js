import Liquor from '../models/Liquor.js';

// Get all liquor items
export const getAllLiquors = async (req, res) => {
  try {
    const { type, lowStock, search, page = 1, limit = 50 } = req.query;
    
    // Build query
    let query = { isActive: true };
    
    if (type && type !== 'all') {
      query.type = type;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Execute query with pagination
    const liquors = await Liquor.find(query)
      .sort({ type: 1, name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    // Filter for low stock if requested
    let filteredLiquors = liquors;
    if (lowStock === 'true') {
      filteredLiquors = liquors.filter(item => item.isLowStock);
    }
    
    // Get total count for pagination
    const total = await Liquor.countDocuments(query);
    
    // Calculate summary statistics
    const totalValue = filteredLiquors.reduce((sum, item) => sum + item.totalValue, 0);
    const lowStockCount = filteredLiquors.filter(item => item.isLowStock).length;
    
    res.json({
      success: true,
      data: filteredLiquors,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      },
      summary: {
        totalItems: filteredLiquors.length,
        totalValue: totalValue,
        lowStockCount: lowStockCount,
        totalWastedVolume: filteredLiquors.reduce((sum, item) => sum + item.wastedVolume, 0),
        totalSoldVolume: filteredLiquors.reduce((sum, item) => sum + item.totalSoldVolume, 0)
      }
    });
  } catch (error) {
    console.error('Error fetching liquor items:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching liquor items',
      error: error.message
    });
  }
};

// Get single liquor item
export const getLiquorItem = async (req, res) => {
  try {
    const liquor = await Liquor.findById(req.params.id);
    
    if (!liquor) {
      return res.status(404).json({
        success: false,
        message: 'Liquor item not found'
      });
    }
    
    res.json({
      success: true,
      data: liquor
    });
  } catch (error) {
    console.error('Error fetching liquor item:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching liquor item',
      error: error.message
    });
  }
};

// Create new liquor item
export const createLiquorItem = async (req, res) => {
  try {
    const liquorData = req.body;
    
    // Define hard liquor types that get portions
    const hardLiquorTypes = ['hard_liquor'];
    
    // Auto-generate standard portions only for hard liquor
    if (hardLiquorTypes.includes(liquorData.type)) {
      if (!liquorData.portions || liquorData.portions.length === 0) {
        // Generate standard portions with zero prices
        liquorData.portions = Liquor.generateStandardPortions(liquorData.bottleVolume);
      } else {
        // Validate that provided portions match standard names and volumes
        const standardPortions = Liquor.generateStandardPortions(liquorData.bottleVolume);
        const standardPortionMap = new Map(standardPortions.map(p => [p.name, p.volume]));
        
        for (const portion of liquorData.portions) {
          if (!standardPortionMap.has(portion.name)) {
            return res.status(400).json({
              success: false,
              message: `Invalid portion name: ${portion.name}. Allowed portions: ${Array.from(standardPortionMap.keys()).join(', ')}`
            });
          }
          if (standardPortionMap.get(portion.name) !== portion.volume) {
            return res.status(400).json({
              success: false,
              message: `Invalid volume for ${portion.name}. Expected: ${standardPortionMap.get(portion.name)}ml, Got: ${portion.volume}ml`
            });
          }
        }
      }
    } else {
      // For beer, wine, cigarettes, and other items - no portions
      liquorData.portions = [];
    }
    
    const liquor = new Liquor(liquorData);
    await liquor.save();
    
    res.status(201).json({
      success: true,
      message: 'Liquor item created successfully',
      data: liquor
    });
  } catch (error) {
    console.error('Error creating liquor item:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating liquor item',
      error: error.message
    });
  }
};

// Update liquor item
export const updateLiquorItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🔄 Updating liquor item ${id} with:`, updateData);
    
    const liquor = await Liquor.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!liquor) {
      console.log(`❌ Liquor item not found: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'Liquor item not found'
      });
    }
    
    console.log(`✅ Liquor item updated successfully:`, liquor.name);
    res.json({
      success: true,
      message: 'Liquor item updated successfully',
      data: liquor
    });
  } catch (error) {
    console.error('❌ Error updating liquor item:', error);
    
    if (error.name === 'ValidationError') {
      console.log('🔍 Validation errors:', error.errors);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating liquor item',
      error: error.message
    });
  }
};

// Add bottles to stock
export const addBottlesToStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { numberOfBottles } = req.body;
    
    if (!numberOfBottles || numberOfBottles <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Number of bottles must be greater than 0'
      });
    }
    
    const liquor = await Liquor.findById(id);
    if (!liquor) {
      return res.status(404).json({
        success: false,
        message: 'Liquor item not found'
      });
    }
    
    const originalBottles = liquor.bottlesInStock;
    liquor.addBottles(numberOfBottles);
    await liquor.save();
    
    res.json({
      success: true,
      message: `${numberOfBottles} bottles added to stock`,
      data: liquor,
      stockChange: {
        previousBottles: originalBottles,
        addedBottles: numberOfBottles,
        newTotal: liquor.bottlesInStock
      }
    });
  } catch (error) {
    console.error('Error adding bottles to stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding bottles to stock',
      error: error.message
    });
  }
};

// Consume liquor (for sales)
export const consumeLiquor = async (req, res) => {
  try {
    const { id } = req.params;
    const { volume, portionName } = req.body;
    
    if (!volume || volume <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Volume must be greater than 0'
      });
    }
    
    const liquor = await Liquor.findById(id);
    if (!liquor) {
      return res.status(404).json({
        success: false,
        message: 'Liquor item not found'
      });
    }
    
    try {
      const consumptionResult = liquor.consumeLiquor(volume);
      await liquor.save();
      
      res.json({
        success: true,
        message: `${volume}ml consumed from ${liquor.name}`,
        data: liquor,
        consumption: {
          ...consumptionResult,
          portionName: portionName || `${volume}ml`
        }
      });
    } catch (consumptionError) {
      return res.status(400).json({
        success: false,
        message: consumptionError.message
      });
    }
  } catch (error) {
    console.error('Error consuming liquor:', error);
    res.status(500).json({
      success: false,
      message: 'Error consuming liquor',
      error: error.message
    });
  }
};

// Update portions for a liquor item
export const updateLiquorPortions = async (req, res) => {
  try {
    const { id } = req.params;
    const { portions } = req.body;
    
    if (!portions || !Array.isArray(portions)) {
      return res.status(400).json({
        success: false,
        message: 'Portions must be provided as an array'
      });
    }
    
    const liquor = await Liquor.findByIdAndUpdate(
      id,
      { portions },
      { new: true, runValidators: true }
    );
    
    if (!liquor) {
      return res.status(404).json({
        success: false,
        message: 'Liquor item not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Liquor portions updated successfully',
      data: liquor
    });
  } catch (error) {
    console.error('Error updating liquor portions:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating liquor portions',
      error: error.message
    });
  }
};

// Delete liquor item (soft delete)
export const deleteLiquorItem = async (req, res) => {
  try {
    const liquor = await Liquor.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!liquor) {
      return res.status(404).json({
        success: false,
        message: 'Liquor item not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Liquor item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting liquor item:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting liquor item',
      error: error.message
    });
  }
};

// Get low stock liquor items
export const getLowStockLiquors = async (req, res) => {
  try {
    const lowStockItems = await Liquor.getLowStock();
    
    res.json({
      success: true,
      data: lowStockItems,
      count: lowStockItems.length
    });
  } catch (error) {
    console.error('Error fetching low stock liquor items:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching low stock liquor items',
      error: error.message
    });
  }
};

// Get liquor analytics
export const getLiquorAnalytics = async (req, res) => {
  try {
    const analytics = await Liquor.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalBottles: { $sum: '$bottlesInStock' },
          totalValue: { $sum: { $multiply: ['$bottlesInStock', '$pricePerBottle'] } },
          totalWastedVolume: { $sum: '$wastedVolume' },
          totalSoldVolume: { $sum: '$totalSoldVolume' },
          lowStockCount: {
            $sum: {
              $cond: [{ $lte: ['$bottlesInStock', '$minimumBottles'] }, 1, 0]
            }
          }
        }
      }
    ]);
    
    // Get analytics by type
    const typeAnalytics = await Liquor.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalBottles: { $sum: '$bottlesInStock' },
          totalValue: { $sum: { $multiply: ['$bottlesInStock', '$pricePerBottle'] } },
          averagePrice: { $avg: '$pricePerBottle' },
          totalWastedVolume: { $sum: '$wastedVolume' },
          totalSoldVolume: { $sum: '$totalSoldVolume' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        overall: analytics[0] || {
          totalItems: 0,
          totalBottles: 0,
          totalValue: 0,
          totalWastedVolume: 0,
          totalSoldVolume: 0,
          lowStockCount: 0
        },
        byType: typeAnalytics
      }
    });
  } catch (error) {
    console.error('Error fetching liquor analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching liquor analytics',
      error: error.message
    });
  }
};

// Process bill payment and consume stock for all items
export const processBillPayment = async (req, res) => {
  try {
    const { billId, tableNumber, items, total, serviceCharge } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items in bill to process'
      });
    }
    
    const consumptionResults = [];
    const errors = [];
    
    // Process each item in the bill
    for (const item of items) {
      try {
        // Extract original liquor ID if this is a portion item
        const liquorId = item.originalItemId || item.id;
        
        // Skip non-liquor items (food items don't have stock deduction)
        if (!liquorId || typeof liquorId !== 'string' || liquorId.length < 20) {
          continue;
        }
        
        const liquor = await Liquor.findById(liquorId);
        if (!liquor) {
          errors.push(`Liquor item not found: ${item.name}`);
          continue;
        }
        
        let consumptionResult;
        
        if (liquor.type === 'hard_liquor') {
          // Hard liquor - consume by volume
          const portionVolume = item.portion?.ml || item.portion?.volume || 0;
          if (portionVolume <= 0) {
            errors.push(`Invalid portion volume for ${item.name}`);
            continue;
          }
          
          const totalVolume = portionVolume * item.quantity;
          consumptionResult = liquor.consumeLiquor(totalVolume);
          
        } else {
          // Beer, wine, cigarettes - consume by bottle/pack count
          if (liquor.bottlesInStock < item.quantity) {
            errors.push(`Insufficient stock for ${item.name}. Available: ${liquor.bottlesInStock}, Required: ${item.quantity}`);
            continue;
          }
          
          liquor.bottlesInStock -= item.quantity;
          // Track total sold items for analytics
          liquor.totalSoldItems = (liquor.totalSoldItems || 0) + item.quantity;
          
          consumptionResult = {
            itemsConsumed: item.quantity,
            remainingStock: liquor.bottlesInStock,
            stockType: 'bottles',
            totalSold: liquor.totalSoldItems
          };
        }
        
        await liquor.save();
        
        consumptionResults.push({
          itemId: liquorId,
          itemName: item.name,
          type: liquor.type,
          consumption: consumptionResult
        });
        
      } catch (itemError) {
        console.error(`Error processing item ${item.name}:`, itemError);
        errors.push(`Error processing ${item.name}: ${itemError.message}`);
      }
    }
    
    const response = {
      success: true,
      message: 'Bill payment processed successfully',
      billInfo: {
        billId,
        tableNumber,
        total,
        serviceCharge,
        processedAt: new Date()
      },
      stockConsumption: {
        totalItemsProcessed: consumptionResults.length,
        results: consumptionResults
      }
    };
    
    if (errors.length > 0) {
      response.warnings = errors;
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('Error processing bill payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing bill payment',
      error: error.message
    });
  }
};

// Enhanced consume liquor with better analytics
export const consumeLiquorEnhanced = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity = 1, volume } = req.body;
    
    const liquor = await Liquor.findById(id);
    if (!liquor) {
      return res.status(404).json({
        success: false,
        message: 'Liquor item not found'
      });
    }
    
    let consumptionResult;
    
    if (liquor.type === 'hard_liquor') {
      // Hard liquor - consume by volume
      if (!volume || volume <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Volume must be greater than 0 for hard liquor'
        });
      }
      
      const totalVolume = volume * quantity;
      consumptionResult = liquor.consumeLiquor(totalVolume);
      
    } else if (liquor.type === 'ice_cubes' || liquor.type === 'sandy_bottles') {
      // Ice cubes and sandy bottles - consume by quantity
      consumptionResult = liquor.consumeByQuantity(quantity);
      
    } else {
      // Beer, wine, cigarettes - consume by count
      if (liquor.bottlesInStock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Available: ${liquor.bottlesInStock}, Required: ${quantity}`
        });
      }
      
      liquor.bottlesInStock -= quantity;
      consumptionResult = {
        itemsConsumed: quantity,
        remainingStock: liquor.bottlesInStock,
        stockType: liquor.type === 'cigarettes' ? 'packs' : 'bottles'
      };
    }
    
    await liquor.save();
    
    let unitType;
    if (liquor.type === 'hard_liquor') {
      unitType = 'portions';
    } else if (liquor.type === 'cigarettes') {
      unitType = 'packs';
    } else if (liquor.type === 'ice_cubes') {
      unitType = 'bowls';
    } else if (liquor.type === 'sandy_bottles') {
      unitType = 'bottles';
    } else {
      unitType = 'bottles';
    }

    res.json({
      success: true,
      message: `${quantity} ${unitType} consumed from ${liquor.name}`,
      data: liquor,
      consumption: consumptionResult
    });
    
  } catch (error) {
    if (error.message.includes('Insufficient stock') || error.message.includes('Invalid volume')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    console.error('Error consuming liquor:', error);
    res.status(500).json({
      success: false,
      message: 'Error consuming liquor',
      error: error.message
    });
  }
};

// Auto-discard bottles with ≤30ml remaining
export const autoDiscardLowVolumes = async (req, res) => {
  try {
    const results = await Liquor.autoDiscardLowVolumes();
    
    const totalWasted = results.reduce((sum, item) => sum + item.wastedVolume, 0);
    
    res.json({
      success: true,
      message: `Auto-discard completed. ${results.length} bottles processed.`,
      data: {
        processedBottles: results,
        totalWastedVolume: totalWasted,
        bottlesDiscarded: results.length
      }
    });
  } catch (error) {
    console.error('Error during auto-discard:', error);
    res.status(500).json({
      success: false,
      message: 'Error during auto-discard process',
      error: error.message
    });
  }
};

// Get liquor statistics for admin dashboard
export const getLiquorStats = async (req, res) => {
  try {
    const stats = await Liquor.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalBottles: { $sum: '$bottlesInStock' },
          totalValue: { $sum: { $multiply: ['$bottlesInStock', '$pricePerBottle'] } },
          lowStockCount: {
            $sum: {
              $cond: [{ $lte: ['$bottlesInStock', '$minimumBottles'] }, 1, 0]
            }
          },
          totalVolume: { $sum: { $multiply: ['$bottlesInStock', '$bottleVolume'] } },
          totalWastedVolume: { $sum: '$wastedVolume' },
          totalSoldVolume: { $sum: '$totalSoldVolume' },
          totalPortions: { $sum: { $size: '$portions' } }
        }
      }
    ]);

    const typeStats = await Liquor.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalBottles: { $sum: '$bottlesInStock' },
          totalValue: { $sum: { $multiply: ['$bottlesInStock', '$pricePerBottle'] } }
        }
      }
    ]);

    const result = stats[0] || {
      totalItems: 0,
      totalBottles: 0,
      totalValue: 0,
      lowStockCount: 0,
      totalVolume: 0,
      totalWastedVolume: 0,
      totalSoldVolume: 0,
      totalPortions: 0
    };

    res.json({
      success: true,
      data: {
        ...result,
        typeBreakdown: typeStats
      }
    });
  } catch (error) {
    console.error('Error getting liquor stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch liquor statistics',
      error: error.message
    });
  }
};
