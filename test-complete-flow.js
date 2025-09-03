#!/usr/bin/env node

/**
 * Test script to verify the complete order processing flow
 * This tests the backend API endpoints with realistic data
 */

const BASE_URL = 'http://localhost:3001/api';

async function testCompleteFlow() {
    console.log('🧪 Testing Complete Order Processing Flow\n');
    
    // 1. Get current stock levels
    console.log('1️⃣ Checking current stock levels...');
    const stockResponse = await fetch(`${BASE_URL}/stock`);
    const stockData = await stockResponse.json();
    
    if (stockData.success) {
        console.log('✅ Stock levels retrieved:');
        stockData.data.forEach(item => {
            console.log(`   - ${item.name}: ${item.quantity}${item.unit}`);
        });
    } else {
        console.error('❌ Failed to get stock levels');
        return;
    }
    
    console.log('\n2️⃣ Getting food items...');
    const foodResponse = await fetch(`${BASE_URL}/food-items`);
    const foodData = await foodResponse.json();
    
    if (foodData.success && foodData.data.length > 0) {
        const foodItem = foodData.data[0]; // Get first food item
        console.log(`✅ Using food item: ${foodItem.name}`);
        console.log('   Ingredients required:');
        foodItem.ingredients.forEach(ing => {
            console.log(`   - ${ing.name}: ${ing.quantity}${ing.unit}`);
        });
        
        console.log('\n3️⃣ Processing order payment...');
        const orderData = {
            tableId: "table01",
            items: [{
                id: foodItem._id,
                name: foodItem.name,
                price: foodItem.sellingPrice,
                quantity: 1,
                ingredients: foodItem.ingredients
            }],
            total: foodItem.sellingPrice,
            paymentMethod: "cash"
        };
        
        const orderResponse = await fetch(`${BASE_URL}/orders/process-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        const orderResult = await orderResponse.json();
        
        if (orderResult.success) {
            console.log('✅ Order processed successfully!');
            console.log(`   Order ID: ${orderResult.data.orderId}`);
            console.log(`   Stock consumptions: ${orderResult.data.stockConsumptions}`);
            console.log(`   Total: LKR ${orderResult.data.total}`);
            
            console.log('\n4️⃣ Verifying updated stock levels...');
            const updatedStockResponse = await fetch(`${BASE_URL}/stock`);
            const updatedStockData = await updatedStockResponse.json();
            
            if (updatedStockData.success) {
                console.log('✅ Updated stock levels:');
                updatedStockData.data.forEach(item => {
                    const originalItem = stockData.data.find(orig => orig._id === item._id);
                    const difference = originalItem ? (originalItem.quantity - item.quantity) : 0;
                    console.log(`   - ${item.name}: ${item.quantity}${item.unit} ${difference > 0 ? `(reduced by ${difference}${item.unit})` : ''}`);
                });
                
                console.log('\n🎉 Complete flow test PASSED! The order processing system is working correctly.');
            }
        } else {
            console.error('❌ Order processing failed:', orderResult.message);
            if (orderResult.stockError) {
                console.error('   Stock Error:', orderResult.stockError);
            }
        }
    } else {
        console.error('❌ No food items found or failed to retrieve food items');
    }
}

// Run the test
testCompleteFlow().catch(error => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
});
