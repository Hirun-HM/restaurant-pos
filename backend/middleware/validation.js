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
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z0-9\s\-&]+$/)
        .withMessage('Name can only contain letters, numbers, spaces, hyphens, and ampersands'),
    
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
        .withMessage('Minimum quantity cannot be negative')
        .custom((value, { req }) => {
            if (value > req.body.quantity) {
                throw new Error('Minimum quantity cannot be greater than current quantity');
            }
            return true;
        }),
    
    body('supplier')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Supplier name cannot exceed 100 characters'),
    
    body('expiryDate')
        .optional({ nullable: true, checkFalsy: true })
        .custom(value => {
            // Allow empty strings, null, undefined
            if (!value || value === '' || value === null) {
                return true;
            }
            
            // Check if it's a valid date
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                throw new Error('Expiry date must be a valid date');
            }
            
            // Don't restrict past dates - some items might already be expired
            return true;
        }),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters'),
    
    body('barcode')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Barcode cannot exceed 50 characters')
        .custom(value => {
            if (value && !/^[0-9A-Za-z-]+$/.test(value)) {
                throw new Error('Barcode can only contain letters, numbers, and hyphens');
            }
            return true;
        }),
    
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
    
    body('reason')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Reason cannot exceed 200 characters'),

    body('notes')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Notes cannot exceed 500 characters'),
    
    handleValidationErrors
];

// Search query validation
export const validateSearchQuery = [
    query('search')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search query must be between 1 and 100 characters'),
    
    query('category')
        .optional()
        .isIn(['ingredients', 'food', 'drinks', 'supplies'])
        .withMessage('Invalid category'),
    
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    
    query('lowStock')
        .optional()
        .isBoolean()
        .withMessage('lowStock must be a boolean value'),
    
    handleValidationErrors
];

// Analytics query validation
export const validateAnalyticsQuery = [
    query('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid date'),
    
    query('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid date')
        .custom((value, { req }) => {
            if (value && req.query.startDate && new Date(value) <= new Date(req.query.startDate)) {
                throw new Error('End date must be after start date');
            }
            return true;
        }),
    
    query('category')
        .optional()
        .isIn(['ingredients', 'food', 'drinks', 'supplies'])
        .withMessage('Invalid category'),
    
    query('groupBy')
        .optional()
        .isIn(['day', 'week', 'month'])
        .withMessage('groupBy must be one of: day, week, month'),
    
    handleValidationErrors
];

// Bulk update validation
export const validateBulkUpdate = [
    body()
        .isArray()
        .withMessage('Request body must be an array')
        .custom(value => {
            if (value.length > 50) {
                throw new Error('Cannot update more than 50 items at once');
            }
            return true;
        }),
    
    body('*.id')
        .isMongoId()
        .withMessage('Invalid stock item ID'),
    
    body('*.quantity')
        .isNumeric()
        .withMessage('Quantity must be a number')
        .isFloat({ min: 0 })
        .withMessage('Quantity cannot be negative'),
    
    body('*.reason')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Reason cannot exceed 200 characters'),
    
    handleValidationErrors
];

// Stock item ID validation
export const validateStockId = [
    param('id')
        .isMongoId()
        .withMessage('Invalid stock item ID'),
    
    handleValidationErrors
];

// Stock query validation for filtering
export const validateStockQuery = [
    query('category')
        .optional()
        .isIn(['ingredients', 'food', 'drinks', 'supplies'])
        .withMessage('Category must be one of: ingredients, food, drinks, supplies'),
    
    query('lowStock')
        .optional()
        .isBoolean()
        .toBoolean()
        .withMessage('lowStock must be a boolean value'),
    
    query('expiringBefore')
        .optional()
        .isISO8601()
        .withMessage('expiringBefore must be a valid date'),
    
    query('supplier')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Supplier name must be between 1 and 100 characters'),
    
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

