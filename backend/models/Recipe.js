import mongoose from 'mongoose';

const recipeIngredientSchema = new mongoose.Schema({
    stockItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stock',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [0, 'Quantity cannot be negative']
    }
});

const recipeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Recipe name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters'],
        unique: true
    },
    menuItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true,
        unique: true
    },
    ingredients: [recipeIngredientSchema],
    portionSize: {
        type: Number,
        required: true,
        min: [1, 'Portion size must be at least 1']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for better query performance
recipeSchema.index({ menuItemId: 1 });
recipeSchema.index({ name: 1 });

const Recipe = mongoose.model('Recipe', recipeSchema);

export default Recipe;
