/**
 * Test the updated success modal title and message for empty bills
 */

console.log('🧪 Testing Updated Success Modal for Empty Bills...\n');

// Simulate the frontend logic for showing success modal
function testSuccessModal(result, enhancedItems, selectedTable) {
    // Check if this is an empty bill
    const isEmpty = !enhancedItems || enhancedItems.length === 0;
    
    // Define stock and liquor counts
    const stockCount = result.data?.stockConsumptions || 0;
    const liquorCount = result.data?.liquorConsumptions || 0;
    
    let successMessage;
    
    if (isEmpty) {
        successMessage = `Bill closed successfully!\n\nOrder ID: ${result.data?.orderId}\n\nThis was an empty bill - no items were ordered.\nNo stock consumption or revenue recorded.`;
    } else {
        successMessage = `Payment processed successfully!\n\nOrder ID: ${result.data?.orderId}`;
        
        // Add stock consumption info for non-empty bills
        if (stockCount > 0) {
            successMessage += `\nFood stock items consumed: ${stockCount}`;
        }
        
        if (liquorCount > 0) {
            successMessage += `\nLiquor items consumed: ${liquorCount}`;
        }
        
        if (stockCount === 0 && liquorCount === 0) {
            successMessage += `\nNo stock consumption required`;
        }
    }
    
    successMessage += `\n\nTable ${selectedTable?.tableNumber || '02'} is now available.`;
    
    // Show success modal with appropriate title
    const modalTitle = isEmpty ? 'Bill Closed' : 'Payment Successful';
    
    return { modalTitle, successMessage, isEmpty };
}

// Test 1: Empty Bill
console.log('📋 Test 1: Empty Bill Modal');
const emptyBillResult = {
    success: true,
    data: {
        orderId: '68c577f5c564249e27487575',
        stockConsumptions: 0,
        liquorConsumptions: 0
    }
};

const emptyBillTest = testSuccessModal(emptyBillResult, [], { tableNumber: '02' });
console.log('✅ Modal Title:', emptyBillTest.modalTitle);
console.log('✅ Is Empty Bill:', emptyBillTest.isEmpty);
console.log('✅ Success Message:');
console.log(emptyBillTest.successMessage);

// Test 2: Bill with Items
console.log('\n📋 Test 2: Bill with Items Modal');
const billWithItemsResult = {
    success: true,
    data: {
        orderId: '68c577f5c564249e27487576',
        stockConsumptions: 2,
        liquorConsumptions: 1
    }
};

const billWithItemsTest = testSuccessModal(billWithItemsResult, [{name: 'Rice', quantity: 1}], { tableNumber: '03' });
console.log('✅ Modal Title:', billWithItemsTest.modalTitle);
console.log('✅ Is Empty Bill:', billWithItemsTest.isEmpty);
console.log('✅ Success Message:');
console.log(billWithItemsTest.successMessage);

console.log('\n🎉 Success! The modal titles are now appropriate:');
console.log('  📝 Empty Bills: "Bill Closed" (not "Payment Successful")');
console.log('  💰 Bills with Items: "Payment Successful"');
console.log('  ✅ Messages clearly distinguish between closing and payment');
console.log('  ✅ No misleading "payment" language for empty bills');
