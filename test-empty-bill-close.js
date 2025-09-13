/**
 * Test Empty Bill Closing
 * This script tests the ability to close bills with no items added
 */

const API_BASE = 'http://localhost:3001/api';

async function testEmptyBillClose() {
    console.log('🧪 Testing Empty Bill Closing...\n');

    try {
        // Step 1: Create an order with no items
        console.log('📝 Step 1: Creating an empty order...');
        const orderData = {
            tableId: "TEST_TABLE",
            tableNumber: "99", // Add required field
            items: [], // Empty items array
            total: 0,
            serviceCharge: false,
            paymentMethod: 'cash',
            customerId: null
        };

        const createResponse = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        if (!createResponse.ok) {
            const errorText = await createResponse.text();
            console.error('❌ Failed to create empty order:', errorText);
            return;
        }

        const createdOrder = await createResponse.json();
        console.log('✅ Empty order created:', {
            orderId: createdOrder.orderId,
            total: createdOrder.total,
            itemCount: createdOrder.items?.length || 0
        });

        // Step 2: Try to process payment for empty order
        console.log('\n💰 Step 2: Processing payment for empty order...');
        const paymentData = {
            orderId: createdOrder.orderId,
            tableId: "TEST_TABLE",
            tableNumber: "99", // Add required field
            items: [],
            total: 0,
            serviceCharge: false,
            paymentMethod: 'cash',
            customerId: null
        };

        const paymentResponse = await fetch(`${API_BASE}/orders/process-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentData)
        });

        if (!paymentResponse.ok) {
            const errorText = await paymentResponse.text();
            console.error('❌ Failed to process payment for empty order:', errorText);
            return;
        }

        const paymentResult = await paymentResponse.json();
        console.log('✅ Payment processed for empty order:', {
            success: paymentResult.success,
            orderId: paymentResult.data?.orderId,
            stockConsumptions: paymentResult.data?.stockConsumptions,
            liquorConsumptions: paymentResult.data?.liquorConsumptions
        });

        // Step 3: Verify order status
        console.log('\n🔍 Step 3: Verifying final order status...');
        const finalOrderResponse = await fetch(`${API_BASE}/orders/${createdOrder.orderId}`);
        
        if (finalOrderResponse.ok) {
            const finalOrder = await finalOrderResponse.json();
            console.log('✅ Final order status:', {
                orderId: finalOrder.orderId,
                status: finalOrder.status,
                total: finalOrder.total,
                itemCount: finalOrder.items?.length || 0,
                paidAt: finalOrder.paidAt
            });
        } else {
            console.log('ℹ️ Order might have been processed and archived');
        }

        console.log('\n🎉 Test completed successfully! Empty bills can be closed.');

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }
}

// Run the test
testEmptyBillClose().catch(console.error);
