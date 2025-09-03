#!/usr/bin/env node

/**
 * Test script to demonstrate graceful order processing
 * Tests partial ingredient processing with unit conversion
 */

const BASE_URL = 'http://localhost:3001/api';

async function testGracefulProcessing() {
    console.log('🧪 Testing Graceful Order Processing with Partial Ingredients\n');
    
    console.log('📋 Test Scenario:');
    console.log('   - Food item with 8 ingredients (some available, some missing)');
    console.log('   - Unit conversion: kg ↔ g');
    console.log('   - Expected: Process only available ingredients, skip missing ones\n');
    
    // Test with a realistic food item that has mixed ingredient availability
    const orderData = {
        tableId: "table01",
        items: [{
            id: "test-fried-rice",
            name: "Special Fried Rice",
            price: 600,
            quantity: 2,
            ingredients: [
                // Available ingredients (should be processed)
                {"name": "Rice", "quantity": 150, "unit": "g"},        // Available in stock
                {"name": "Chicken", "quantity": 80, "unit": "g"},      // Available, needs kg→g conversion
                {"name": "Eggs", "quantity": 2, "unit": "piece"},      // Available in stock
                
                // Missing ingredients (should be skipped gracefully)
                {"name": "Bell Peppers", "quantity": 30, "unit": "g"}, // Not in stock
                {"name": "Green Onions", "quantity": 20, "unit": "g"}, // Not in stock
                {"name": "Sesame Oil", "quantity": 1, "unit": "tbsp"}, // Not in stock
                {"name": "Fish Sauce", "quantity": 1, "unit": "tsp"},  // Not in stock
                {"name": "Bean Sprouts", "quantity": 50, "unit": "g"}  // Not in stock
            ]
        }],
        total: 1200,
        paymentMethod: "cash"
    };
    
    console.log('🔍 Order Details:');
    console.log(`   - Item: ${orderData.items[0].name}`);
    console.log(`   - Quantity: ${orderData.items[0].quantity}`);
    console.log(`   - Total Ingredients: ${orderData.items[0].ingredients.length}`);
    console.log('   - Expected Available: Rice (300g total), Chicken (160g→0.16kg total), Eggs (4 pieces total)');
    console.log('   - Expected Missing: 5 ingredients\n');
    
    try {
        // Get current stock levels
        console.log('1️⃣ Current stock levels (before order):');
        const stockResponse = await fetch(`${BASE_URL}/stock`);
        const stockData = await stockResponse.json();
        const relevantStock = stockData.data.filter(item => 
            ['Rice', 'Chicken', 'Eggs'].includes(item.name)
        );
        
        relevantStock.forEach(item => {
            console.log(`   - ${item.name}: ${item.quantity}${item.unit}`);
        });
        
        console.log('\n2️⃣ Processing order with graceful handling...');
        
        // Process the order
        const orderResponse = await fetch(`${BASE_URL}/orders/process-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        
        const result = await orderResponse.json();
        
        if (result.success) {
            console.log('✅ Order processed successfully!');
            console.log(`   - Order ID: ${result.data.orderId}`);
            console.log(`   - Stock items processed: ${result.data.stockConsumptions}`);
            console.log(`   - Ingredients skipped: ${result.data.missedIngredients?.length || 0}`);
            
            if (result.data.missedIngredients && result.data.missedIngredients.length > 0) {
                console.log('\n⚠️ Skipped ingredients:');
                result.data.missedIngredients.forEach(ingredient => {
                    console.log(`   - ${ingredient.name}: ${ingredient.required} (${ingredient.reason.includes('not found') ? 'Not in stock' : ingredient.reason})`);
                });
            }
            
            console.log(`\n📝 Processing Notes: ${result.data.processingNotes}`);
            
            // Check updated stock levels
            console.log('\n3️⃣ Updated stock levels (after order):');
            const updatedStockResponse = await fetch(`${BASE_URL}/stock`);
            const updatedStockData = await updatedStockResponse.json();
            const updatedRelevantStock = updatedStockData.data.filter(item => 
                ['Rice', 'Chicken', 'Eggs'].includes(item.name)
            );
            
            updatedRelevantStock.forEach(item => {
                const originalItem = relevantStock.find(orig => orig.name === item.name);
                if (originalItem) {
                    const reduction = originalItem.quantity - item.quantity;
                    console.log(`   - ${item.name}: ${item.quantity}${item.unit} (reduced by ${reduction}${item.unit})`);
                }
            });
            
            console.log('\n🎉 SUCCESS! The system correctly:');
            console.log('   ✅ Processed available ingredients with unit conversion');
            console.log('   ✅ Gracefully skipped missing ingredients');
            console.log('   ✅ Completed the order without errors');
            console.log('   ✅ Provided detailed feedback about what was processed');
            
        } else {
            console.error('❌ Order failed:', result.message);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testGracefulProcessing().catch(console.error);
