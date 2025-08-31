import { useState, useCallback } from 'react';
import liquorService from '../services/liquorService';

export const useLiquor = () => {
  const [liquorItems, setLiquorItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch all liquor items
  const fetchLiquorItems = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await liquorService.getAllLiquors(params);
      
      if (response.success) {
        setLiquorItems(response.data || []);
        if (response.summary) {
          setAnalytics(response.summary);
        }
      } else {
        throw new Error(response.message || 'Failed to fetch liquor items');
      }
    } catch (err) {
      console.error('Error fetching liquor items:', err);
      setError(err.message || 'Failed to fetch liquor items');
      setLiquorItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new liquor item
  const createLiquorItem = useCallback(async (liquorData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await liquorService.createLiquor(liquorData);
      
      if (response.success) {
        // Add the new item to the state
        setLiquorItems(prev => [...prev, response.data]);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create liquor item');
      }
    } catch (err) {
      console.error('Error creating liquor item:', err);
      setError(err.message || 'Failed to create liquor item');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update liquor item
  const updateLiquorItem = useCallback(async (id, liquorData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await liquorService.updateLiquor(id, liquorData);
      
      if (response.success) {
        // Update the item in state
        setLiquorItems(prev => 
          prev.map(item => 
            item._id === id ? response.data : item
          )
        );
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update liquor item');
      }
    } catch (err) {
      console.error('Error updating liquor item:', err);
      setError(err.message || 'Failed to update liquor item');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete liquor item
  const deleteLiquorItem = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);

      const response = await liquorService.deleteLiquor(id);
      
      if (response.success) {
        // Remove the item from state
        setLiquorItems(prev => prev.filter(item => item._id !== id));
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete liquor item');
      }
    } catch (err) {
      console.error('Error deleting liquor item:', err);
      setError(err.message || 'Failed to delete liquor item');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add portion to liquor item
  const addPortion = useCallback(async (liquorId, portionData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await liquorService.addPortion(liquorId, portionData);
      
      if (response.success) {
        // Update the item in state
        setLiquorItems(prev => 
          prev.map(item => 
            item._id === liquorId ? response.data : item
          )
        );
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to add portion');
      }
    } catch (err) {
      console.error('Error adding portion:', err);
      setError(err.message || 'Failed to add portion');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update portion
  const updatePortion = useCallback(async (liquorId, portionId, portionData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await liquorService.updatePortion(liquorId, portionId, portionData);
      
      if (response.success) {
        // Update the item in state
        setLiquorItems(prev => 
          prev.map(item => 
            item._id === liquorId ? response.data : item
          )
        );
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update portion');
      }
    } catch (err) {
      console.error('Error updating portion:', err);
      setError(err.message || 'Failed to update portion');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete portion
  const deletePortion = useCallback(async (liquorId, portionId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await liquorService.deletePortion(liquorId, portionId);
      
      if (response.success) {
        // Update the item in state
        setLiquorItems(prev => 
          prev.map(item => 
            item._id === liquorId ? response.data : item
          )
        );
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to delete portion');
      }
    } catch (err) {
      console.error('Error deleting portion:', err);
      setError(err.message || 'Failed to delete portion');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add bottles to stock
  const addBottlesToStock = useCallback(async (liquorId, numberOfBottles) => {
    try {
      setLoading(true);
      setError(null);

      const response = await liquorService.addBottlesToStock(liquorId, numberOfBottles);
      
      if (response.success) {
        // Update the item in state
        setLiquorItems(prev => 
          prev.map(item => 
            item._id === liquorId ? response.data : item
          )
        );
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to add bottles to stock');
      }
    } catch (err) {
      console.error('Error adding bottles to stock:', err);
      setError(err.message || 'Failed to add bottles to stock');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Consume liquor
  const consumeLiquor = useCallback(async (liquorId, volume) => {
    try {
      setLoading(true);
      setError(null);

      const response = await liquorService.consumeLiquor(liquorId, volume);
      
      if (response.success) {
        // Update the item in state
        setLiquorItems(prev => 
          prev.map(item => 
            item._id === liquorId ? response.data.liquor : item
          )
        );
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to consume liquor');
      }
    } catch (err) {
      console.error('Error consuming liquor:', err);
      setError(err.message || 'Failed to consume liquor');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get low stock items
  const getLowStockItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await liquorService.getLowStockItems();
      
      if (response.success) {
        return response.data || [];
      } else {
        throw new Error(response.message || 'Failed to fetch low stock items');
      }
    } catch (err) {
      console.error('Error fetching low stock items:', err);
      setError(err.message || 'Failed to fetch low stock items');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get liquor analytics
  const getLiquorAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await liquorService.getLiquorAnalytics();
      
      if (response.success) {
        setAnalytics(response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch analytics');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Failed to fetch analytics');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get liquors by type
  const getLiquorsByType = useCallback(async (type) => {
    try {
      setLoading(true);
      setError(null);

      const response = await liquorService.getLiquorsByType(type);
      
      if (response.success) {
        return response.data || [];
      } else {
        throw new Error(response.message || 'Failed to fetch liquors by type');
      }
    } catch (err) {
      console.error('Error fetching liquors by type:', err);
      setError(err.message || 'Failed to fetch liquors by type');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter items by category
  const getItemsByType = useCallback((type) => {
    if (type === 'all' || !type) return liquorItems;
    return liquorItems.filter(item => item.type === type);
  }, [liquorItems]);

  // Get low stock items from current state
  const getLowStockFromState = useCallback(() => {
    return liquorItems.filter(item => item.isLowStock);
  }, [liquorItems]);

  return {
    // State
    liquorItems,
    loading,
    error,
    analytics,
    
    // Actions
    fetchLiquorItems,
    createLiquorItem,
    updateLiquorItem,
    deleteLiquorItem,
    addPortion,
    updatePortion,
    deletePortion,
    addBottlesToStock,
    consumeLiquor,
    getLowStockItems,
    getLiquorAnalytics,
    getLiquorsByType,
    
    // Utilities
    getItemsByType,
    getLowStockFromState,
    clearError
  };
};
