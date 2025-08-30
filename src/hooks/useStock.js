import { useState, useEffect, useCallback } from 'react';
import stockAPI from '../services/stockService';

export const useStock = () => {
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  // Fetch all stock items
  const fetchStockItems = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await stockAPI.getAllStockItems(params);
      setStockItems(response.data);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch stock analytics
  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await stockAPI.getStockAnalytics();
      setAnalytics(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching analytics:', err);
      throw err;
    }
  }, []);

  // Create stock item
  const createStock = useCallback(async (stockData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await stockAPI.createStockItem(stockData);
      
      // Add new item to state
      setStockItems(prev => [...prev, response.data]);
      
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update stock item
  const updateStock = useCallback(async (id, stockData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await stockAPI.updateStockItem(id, stockData);
      
      // Update item in state
      setStockItems(prev => 
        prev.map(item => item._id === id ? response.data : item)
      );
      
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update stock quantity
  const updateQuantity = useCallback(async (id, quantity, operation) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await stockAPI.updateStockQuantity(id, quantity, operation);
      
      // Update item in state
      setStockItems(prev => 
        prev.map(item => item._id === id ? response.data : item)
      );
      
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add stock (restock)
  const addStock = useCallback(async (id, quantity) => {
    return updateQuantity(id, quantity, 'add');
  }, [updateQuantity]);

  // Consume stock
  const consumeStock = useCallback(async (id, quantity) => {
    return updateQuantity(id, quantity, 'subtract');
  }, [updateQuantity]);

  // Delete stock item
  const deleteStock = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      await stockAPI.deleteStockItem(id);
      
      // Remove item from state
      setStockItems(prev => prev.filter(item => item._id !== id));
      
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get low stock items
  const getLowStockItems = useCallback(async () => {
    try {
      const response = await stockAPI.getLowStockItems();
      return response.data;
    } catch (err) {
      console.error('Error fetching low stock items:', err);
      throw err;
    }
  }, []);

  // Search stock items
  const searchStock = useCallback(async (searchTerm, filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await stockAPI.searchStockItems(searchTerm, filters);
      setStockItems(response.data);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get items by category
  const getItemsByCategory = useCallback((category) => {
    return stockItems.filter(item => item.category === category);
  }, [stockItems]);

  // Calculate totals
  const totals = {
    totalItems: stockItems.length,
    totalValue: stockItems.reduce((sum, item) => sum + (item.quantity * item.price), 0),
    lowStockCount: stockItems.filter(item => item.quantity <= (item.minimumQuantity || 5)).length
  };

  return {
    // State
    stockItems,
    loading,
    error,
    analytics,
    totals,
    
    // Actions
    fetchStockItems,
    fetchAnalytics,
    createStock,
    updateStock,
    updateQuantity,
    addStock,
    consumeStock,
    deleteStock,
    getLowStockItems,
    searchStock,
    getItemsByCategory,
    
    // Utilities
    setError: (error) => setError(error),
    clearError: () => setError(null)
  };
};

// Hook for single stock item
export const useStockItem = (id) => {
  const [stockItem, setStockItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStockItem = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await stockAPI.getStockItem(id);
      setStockItem(response.data);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStockItem();
  }, [fetchStockItem]);

  return {
    stockItem,
    loading,
    error,
    refetch: fetchStockItem
  };
};
