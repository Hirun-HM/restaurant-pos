import { body, param, query, validationResult } from 'express-validator';

// Handle validation errors
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
        });
    }
    next();
};

// Stock item validation rules
export const validateStockItem = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Stock item name is required')
        .isLength({ min: 1, max: 100 })
        .withMessage('Name must be between 1 and 100 characters'),
    
    body('category')
        .isIn(['ingredients', 'food', 'drinks', 'supplies'])
        .withMessage('Category must be one of: ingredients, food, drinks, supplies'),
    
    body('quantity')
        .isNumeric()
        .withMessage('Quantity must be a number')
        .isFloat({ min: 0 })
        .withMessage('Quantity cannot be negative'),
    
    body('unit')
        .trim()
        .notEmpty()
        .withMessage('Unit is required')
        .isLength({ max: 20 })
        .withMessage('Unit cannot exceed 20 characters'),
    
    body('price')
        .isNumeric()
        .withMessage('Price must be a number')
        .isFloat({ min: 0 })
        .withMessage('Price cannot be negative'),
    
    body('minimumQuantity')
        .optional()
        .isNumeric()
        .withMessage('Minimum quantity must be a number')
        .isFloat({ min: 0 })
        .withMessage('Minimum quantity cannot be negative'),
    
    body('supplier')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Supplier name cannot exceed 100 characters'),
    
    body('expiryDate')
        .optional()
        .isISO8601()
        .withMessage('Expiry date must be a valid date'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters'),
    
    body('barcode')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Barcode cannot exceed 50 characters'),
    
    handleValidationErrors
    ];

    // Stock quantity update validation
    export const validateQuantityUpdate = [
    param('id')
        .isMongoId()
        .withMessage('Invalid stock item ID'),
    
    body('quantity')
        .isNumeric()
        .withMessage('Quantity must be a number')
        .isFloat({ min: 0.01 })
        .withMessage('Quantity must be greater than 0'),
    
    body('operation')
        .isIn(['add', 'subtract'])
        .withMessage('Operation must be either "add" or "subtract"'),
    
    handleValidationErrors
    ];

    // Stock item ID validation
    export const validateStockId = [
    param('id')
        .isMongoId()
        .withMessage('Invalid stock item ID'),
    
    handleValidationErrors
    ];

    // Query parameters validation
    export const validateStockQuery = [
    query('category')
        .optional()
        .isIn(['ingredients', 'food', 'drinks', 'supplies'])
        .withMessage('Category must be one of: ingredients, food, drinks, supplies'),
    
    query('lowStock')
        .optional()
        .isBoolean()
        .withMessage('lowStock must be true or false'),
    
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    
    query('search')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search query must be between 1 and 100 characters'),
    
    handleValidationErrors
    ];

    // Generic error handler middleware
    export const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(error => error.message);
        return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors
        });
    }
    
    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({
        success: false,
        message: `${field} already exists`
        });
    }
    
    // Mongoose cast error
    if (err.name === 'CastError') {
        return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
        });
    }
    
    // Default error
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
};
