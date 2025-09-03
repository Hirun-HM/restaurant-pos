// Give server time to start
setTimeout(async () => {
    try {
        console.log('Testing Analytics APIs...\n');
        
        // Test revenue endpoint
        console.log('1. Testing Revenue API...');
        const revenueResponse = await fetch('http://localhost:3001/api/orders/revenue-data?period=today');
        const revenueData = await revenueResponse.json();
        console.log('Revenue Response:', JSON.stringify(revenueData, null, 2));
        
        // Test profit endpoint
        console.log('\n2. Testing Profit API...');
        const profitResponse = await fetch('http://localhost:3001/api/orders/profit-data?period=today');
        const profitData = await profitResponse.json();
        console.log('Profit Response:', JSON.stringify(profitData, null, 2));
        
        console.log('\nAnalytics test completed!');
        process.exit(0);
    } catch (error) {
        console.error('Test Error:', error);
        process.exit(1);
    }
}, 3000);
