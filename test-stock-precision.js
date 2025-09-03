/**
 * Test script to reproduce the stock quantity precision issue
 */

const API_BASE_URL = 'http://localhost:3001/api';

async function testStockQuantityPrecision() {
    console.log('🧪 Testing Stock Quantity Precision Issue\n');
    
    try {
        // Step 1: Get current stock items
        console.log('1️⃣ Fetching current stock items...');
        const stockResponse = await fetch(`${API_BASE_URL}/stock`);
        const stockData = await stockResponse.json();
        
        if (!stockData.success || !stockData.data || stockData.data.length === 0) {
            console.log('❌ No stock items found');
            return;
        }
        
        // Find a stock item to update (prefer one with decimal quantity)
        const stockItem = stockData.data[0];
        console.log('✅ Using stock item:', stockItem.name);
        console.log('   Current quantity:', stockItem.quantity, stockItem.unit);
        console.log('   Original type:', typeof stockItem.quantity);
        
        // Step 2: Update the stock item with a clean number like 500
        const newQuantity = 500;
        console.log(`\n2️⃣ Updating ${stockItem.name} to ${newQuantity}${stockItem.unit}...`);
        
        const updateData = {
            name: stockItem.name,
            category: stockItem.category,
            quantity: newQuantity,
            unit: stockItem.unit,
            price: stockItem.price,
            minimumQuantity: stockItem.minimumQuantity
        };
        
        if (stockItem.supplier) updateData.supplier = stockItem.supplier;
        if (stockItem.description) updateData.description = stockItem.description;
        if (stockItem.expiryDate) updateData.expiryDate = stockItem.expiryDate;
        
        console.log('Update data being sent:');
        console.log('   quantity:', updateData.quantity, '(type:', typeof updateData.quantity, ')');
        
        const updateResponse = await fetch(`${API_BASE_URL}/stock/${stockItem._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error('❌ Update failed:', errorText);
            return;
        }
        
        const updateResult = await updateResponse.json();
        console.log('✅ Update response received');
        
        if (updateResult.success) {
            const updatedQuantity = updateResult.data.quantity;
            console.log('📊 Results:');
            console.log('   Expected quantity:', newQuantity);
            console.log('   Actual quantity:', updatedQuantity);
            console.log('   Difference:', Math.abs(newQuantity - updatedQuantity));
            console.log('   Precision issue?', newQuantity !== updatedQuantity ? '❌ YES' : '✅ NO');
            
            if (newQuantity !== updatedQuantity) {
                console.log('\n🔍 Investigating the precision issue:');
                console.log('   Expected (number):', newQuantity);
                console.log('   Actual (number):', updatedQuantity);
                console.log('   Expected (string):', newQuantity.toString());
                console.log('   Actual (string):', updatedQuantity.toString());
                console.log('   Actual (fixed 2):', updatedQuantity.toFixed(2));
                console.log('   Actual (fixed 0):', updatedQuantity.toFixed(0));
                console.log('   Is float?:', updatedQuantity % 1 !== 0);
            }
        } else {
            console.error('❌ Update failed:', updateResult.message);
        }
        
        // Step 3: Check if there are any recent stock operations that might have affected this item
        console.log('\n3️⃣ Checking for recent stock operations...');
        
        // Try to get stock audit logs if available
        try {
            const auditResponse = await fetch(`${API_BASE_URL}/stock/${stockItem._id}/audit`);
            if (auditResponse.ok) {
                const auditData = await auditResponse.json();
                if (auditData.success && auditData.data && auditData.data.length > 0) {
                    console.log('📝 Recent audit logs:');
                    auditData.data.slice(0, 3).forEach((log, index) => {
                        console.log(`   ${index + 1}. ${log.action} at ${new Date(log.timestamp).toLocaleString()}`);
                        if (log.quantityChange) {
                            console.log(`      Quantity change: ${log.quantityChange}`);
                        }
                    });
                } else {
                    console.log('   No audit logs available');
                }
            } else {
                console.log('   Audit endpoint not available');
            }
        } catch (auditError) {
            console.log('   Could not fetch audit logs');
        }
        
    } catch (error) {
        console.error('💥 Error during test:', error.message);
    }
}

// Run the test
testStockQuantityPrecision()
    .then(() => {
        console.log('\n🏁 Test completed');
    })
    .catch((error) => {
        console.log('\n💥 Test failed:', error.message);
    });
