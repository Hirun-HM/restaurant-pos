import mongoose from 'mongoose';
import Stock from '../models/Stock.js';
import StockAuditLog from '../models/StockAuditLog.js';
import Recipe from '../models/Recipe.js';

/**
 * Unit conversion utility
 * Converts quantities between different units
 */
const unitConversion = {
    // Weight conversions to grams (base unit)
    weight: {
        'g': 1,
        'gram': 1,
        'grams': 1,
        'kg': 1000,
        'kilogram': 1000,
        'kilograms': 1000,
        'lb': 453.592,
        'pound': 453.592,
        'pounds': 453.592,
        'oz': 28.3495,
        'ounce': 28.3495,
        'ounces': 28.3495
    },
    // Volume conversions to milliliters (base unit)
    volume: {
        'ml': 1,
        'milliliter': 1,
        'milliliters': 1,
        'l': 1000,
        'liter': 1000,
        'liters': 1000,
        'cup': 240,
        'cups': 240,
        'tbsp': 15,
        'tablespoon': 15,
        'tablespoons': 15,
        'tsp': 5,
        'teaspoon': 5,
        'teaspoons': 5
    },
    // Count units (no conversion needed)
    count: {
        'piece': 1,
        'pieces': 1,
        'item': 1,
        'items': 1,
        'unit': 1,
        'units': 1
    }
};

/**
 * Convert quantity from one unit to another
 * @param {number} quantity - The quantity to convert
 * @param {string} fromUnit - Source unit
 * @param {string} toUnit - Target unit
 * @returns {number} - Converted quantity
 */
const convertUnits = (quantity, fromUnit, toUnit) => {
    // Normalize unit names (lowercase, trim)
    const normalizeUnit = (unit) => unit.toLowerCase().trim();
    const from = normalizeUnit(fromUnit);
    const to = normalizeUnit(toUnit);

    // If units are the same, no conversion needed
    if (from === to) return quantity;

    // Find which category the units belong to
    let fromFactor = null;
    let toFactor = null;
    let category = null;

    for (const [cat, conversions] of Object.entries(unitConversion)) {
        if (conversions[from] && conversions[to]) {
            fromFactor = conversions[from];
            toFactor = conversions[to];
            category = cat;
            break;
        }
    }

    if (fromFactor === null || toFactor === null) {
        // Units are not in the same category or not found
        console.warn(`Cannot convert from ${fromUnit} to ${toUnit} - units may be incompatible`);
        return quantity; // Return original quantity if conversion is not possible
    }

    // Convert: (quantity * fromFactor) / toFactor
    const convertedValue = (quantity * fromFactor) / toFactor;
    
    // Fix floating-point precision issues by rounding to appropriate decimal places
    // For weight (grams), round to 2 decimal places
    // For volume (ml), round to 2 decimal places  
    // For count, round to 0 decimal places
    let decimalPlaces;
    switch (category) {
        case 'weight':
            decimalPlaces = 2; // 0.01g precision
            break;
        case 'volume':
            decimalPlaces = 2; // 0.01ml precision
            break;
        case 'count':
            decimalPlaces = 0; // whole numbers only
            break;
        default:
            decimalPlaces = 2;
    }
    
    return Math.round(convertedValue * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
};

/**
 * Reduce stock quantities based on order items
 * @param {Array} orderItems - Array of { menuItemId, quantity }
 * @param {String} orderId - Order ID for audit logging
 * @returns {Promise<{success: boolean, message: string, insufficientStock?: Array}>}
 */
export const reduceStockFromOrder = async (orderItems, orderId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Get all recipes for the menu items in the order
        const menuItemIds = orderItems.map(item => item.menuItemId);
        const recipes = await Recipe.find({
            menuItemId: { $in: menuItemIds },
            isActive: true
        }).populate('ingredients.stockItem');

        // Check if we have recipes for all menu items
        const missingRecipes = orderItems.filter(orderItem => 
            !recipes.find(recipe => recipe.menuItemId.toString() === orderItem.menuItemId.toString())
        );

        if (missingRecipes.length > 0) {
            throw new Error(`Missing recipes for some menu items: ${missingRecipes.map(item => item.menuItemId).join(', ')}`);
        }

        // Calculate total required quantities for each stock item
        const stockRequirements = new Map();

        for (const orderItem of orderItems) {
            const recipe = recipes.find(r => r.menuItemId.toString() === orderItem.menuItemId.toString());
            
            for (const ingredient of recipe.ingredients) {
                const requiredQty = (ingredient.quantity * orderItem.quantity) / recipe.portionSize;
                const currentQty = stockRequirements.get(ingredient.stockItem._id.toString()) || 0;
                stockRequirements.set(ingredient.stockItem._id.toString(), currentQty + requiredQty);
            }
        }

        // Check if we have sufficient stock for all ingredients
        const insufficientStock = [];
        
        for (const [stockId, requiredQty] of stockRequirements) {
            const stockItem = await Stock.findById(stockId).session(session);
            if (!stockItem || stockItem.quantity < requiredQty) {
                insufficientStock.push({
                    stockId,
                    itemName: stockItem?.name || 'Unknown Item',
                    required: requiredQty,
                    available: stockItem?.quantity || 0
                });
            }
        }

        if (insufficientStock.length > 0) {
            await session.abortTransaction();
            return {
                success: false,
                message: 'Insufficient stock for some ingredients',
                insufficientStock
            };
        }

        // Reduce stock quantities and create audit logs
        for (const [stockId, reduceQty] of stockRequirements) {
            await Stock.findByIdAndUpdate(
                stockId,
                { 
                    $inc: { quantity: -reduceQty },
                    $set: { lastUpdated: new Date() }
                },
                { session, new: true }
            );

            // Create audit log entry
            await StockAuditLog.create([{
                stockId,
                action: 'quantity_subtract',
                quantityChange: -reduceQty,
                reason: `Order ID: ${orderId}`,
                notes: `Stock reduced for order processing`
            }], { session });
        }

        await session.commitTransaction();
        return {
            success: true,
            message: 'Stock quantities updated successfully'
        };

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Stock management utilities
 */
export const stockManagement = {
    /**
     * Consume stock for a specific ingredient
     * @param {String} stockItemName - Name of the stock item
     * @param {Number} quantityToConsume - Amount to consume
     * @param {String} unit - Unit of measurement
     * @param {String} reason - Reason for consumption
     * @param {mongoose.Session} session - MongoDB session for transactions
     * @returns {Promise<Object>} - Consumption result
     */
    async consumeStock(stockItemName, quantityToConsume, unit = 'g', reason = 'Order processing', session = null) {
        try {
            // Find stock item by name (case-insensitive)
            const stockItem = await Stock.findOne({ 
                name: { $regex: new RegExp(`^${stockItemName}$`, 'i') }
            }).session(session);

            if (!stockItem) {
                throw new Error(`Stock item "${stockItemName}" not found`);
            }

            // Convert the required quantity to the stock's unit
            const convertedQuantity = convertUnits(quantityToConsume, unit, stockItem.unit);
            
            console.log(`🔧 Unit conversion: ${quantityToConsume}${unit} -> ${convertedQuantity}${stockItem.unit}`);

            // Check if we have sufficient stock (using converted quantity)
            if (stockItem.quantity < convertedQuantity) {
                throw new Error(
                    `Insufficient stock for "${stockItemName}". ` +
                    `Required: ${quantityToConsume}${unit} (${convertedQuantity}${stockItem.unit}), Available: ${stockItem.quantity}${stockItem.unit}`
                );
            }

            // Update stock quantity (using converted quantity)
            const updatedStock = await Stock.findByIdAndUpdate(
                stockItem._id,
                {
                    $inc: { quantity: -convertedQuantity },
                    $set: { lastUpdated: new Date() }
                },
                { session, new: true }
            );

            // Fix any floating-point precision issues in the final quantity
            const roundedQuantity = Math.round(updatedStock.quantity * 100) / 100;
            if (Math.abs(updatedStock.quantity - roundedQuantity) > 0.0001) {
                await Stock.findByIdAndUpdate(
                    stockItem._id,
                    { $set: { quantity: roundedQuantity } },
                    { session }
                );
                updatedStock.quantity = roundedQuantity;
            }

            // Create audit log (using converted quantity)
            await StockAuditLog.create([{
                stockId: stockItem._id,
                action: 'quantity_subtract',
                quantityChange: -convertedQuantity,
                reason: reason,
                notes: `Consumed ${quantityToConsume}${unit} (${convertedQuantity}${stockItem.unit}) for: ${reason}`,
                timestamp: new Date()
            }], { session });

            return {
                success: true,
                stockId: stockItem._id,
                itemName: stockItemName,
                consumedQuantity: convertedQuantity, // Return converted quantity
                originalQuantity: quantityToConsume,
                originalUnit: unit,
                remainingQuantity: updatedStock.quantity,
                unit: unit
            };

        } catch (error) {
            throw error;
        }
    },

    /**
     * Check stock availability
     * @param {String} stockItemName - Name of the stock item
     * @param {Number} requiredQuantity - Required amount
     * @param {String} unit - Unit of measurement
     * @returns {Promise<Object>} - Availability check result
     */
    async checkStockAvailability(stockItemName, requiredQuantity, unit = 'g') {
        try {
            const stockItem = await Stock.findOne({ 
                name: { $regex: new RegExp(`^${stockItemName}$`, 'i') }
            });

            if (!stockItem) {
                return {
                    sufficient: false,
                    availableQuantity: 0,
                    requiredQuantity,
                    error: `Stock item "${stockItemName}" not found`
                };
            }

            return {
                sufficient: stockItem.quantity >= requiredQuantity,
                availableQuantity: stockItem.quantity,
                requiredQuantity,
                stockId: stockItem._id,
                unit: stockItem.unit || unit
            };

        } catch (error) {
            throw error;
        }
    }
};

// Keep existing exports for backward compatibility
