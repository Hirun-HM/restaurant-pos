/**
 * Final test to verify empty bill closing in frontend
 */

console.log('🧪 Testing Frontend Empty Bill Closing...\n');

async function testFrontendEmptyBillClose() {
    const API_BASE = 'http://localhost:3001/api';
    
    try {
        // Test the exact scenario that was failing
        console.log('📝 Testing the exact frontend scenario...');
        
        const orderData = {
            orderId: null, // No existing order ID (new bill)
            tableId: "99",
            tableNumber: "99",
            items: [], // Empty items array - this was causing the 400 error
            total: 0,
            serviceCharge: false,
            paymentMethod: 'cash',
            customerId: null
        };

        console.log('🔍 Sending order data:', JSON.stringify(orderData, null, 2));

        const response = await fetch(`${API_BASE}/orders/process-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ SUCCESS! Empty bill processed successfully:');
            console.log('  - Status:', response.status);
            console.log('  - Success:', result.success);
            console.log('  - Order ID:', result.data?.orderId);
            console.log('  - Stock Consumptions:', result.data?.stockConsumptions);
            console.log('  - Liquor Consumptions:', result.data?.liquorConsumptions);
            console.log('  - Message:', result.message);
            
            console.log('\n🎉 The frontend should now work without "Payment Processing Failed" errors!');
        } else {
            console.log('❌ FAILED! Still getting error:');
            console.log('  - Status:', response.status);
            console.log('  - Error:', result.message);
            console.log('  - Details:', result.error);
        }

    } catch (error) {
        console.error('❌ Network or other error:', error.message);
    }
}

testFrontendEmptyBillClose();
