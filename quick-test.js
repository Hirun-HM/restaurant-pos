console.log('Testing analytics endpoints...');

async function testEndpoints() {
    try {
        // Test revenue endpoint
        console.log('Testing revenue endpoint...');
        const revenueRes = await fetch('http://localhost:3001/api/orders/revenue?period=today');
        const revenueData = await revenueRes.json();
        console.log('Revenue:', JSON.stringify(revenueData, null, 2));

        // Test profit endpoint
        console.log('\nTesting profit endpoint...');
        const profitRes = await fetch('http://localhost:3001/api/orders/profit?period=today');
        const profitData = await profitRes.json();
        console.log('Profit:', JSON.stringify(profitData, null, 2));

        // Test analytics endpoint
        console.log('\nTesting analytics endpoint...');
        const analyticsRes = await fetch('http://localhost:3001/api/orders/analytics?period=today');
        const analyticsData = await analyticsRes.json();
        console.log('Analytics:', JSON.stringify(analyticsData, null, 2));

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testEndpoints();
