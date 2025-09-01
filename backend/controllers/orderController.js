// Inside your order controller

import { reduceStockFromOrder } from '../utils/stockManagement.js';

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
