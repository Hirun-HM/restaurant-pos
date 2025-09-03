/**
 * Test script to verify that the floating-point precision fix is working
 */

const API_BASE_URL = 'http://localhost:3001/api';

async function testPrecisionFix() {
    console.log('🧪 Testing Floating-Point Precision Fix\n');
    
    try {
        // Step 1: Create a test item with a precise quantity
        console.log('1️⃣ Creating test stock item...');
        const testItem = {
            name: 'Precision Test Item',
            category: 'ingredients',
            quantity: 500, // Start with a nice round number
            unit: 'g',
            price: 1.50,
            minimumQuantity: 10,
            supplier: 'Test Supplier'
        };
        
        const createResponse = await fetch(`${API_BASE_URL}/stock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testItem)
        });
        
        if (!createResponse.ok) {
            console.error('❌ Failed to create test item');
            return;
        }
        
        const createResult = await createResponse.json();
        const itemId = createResult.data._id;
        console.log('✅ Created test item with ID:', itemId);
        console.log('   Initial quantity:', createResult.data.quantity);
        
        // Step 2: Simulate stock consumption that would cause precision issues
        console.log('\n2️⃣ Simulating order processing that causes precision issues...');
        
        // Create an order with ingredients that require unit conversion
        const orderData = {
            tableId: "precision-test",
            items: [
                {
                    id: "test-food-001",
                    name: "Test Food Item",
                    price: 100,
                    quantity: 1,
                    category: "Food",
                    type: "food",
                    ingredients: [
                        {
                            name: "Precision Test Item",
                            quantity: 0.05, // This might cause precision issues when converted
                            unit: "kg", // Will be converted to grams
                            cost: 1
                        }
                    ]
                }
            ],
            total: 100,
            serviceCharge: false,
            paymentMethod: "cash"
        };
        
        console.log('   Processing order with 0.05kg (should be exactly 50g)...');
        
        const orderResponse = await fetch(`${API_BASE_URL}/orders/process-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        
        if (!orderResponse.ok) {
            const errorText = await orderResponse.text();
            console.error('❌ Order processing failed:', errorText);
        } else {
            const orderResult = await orderResponse.json();
            console.log('✅ Order processed successfully');
            console.log('   Stock consumptions:', orderResult.data?.stockConsumptions);
        }
        
        // Step 3: Check the remaining quantity
        console.log('\n3️⃣ Checking remaining stock quantity...');
        
        const stockResponse = await fetch(`${API_BASE_URL}/stock/${itemId}`);
        if (!stockResponse.ok) {
            console.error('❌ Failed to fetch updated stock');
        } else {
            const stockResult = await stockResponse.json();
            const remainingQuantity = stockResult.data.quantity;
            
            console.log('📊 Quantity analysis:');
            console.log('   Original quantity:', 500);
            console.log('   Consumed quantity:', '50g (0.05kg converted)');
            console.log('   Expected remaining:', 450);
            console.log('   Actual remaining:', remainingQuantity);
            console.log('   Is exact match?', remainingQuantity === 450 ? '✅ YES' : '❌ NO');
            console.log('   Difference:', Math.abs(450 - remainingQuantity));
            
            if (remainingQuantity === 450) {
                console.log('🎉 SUCCESS: No floating-point precision issues!');
            } else {
                console.log('⚠️ Still has precision issues:', remainingQuantity);
            }
        }
        
        // Step 4: Test direct update with decimal values
        console.log('\n4️⃣ Testing direct update with decimal value...');
        
        const updateData = {
            name: testItem.name,
            category: testItem.category,
            quantity: 123.45, // Decimal value
            unit: testItem.unit,
            price: testItem.price,
            minimumQuantity: testItem.minimumQuantity,
            supplier: testItem.supplier
        };
        
        const updateResponse = await fetch(`${API_BASE_URL}/stock/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        
        if (!updateResponse.ok) {
            console.error('❌ Update failed');
        } else {
            const updateResult = await updateResponse.json();
            const updatedQuantity = updateResult.data.quantity;
            
            console.log('📊 Update results:');
            console.log('   Sent quantity:', 123.45);
            console.log('   Received quantity:', updatedQuantity);
            console.log('   Is exact match?', updatedQuantity === 123.45 ? '✅ YES' : '❌ NO');
            
            if (updatedQuantity === 123.45) {
                console.log('🎉 SUCCESS: Direct updates maintain precision!');
            } else {
                console.log('⚠️ Direct update precision issue:', updatedQuantity);
            }
        }
        
        // Step 5: Clean up - delete the test item
        console.log('\n5️⃣ Cleaning up test item...');
        
        const deleteResponse = await fetch(`${API_BASE_URL}/stock/${itemId}`, {
            method: 'DELETE'
        });
        
        if (deleteResponse.ok) {
            console.log('✅ Test item cleaned up successfully');
        } else {
            console.log('⚠️ Could not delete test item (you may need to delete manually)');
        }
        
    } catch (error) {
        console.error('💥 Test failed:', error.message);
    }
}

// Run the test
testPrecisionFix()
    .then(() => {
        console.log('\n🏁 Precision fix test completed');
    })
    .catch((error) => {
        console.log('\n💥 Test failed:', error.message);
    });
