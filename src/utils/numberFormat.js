/**
 * Utility functions for formatting numbers and handling floating-point precision issues
 */

/**
 * Format quantity to remove floating point precision issues
 * @param {number|string} quantity - The quantity to format
 * @param {number} maxDecimals - Maximum decimal places (default: 3)
 * @returns {string} - Formatted quantity string
 */
export const formatQuantity = (quantity, maxDecimals = 3) => {
    if (quantity === null || quantity === undefined) {
        return '0';
    }

    const num = typeof quantity === 'string' ? parseFloat(quantity) : quantity;
    
    if (isNaN(num)) {
        return '0';
    }

    // If it's a whole number or very close to a whole number, show as integer
    if (Math.abs(num - Math.round(num)) < 0.001) {
        return Math.round(num).toString();
    }
    
    // Otherwise, round to specified decimal places and remove trailing zeros
    return parseFloat(num.toFixed(maxDecimals)).toString();
};

/**
 * Format price to 2 decimal places
 * @param {number|string} price - The price to format
 * @returns {string} - Formatted price string
 */
export const formatPrice = (price) => {
    if (price === null || price === undefined) {
        return '0.00';
    }

    const num = typeof price === 'string' ? parseFloat(price) : price;
    
    if (isNaN(num)) {
        return '0.00';
    }

    return num.toFixed(2);
};

/**
 * Format currency with LKR prefix
 * @param {number|string} amount - The amount to format
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount) => {
    return `LKR ${formatPrice(amount)}`;
};

/**
 * Round number to specified decimal places and handle floating point precision
 * @param {number} num - The number to round
 * @param {number} decimals - Number of decimal places
 * @returns {number} - Rounded number
 */
export const roundToPrecision = (num, decimals = 2) => {
    if (typeof num !== 'number' || isNaN(num)) {
        return 0;
    }
    
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
};

/**
 * Check if two numbers are equal within a small tolerance (for floating point comparison)
 * @param {number} a - First number
 * @param {number} b - Second number
 * @param {number} tolerance - Tolerance level (default: 0.001)
 * @returns {boolean} - True if numbers are approximately equal
 */
export const isApproximatelyEqual = (a, b, tolerance = 0.001) => {
    return Math.abs(a - b) < tolerance;
};

export default {
    formatQuantity,
    formatPrice,
    formatCurrency,
    roundToPrecision,
    isApproximatelyEqual
};
