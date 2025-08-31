import mongoose from 'mongoose';

const stockAuditLogSchema = new mongoose.Schema({
    stockId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stock',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming you have a User model
        required: false
    },
    action: {
        type: String,
        enum: ['create', 'update', 'delete', 'quantity_add', 'quantity_subtract'],
        required: true
    },
    previousState: {
        type: mongoose.Schema.Types.Mixed,
        required: false
    },
    newState: {
        type: mongoose.Schema.Types.Mixed,
        required: false
    },
    quantityChange: {
        type: Number,
        required: false
    },
    reason: {
        type: String,
        trim: true,
        maxlength: 200
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 500
    },
    timestamp: {
        type: Date,
        default: Date.now,
        required: true,
        index: true
    }
}, {
    timestamps: true
});

// Index for efficient queries
stockAuditLogSchema.index({ stockId: 1, timestamp: -1 });

const StockAuditLog = mongoose.model('StockAuditLog', stockAuditLogSchema);

export default StockAuditLog;
