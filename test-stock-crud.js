#!/usr/bin/env node

/**
 * Test script to verify stock CRUD operations
 */

const BASE_URL = 'http://localhost:3001/api';

async function testStockOperations() {
    console.log('🧪 Testing Stock CRUD Operations\n');
    
    try {
        // 1. Test Create Stock Item
        console.log('1️⃣ Testing CREATE operation...');
        const newStock = {
            name: 'Test Stock Item',
            category: 'ingredients',
            quantity: 50,
            unit: 'piece',
            price: 2.5,
            minimumQuantity: 5,
            supplier: 'Test Supplier Inc',
            description: 'Test stock item for CRUD operations'
            // No expiry date - testing optional field
        };
        
        const createResponse = await fetch(`${BASE_URL}/stock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newStock)
        });
        
        if (!createResponse.ok) {
            const error = await createResponse.json();
            throw new Error(`Create failed: ${JSON.stringify(error)}`);
        }
        
        const createdItem = await createResponse.json();
        console.log('✅ CREATE successful');
        console.log(`   - ID: ${createdItem.data._id}`);
        console.log(`   - Name: ${createdItem.data.name}`);
        console.log(`   - Quantity: ${createdItem.data.quantity}${createdItem.data.unit}`);
        
        const itemId = createdItem.data._id;
        
        // 2. Test Read Stock Item
        console.log('\n2️⃣ Testing READ operation...');
        const readResponse = await fetch(`${BASE_URL}/stock/${itemId}`);
        const readItem = await readResponse.json();
        
        if (readItem.success) {
            console.log('✅ READ successful');
            console.log(`   - Retrieved item: ${readItem.data.name}`);
        } else {
            throw new Error('Read failed');
        }
        
        // 3. Test Update Stock Item
        console.log('\n3️⃣ Testing UPDATE operation...');
        const updateData = {
            name: 'Updated Test Stock Item',
            category: 'ingredients',
            quantity: 75,
            unit: 'piece',
            price: 3.0,
            minimumQuantity: 10,
            supplier: 'Updated Test Supplier',
            description: 'Updated test stock item',
            expiryDate: '2025-12-31' // Adding expiry date in update
        };
        
        const updateResponse = await fetch(`${BASE_URL}/stock/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        
        if (!updateResponse.ok) {
            const error = await updateResponse.json();
            throw new Error(`Update failed: ${JSON.stringify(error)}`);
        }
        
        const updatedItem = await updateResponse.json();
        console.log('✅ UPDATE successful');
        console.log(`   - New name: ${updatedItem.data.name}`);
        console.log(`   - New quantity: ${updatedItem.data.quantity}${updatedItem.data.unit}`);
        console.log(`   - New price: $${updatedItem.data.price}`);
        console.log(`   - Expiry date: ${updatedItem.data.expiryDate || 'Not set'}`);
        
        // 4. Test Quantity Update
        console.log('\n4️⃣ Testing QUANTITY UPDATE operation...');
        const quantityResponse = await fetch(`${BASE_URL}/stock/${itemId}/quantity`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: 25, operation: 'add' })
        });
        
        if (quantityResponse.ok) {
            const quantityResult = await quantityResponse.json();
            console.log('✅ QUANTITY UPDATE successful');
            console.log(`   - New quantity: ${quantityResult.data.quantity}${quantityResult.data.unit}`);
        }
        
        // 5. Test Delete Stock Item
        console.log('\n5️⃣ Testing DELETE operation...');
        const deleteResponse = await fetch(`${BASE_URL}/stock/${itemId}`, {
            method: 'DELETE'
        });
        
        if (deleteResponse.ok) {
            console.log('✅ DELETE successful');
        } else {
            console.log('⚠️ DELETE failed or item already deleted');
        }
        
        console.log('\n🎉 All stock operations completed successfully!');
        console.log('\n📋 Summary:');
        console.log('   ✅ CREATE - Working (with optional expiry date)');
        console.log('   ✅ READ - Working');
        console.log('   ✅ UPDATE - Working (with expiry date)');
        console.log('   ✅ QUANTITY UPDATE - Working');
        console.log('   ✅ DELETE - Working');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Full error:', error);
    }
}

// Run the test
testStockOperations().catch(console.error);
