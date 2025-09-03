import mongoose from 'mongoose';
import Order from '../models/Order.js';
import { stockManagement } from '../utils/stockManagement.js';

/**
 * Create a new order (existing functionality)
 */
export const createOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { items, tableId, customerId, ...orderData } = req.body;

        // First, check if we have sufficient stock for all items
        const stockCheck = await reduceStockFromOrder(items, 'preview');
        
        if (!stockCheck.success) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock for some items',
                insufficientItems: stockCheck.insufficientStock.map(item => ({
                    name: item.itemName,
                    required: item.required,
                    available: item.available
                }))
            });
        }

        // Create the order
        const order = new Order({
            items,
            tableId,
            customerId,
            ...orderData
        });

        await order.save({ session });

        // Reduce stock quantities
        const stockReduction = await reduceStockFromOrder(items, order._id);
        
        if (!stockReduction.success) {
            await session.abortTransaction();
            return res.status(500).json({
                success: false,
                message: 'Error reducing stock quantities'
            });
        }

        await session.commitTransaction();

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: order
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating order',
            error: error.message
        });
    } finally {
        session.endSession();
    }
};

/**
 * Process order payment and handle stock deduction
 */
export const processOrderPayment = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        console.log('🔍 Backend: Received order payment request');
        console.log('🔍 Backend: Request body:', JSON.stringify(req.body, null, 2));
        
        const { 
            tableId, 
            items, 
            total, 
            serviceCharge = false,
            paymentMethod = 'cash',
            customerId 
        } = req.body;

        console.log('🔍 Backend: Extracted data:');
        console.log('  - tableId:', tableId);
        console.log('  - items count:', items?.length);
        console.log('  - items:', items);
        console.log('  - total:', total);

        // Validate required fields
        if (!tableId || !items || !Array.isArray(items) || items.length === 0) {
            console.log('❌ Backend: Validation failed');
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: tableId and items are required'
            });
        }

        // Separate food items and liquor items
        const foodItems = items.filter(item => item.ingredients && item.ingredients.length > 0);
        const liquorItems = items.filter(item => item.type && ['hard_liquor', 'beer', 'wine', 'cigarettes'].includes(item.type));

        // Validate and consume stock for food items - GRACEFUL MODE
        // Only reduce stock for ingredients that exist, ignore missing ones
        const stockConsumptionResults = [];
        const missedIngredients = [];
        
        for (const foodItem of foodItems) {
            console.log(`🍽️ Processing food item: ${foodItem.name} (quantity: ${foodItem.quantity})`);
            
            for (const ingredient of foodItem.ingredients) {
                const totalQuantityNeeded = ingredient.quantity * foodItem.quantity;
                
                try {
                    const consumptionResult = await stockManagement.consumeStock(
                        ingredient.name,
                        totalQuantityNeeded,
                        ingredient.unit || 'g',
                        `Order for Table ${tableId} - ${foodItem.name}`,
                        session
                    );
                    stockConsumptionResults.push(consumptionResult);
                    console.log(`✅ Successfully consumed: ${ingredient.name} - ${totalQuantityNeeded}${ingredient.unit || 'g'}`);
                } catch (stockError) {
                    // Instead of failing, just log and continue with other ingredients
                    console.log(`⚠️ Skipping ingredient: ${ingredient.name} - ${stockError.message}`);
                    missedIngredients.push({
                        name: ingredient.name,
                        required: `${totalQuantityNeeded}${ingredient.unit || 'g'}`,
                        reason: stockError.message,
                        foodItem: foodItem.name
                    });
                    // Continue processing other ingredients instead of aborting
                }
            }
        }

        // Handle liquor consumption if needed
        const liquorConsumptionResults = [];
        for (const liquorItem of liquorItems) {
            try {
                // Import liquor controller functions
                const { consumeLiquorStock } = await import('./liquorController.js');
                
                const portion = liquorItem.selectedPortion || { volume: liquorItem.bottleVolume || 750 };
                const totalVolumeConsumed = portion.volume * liquorItem.quantity;
                
                const consumptionResult = await consumeLiquorStock(
                    liquorItem.id || liquorItem._id,
                    totalVolumeConsumed,
                    `Order for Table ${tableId} - ${liquorItem.name}`,
                    session
                );
                liquorConsumptionResults.push(consumptionResult);
            } catch (liquorError) {
                await session.abortTransaction();
                return res.status(400).json({
                    success: false,
                    message: `Insufficient liquor stock for ${liquorItem.name}`,
                    liquorError: liquorError.message
                });
            }
        }

        // Create order record
        const orderData = {
            tableId,
            items: items.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                category: item.category,
                type: item.type || 'food',
                ingredients: item.ingredients || [],
                selectedPortion: item.selectedPortion
            })),
            subtotal: total,
            serviceCharge: serviceCharge ? Math.round(total * 0.1) : 0,
            total: serviceCharge ? total + Math.round(total * 0.1) : total,
            paymentMethod,
            customerId,
            status: 'completed',
            stockConsumptions: stockConsumptionResults,
            liquorConsumptions: liquorConsumptionResults,
            createdAt: new Date(),
            completedAt: new Date()
        };

        // Save order to database
        const savedOrder = new Order({
            tableNumber: tableId,
            items: items.map(item => ({
                name: item.name,
                itemType: item.type === 'liquor' || ['hard_liquor', 'beer', 'wine', 'cigarettes'].includes(item.type) ? 'liquor' : 'food',
                itemId: new mongoose.Types.ObjectId(), // Generate a dummy ObjectId for now
                quantity: item.quantity,
                unitPrice: item.price,
                totalPrice: item.price * item.quantity,
                portionSize: item.portionSize || null
            })),
            subtotal: total,
            serviceCharge: serviceCharge ? Math.round(total * 0.1) : 0,
            total: serviceCharge ? total + Math.round(total * 0.1) : total,
            paymentMethod,
            customerId,
            status: 'paid',
            paymentStatus: 'paid',
            createdAt: new Date(),
            orderTime: new Date()
        });

        await savedOrder.save({ session });
        console.log('✅ Order saved to database with ID:', savedOrder._id);
        
        // Log summary of what was processed
        console.log(`📊 Processing Summary:`);
        console.log(`   - Stock items consumed: ${stockConsumptionResults.length}`);
        console.log(`   - Liquor items consumed: ${liquorConsumptionResults.length}`);
        console.log(`   - Ingredients skipped: ${missedIngredients.length}`);
        if (missedIngredients.length > 0) {
            console.log('   - Skipped ingredients:', missedIngredients.map(ing => ing.name).join(', '));
        }

        await session.commitTransaction();

        res.status(200).json({
            success: true,
            message: 'Order payment processed successfully',
            data: {
                orderId: savedOrder._id.toString(),
                tableId,
                items: savedOrder.items,
                subtotal: savedOrder.subtotal,
                serviceCharge: savedOrder.serviceCharge,
                total: savedOrder.total,
                paymentMethod: savedOrder.paymentMethod,
                status: savedOrder.status,
                paymentStatus: savedOrder.paymentStatus,
                stockConsumptions: stockConsumptionResults.length,
                liquorConsumptions: liquorConsumptionResults.length,
                createdAt: savedOrder.createdAt,
                orderTime: savedOrder.orderTime,
                missedIngredients: missedIngredients, // Include info about skipped ingredients
                processingNotes: missedIngredients.length > 0 
                    ? `${missedIngredients.length} ingredient(s) were skipped due to unavailability: ${missedIngredients.map(ing => ing.name).join(', ')}` 
                    : 'All ingredients were processed successfully'
            }
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('Error processing order payment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process order payment',
            error: error.message
        });
    } finally {
        session.endSession();
    }
};

/**
 * Validate stock availability for order items
 */
export const validateStockAvailability = async (req, res) => {
    try {
        const { foodItems = [], liquorItems = [] } = req.body;

        const validationResults = [];
        const insufficientStock = [];

        // Check food item ingredients
        for (const foodItem of foodItems) {
            if (foodItem.ingredients && foodItem.ingredients.length > 0) {
                for (const ingredient of foodItem.ingredients) {
                    const totalQuantityNeeded = ingredient.quantity * foodItem.quantity;
                    
                    try {
                        const availability = await stockManagement.checkStockAvailability(
                            ingredient.name,
                            totalQuantityNeeded,
                            ingredient.unit || 'g'
                        );
                        
                        validationResults.push({
                            item: foodItem.name,
                            ingredient: ingredient.name,
                            required: totalQuantityNeeded,
                            available: availability.availableQuantity,
                            sufficient: availability.sufficient
                        });

                        if (!availability.sufficient) {
                            insufficientStock.push({
                                item: foodItem.name,
                                ingredient: ingredient.name,
                                required: totalQuantityNeeded,
                                available: availability.availableQuantity,
                                shortfall: totalQuantityNeeded - availability.availableQuantity
                            });
                        }
                    } catch (error) {
                        insufficientStock.push({
                            item: foodItem.name,
                            ingredient: ingredient.name,
                            required: totalQuantityNeeded,
                            available: 0,
                            error: error.message
                        });
                    }
                }
            }
        }

        // For liquor items, we'll use the existing liquor stock management
        for (const liquorItem of liquorItems) {
            try {
                const portion = liquorItem.selectedPortion || { volume: liquorItem.bottleVolume || 750 };
                const totalVolumeNeeded = portion.volume * liquorItem.quantity;
                
                validationResults.push({
                    item: liquorItem.name,
                    type: 'liquor',
                    required: totalVolumeNeeded,
                    available: liquorItem.stock?.millilitersRemaining || 0,
                    sufficient: (liquorItem.stock?.millilitersRemaining || 0) >= totalVolumeNeeded
                });

                if ((liquorItem.stock?.millilitersRemaining || 0) < totalVolumeNeeded) {
                    insufficientStock.push({
                        item: liquorItem.name,
                        type: 'liquor',
                        required: totalVolumeNeeded,
                        available: liquorItem.stock?.millilitersRemaining || 0,
                        shortfall: totalVolumeNeeded - (liquorItem.stock?.millilitersRemaining || 0)
                    });
                }
            } catch (error) {
                insufficientStock.push({
                    item: liquorItem.name,
                    type: 'liquor',
                    error: error.message
                });
            }
        }

        res.status(200).json({
            success: true,
            data: {
                canFulfillOrder: insufficientStock.length === 0,
                validationResults,
                insufficientStock,
                summary: {
                    totalItemsChecked: validationResults.length,
                    insufficientItems: insufficientStock.length
                }
            }
        });

    } catch (error) {
        console.error('Error validating stock availability:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate stock availability',
            error: error.message
        });
    }
};

/**
 * Bulk stock consumption for food items
 */
export const bulkConsumeStock = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { consumptions } = req.body;

        if (!consumptions || !Array.isArray(consumptions)) {
            return res.status(400).json({
                success: false,
                message: 'Consumptions array is required'
            });
        }

        const results = [];

        for (const consumption of consumptions) {
            const { stockItemName, quantityConsumed, unit, orderId, foodItemName, reason } = consumption;
            
            try {
                const result = await stockManagement.consumeStock(
                    stockItemName,
                    quantityConsumed,
                    unit || 'g',
                    reason || `Order ${orderId} - ${foodItemName}`,
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
        console.error('Error in bulk stock consumption:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process bulk stock consumption',
            error: error.message
        });
    } finally {
        session.endSession();
    }
};

// Analytics endpoints for admin dashboard
export const getOrderStats = async (req, res) => {
    try {
        const Order = (await import('../models/Order.js')).default;
        
        const totalOrders = await Order.countDocuments();
        const activeOrders = await Order.countDocuments({ status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] } });
        const completedOrders = await Order.countDocuments({ paymentStatus: 'paid' });
        
        const revenueResult = await Order.aggregate([
            { $match: { paymentStatus: 'paid' } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$total' },
                    avgOrderValue: { $avg: '$total' }
                }
            }
        ]);
        
        const revenue = revenueResult[0] || { totalRevenue: 0, avgOrderValue: 0 };
        
        res.json({
            success: true,
            data: {
                totalOrders,
                activeOrders,
                completedOrders,
                totalRevenue: revenue.totalRevenue,
                avgOrderValue: revenue.avgOrderValue
            }
        });
    } catch (error) {
        console.error('Error fetching order stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order statistics',
            error: error.message
        });
    }
};

export const getRevenueData = async (req, res) => {
    try {
        const Order = (await import('../models/Order.js')).default;
        const { period = 'today' } = req.query;
        
        // Calculate date filter based on period
        const now = new Date();
        let dateFilter = {};
        
        switch (period) {
            case 'today':
                const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
                dateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
                break;
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                dateFilter = { createdAt: { $gte: weekAgo } };
                break;
            case 'month':
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                dateFilter = { createdAt: { $gte: monthAgo } };
                break;
        }
        
        const analytics = await Order.getRevenueAnalytics(dateFilter);
        
        res.json({
            success: true,
            data: analytics,
            period
        });
    } catch (error) {
        console.error('Error fetching revenue data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch revenue data',
            error: error.message
        });
    }
};

export const getAnalyticsData = async (req, res) => {
    try {
        const Order = (await import('../models/Order.js')).default;
        const { period = 'today' } = req.query;
        
        // Calculate date filter
        const now = new Date();
        let dateFilter = {};
        
        switch (period) {
            case 'today':
                const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
                dateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
                break;
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                dateFilter = { createdAt: { $gte: weekAgo } };
                break;
            case 'month':
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                dateFilter = { createdAt: { $gte: monthAgo } };
                break;
        }
        
        // Get top selling items
        const topItems = await Order.aggregate([
            { $match: { paymentStatus: 'paid', ...dateFilter } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.name',
                    totalSold: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: '$items.totalPrice' }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 }
        ]);
        
        res.json({
            success: true,
            data: {
                topItems,
                period
            }
        });
    } catch (error) {
        console.error('Error fetching analytics data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch analytics data',
            error: error.message
        });
    }
};

export const getProfitData = async (req, res) => {
    try {
        const Order = (await import('../models/Order.js')).default;
        const { period = 'today' } = req.query;
        
        // Calculate date filter
        const now = new Date();
        let dateFilter = {};
        
        switch (period) {
            case 'today':
                const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
                dateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
                break;
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                dateFilter = { createdAt: { $gte: weekAgo } };
                break;
            case 'month':
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                dateFilter = { createdAt: { $gte: monthAgo } };
                break;
        }
        
        const profitData = await Order.aggregate([
            { $match: { paymentStatus: 'paid', ...dateFilter } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$total' },
                    totalCost: { $sum: '$totalCost' },
                    totalProfit: { $sum: '$totalProfit' },
                    orderCount: { $sum: 1 }
                }
            }
        ]);
        
        const result = profitData[0] || {
            totalRevenue: 0,
            totalCost: 0,
            totalProfit: 0,
            orderCount: 0
        };
        
        // Calculate profit margin
        result.profitMargin = result.totalRevenue > 0 
            ? ((result.totalProfit / result.totalRevenue) * 100).toFixed(2)
            : 0;
            
        res.json({
            success: true,
            data: result,
            period
        });
    } catch (error) {
        console.error('Error fetching profit data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profit data',
            error: error.message
        });
    }
};

export const getFoodLiquorBreakdown = async (req, res) => {
    try {
        const Order = (await import('../models/Order.js')).default;
        const { period = 'today' } = req.query;
        
        // Calculate date filter
        const now = new Date();
        let dateFilter = {};
        
        switch (period) {
            case 'today':
                const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
                dateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
                break;
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                dateFilter = { createdAt: { $gte: weekAgo } };
                break;
            case 'month':
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                dateFilter = { createdAt: { $gte: monthAgo } };
                break;
        }
        
        const breakdown = await Order.getFoodLiquorBreakdown(dateFilter);
        
        res.json({
            success: true,
            data: breakdown,
            period
        });
    } catch (error) {
        console.error('Error fetching food/liquor breakdown:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch food/liquor breakdown',
            error: error.message
        });
    }
};
