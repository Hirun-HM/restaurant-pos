import express from 'express';
import { body } from 'express-validator';
import {
  getFoodItems,
  getFoodItemById,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
  seedFoodItems,
  getFoodCategories,
  getFoodItemStats
} from '../controllers/foodItemController.js';

const router = express.Router();

// Validation rules for food item
const validateFoodItem = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Food item name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['Rice Dishes', 'Noodles', 'Appetizers', 'Main Course', 'Desserts', 'Beverages', 'Others'])
    .withMessage('Invalid category'),
  
  body('basePrice')
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),
  
  body('sellingPrice')
    .isFloat({ min: 0 })
    .withMessage('Selling price must be a positive number'),
  
  body('ingredients')
    .isArray({ min: 1 })
    .withMessage('At least one ingredient is required'),
  
  body('ingredients.*.name')
    .trim()
    .notEmpty()
    .withMessage('Ingredient name is required'),
  
  body('ingredients.*.quantity')
    .isFloat({ min: 0 })
    .withMessage('Ingredient quantity must be a positive number'),
  
  body('ingredients.*.unit')
    .notEmpty()
    .withMessage('Ingredient unit is required')
    .isIn(['g', 'kg', 'ml', 'l', 'piece', 'cup', 'tsp', 'tbsp', 'oz'])
    .withMessage('Invalid ingredient unit'),
];

// Routes
router.get('/', getFoodItems);                    // GET /api/food-items
router.get('/stats', getFoodItemStats);           // GET /api/food-items/stats  
router.get('/categories', getFoodCategories);     // GET /api/food-items/categories
router.post('/seed', seedFoodItems);              // POST /api/food-items/seed
router.get('/:id', getFoodItemById);              // GET /api/food-items/:id
router.post('/', validateFoodItem, createFoodItem);        // POST /api/food-items
router.put('/:id', validateFoodItem, updateFoodItem);      // PUT /api/food-items/:id
router.delete('/:id', deleteFoodItem);            // DELETE /api/food-items/:id

export default router;
