/**
 * Complete frontend flow test to debug the payment processing issue
 */

// Simulate the api.js utility
const API_BASE_URL = 'http://localhost:3001/api';

const api = {
    post: async (endpoint, data) => {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const jsonResult = await response.json();
            console.log('🔍 api.post returning:', jsonResult);
            return jsonResult;
        } catch (error) {
            console.error('API POST error:', error);
            throw error;
        }
    }
};

// Simulate the orderService
class OrderService {
    async processOrderPayment(orderData) {
        try {
            console.log('🔍 OrderService: Sending data to API:', JSON.stringify(orderData, null, 2));
            const response = await api.post('/orders/process-payment', orderData);
            console.log('🔍 OrderService: Raw response from api.post:', response);
            console.log('🔍 OrderService: Response type:', typeof response);
            console.log('🔍 OrderService: Response stringified:', JSON.stringify(response, null, 2));
            
            // The api.post method already returns the parsed JSON, which includes the success field
            return response;
        } catch (error) {
            console.error('❌ OrderService: API Error:', error);
            throw error;
        }
    }
}

const orderService = new OrderService();

// Simulate the confirmCloseBill function from TableManagement
async function simulateConfirmCloseBill() {
    console.log('🧪 Testing Complete Frontend Flow\n');
    
    // Simulate bill data
    const billToClose = 'table01';
    const bill = {
        items: [
            {
                id: "68b6b8541b1291defd322e03",
                name: "Egg Fried Rice",
                price: 350,
                quantity: 1,
                category: "Rice Dishes",
                type: "food",
                ingredients: [
                    {"name": "Rice", "quantity": 200, "unit": "g", "cost": 15},
                    {"name": "Eggs", "quantity": 2, "unit": "piece", "cost": 30},
                    {"name": "Carrots", "quantity": 50, "unit": "g", "cost": 10},
                    {"name": "Leeks", "quantity": 30, "unit": "g", "cost": 8},
                    {"name": "Soy Sauce", "quantity": 2, "unit": "tbsp", "cost": 5},
                    {"name": "Oil", "quantity": 1, "unit": "tbsp", "cost": 3}
                ]
            }
        ],
        total: 350,
        serviceCharge: false
    };
    
    try {
        // Process order payment and consume stock
        const orderData = {
            tableId: billToClose, // This should be the table identifier like "table01"
            items: bill.items,
            total: bill.total,
            serviceCharge: bill.serviceCharge || false,
            paymentMethod: 'cash', // Default payment method
            customerId: null // Could be added later for customer tracking
        };

        // Debug logging to see what data we're sending
        console.log('🔍 Order data being sent:', JSON.stringify(orderData, null, 2));
        console.log('🔍 Bill items:', bill.items);

        // Call the order service to process payment and consume stock
        const result = await orderService.processOrderPayment(orderData);
        
        console.log('🔍 Frontend: Received response:', result);
        console.log('🔍 Frontend: Response type:', typeof result);
        console.log('🔍 Frontend: Response.success:', result?.success);
        console.log('🔍 Frontend: Response stringified:', JSON.stringify(result, null, 2));
        console.log('🔍 Frontend: Response keys:', Object.keys(result || {}));
        
        // More detailed checking
        if (!result) {
            console.error('❌ Frontend: Result is null/undefined');
            throw new Error('No response received from server');
        }
        
        if (typeof result.success === 'undefined') {
            console.error('❌ Frontend: success field is undefined');
            console.error('❌ Frontend: Available fields:', Object.keys(result));
        }
        
        if (result && result.success) {
            // Show success message
            console.log('✅ Order processed successfully:', result.data);
            console.log(`📦 Stock consumptions: ${result.data?.stockConsumptions}`);
            console.log(`🍺 Liquor consumptions: ${result.data?.liquorConsumptions}`);

            // Build user-friendly success message
            let successMessage = `✅ Payment processed successfully!\n\nOrder ID: ${result.data?.orderId}\nStock items consumed: ${result.data?.stockConsumptions}`;
            
            // Add information about missed ingredients if any
            if (result.data?.missedIngredients && result.data.missedIngredients.length > 0) {
                successMessage += `\n\n⚠️ Note: Some ingredients were not available in stock:\n${result.data.missedIngredients.map(ing => `• ${ing.name} (${ing.reason})`).join('\n')}`;
                successMessage += `\n\nOnly available ingredients were deducted from stock.`;
            } else {
                successMessage += `\n\nAll ingredients were processed successfully.`;
            }
            
            successMessage += `\n\nTable ${billToClose} is now available.`;

            // Show success alert to user
            console.log('🎉 SUCCESS MESSAGE TO USER:', successMessage);
            
        } else {
            throw new Error(result?.message || 'Failed to process order payment');
        }

    } catch (error) {
        console.error('❌ Error processing order payment:', error);
        
        // Show error to user (you might want to add a toast notification system)
        console.log('💥 ERROR MESSAGE TO USER:', `Failed to process payment: ${error.message}\n\nPlease check stock availability and try again.`);
        
        // Don't close the modal on error, let user try again or cancel
    }
}

// Run the test
simulateConfirmCloseBill()
    .then(() => {
        console.log('\n🎉 Frontend flow test completed');
    })
    .catch((error) => {
        console.log('\n💥 Frontend flow test failed:', error.message);
    });
