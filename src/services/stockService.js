// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Stock API Service
class StockAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/stock`;
  }

  // Helper method for making API requests
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    };

    // Get token from localStorage if available
    const token = localStorage.getItem('authToken');
    if (token) {
      defaultOptions.headers.Authorization = `Bearer ${token}`;
    }

    const config = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      let data;
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        });
        
        // Enhanced error message for validation errors
        if (response.status === 400) {
          const errorMessage = data.message || data.error || 'Validation failed';
          const validationErrors = data.errors || data.details || [];
          
          if (validationErrors.length > 0) {
            console.error('Validation errors:', validationErrors);
            throw new Error(`${errorMessage}: ${validationErrors.join(', ')}`);
          } else {
            throw new Error(errorMessage);
          }
        }
        
        throw new Error(data.message || data.error || `HTTP Error: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Get all stock items
  async getAllStockItems(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/?${queryString}` : '/';
    return this.request(endpoint, { method: 'GET' });
  }

  // Get stock items by category
  async getStockItemsByCategory(category, params = {}) {
    const queryParams = { ...params, category };
    return this.getAllStockItems(queryParams);
  }

  // Get single stock item
  async getStockItem(id) {
    return this.request(`/${id}`, { method: 'GET' });
  }

  // Create new stock item
  async createStockItem(stockData) {
    return this.request('/', {
      method: 'POST',
      body: JSON.stringify(stockData),
    });
  }

  // Update stock item
  async updateStockItem(id, stockData) {
    return this.request(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(stockData),
    });
  }

  // Update stock quantity (add or subtract)
  async updateStockQuantity(id, quantity, operation) {
    return this.request(`/${id}/quantity`, {
      method: 'PUT',
      body: JSON.stringify({ quantity, operation }),
    });
  }

  // Add stock (restock)
  async addStock(id, quantity) {
    return this.updateStockQuantity(id, quantity, 'add');
  }

  // Consume stock
  async consumeStock(id, quantity) {
    return this.updateStockQuantity(id, quantity, 'subtract');
  }

  // Delete stock item
  async deleteStockItem(id) {
    return this.request(`/${id}`, { method: 'DELETE' });
  }

  // Get low stock items
  async getLowStockItems() {
    return this.request('/low-stock', { method: 'GET' });
  }

  // Get stock analytics
  async getStockAnalytics() {
    return this.request('/analytics', { method: 'GET' });
  }

  // Search stock items
  async searchStockItems(searchTerm, params = {}) {
    const queryParams = { ...params, search: searchTerm };
    return this.getAllStockItems(queryParams);
  }

  // Get stock items with pagination
  async getStockItemsPaginated(page = 1, limit = 20, filters = {}) {
    const params = { page, limit, ...filters };
    return this.getAllStockItems(params);
  }
}

// Create and export instance
const stockAPI = new StockAPI();

// Export individual methods for convenience
export const {
  getAllStockItems,
  getStockItemsByCategory,
  getStockItem,
  createStockItem,
  updateStockItem,
  updateStockQuantity,
  addStock,
  consumeStock,
  deleteStockItem,
  getLowStockItems,
  getStockAnalytics,
  searchStockItems,
  getStockItemsPaginated
} = stockAPI;

// Export the class instance as default
export default stockAPI;
