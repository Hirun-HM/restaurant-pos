import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Stock item name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters'],
        unique: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['ingredients', 'food', 'drinks', 'supplies'],
        lowercase: true,
        index: true
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [0, 'Quantity cannot be negative'],
        default: 0
    },
    unit: {
        type: String,
        required: [true, 'Unit is required'],
        trim: true,
        maxlength: [20, 'Unit cannot exceed 20 characters']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    minimumQuantity: {
        type: Number,
        default: 5,
        min: [0, 'Minimum quantity cannot be negative']
    },
    supplier: {
        type: String,
        trim: true,
        maxlength: [100, 'Supplier name cannot exceed 100 characters']
    },
    lastRestocked: {
        type: Date,
        default: Date.now
    },
    expiryDate: {
        type: Date
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    barcode: {
        type: String,
        trim: true,
        unique: true,
        sparse: true // Allow null values but ensure uniqueness when present
    },
    isActive: {
        type: Boolean,
        default: true
    }
    }, {
        timestamps: true
    });

    // Index for better query performance
    stockSchema.index({ category: 1, name: 1 });
    stockSchema.index({ quantity: 1 });
    stockSchema.index({ isActive: 1 });

    // Virtual for checking if item is low in stock
    stockSchema.virtual('isLowStock').get(function() {
        return this.quantity <= this.minimumQuantity;
    });

    // Virtual for total value
    stockSchema.virtual('totalValue').get(function() {
        return this.quantity * this.price;
    });

    // Ensure virtual fields are serialized
    stockSchema.set('toJSON', { virtuals: true });
    stockSchema.set('toObject', { virtuals: true });

    // Pre-save middleware to update lastRestocked when quantity increases
    stockSchema.pre('save', function(next) {
    if (this.isModified('quantity') && this.quantity > (this._original?.quantity || 0)) {
        this.lastRestocked = new Date();
    }
    next();
});

const Stock = mongoose.model('Stock', stockSchema);

export default Stock;
