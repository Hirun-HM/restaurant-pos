import FoodItem from '../models/FoodItem.js';
import { validationResult } from 'express-validator';


export const getFoodItems = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      category,
      search,
      isAvailable,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (isAvailable !== undefined) {
      filter.isAvailable = isAvailable === 'true';
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const foodItems = await FoodItem.find(filter)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Get total count for pagination
    const total = await FoodItem.countDocuments(filter);

    res.json({
      success: true,
      data: foodItems,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Error fetching food items:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching food items',
      error: error.message
    });
  }
};

// Get single food item by ID
export const getFoodItemById = async (req, res) => {
  try {
    const foodItem = await FoodItem.findById(req.params.id);
    
    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }

    res.json({
      success: true,
      data: foodItem
    });
  } catch (error) {
    console.error('Error fetching food item:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching food item',
      error: error.message
    });
  }
};

// Create new food item
export const createFoodItem = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const foodItemData = req.body;
    
    // Check if food item with same name already exists
    const existingItem = await FoodItem.findOne({ 
      name: { $regex: new RegExp(`^${foodItemData.name}$`, 'i') }
    });
    
    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: 'A food item with this name already exists'
      });
    }

    // Create new food item
    const foodItem = new FoodItem(foodItemData);
    const savedItem = await foodItem.save();

    res.status(201).json({
      success: true,
      message: 'Food item created successfully',
      data: savedItem
    });
  } catch (error) {
    console.error('Error creating food item:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating food item',
      error: error.message
    });
  }
};

// Update food item
export const updateFoodItem = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = req.body;
    
    // Check if another food item with same name exists (excluding current item)
    if (updateData.name) {
      const existingItem = await FoodItem.findOne({ 
        name: { $regex: new RegExp(`^${updateData.name}$`, 'i') },
        _id: { $ne: id }
      });
      
      if (existingItem) {
        return res.status(400).json({
          success: false,
          message: 'Another food item with this name already exists'
        });
      }
    }

    // Update the food item
    const updatedItem = await FoodItem.findByIdAndUpdate(
      id,
      { ...updateData, lastUpdated: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }

    res.json({
      success: true,
      message: 'Food item updated successfully',
      data: updatedItem
    });
  } catch (error) {
    console.error('Error updating food item:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating food item',
      error: error.message
    });
  }
};

// Delete food item
export const deleteFoodItem = async (req, res) => {
  try {
    const deletedItem = await FoodItem.findByIdAndDelete(req.params.id);
    
    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }

    res.json({
      success: true,
      message: 'Food item deleted successfully',
      data: deletedItem
    });
  } catch (error) {
    console.error('Error deleting food item:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting food item',
      error: error.message
    });
  }
};

// Seed sample food items
export const seedFoodItems = async (req, res) => {
  try {
    // Clear existing food items (optional)
    // await FoodItem.deleteMany({});

    const sampleFoodItems = [
      {
        name: 'Egg Fried Rice',
        description: 'Delicious fried rice with scrambled eggs and vegetables',
        category: 'Rice Dishes',
        ingredients: [
          { name: 'Rice', quantity: 200, unit: 'g', cost: 15 },
          { name: 'Eggs', quantity: 2, unit: 'piece', cost: 30 },
          { name: 'Carrots', quantity: 50, unit: 'g', cost: 10 },
          { name: 'Leeks', quantity: 30, unit: 'g', cost: 8 },
          { name: 'Soy Sauce', quantity: 2, unit: 'tbsp', cost: 5 },
          { name: 'Oil', quantity: 1, unit: 'tbsp', cost: 3 }
        ],
        basePrice: 71,
        sellingPrice: 350,
        preparationTime: 15,
        nutritionalInfo: {
          calories: 420,
          protein: 12,
          carbs: 65,
          fat: 14
        },
        allergens: ['Eggs', 'Soy']
      },
      {
        name: 'Chicken Fried Rice',
        description: 'Aromatic fried rice with tender chicken pieces and fresh vegetables',
        category: 'Rice Dishes',
        ingredients: [
          { name: 'Rice', quantity: 200, unit: 'g', cost: 15 },
          { name: 'Chicken', quantity: 100, unit: 'g', cost: 80 },
          { name: 'Eggs', quantity: 1, unit: 'piece', cost: 15 },
          { name: 'Carrots', quantity: 40, unit: 'g', cost: 8 },
          { name: 'Leeks', quantity: 30, unit: 'g', cost: 8 },
          { name: 'Garlic', quantity: 2, unit: 'piece', cost: 3 },
          { name: 'Soy Sauce', quantity: 2, unit: 'tbsp', cost: 5 },
          { name: 'Oil', quantity: 2, unit: 'tbsp', cost: 6 }
        ],
        basePrice: 140,
        sellingPrice: 450,
        preparationTime: 20,
        nutritionalInfo: {
          calories: 520,
          protein: 28,
          carbs: 68,
          fat: 16
        },
        allergens: ['Eggs', 'Soy']
      },
      {
        name: 'Nasi Goreng',
        description: 'Indonesian style fried rice with special spices and sambal',
        category: 'Rice Dishes',
        ingredients: [
          { name: 'Rice', quantity: 200, unit: 'g', cost: 15 },
          { name: 'Prawns', quantity: 80, unit: 'g', cost: 120 },
          { name: 'Chicken', quantity: 60, unit: 'g', cost: 48 },
          { name: 'Eggs', quantity: 2, unit: 'piece', cost: 30 },
          { name: 'Onions', quantity: 50, unit: 'g', cost: 8 },
          { name: 'Chili', quantity: 2, unit: 'piece', cost: 2 },
          { name: 'Tamarind Paste', quantity: 1, unit: 'tsp', cost: 3 },
          { name: 'Palm Sugar', quantity: 1, unit: 'tsp', cost: 2 },
          { name: 'Soy Sauce', quantity: 2, unit: 'tbsp', cost: 5 },
          { name: 'Oil', quantity: 2, unit: 'tbsp', cost: 6 }
        ],
        basePrice: 239,
        sellingPrice: 650,
        preparationTime: 25,
        nutritionalInfo: {
          calories: 580,
          protein: 32,
          carbs: 70,
          fat: 18
        },
        allergens: ['Eggs', 'Shellfish', 'Soy']
      }
    ];

    const createdItems = [];
    for (const itemData of sampleFoodItems) {
      const existingItem = await FoodItem.findOne({ name: itemData.name });
      if (!existingItem) {
        const foodItem = new FoodItem(itemData);
        const savedItem = await foodItem.save();
        createdItems.push(savedItem);
      }
    }

    res.json({
      success: true,
      message: `Successfully seeded ${createdItems.length} food items`,
      data: createdItems
    });
  } catch (error) {
    console.error('Error seeding food items:', error);
    res.status(500).json({
      success: false,
      message: 'Error seeding food items',
      error: error.message
    });
  }
};

// Get food item categories
export const getFoodCategories = async (req, res) => {
  try {
    const categories = [
      'Rice Dishes',
      'Noodles', 
      'Appetizers',
      'Main Course',
      'Desserts',
      'Beverages',
      'Others'
    ];

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

// Get food item statistics for admin dashboard
export const getFoodItemStats = async (req, res) => {
  try {
    const stats = await FoodItem.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          availableItems: {
            $sum: { $cond: ['$isAvailable', 1, 0] }
          },
          totalValue: { $sum: '$price' },
          averagePrice: { $avg: '$price' },
          averageBasePrice: { $avg: '$basePrice' }
        }
      }
    ]);

    const categoryStats = await FoodItem.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          availableCount: { $sum: { $cond: ['$isAvailable', 1, 0] } },
          avgPrice: { $avg: '$price' }
        }
      }
    ]);

    const profitAnalysis = await FoodItem.aggregate([
      {
        $match: {
          basePrice: { $gt: 0 },
          price: { $gt: 0 }
        }
      },
      {
        $project: {
          name: 1,
          category: 1,
          profit: { $subtract: ['$price', '$basePrice'] },
          profitMargin: {
            $multiply: [
              { $divide: [{ $subtract: ['$price', '$basePrice'] }, '$price'] },
              100
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgProfit: { $avg: '$profit' },
          avgProfitMargin: { $avg: '$profitMargin' },
          totalProfit: { $sum: '$profit' }
        }
      }
    ]);

    const result = stats[0] || {
      totalItems: 0,
      availableItems: 0,
      totalValue: 0,
      averagePrice: 0,
      averageBasePrice: 0
    };

    const profit = profitAnalysis[0] || {
      avgProfit: 0,
      avgProfitMargin: 0,
      totalProfit: 0
    };

    res.json({
      success: true,
      data: {
        ...result,
        ...profit,
        categoryBreakdown: categoryStats
      }
    });
  } catch (error) {
    console.error('Error getting food item stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch food item statistics',
      error: error.message
    });
  }
};
