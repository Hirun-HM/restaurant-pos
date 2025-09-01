import mongoose from 'mongoose';
import Stock from '../models/Stock.js';
import Recipe from '../models/Recipe.js';

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
