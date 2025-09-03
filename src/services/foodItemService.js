import { api } from '../utils/api.js';

// Food Items API Service
class FoodItemService {
    constructor() {
        this.baseUrl = '/food-items';
    }

    // Get all food items with filtering
    async getFoodItems(params = {}) {
        try {
            const queryParams = new URLSearchParams(params).toString();
            const url = queryParams ? `${this.baseUrl}?${queryParams}` : this.baseUrl;
            return await api.get(url);
        } catch (error) {
            console.error('Error fetching food items:', error);
            throw this.handleError(error);
        }
    }

    // Get single food item by ID
    async getFoodItemById(id) {
        try {
            return await api.get(`${this.baseUrl}/${id}`);
        } catch (error) {
            console.error('Error fetching food item:', error);
            throw this.handleError(error);
        }
    }

    // Create new food item
    async createFoodItem(foodItemData) {
        try {
            return await api.post(this.baseUrl, foodItemData);
        } catch (error) {
            console.error('Error creating food item:', error);
            throw this.handleError(error);
        }
    }

    // Update food item
    async updateFoodItem(id, foodItemData) {
        try {
            return await api.put(`${this.baseUrl}/${id}`, foodItemData);
        } catch (error) {
            console.error('Error updating food item:', error);
            throw this.handleError(error);
        }
    }

    // Delete food item
    async deleteFoodItem(id) {
        try {
            return await api.delete(`${this.baseUrl}/${id}`);
        } catch (error) {
            console.error('Error deleting food item:', error);
            throw this.handleError(error);
        }
    }

    // Seed sample food items
    async seedFoodItems() {
        try {
            return await api.post(`${this.baseUrl}/seed`);
        } catch (error) {
            console.error('Error seeding food items:', error);
            throw this.handleError(error);
        }
    }

    // Get food categories
    async getFoodCategories() {
        try {
            return await api.get(`${this.baseUrl}/categories`);
        } catch (error) {
            console.error('Error fetching categories:', error);
            throw this.handleError(error);
        }
    }

    // Validation helper
    validateFoodItemData(data) {
        const errors = [];

        if (!data.name || data.name.trim().length < 2) {
            errors.push('Food item name must be at least 2 characters long');
        }

        if (!data.category) {
            errors.push('Category is required');
        }

        if (!data.sellingPrice || data.sellingPrice <= 0) {
            errors.push('Selling price must be greater than 0');
        }

        if (!data.basePrice || data.basePrice < 0) {
            errors.push('Base price must be 0 or greater');
        }

        if (!data.ingredients || data.ingredients.length === 0) {
            errors.push('At least one ingredient is required');
        }

        // Validate ingredients
        if (data.ingredients) {
            data.ingredients.forEach((ingredient, index) => {
                if (!ingredient.name || ingredient.name.trim() === '') {
                    errors.push(`Ingredient ${index + 1}: Name is required`);
                }
                if (!ingredient.quantity || ingredient.quantity <= 0) {
                    errors.push(`Ingredient ${index + 1}: Quantity must be greater than 0`);
                }
                if (!ingredient.unit) {
                    errors.push(`Ingredient ${index + 1}: Unit is required`);
                }
            });
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Get food categories for dropdown
    getFoodCategoryOptions() {
        return [
            { value: 'Rice Dishes', label: 'Rice Dishes' },
            { value: 'Noodles', label: 'Noodles' },
            { value: 'Appetizers', label: 'Appetizers' },
            { value: 'Main Course', label: 'Main Course' },
            { value: 'Desserts', label: 'Desserts' },
            { value: 'Beverages', label: 'Beverages' },
            { value: 'Others', label: 'Others' }
        ];
    }

    // Get available units for ingredients
    getAvailableUnits() {
        return [
            { value: 'g', label: 'Grams (g)' },
            { value: 'kg', label: 'Kilograms (kg)' },
            { value: 'ml', label: 'Milliliters (ml)' },
            { value: 'l', label: 'Liters (l)' },
            { value: 'piece', label: 'Pieces' },
            { value: 'cup', label: 'Cups' },
            { value: 'tsp', label: 'Teaspoons (tsp)' },
            { value: 'tbsp', label: 'Tablespoons (tbsp)' },
            { value: 'oz', label: 'Ounces (oz)' }
        ];
    }

    // Error handler
    handleError(error) {
        if (error.response) {
            // Server responded with error status
            return new Error(error.response.data?.message || 'Server error occurred');
        } else if (error.request) {
            // Request was made but no response received
            return new Error('No response from server. Please check your connection.');
        } else {
            // Something else happened
            return new Error(error.message || 'An unexpected error occurred');
        }
    }

    // Helper method to format currency
    formatCurrency(amount) {
        return `LKR ${parseFloat(amount || 0).toFixed(2)}`;
    }

    // Helper method to calculate profit percentage
    calculateProfitPercentage(basePrice, sellingPrice) {
        if (basePrice <= 0) return '0';
        return (((sellingPrice - basePrice) / basePrice) * 100).toFixed(2);
    }
}

const foodItemService = new FoodItemService();
export default foodItemService;
