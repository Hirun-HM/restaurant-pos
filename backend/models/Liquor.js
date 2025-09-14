import mongoose from 'mongoose';

const liquorPortionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        enum: {
            values: ['25ml Shot', '50ml Shot', '75ml Shot', '100ml Shot', 'Quarter Bottle', 'Half Bottle', 'Full Bottle'],
            message: '{VALUE} is not a valid portion name'
        }
    },
    volume: {
        type: Number,
        required: true,
        min: [1, 'Volume must be at least 1ml']
    },
    price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative']
    }
});

const liquorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Liquor name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    brand: {
        type: String,
        required: function() {
            // Brand is optional for ice_cubes, sandy_bottles, and bites
            return !['ice_cubes', 'sandy_bottles', 'bites'].includes(this.type);
        },
        trim: true,
        maxlength: [100, 'Brand cannot exceed 100 characters']
    },
    type: {
        type: String,
        required: [true, 'Item type is required'],
        enum: {
            values: ['hard_liquor', 'beer', 'wine', 'cigarettes', 'ice_cubes', 'sandy_bottles', 'bites', 'other'],
            message: '{VALUE} is not a valid item type'
        }
    },
    bottleVolume: {
        type: Number,
        required: function() {
            return this.type === 'hard_liquor'; // Only required for hard liquor
        },
        validate: {
            validator: function(value) {
                // For hard liquor, require 750 or 1000ml
                if (this.type === 'hard_liquor') {
                    return [750, 1000].includes(value);
                }
                // For other types, allow any positive value or undefined
                return value === undefined || value === null || value > 0;
            },
            message: 'Bottle volume must be either 750ml or 1000ml for hard liquor items'
        },
        default: function() {
            if (this.type === 'hard_liquor') return 750;
            if (this.type === 'ice_cubes') return 1; // 1 unit per bowl
            if (this.type === 'sandy_bottles') return 1; // 1 unit per bottle
            if (this.type === 'bites') return 1; // 1 unit per plate
            return 330; // 330ml for beer and others
        }
    },
    bottlesInStock: {
        type: Number,
        required: function() {
            return !['bites', 'ice_cubes'].includes(this.type); // Not required for bites and ice_cubes
        },
        min: [0, 'Cannot have negative bottles'],
        default: function() {
            // Don't set default stock for ice cubes and bites
            return ['bites', 'ice_cubes'].includes(this.type) ? undefined : 0;
        }
    },
    currentBottleVolume: {
        type: Number,
        default: function() { 
            if (this.type === 'hard_liquor') return this.bottleVolume;
            if (this.type === 'ice_cubes' || this.type === 'sandy_bottles' || this.type === 'bites') return 1;
            return 0; 
        },
        min: [0, 'Current volume cannot be negative'],
        validate: {
            validator: function(value) {
                // Allow any non-negative number for all types
                return value >= 0;
            },
            message: 'Current volume must be non-negative'
        }
    },
    totalVolumeRemaining: {
        type: Number,
        default: function() { 
            return this.type === 'hard_liquor' ? this.bottlesInStock * this.bottleVolume : 0; 
        }
    },
    minimumBottles: {
        type: Number,
        default: function() {
            // Don't set minimum for ice cubes and bites
            return ['ice_cubes', 'bites'].includes(this.type) ? undefined : 2;
        },
        min: [0, 'Minimum bottles cannot be negative']
    },
    supplier: {
        type: String,
        trim: true,
        maxlength: [100, 'Supplier name cannot exceed 100 characters']
    },
    alcoholPercentage: {
        type: Number,
        min: [0, 'Alcohol percentage cannot be negative'],
        max: [100, 'Alcohol percentage cannot exceed 100']
    },
    portions: [liquorPortionSchema],
    pricePerBottle: {
        type: Number,
        required: function() {
            return this.type !== 'bites'; // Not required for bites
        },
        min: [0, 'Price cannot be negative']
    },
    buyingPrice: {
        type: Number,
        required: function() {
            return !['bites', 'ice_cubes'].includes(this.type); // Not required for bites and ice_cubes
        },
        min: [0, 'Buying price cannot be negative']
    },
    // Cigarette-specific fields
    cigaretteIndividualPrice: {
        type: Number,
        required: function() {
            return this.type === 'cigarettes';
        },
        min: [0, 'Individual cigarette price cannot be negative'],
        validate: {
            validator: function(value) {
                // Only validate if this is a cigarette item
                if (this.type === 'cigarettes') {
                    return value > 0;
                }
                return true;
            },
            message: 'Individual cigarette price is required for cigarette items'
        }
    },
    cigarettesPerPack: {
        type: Number,
        default: function() {
            return this.type === 'cigarettes' ? 20 : undefined;
        },
        required: function() {
            return this.type === 'cigarettes';
        },
        min: [1, 'Cigarettes per pack must be at least 1'],
        validate: {
            validator: function(value) {
                if (this.type === 'cigarettes') {
                    return Number.isInteger(value) && value > 0;
                }
                return true;
            },
            message: 'Cigarettes per pack must be a positive integer'
        }
    },
    individualCigaretteSales: {
        type: Number,
        default: 0,
        min: [0, 'Individual cigarette sales cannot be negative']
    },
    // Bites-specific fields
    platesInStock: {
        type: Number,
        default: function() {
            // Don't set for bites - they don't track stock
            return undefined;
        },
        min: [0, 'Plates in stock cannot be negative']
    },
    pricePerPlate: {
        type: Number,
        required: function() {
            return this.type === 'bites';
        },
        min: [0, 'Price per plate cannot be negative']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    wastedVolume: {
        type: Number,
        default: 0,
        min: [0, 'Wasted volume cannot be negative']
    },
    totalSoldVolume: {
        type: Number,
        default: 0,
        min: [0, 'Sold volume cannot be negative']
    },
    totalSoldItems: {
        type: Number,
        default: 0,
        min: [0, 'Sold items count cannot be negative']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for better query performance
liquorSchema.index({ name: 1, brand: 1 });
liquorSchema.index({ type: 1 });
liquorSchema.index({ isActive: 1 });

// Virtual for checking if liquor is low in stock
liquorSchema.virtual('isLowStock').get(function() {
    return this.bottlesInStock <= this.minimumBottles;
});

// Virtual for total value
liquorSchema.virtual('totalValue').get(function() {
    return this.bottlesInStock * this.pricePerBottle;
});

// Pre-save middleware to calculate total volume remaining
liquorSchema.pre('save', function(next) {
    // Skip volume calculations for non-hard-liquor types
    if (this.type !== 'hard_liquor') {
        this.totalVolumeRemaining = 0;
        return next();
    }

    if (this.isModified('bottlesInStock') || this.isModified('currentBottleVolume') || this.isModified('bottleVolume')) {
        // Calculate total remaining volume for hard liquor items
        const fullBottles = Math.max(0, this.bottlesInStock - 1);
        const currentBottle = this.bottlesInStock > 0 ? this.currentBottleVolume : 0;
        this.totalVolumeRemaining = (fullBottles * this.bottleVolume) + currentBottle;
    }
    next();
});

// Method to consume liquor and handle bottle management
liquorSchema.methods.consumeLiquor = function(volumeToConsume) {
    if (this.totalVolumeRemaining < volumeToConsume) {
        throw new Error('Insufficient liquor volume in stock');
    }

    let remainingToConsume = volumeToConsume;
    let wastedThisTransaction = 0;
    let bottlesCompleted = 0; // Track completed bottles for sold count

    // Consume the requested volume
    while (remainingToConsume > 0 && this.bottlesInStock > 0) {
        if (this.currentBottleVolume >= remainingToConsume) {
            // Current bottle has enough
            this.currentBottleVolume -= remainingToConsume;
            remainingToConsume = 0;
            
            // If bottle is now empty, count as completed
            if (this.currentBottleVolume === 0) {
                bottlesCompleted++;
                this.bottlesInStock -= 1;
                if (this.bottlesInStock > 0) {
                    this.currentBottleVolume = this.bottleVolume;
                }
            }
        } else {
            // Need to finish current bottle and move to next
            remainingToConsume -= this.currentBottleVolume;
            bottlesCompleted++; // Current bottle is finished
            this.currentBottleVolume = 0;
            this.bottlesInStock -= 1;
            
            if (this.bottlesInStock > 0) {
                this.currentBottleVolume = this.bottleVolume;
            }
        }
    }

    // After consumption, check if current bottle has 30ml or less and should be discarded
    if (this.bottlesInStock > 0 && this.currentBottleVolume > 0 && this.currentBottleVolume <= 30) {
        wastedThisTransaction += this.currentBottleVolume;
        this.wastedVolume += this.currentBottleVolume;
        bottlesCompleted++; // Discarded bottle counts as completed
        this.currentBottleVolume = 0;
        this.bottlesInStock -= 1;
        
        // Open new bottle if available
        if (this.bottlesInStock > 0) {
            this.currentBottleVolume = this.bottleVolume;
        }
    }

    // Update totals
    this.totalSoldVolume += volumeToConsume;
    this.totalSoldItems += bottlesCompleted; // Increment bottle sold count
    
    // Recalculate total volume remaining
    const fullBottles = Math.max(0, this.bottlesInStock - 1);
    const currentBottle = this.bottlesInStock > 0 ? this.currentBottleVolume : 0;
    this.totalVolumeRemaining = (fullBottles * this.bottleVolume) + currentBottle;

    return {
        consumed: volumeToConsume,
        wasted: wastedThisTransaction,
        bottlesCompleted: bottlesCompleted,
        remainingBottles: this.bottlesInStock,
        remainingVolume: this.totalVolumeRemaining
    };
};

// Method to add new bottles to stock
liquorSchema.methods.addBottles = function(numberOfBottles) {
    if (this.bottlesInStock === 0) {
        // No bottles in stock, start fresh
        this.bottlesInStock = numberOfBottles;
        this.currentBottleVolume = this.bottleVolume;
    } else {
        // Add to existing stock
        this.bottlesInStock += numberOfBottles;
    }
    
    // Recalculate total volume
    const fullBottles = Math.max(0, this.bottlesInStock - 1);
    const currentBottle = this.bottlesInStock > 0 ? this.currentBottleVolume : 0;
    this.totalVolumeRemaining = (fullBottles * this.bottleVolume) + currentBottle;
    
    return this;
};

// Method to check and auto-discard bottles with ≤30ml remaining
liquorSchema.methods.checkAndAutoDiscard = function() {
    if (this.type !== 'hard_liquor') {
        return { discarded: false, wastedVolume: 0, bottlesCompleted: 0 };
    }
    
    if (this.bottlesInStock > 0 && this.currentBottleVolume > 0 && this.currentBottleVolume <= 30) {
        const wastedVolume = this.currentBottleVolume;
        this.wastedVolume += wastedVolume;
        this.totalSoldItems += 1; // Increment bottles sold count
        this.currentBottleVolume = 0;
        this.bottlesInStock -= 1;
        
        // Open new bottle if available
        if (this.bottlesInStock > 0) {
            this.currentBottleVolume = this.bottleVolume;
        }
        
        // Recalculate total volume remaining
        const fullBottles = Math.max(0, this.bottlesInStock - 1);
        const currentBottle = this.bottlesInStock > 0 ? this.currentBottleVolume : 0;
        this.totalVolumeRemaining = (fullBottles * this.bottleVolume) + currentBottle;
        
        return { discarded: true, wastedVolume, bottlesCompleted: 1 };
    }
    
    return { discarded: false, wastedVolume: 0, bottlesCompleted: 0 };
};

// Static method to auto-discard all bottles with ≤30ml remaining
liquorSchema.statics.autoDiscardLowVolumes = async function() {
    const hardLiquors = await this.find({ 
        type: 'hard_liquor', 
        isActive: true,
        bottlesInStock: { $gt: 0 },
        currentBottleVolume: { $gt: 0, $lte: 30 }
    });
    
    const results = [];
    for (const liquor of hardLiquors) {
        const result = liquor.checkAndAutoDiscard();
        if (result.discarded) {
            await liquor.save();
            results.push({
                liquorId: liquor._id,
                name: liquor.name,
                brand: liquor.brand,
                wastedVolume: result.wastedVolume,
                remainingBottles: liquor.bottlesInStock
            });
        }
    }
    
    return results;
};

// Static method to get low stock items
liquorSchema.statics.getLowStock = function() {
    return this.find({ 
        isActive: true,
        $expr: { $lte: ['$bottlesInStock', '$minimumBottles'] }
    });
};

// Static method to generate standard portions for a bottle volume
liquorSchema.statics.generateStandardPortions = function(bottleVolume) {
    // Define specific volumes for quarter, half, and full based on bottle size
    let quarterVolume, halfVolume;
    
    if (bottleVolume === 750) {
        quarterVolume = 180; // As specified by user
        halfVolume = 375;
    } else if (bottleVolume === 1000) {
        quarterVolume = 250;
        halfVolume = 500;
    } else {
        // Fallback to mathematical calculation for other sizes
        quarterVolume = Math.round(bottleVolume / 4);
        halfVolume = Math.round(bottleVolume / 2);
    }
    
    const portions = [
        { name: '25ml Shot', volume: 25 },
        { name: '50ml Shot', volume: 50 },
        { name: '75ml Shot', volume: 75 },
        { name: '100ml Shot', volume: 100 },
        { name: 'Quarter Bottle', volume: quarterVolume },
        { name: 'Half Bottle', volume: halfVolume },
        { name: 'Full Bottle', volume: bottleVolume }
    ];
    
    return portions.map(portion => ({
        ...portion,
        price: 0 // Price to be set by cashier
    }));
};

// Method to consume items by quantity (for ice cubes, sandy bottles, etc.)
liquorSchema.methods.consumeByQuantity = function(quantityToConsume) {
    // Handle cases where stock is not tracked (bottlesInStock is undefined or 0)
    if (this.bottlesInStock === undefined || this.bottlesInStock === null) {
        // Stock not tracked - just record the sale
        this.totalSoldItems = (this.totalSoldItems || 0) + quantityToConsume;
        return {
            consumed: quantityToConsume,
            wasted: 0,
            itemsCompleted: quantityToConsume,
            remainingStock: 'Not tracked',
            remainingVolume: 0
        };
    }

    if (this.bottlesInStock < quantityToConsume) {
        throw new Error(`Insufficient stock. Available: ${this.bottlesInStock}, Required: ${quantityToConsume}`);
    }

    // Simple quantity reduction for ice cubes and sandy bottles
    this.bottlesInStock -= quantityToConsume;
    
    // Update total sold items
    this.totalSoldItems = (this.totalSoldItems || 0) + quantityToConsume;

    return {
        consumed: quantityToConsume,
        wasted: 0,
        itemsCompleted: quantityToConsume,
        remainingStock: this.bottlesInStock,
        remainingVolume: 0 // No volume tracking for these items
    };
};

export default mongoose.model('Liquor', liquorSchema);
