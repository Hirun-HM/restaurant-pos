/**
 * Test script that replicates the exact UI flow for placing an order
 * This will help identify where the disconnect is happening
 */

const API_BASE_URL = 'http://localhost:3001/api';

async function testUIOrderFlow() {
    console.log('🧪 Testing UI Order Flow with Real Menu Data\n');
    
    // Step 1: Get real food items (like the UI does)
    console.log('1️⃣ Fetching food items from API...');
    const foodResponse = await fetch(`${API_BASE_URL}/food-items`);
    const foodData = await foodResponse.json();
    
    if (!foodData.success || !foodData.data || foodData.data.length === 0) {
        console.error('❌ Failed to get food items');
        return;
    }
    
    const eggFriedRice = foodData.data.find(item => item.name === 'Egg Fried Rice');
    if (!eggFriedRice) {
        console.error('❌ Egg Fried Rice not found in menu');
        console.log('Available items:', foodData.data.map(item => item.name));
        return;
    }
    
    console.log('✅ Found Egg Fried Rice in menu');
    console.log('   ID:', eggFriedRice._id);
    console.log('   Price:', eggFriedRice.sellingPrice);
    console.log('   Ingredients:', eggFriedRice.ingredients.length);
    
    // Step 2: Create a bill structure exactly like the UI would
    const tableId = 'table01';
    const bill = {
        items: [
            {
                id: eggFriedRice._id,
                name: eggFriedRice.name,
                price: eggFriedRice.sellingPrice,
                quantity: 1,
                category: eggFriedRice.category,
                type: 'food',
                ingredients: eggFriedRice.ingredients.map(ing => ({
                    name: ing.name,
                    quantity: ing.quantity,
                    unit: ing.unit,
                    cost: ing.cost
                }))
            }
        ],
        total: eggFriedRice.sellingPrice,
        serviceCharge: false,
        status: 'active'
    };
    
    console.log('\n2️⃣ Created bill structure:');
    console.log('   Table:', tableId);
    console.log('   Items:', bill.items.length);
    console.log('   Total:', bill.total);
    console.log('   Item ingredients:', bill.items[0].ingredients.length);
    
    // Step 3: Process payment exactly like the UI does
    console.log('\n3️⃣ Processing payment...');
    
    const orderData = {
        tableId: tableId,
        items: bill.items,
        total: bill.total,
        serviceCharge: bill.serviceCharge || false,
        paymentMethod: 'cash',
        customerId: null
    };
    
    console.log('Order data prepared:', {
        tableId: orderData.tableId,
        itemCount: orderData.items.length,
        total: orderData.total,
        ingredientCount: orderData.items[0].ingredients.length
    });
    
    try {
        const response = await fetch(`${API_BASE_URL}/orders/process-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData),
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Response not ok:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        
        console.log('Payment result:', result?.success ? 'SUCCESS' : 'FAILED');
        
        if (result && result.success) {
            console.log('✅ Payment processed successfully!');
            console.log('   Order ID:', result.data?.orderId);
            console.log('   Stock consumptions:', result.data?.stockConsumptions);
            console.log('   Liquor consumptions:', result.data?.liquorConsumptions);
            
            if (result.data?.missedIngredients && result.data.missedIngredients.length > 0) {
                console.log('   ⚠️ Missed ingredients:', result.data.missedIngredients.length);
                result.data.missedIngredients.forEach(ing => {
                    console.log(`      - ${ing.name}: ${ing.reason}`);
                });
            } else {
                console.log('   🎉 All ingredients processed successfully');
            }
            
            console.log('   📝 Processing notes:', result.data?.processingNotes);
        } else {
            console.log('❌ Payment failed:', result?.message);
        }
        
    } catch (error) {
        console.error('💥 Error during payment processing:', error.message);
        console.error('This is the same error the user would see in the UI');
    }
}

// Run the test
testUIOrderFlow()
    .then(() => {
        console.log('\n🎉 UI flow test completed');
    })
    .catch((error) => {
        console.log('\n💥 UI flow test failed:', error.message);
    });
