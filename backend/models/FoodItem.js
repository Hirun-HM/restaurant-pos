import mongoose from 'mongoose';

// Ingredient Schema
const ingredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    enum: ['g', 'kg', 'ml', 'l', 'piece', 'cup', 'tsp', 'tbsp', 'oz']
  },
  cost: {
    type: Number,
    default: 0,
    min: 0
  }
});

// Food Item Schema
const foodItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Rice Dishes', 'Noodles', 'Appetizers', 'Main Course', 'Desserts', 'Beverages', 'Others'],
    default: 'Others'
  },
  ingredients: [ingredientSchema],
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0
  },
  preparationTime: {
    type: Number, // in minutes
    default: 15
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  nutritionalInfo: {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 }
  },
  allergens: [{
    type: String,
    enum: ['Dairy', 'Eggs', 'Fish', 'Shellfish', 'Nuts', 'Peanuts', 'Wheat', 'Soy']
  }],
  image: String,
  createdBy: String,
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for profit margin
foodItemSchema.virtual('profit').get(function() {
  return this.sellingPrice - this.basePrice;
});

// Virtual for profit percentage
foodItemSchema.virtual('profitPercentage').get(function() {
  return this.basePrice > 0 ? ((this.sellingPrice - this.basePrice) / this.basePrice * 100).toFixed(2) : 0;
});

// Index for better search performance
foodItemSchema.index({ name: 'text', description: 'text' });
foodItemSchema.index({ category: 1 });
foodItemSchema.index({ isAvailable: 1 });

const FoodItem = mongoose.model('FoodItem', foodItemSchema);

export default FoodItem;
