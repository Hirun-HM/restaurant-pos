// Simple test for food orders only

const API_BASE = 'http://localhost:3001/api';

async function createFoodOrder(orderData) {
    try {
        const response = await fetch(`${API_BASE}/orders/process-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        console.log('Order result:', result.success ? '✅ Success' : '❌ Failed', result.message);
        return result;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

async function testAnalytics() {
    console.log('🧪 Creating Food Orders for Analytics...\n');

    // Multiple food orders to generate analytics data
    const orders = [
        {
            tableId: 'table-1',
            items: [{
                name: 'Chicken Curry',
                type: 'food',
                price: 850,
                quantity: 2,
                ingredients: [
                    { name: 'Chicken', quantity: 200, unit: 'g' },
                    { name: 'Rice', quantity: 100, unit: 'g' }
                ]
            }],
            total: 1700,
            serviceCharge: true,
            paymentMethod: 'cash'
        },
        {
            tableId: 'table-2',
            items: [{
                name: 'Chicken Fried Rice',
                type: 'food',
                price: 650,
                quantity: 1,
                ingredients: [
                    { name: 'Chicken', quantity: 150, unit: 'g' },
                    { name: 'Rice', quantity: 120, unit: 'g' }
                ]
            }],
            total: 650,
            serviceCharge: false,
            paymentMethod: 'card'
        },
        {
            tableId: 'table-3',
            items: [{
                name: 'Chicken Soup',
                type: 'food', 
                price: 450,
                quantity: 3,
                ingredients: [
                    { name: 'Chicken', quantity: 100, unit: 'g' }
                ]
            }],
            total: 1350,
            serviceCharge: true,
            paymentMethod: 'cash'
        }
    ];

    // Create orders
    for (let i = 0; i < orders.length; i++) {
        console.log(`📝 Creating order ${i + 1}/${orders.length}...`);
        await createFoodOrder(orders[i]);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between orders
    }

    console.log('\n📊 Testing Analytics Endpoints:');
    
    try {
        const statsResponse = await fetch(`${API_BASE}/orders/stats`);
        const stats = await statsResponse.json();
        console.log('📈 Order Stats:', stats.data);
        
        const revenueResponse = await fetch(`${API_BASE}/orders/revenue?period=today`);
        const revenue = await revenueResponse.json();
        console.log('💰 Revenue:', revenue.data);
        
        const breakdownResponse = await fetch(`${API_BASE}/orders/breakdown?period=today`);
        const breakdown = await breakdownResponse.json();
        console.log('🍽️ Food/Liquor Breakdown:', breakdown.data);
        
    } catch (error) {
        console.error('❌ Error testing analytics:', error);
    }
}

testAnalytics().catch(console.error);
