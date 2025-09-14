import { api } from '../utils/api';

class MenuLiquorService {
  // Get all liquor items that can be added to menu
  async getAvailableLiquorItems() {
    try {
      const response = await api.get('/liquor?isActive=true&limit=100');
      return response;
    } catch (error) {
      console.error('Error fetching liquor items:', error);
      throw error;
    }
  }

  // Convert liquor items to menu format
  convertLiquorToMenuItems(liquorItems) {
    const menuItems = [];
    
    liquorItems.forEach(liquor => {
      if (liquor.type === 'beer') {
        // For beer, create a simple menu item
        menuItems.push({
          id: `liquor_${liquor._id}`,
          name: liquor.name,
          brand: liquor.brand,
          price: liquor.pricePerBottle,
          category: 'Liquor',
          type: 'liquor',
          liquorId: liquor._id,
          description: `${liquor.brand} ${liquor.type} - ${liquor.bottleVolume}ml bottle`,
          stockInfo: {
            bottlesInStock: liquor.bottlesInStock,
            minimumBottles: liquor.minimumBottles,
            isLowStock: liquor.bottlesInStock <= liquor.minimumBottles
          },
          portionTracking: false,
          volume: liquor.bottleVolume,
          volumeUnit: 'ml'
        });
      } else if (liquor.type === 'ice_cubes' || liquor.type === 'sandy_bottles') {
        // For ice cubes and sandy bottles, create simple menu items
        menuItems.push({
          id: `liquor_${liquor._id}`,
          name: liquor.name,
          brand: liquor.brand,
          price: liquor.pricePerBottle,
          category: liquor.type === 'ice_cubes' ? 'Ice Cubes' : 'Sandy Bottles',
          type: 'liquor',
          liquorId: liquor._id,
          description: `${liquor.brand} ${liquor.name} - ${liquor.type === 'ice_cubes' ? 'Ice Cube Bowls' : 'Sandy Bottles'}`,
          stockInfo: {
            bottlesInStock: liquor.bottlesInStock,
            minimumBottles: liquor.minimumBottles,
            isLowStock: liquor.bottlesInStock <= liquor.minimumBottles
          },
          portionTracking: false,
          volume: 1,
          volumeUnit: liquor.type === 'ice_cubes' ? 'bowl' : 'bottle'
        });
      } else if (liquor.type === 'bites') {
        // For bites, create a simple menu item
        menuItems.push({
          id: `liquor_${liquor._id}`,
          name: liquor.name,
          price: liquor.pricePerPlate || liquor.pricePerBottle,
          category: 'Bites',
          type: 'bites',
          liquorId: liquor._id,
          description: `${liquor.name} - ${liquor.servingSize} serving` + (liquor.spiceLevel ? `, ${liquor.spiceLevel} spice` : ''),
          stockInfo: {
            platesInStock: liquor.platesInStock || liquor.bottlesInStock,
            minimumPlates: liquor.minimumBottles || 2,
            isLowStock: (liquor.platesInStock || liquor.bottlesInStock) <= (liquor.minimumBottles || 2)
          },
          portionTracking: false,
          servingSize: liquor.servingSize,
          ingredients: liquor.ingredients,
          spiceLevel: liquor.spiceLevel,
          unit: 'plate'
        });
      } else {
        // For hard liquor, create menu items for each portion
        liquor.portions.forEach(portion => {
          menuItems.push({
            id: `liquor_${liquor._id}_${portion._id}`,
            name: `${liquor.name} - ${portion.name}`,
            brand: liquor.brand,
            price: portion.price,
            category: 'Liquor',
            type: 'liquor',
            liquorId: liquor._id,
            portionId: portion._id,
            description: `${liquor.brand} ${liquor.type} - ${portion.volume}ml shot`,
            stockInfo: {
              bottlesInStock: liquor.bottlesInStock,
              totalVolumeRemaining: liquor.totalVolumeRemaining,
              minimumBottles: liquor.minimumBottles,
              isLowStock: liquor.bottlesInStock <= liquor.minimumBottles,
              wastedVolume: liquor.wastedVolume,
              totalSoldVolume: liquor.totalSoldVolume
            },
            portionTracking: true,
            portion: portion,
            volume: portion.volume,
            volumeUnit: 'ml'
          });
        });
      }
    });

    return menuItems;
  }

  // Process liquor sale (for billing)
  async processLiquorSale(liquorId, portionId = null, volume = null) {
    try {
      // Determine volume to consume
      let volumeToConsume = volume;
      let portionName = 'Manual Sale';

      if (portionId) {
        // Get liquor details to find portion info
        const liquor = await api.get(`/liquor/${liquorId}`);
        const portion = liquor.data.portions.find(p => p._id === portionId);
        if (portion) {
          volumeToConsume = portion.volume;
          portionName = portion.name;
        }
      }

      if (!volumeToConsume || volumeToConsume <= 0) {
        throw new Error('Invalid volume for liquor sale');
      }

      // Consume liquor
      const response = await api.post(`/liquor/${liquorId}/consume`, {
        volume: volumeToConsume,
        portionName: portionName
      });

      return {
        success: true,
        consumed: response.consumption.consumed,
        wasted: response.consumption.wasted,
        remainingBottles: response.consumption.remainingBottles,
        remainingVolume: response.consumption.remainingVolume,
        portionName: response.consumption.portionName
      };
    } catch (error) {
      console.error('Error processing liquor sale:', error);
      throw error;
    }
  }

  // Get liquor stock summary for reporting
  async getLiquorStockSummary() {
    try {
      const response = await api.get('/liquor/analytics');
      return response.data;
    } catch (error) {
      console.error('Error fetching liquor analytics:', error);
      throw error;
    }
  }

  // Check for low stock alerts
  async getLowStockAlerts() {
    try {
      const response = await api.get('/liquor/low-stock');
      return response.data;
    } catch (error) {
      console.error('Error fetching low stock alerts:', error);
      throw error;
    }
  }

  // Format price for display
  formatPrice(price) {
    return `Rs. ${price.toFixed(2)}`;
  }

  // Format volume for display
  formatVolume(volume, unit = 'ml') {
    return `${volume}${unit}`;
  }
}

export const menuLiquorService = new MenuLiquorService();
export default menuLiquorService;
