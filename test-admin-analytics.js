// Test script to create sample orders for testing admin analytics

const API_BASE = 'http://localhost:3001/api';

async function createSampleOrder(orderData) {
    try {
        const response = await fetch(`${API_BASE}/orders/process-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        console.log('Order created:', result);
        return result;
    } catch (error) {
        console.error('Error creating order:', error);
        return null;
    }
}

async function testAdminAnalytics() {
    console.log('🧪 Testing Admin Analytics with Sample Orders...\n');

    // Sample order 1: Food items
    const order1 = {
        tableId: 'table-1',
        items: [
            {
                id: 'food-1',
                name: 'Chicken Curry',
                type: 'food',
                price: 850,
                quantity: 2,
                ingredients: [
                    { name: 'Chicken', quantity: 250, unit: 'g' },
                    { name: 'Rice', quantity: 100, unit: 'g' }
                ]
            }
        ],
        total: 1700,
        serviceCharge: true,
        paymentMethod: 'cash'
    };

    // Sample order 2: Liquor items
    const order2 = {
        tableId: 'table-2',
        items: [
            {
                id: 'liquor-1',
                name: 'Beer',
                type: 'beer',
                price: 100,
                quantity: 2,
                portionSize: 330
            },
            {
                id: 'liquor-2',
                name: 'Jack Daniels',
                type: 'hard_liquor',
                price: 25,
                quantity: 4,
                portionSize: 25
            }
        ],
        total: 300,
        serviceCharge: true,
        paymentMethod: 'cash'
    };

    // Sample order 3: Mixed order
    const order3 = {
        tableId: 'table-3',
        items: [
            {
                id: 'food-2',
                name: 'Chicken Fried Rice',
                type: 'food',
                price: 650,
                quantity: 1,
                ingredients: [
                    { name: 'Chicken', quantity: 200, unit: 'g' },
                    { name: 'Rice', quantity: 150, unit: 'g' }
                ]
            },
            {
                id: 'liquor-3',
                name: 'Beer',
                type: 'beer',
                price: 100,
                quantity: 1,
                portionSize: 330
            }
        ],
        total: 750,
        serviceCharge: true,
        paymentMethod: 'card'
    };

    // Create orders
    console.log('📝 Creating sample orders...');
    await createSampleOrder(order1);
    await createSampleOrder(order2);
    await createSampleOrder(order3);

    console.log('\n✅ Sample orders created! Check the admin dashboard for updated analytics.');
    
    // Test analytics endpoints
    console.log('\n📊 Testing Analytics Endpoints:');
    
    try {
        const statsResponse = await fetch(`${API_BASE}/orders/stats`);
        const stats = await statsResponse.json();
        console.log('Order Stats:', stats);
        
        const revenueResponse = await fetch(`${API_BASE}/orders/revenue?period=today`);
        const revenue = await revenueResponse.json();
        console.log('Revenue Data:', revenue);
        
        const breakdownResponse = await fetch(`${API_BASE}/orders/breakdown?period=today`);
        const breakdown = await breakdownResponse.json();
        console.log('Breakdown Data:', breakdown);
        
    } catch (error) {
        console.error('Error testing analytics:', error);
    }
}

// Run the test
testAdminAnalytics().catch(console.error);
