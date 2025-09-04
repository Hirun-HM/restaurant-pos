import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    itemType: {
        type: String,
        enum: ['food', 'liquor'],
        required: true
    },
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        // This can reference either FoodItem or Liquor depending on itemType
        refPath: 'items.itemType'
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0
    },
    buyingPrice: {
        type: Number,
        default: 0,
        min: 0
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    // For liquor items - portion information
    portionSize: {
        type: String,
        default: null // e.g., "25ml", "full_bottle", etc.
    }
});

const OrderSchema = new mongoose.Schema({
    // Table information
    tableNumber: {
        type: String,
        required: true,
        trim: true
    },
    
    // Customer information (optional)
    customerName: {
        type: String,
        trim: true,
        default: null
    },
    
    // Order items
    items: [OrderItemSchema],
    
    // Pricing
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    serviceCharge: {
        type: Number,
        default: 0,
        min: 0
    },
    tax: {
        type: Number,
        default: 0,
        min: 0
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    
    // Order status
    status: {
        type: String,
        enum: ['created', 'pending', 'confirmed', 'preparing', 'ready', 'served', 'paid', 'cancelled'],
        default: 'created'
    },
    
    // Payment information
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'online', 'other'],
        default: null
    },
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'paid', 'refunded'],
        default: 'unpaid'
    },
    
    // Staff information
    createdBy: {
        type: String, // Staff member who created the order
        default: 'System'
    },
    servedBy: {
        type: String, // Staff member who served the order
        default: null
    },
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    confirmedAt: {
        type: Date,
        default: null
    },
    servedAt: {
        type: Date,
        default: null
    },
    paidAt: {
        type: Date,
        default: null
    },
    
    // Additional fields
    notes: {
        type: String,
        trim: true,
        default: null
    },
    
    // Stock deduction tracking
    stockDeducted: {
        type: Boolean,
        default: false
    },
    
    // For analytics - profit calculation
    totalCost: {
        type: Number,
        default: 0,
        min: 0
    },
    totalProfit: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true // This adds createdAt and updatedAt automatically
});

// Indexes for better query performance
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ tableNumber: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ 'items.itemType': 1 });

// Virtual for profit margin percentage
OrderSchema.virtual('profitMargin').get(function() {
    if (this.total <= 0) return 0;
    return ((this.totalProfit / this.total) * 100).toFixed(2);
});

// Method to calculate profit
OrderSchema.methods.calculateProfit = function() {
    let totalCost = 0;
    
    this.items.forEach(item => {
        totalCost += (item.buyingPrice || 0) * item.quantity;
    });
    
    this.totalCost = totalCost;
    this.totalProfit = this.total - totalCost;
    
    return this.totalProfit;
};

// Static method to get revenue analytics
OrderSchema.statics.getRevenueAnalytics = async function(dateFilter = {}) {
    const pipeline = [
        {
            $match: {
                paymentStatus: 'paid',
                ...dateFilter
            }
        },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$total' },
                totalProfit: { $sum: '$totalProfit' },
                totalOrders: { $sum: 1 },
                avgOrderValue: { $avg: '$total' }
            }
        }
    ];
    
    const result = await this.aggregate(pipeline);
    return result[0] || {
        totalRevenue: 0,
        totalProfit: 0,
        totalOrders: 0,
        avgOrderValue: 0
    };
};

// Static method to get food vs liquor breakdown
OrderSchema.statics.getFoodLiquorBreakdown = async function(dateFilter = {}) {
    const pipeline = [
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
                profit: { 
                    $sum: { 
                        $subtract: [
                            '$items.totalPrice',
                            { $multiply: ['$items.buyingPrice', '$items.quantity'] }
                        ]
                    }
                },
                quantity: { $sum: '$items.quantity' },
                orders: { $addToSet: '$_id' }
            }
        },
        {
            $project: {
                _id: 1,
                revenue: 1,
                profit: 1,
                quantity: 1,
                orderCount: { $size: '$orders' }
            }
        }
    ];
    
    const result = await this.aggregate(pipeline);
    
    // Ensure both food and liquor are represented
    const breakdown = {
        food: { revenue: 0, profit: 0, quantity: 0, orderCount: 0 },
        liquor: { revenue: 0, profit: 0, quantity: 0, orderCount: 0 }
    };
    
    result.forEach(item => {
        if (item._id === 'food' || item._id === 'liquor') {
            breakdown[item._id] = {
                revenue: item.revenue,
                profit: item.profit,
                quantity: item.quantity,
                orderCount: item.orderCount
            };
        }
    });
    
    return breakdown;
};

const Order = mongoose.model('Order', OrderSchema);

export default Order;
