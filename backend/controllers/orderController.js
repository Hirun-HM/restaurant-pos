import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Liquor from '../models/Liquor.js';
import { stockManagement } from '../utils/stockManagement.js';

/**
 * Create a new order (existing functionality)
 */
export const createOrder = async (req, res) => {
    try {
        const { tableNumber, items = [], subtotal = 0, total = 0, status = 'created' } = req.body;

        // Create the order
        const order = new Order({
            tableNumber,
            items: items.map(item => ({
                name: item.name || 'Unknown Item',
                itemType: item.itemType || 'food',
                itemId: item.itemId || new mongoose.Types.ObjectId(),
                quantity: item.quantity || 1,
                unitPrice: item.unitPrice || 0,
                totalPrice: item.totalPrice || 0,
                portionSize: item.portionSize || null
            })),
            subtotal,
            total,
            status,
            paymentStatus: 'unpaid'
        });

        await order.save();

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: order
        });

    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating order',
            error: error.message
        });
    }
};

/**
 * Update an existing order
 */
export const updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        console.log('🔍 OrderController: Updating order ID:', id);
        console.log('🔍 OrderController: Update data:', JSON.stringify(updateData, null, 2));

        // Handle composite itemIds for liquor items with portions
        if (updateData.items && Array.isArray(updateData.items)) {
            console.log('🔍 OrderController: Processing', updateData.items.length, 'items');
            
            updateData.items = updateData.items.map((item, index) => {
                console.log(`🔍 OrderController: Processing item ${index + 1}:`, item.name, 'ID:', item.itemId);
                
                // If itemId contains underscore, it's a composite ID (liquorId_portionType)
                if (item.itemId && typeof item.itemId === 'string' && item.itemId.includes('_')) {
                    // Extract the original liquor ID (before the underscore)
                    const originalId = item.itemId.split('_')[0];
                    console.log('🔍 OrderController: Composite ID detected. Extracting:', originalId, 'from:', item.itemId);
                    
                    // Validate that the extracted ID is a valid ObjectId
                    if (mongoose.Types.ObjectId.isValid(originalId)) {
                        console.log('✅ OrderController: Valid ObjectId extracted for', item.name);
                        return {
                            ...item,
                            itemId: originalId, // Use the original liquor ID for database storage
                            originalCompositeId: item.itemId // Keep track of the composite ID
                        };
                    } else {
                        console.log('⚠️ OrderController: Invalid ObjectId extracted for', item.name);
                    }
                }
                
                // For regular items or if validation fails, keep as is
                console.log('➡️ OrderController: Using original ID for', item.name);
                return item;
            });
        }

        const order = await Order.findByIdAndUpdate(id, updateData, { 
            new: true,
            runValidators: true // Ensure validation rules are applied
        });

        if (!order) {
            console.log('❌ OrderController: Order not found with ID:', id);
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        console.log('✅ OrderController: Order updated successfully');
        res.status(200).json({
            success: true,
            message: 'Order updated successfully',
            data: order
        });

    } catch (error) {
        console.error('❌ OrderController: Error updating order:', error);
        
        // Provide more specific error messages for common issues
        let errorMessage = 'Error updating order';
        if (error.name === 'ValidationError') {
            errorMessage = 'Invalid order data provided';
            console.error('❌ OrderController: Validation errors:', error.errors);
        } else if (error.name === 'CastError') {
            errorMessage = 'Invalid ID format in order items';
            console.error('❌ OrderController: Cast error details:', error.path, error.value);
        }
        
        res.status(500).json({
            success: false,
            message: errorMessage,
            error: error.message
        });
    }
};

/**
 * Process order payment and handle stock deduction
 */
export const processOrderPayment = async (req, res) => {
    let session = null;
    
    try {
        console.log('🔍 Backend: Received order payment request');
        console.log('🔍 Backend: Request body:', JSON.stringify(req.body, null, 2));
        
        // Start session and transaction
        session = await mongoose.startSession();
        session.startTransaction();
        
        const { 
            orderId, // Add orderId to identify existing order
            tableId, 
            items, 
            total, 
            serviceCharge = false,
            paymentMethod = 'cash',
            customerId 
        } = req.body;

        console.log('🔍 Backend: Extracted data:');
        console.log('  - orderId:', orderId);
        console.log('  - tableId:', tableId);
        console.log('  - items count:', items?.length);
        console.log('  - total:', total);

        // Validate required fields (allow empty items array for empty bills)
        if (!tableId || !items || !Array.isArray(items)) {
            console.log('❌ Backend: Validation failed - missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: tableId and items array are required'
            });
        }

        // Log if this is an empty bill
        if (items.length === 0) {
            console.log('🔍 Backend: Processing empty bill (no items)');
        }

        // If orderId is provided, find and update existing order
        let existingOrder = null;
        if (orderId) {
            console.log('🔍 Looking for existing order with ID:', orderId);
            try {
                existingOrder = await Order.findById(orderId).session(session);
                if (!existingOrder) {
                    console.log('❌ Order not found with ID:', orderId);
                    return res.status(404).json({
                        success: false,
                        message: 'Order not found'
                    });
                }
                console.log('✅ Found existing order:', existingOrder._id);
            } catch (findError) {
                console.error('❌ Error finding order:', findError);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid order ID format',
                    error: findError.message
                });
            }
        }

        // Separate food items and liquor items
        const foodItems = items.filter(item => item.ingredients && item.ingredients.length > 0);
        const liquorItems = items.filter(item => item.type && ['hard_liquor', 'beer', 'wine', 'cigarettes', 'ice_cubes', 'sandy_bottles'].includes(item.type));

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

        // Handle liquor consumption with different strategies for different types
        const liquorConsumptionResults = [];
        for (const liquorItem of liquorItems) {
            try {
                console.log(`🍺 Processing liquor item: ${liquorItem.name} (type: ${liquorItem.type}, quantity: ${liquorItem.quantity})`);
                
                // Get the actual liquor item from database using originalItemId
                const liquorId = liquorItem.originalItemId || (liquorItem.id && liquorItem.id.includes('_') ? liquorItem.id.split('_')[0] : liquorItem.id);
                if (!liquorId) {
                    throw new Error('No valid liquor ID found');
                }
                
                const liquorFromDB = await Liquor.findById(liquorId).session(session);
                if (!liquorFromDB) {
                    throw new Error(`Liquor item not found in database: ${liquorId}`);
                }

                // Check if we have enough stock
                if (liquorFromDB.bottlesInStock <= 0) {
                    throw new Error(`No stock available for ${liquorFromDB.name}`);
                }

                let consumptionResult;
                
                if (liquorItem.type === 'hard_liquor') {
                    // Check if this is a full bottle sale or portion sale
                    const isFullBottleSale = liquorItem.isFullBottle || liquorItem.id?.includes('_full');
                    
                    if (isFullBottleSale) {
                        // Full bottle sale - treat as unit-based consumption
                        const quantityToConsume = liquorItem.quantity;
                        
                        console.log(`🍾 Full bottle sale: consuming ${quantityToConsume} bottles of ${liquorFromDB.name}`);
                        
                        if (liquorFromDB.bottlesInStock < quantityToConsume) {
                            throw new Error(`Insufficient bottles for full bottle sale. Required: ${quantityToConsume}, Available: ${liquorFromDB.bottlesInStock}`);
                        }
                        
                        // Reduce bottle count
                        liquorFromDB.bottlesInStock -= quantityToConsume;
                        liquorFromDB.totalSoldItems += quantityToConsume;
                        
                        // Also reduce total volume accordingly
                        const volumeConsumed = quantityToConsume * liquorFromDB.bottleVolume;
                        liquorFromDB.totalVolumeRemaining -= volumeConsumed;
                        
                        consumptionResult = {
                            consumed: quantityToConsume,
                            volumeConsumed: volumeConsumed,
                            remainingBottles: liquorFromDB.bottlesInStock,
                            remainingVolume: liquorFromDB.totalVolumeRemaining
                        };
                        
                        liquorConsumptionResults.push({
                            itemName: liquorItem.name,
                            type: liquorItem.type,
                            liquorId: liquorId,
                            bottlesConsumed: quantityToConsume,
                            volumeConsumed: volumeConsumed,
                            quantity: liquorItem.quantity,
                            saleType: 'full_bottle',
                            remainingBottles: liquorFromDB.bottlesInStock,
                            remainingVolume: liquorFromDB.totalVolumeRemaining,
                            note: `Full bottle sale - ${quantityToConsume} bottle(s) sold`
                        });
                    } else {
                        // Portion sale - Handle volume-based consumption
                        const portion = liquorItem.portion || liquorItem.selectedPortion || { ml: 25 }; // Default to 25ml
                        const volumePerItem = portion.ml || portion.volume || 25;
                        const totalVolumeToConsume = volumePerItem * liquorItem.quantity;
                        
                        console.log(`📊 Consuming ${totalVolumeToConsume}ml (${volumePerItem}ml × ${liquorItem.quantity}) from ${liquorFromDB.name}`);
                        
                        // Check if we have enough volume
                        if (liquorFromDB.totalVolumeRemaining < totalVolumeToConsume) {
                            throw new Error(`Insufficient volume for ${liquorFromDB.name}. Required: ${totalVolumeToConsume}ml, Available: ${liquorFromDB.totalVolumeRemaining}ml`);
                        }
                        
                        // Consume the liquor volume
                        consumptionResult = liquorFromDB.consumeLiquor(totalVolumeToConsume);
                        
                        liquorConsumptionResults.push({
                            itemName: liquorItem.name,
                            type: liquorItem.type,
                            liquorId: liquorId,
                            volumeConsumed: consumptionResult.consumed,
                            volumeWasted: consumptionResult.wasted,
                            bottlesCompleted: consumptionResult.bottlesCompleted,
                            quantity: liquorItem.quantity,
                            portionSize: `${volumePerItem}ml`,
                            saleType: 'portion',
                            remainingBottles: consumptionResult.remainingBottles,
                            remainingVolume: consumptionResult.remainingVolume,
                            note: 'Volume successfully deducted from stock'
                        });
                    }
                    
                } else if (liquorItem.type === 'ice_cubes' || liquorItem.type === 'sandy_bottles') {
                    // Ice cubes and sandy bottles: Handle unit-based consumption
                    const quantityToConsume = liquorItem.quantity;
                    
                    console.log(`🧊 Consuming ${quantityToConsume} ${liquorItem.type === 'ice_cubes' ? 'bowls' : 'bottles'} of ${liquorFromDB.name}`);
                    
                    // Use the new consumeByQuantity method
                    consumptionResult = liquorFromDB.consumeByQuantity(quantityToConsume);
                    
                    liquorConsumptionResults.push({
                        itemName: liquorItem.name,
                        type: liquorItem.type,
                        liquorId: liquorId,
                        quantityConsumed: consumptionResult.consumed,
                        quantity: liquorItem.quantity,
                        saleType: 'unit_based',
                        remainingStock: consumptionResult.remainingStock,
                        unit: liquorItem.type === 'ice_cubes' ? 'bowls' : 'bottles',
                        note: `${quantityToConsume} ${liquorItem.type === 'ice_cubes' ? 'bowl(s)' : 'bottle(s)'} consumed from stock`
                    });
                    
                } else {
                    // Beer, Wine, Cigarettes, Other: Handle unit-based consumption (whole bottles/packs)
                    const quantityToConsume = liquorItem.quantity;
                    
                    console.log(`📦 Consuming ${quantityToConsume} units of ${liquorFromDB.name}`);
                    
                    // Check if we have enough units in stock
                    if (liquorFromDB.bottlesInStock < quantityToConsume) {
                        throw new Error(`Insufficient stock for ${liquorFromDB.name}. Required: ${quantityToConsume}, Available: ${liquorFromDB.bottlesInStock}`);
                    }
                    
                    // For cigarettes, handle both pack and individual sales
                    if (liquorItem.type === 'cigarettes') {
                        // Check if this is individual cigarette sale or pack sale
                        const isIndividualSale = liquorItem.isIndividual || (liquorItem.price !== liquorFromDB.pricePerBottle);
                        
                        if (isIndividualSale) {
                            // Individual cigarette sale - convert to packs
                            const cigarettesPerPack = liquorFromDB.cigarettesPerPack || 20;
                            const packsNeeded = Math.ceil(quantityToConsume / cigarettesPerPack);
                            
                            console.log(`� Individual cigarette sale: ${quantityToConsume} cigarettes = ${packsNeeded} pack(s) needed`);
                            
                            if (liquorFromDB.bottlesInStock < packsNeeded) {
                                throw new Error(`Insufficient packs for individual cigarette sale. Need ${packsNeeded} pack(s), have ${liquorFromDB.bottlesInStock}`);
                            }
                            
                            // Reduce pack count and track individual sales
                            liquorFromDB.bottlesInStock -= packsNeeded;
                            liquorFromDB.totalSoldItems += packsNeeded;
                            liquorFromDB.individualCigaretteSales += quantityToConsume; // Track individual cigarettes sold
                            
                            consumptionResult = {
                                consumed: quantityToConsume,
                                packsUsed: packsNeeded,
                                remainingBottles: liquorFromDB.bottlesInStock
                            };
                            
                            liquorConsumptionResults.push({
                                itemName: liquorItem.name,
                                type: liquorItem.type,
                                liquorId: liquorId,
                                cigarettesConsumed: quantityToConsume,
                                packsUsed: packsNeeded,
                                quantity: liquorItem.quantity,
                                saleType: 'individual',
                                remainingPacks: liquorFromDB.bottlesInStock,
                                note: `Individual cigarette sale - ${quantityToConsume} cigarettes from ${packsNeeded} pack(s)`
                            });
                        } else {
                            // Pack sale
                            liquorFromDB.bottlesInStock -= quantityToConsume;
                            liquorFromDB.totalSoldItems += quantityToConsume;
                            
                            consumptionResult = {
                                consumed: quantityToConsume,
                                remainingBottles: liquorFromDB.bottlesInStock
                            };
                            
                            liquorConsumptionResults.push({
                                itemName: liquorItem.name,
                                type: liquorItem.type,
                                liquorId: liquorId,
                                packsConsumed: quantityToConsume,
                                quantity: liquorItem.quantity,
                                saleType: 'pack',
                                remainingPacks: liquorFromDB.bottlesInStock,
                                note: `Pack sale - ${quantityToConsume} pack(s) sold`
                            });
                        }
                    } else {
                        // Beer, Wine, Other - simple unit consumption
                        liquorFromDB.bottlesInStock -= quantityToConsume;
                        liquorFromDB.totalSoldItems += quantityToConsume;
                        
                        consumptionResult = {
                            consumed: quantityToConsume,
                            remainingBottles: liquorFromDB.bottlesInStock
                        };
                        
                        liquorConsumptionResults.push({
                            itemName: liquorItem.name,
                            type: liquorItem.type,
                            liquorId: liquorId,
                            unitsConsumed: quantityToConsume,
                            quantity: liquorItem.quantity,
                            remainingUnits: liquorFromDB.bottlesInStock,
                            note: `Unit-based sale - ${quantityToConsume} ${liquorItem.type}(s) sold`
                        });
                    }
                }
                
                // Save the updated liquor data
                await liquorFromDB.save({ session });
                
                
            } catch (liquorError) {
                // Don't abort transaction for liquor issues - just log and continue
                liquorConsumptionResults.push({
                    itemName: liquorItem.name,
                    type: liquorItem.type || 'unknown',
                    quantity: liquorItem.quantity,
                    error: liquorError.message,
                    note: 'Liquor consumption failed but order continues'
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

        // Update existing order or create new order record
        let savedOrder;
        if (existingOrder) {
            // Update existing order
            existingOrder.items = items.map(item => ({
                name: item.name,
                itemType: item.type === 'liquor' || ['hard_liquor', 'beer', 'wine', 'cigarettes', 'ice_cubes', 'sandy_bottles'].includes(item.type) ? 'liquor' : 'food',
                itemId: item.originalItemId || (item.id && item.id.includes('_') ? item.id.split('_')[0] : item.id) || new mongoose.Types.ObjectId(),
                quantity: item.quantity,
                unitPrice: item.price,
                totalPrice: item.price * item.quantity,
                portionSize: item.portionSize || (item.portion ? `${item.portion.ml}ml` : null)
            }));
            existingOrder.subtotal = total;
            existingOrder.serviceCharge = serviceCharge ? Math.round(total * 0.1) : 0;
            existingOrder.total = serviceCharge ? total + Math.round(total * 0.1) : total;
            existingOrder.paymentMethod = paymentMethod;
            existingOrder.status = 'paid';
            existingOrder.paymentStatus = 'paid';
            existingOrder.paidAt = new Date();

            await existingOrder.save({ session });
            savedOrder = existingOrder;
            console.log('✅ Existing order updated with ID:', savedOrder._id);
        } else {
            // Create new order (fallback for backward compatibility)
            savedOrder = new Order({
                tableNumber: tableId,
                items: items.map(item => ({
                    name: item.name,
                    itemType: item.type === 'liquor' || ['hard_liquor', 'beer', 'wine', 'cigarettes', 'ice_cubes', 'sandy_bottles'].includes(item.type) ? 'liquor' : 'food',
                    itemId: item.originalItemId || (item.id && item.id.includes('_') ? item.id.split('_')[0] : item.id) || new mongoose.Types.ObjectId(),
                    quantity: item.quantity,
                    unitPrice: item.price,
                    totalPrice: item.price * item.quantity,
                    portionSize: item.portionSize || (item.portion ? `${item.portion.ml}ml` : null)
                })),
                subtotal: total,
                serviceCharge: serviceCharge ? Math.round(total * 0.1) : 0,
                total: serviceCharge ? total + Math.round(total * 0.1) : total,
                paymentMethod,
                customerId,
                status: 'paid',
                paymentStatus: 'paid',
                createdAt: new Date(),
                paidAt: new Date()
            });

            await savedOrder.save({ session });
            console.log('✅ New order created with ID:', savedOrder._id);
        }
        
        // Log summary of what was processed
        console.log(`📊 Processing Summary:`);
        console.log(`   - Stock items consumed: ${stockConsumptionResults.length}`);
        console.log(`   - Liquor items consumed: ${liquorConsumptionResults.length}`);
        console.log(`   - Ingredients skipped: ${missedIngredients.length}`);
        if (missedIngredients.length > 0) {
            console.log('   - Skipped ingredients:', missedIngredients.map(ing => ing.name).join(', '));
        }

        // Commit the transaction BEFORE sending response
        console.log('💾 Committing transaction...');
        await session.commitTransaction();
        console.log('✅ Transaction committed successfully');

        // Prepare the response data
        const responseData = {
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
                liquorConsumptionDetails: liquorConsumptionResults, // Include detailed liquor consumption info
                createdAt: savedOrder.createdAt,
                orderTime: savedOrder.orderTime,
                missedIngredients: missedIngredients, // Include info about skipped ingredients
                processingNotes: missedIngredients.length > 0 
                    ? `${missedIngredients.length} ingredient(s) were skipped due to unavailability: ${missedIngredients.map(ing => ing.name).join(', ')}` 
                    : 'All ingredients were processed successfully'
            }
        };

        console.log('📤 Sending success response...');
        res.status(200).json(responseData);
        console.log('✅ Response sent successfully');

    } catch (error) {
        console.error('❌ Error processing order payment:', error);
        console.error('❌ Error stack:', error.stack);
        
        try {
            await session.abortTransaction();
        } catch (abortError) {
            console.error('❌ Error aborting transaction:', abortError);
        }
        
        // Don't return a 500 for insufficient stock - this is expected behavior
        if (error.message && error.message.includes('Insufficient stock')) {
            return res.status(400).json({
                success: false,
                message: 'Some ingredients are out of stock, but payment can still be processed with available items only',
                error: error.message,
                recommendation: 'Consider updating menu availability or restocking ingredients'
            });
        }
        
        // Handle specific error types
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Data validation failed',
                error: error.message
            });
        }

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid data format provided',
                error: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to process order payment',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        if (session) {
            console.log('🔄 Ending session...');
            try {
                await session.endSession();
                console.log('✅ Session ended');
            } catch (sessionError) {
                console.error('❌ Error ending session:', sessionError);
            }
        }
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
            case 'year':
                const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                dateFilter = { createdAt: { $gte: yearAgo } };
                break;
            default:
                // If no filter, get all time data
                dateFilter = {};
        }
        
        // Get revenue data from paid orders
        const revenueData = await Order.aggregate([
            { 
                $match: { 
                    paymentStatus: 'paid',
                    ...dateFilter 
                } 
            },
            {
                $unwind: '$items'
            },
            {
                $group: {
                    _id: '$items.itemType',
                    revenue: { $sum: '$items.totalPrice' },
                    orders: { $addToSet: '$_id' }
                }
            }
        ]);
        
        // Calculate total revenue and breakdown
        let totalRevenue = 0;
        let foodRevenue = 0;
        let liquorRevenue = 0;
        
        revenueData.forEach(item => {
            if (item._id === 'food') {
                foodRevenue = item.revenue;
            } else if (item._id === 'liquor') {
                liquorRevenue = item.revenue;
            }
            totalRevenue += item.revenue;
        });
        
        const result = {
            total: totalRevenue,
            foodRevenue: foodRevenue,
            liquorRevenue: liquorRevenue,
            trend: 0 // Would need historical comparison for real trend
        };
        
        res.json({
            success: true,
            data: result,
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
            case 'year':
                const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                dateFilter = { createdAt: { $gte: yearAgo } };
                break;
            default:
                dateFilter = {};
        }
        
        // Get order count
        const orderCount = await Order.countDocuments({ 
            paymentStatus: 'paid', 
            ...dateFilter 
        });
        
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
                total: orderCount,
                trend: 0, // Could implement trend calculation later
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
            case 'year':
                const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                dateFilter = { createdAt: { $gte: yearAgo } };
                break;
            default:
                // If no filter, get all time data
                dateFilter = {};
        }
        
        // Calculate profit based on selling price vs estimated cost
        // Since we don't have exact cost tracking, we'll estimate based on food items
        const profitData = await Order.aggregate([
            { 
                $match: { 
                    paymentStatus: 'paid',
                    ...dateFilter 
                } 
            },
            {
                $unwind: '$items'
            },
            {
                $group: {
                    _id: '$items.itemType',
                    revenue: { $sum: '$items.totalPrice' },
                    // Estimate cost as 40% of selling price for food, 20% for liquor
                    estimatedCost: {
                        $sum: {
                            $cond: {
                                if: { $eq: ['$items.itemType', 'food'] },
                                then: { $multiply: ['$items.totalPrice', 0.4] }, // 40% cost for food
                                else: { $multiply: ['$items.totalPrice', 0.2] }  // 20% cost for liquor
                            }
                        }
                    },
                    orders: { $addToSet: '$_id' }
                }
            }
        ]);
        
        // Calculate totals
        let totalRevenue = 0;
        let totalCost = 0;
        let foodProfit = 0;
        let liquorProfit = 0;
        
        profitData.forEach(item => {
            const itemRevenue = item.revenue;
            const itemCost = item.estimatedCost;
            const itemProfit = itemRevenue - itemCost;
            
            totalRevenue += itemRevenue;
            totalCost += itemCost;
            
            if (item._id === 'food') {
                foodProfit = itemProfit;
            } else if (item._id === 'liquor') {
                liquorProfit = itemProfit;
            }
        });
        
        const totalProfit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0;
        
        const result = {
            total: totalProfit,
            foodProfit: foodProfit,
            liquorProfit: liquorProfit,
            margin: profitMargin,
            revenue: totalRevenue,
            cost: totalCost
        };
            
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

// Get active table count for admin overview
export async function getActiveTableCount(req, res) {
    try {
        // Count distinct tables that have bills created but with NO items (empty bills)
        // These are tables that have been "claimed" but don't have any items yet
        const activeStatuses = ['created', 'pending'];
        const emptyBillTables = await Order.distinct('tableNumber', { 
        status: { $in: activeStatuses },
        $or: [
            { items: { $exists: false } },
            { items: { $size: 0 } }
        ]
        });
        res.json({ count: emptyBillTables.length });
    } catch (error) {
        console.error('Error fetching active table count:', error);
        res.status(500).json({ error: 'Failed to fetch active table count' });
    }
}

// Get active bills count (bills with at least one item and not paid/cancelled)
export async function getActiveBillsCount(req, res) {
    try {
        // Count bills that have items added to them (but not yet paid)
        const activeStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'served'];
        const activeBills = await Order.countDocuments({ 
        status: { $in: activeStatuses }, 
        items: { $exists: true, $not: { $size: 0 } } 
        });
        res.json({ count: activeBills });
    } catch (error) {
        console.error('Error fetching active bills count:', error);
        res.status(500).json({ error: 'Failed to fetch active bills count' });
    }
}

// Debug endpoint to see all orders and their statuses
export async function getDebugOrders(req, res) {
    try {
        const orders = await Order.find({}, {
        tableNumber: 1,
        status: 1,
        items: 1,
        total: 1,
        createdAt: 1
        }).sort({ createdAt: -1 }).limit(20);
        
        res.json({
        totalOrders: orders.length,
        orders: orders.map(order => ({
            id: order._id,
            tableNumber: order.tableNumber,
            status: order.status,
            itemCount: order.items ? order.items.length : 0,
            total: order.total,
            createdAt: order.createdAt
        }))
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch debug orders' });
    }
}
