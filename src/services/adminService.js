import api from '../utils/api';

export const AdminService = {
    // Get overview statistics
    async getOverviewStats() {
        try {
            const [stockStats, liquorStats, foodStats, orderStats] = await Promise.all([
                api.get('/stock/stats'),
                api.get('/liquor/stats'), 
                api.get('/food-items/stats'),
                api.get('/orders/stats')
            ]);

            return {
                stock: stockStats.data,
                liquor: liquorStats.data,
                food: foodStats.data,
                orders: orderStats.data
            };
        } catch (error) {
            console.error('Error fetching overview stats:', error);
            throw error;
        }
    },

    // Get stock management data
    async getStockData() {
        try {
            const response = await api.get('/stock');
            return response.data;
        } catch (error) {
            console.error('Error fetching stock data:', error);
            throw error;
        }
    },

    // Get liquor management data  
    async getLiquorData() {
        try {
            const response = await api.get('/liquor');
            return response.data;
        } catch (error) {
            console.error('Error fetching liquor data:', error);
            throw error;
        }
    },

    // Get analytics data with revenue and profit calculations
    async getAnalyticsData(dateRange = 'today') {
        try {
            const [revenueData, orderData, profitData] = await Promise.all([
                api.get(`/orders/revenue?period=${dateRange}`),
                api.get(`/orders/analytics?period=${dateRange}`),
                api.get(`/orders/profit?period=${dateRange}`)
            ]);

            return {
                revenue: revenueData.data,
                orders: orderData.data,
                profit: profitData.data
            };
        } catch (error) {
            console.error('Error fetching analytics data:', error);
            throw error;
        }
    },

    // Get food and liquor breakdown
    async getFoodLiquorBreakdown(dateRange = 'today') {
        try {
            const response = await api.get(`/orders/breakdown?period=${dateRange}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching food/liquor breakdown:', error);
            throw error;
        }
    },

    // Get active table count
    async getActiveTableCount() {
        try {
            const response = await api.get('/orders/active-table-count');
            return response.count || 0;
        } catch (error) {
            console.error('Error fetching active table count:', error);
            return 0;
        }
    },

    // Get active bills count
    async getActiveBillsCount() {
        try {
            const response = await api.get('/orders/active-bills-count');
            return response.count || 0;
        } catch (error) {
            console.error('Error fetching active bills count:', error);
            return 0;
        }
    },

    // Debug method to get orders info
    async getDebugOrders() {
        try {
            const response = await api.get('/orders/debug');
            return response;
        } catch (error) {
            console.error('Error fetching debug orders:', error);
            return { totalOrders: 0, orders: [] };
        }
    }
};

export default AdminService;
