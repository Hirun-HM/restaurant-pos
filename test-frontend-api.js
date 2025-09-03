/**
 * Test script to simulate what the frontend is doing
 */

const API_BASE_URL = 'http://localhost:3001/api';

async function testFrontendAPICall() {
    console.log('🧪 Testing Frontend API Call to Backend');
    
    const orderData = {
        tableId: "table01",
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
                    {"name": "Eggs", "quantity": 2, "unit": "piece", "cost": 30}
                ]
            }
        ],
        total: 350,
        serviceCharge: false,
        paymentMethod: "cash",
        customerId: null
    };

    try {
        console.log('🔍 Sending order data:', JSON.stringify(orderData, null, 2));
        
        const response = await fetch(`${API_BASE_URL}/orders/process-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        console.log('🔍 Response status:', response.status);
        console.log('🔍 Response ok:', response.ok);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Response not ok:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        
        console.log('🔍 Response data:', JSON.stringify(result, null, 2));
        console.log('🔍 Response.success:', result?.success);
        console.log('🔍 Result type:', typeof result);

        if (result && result.success) {
            console.log('✅ SUCCESS: Order processed successfully');
            console.log(`📋 Order ID: ${result.data?.orderId}`);
            console.log(`📦 Stock consumptions: ${result.data?.stockConsumptions}`);
            console.log(`🍺 Liquor consumptions: ${result.data?.liquorConsumptions}`);
            
            if (result.data?.missedIngredients && result.data.missedIngredients.length > 0) {
                console.log(`⚠️ Missed ingredients: ${result.data.missedIngredients.length}`);
            } else {
                console.log('🎉 All ingredients processed successfully');
            }
        } else {
            console.log('❌ FAILURE: success field is falsy');
            console.log('📝 Message:', result?.message);
            throw new Error(result?.message || 'Failed to process order payment');
        }

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        console.error('❌ Full error:', error);
        throw error;
    }
}

// Run the test
testFrontendAPICall()
    .then(() => {
        console.log('🎉 Test completed successfully');
    })
    .catch((error) => {
        console.log('💥 Test failed:', error.message);
    });
