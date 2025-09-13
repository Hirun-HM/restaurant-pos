#!/usr/bin/env node

/**
 * Test specific ice cube and sandy bottle rendering
 */

const API_BASE = 'http://localhost:3001/api';

async function testSpecificRendering() {
    console.log('🔍 Testing Ice Cube and Sandy Bottle Rendering\n');
    
    try {
        // Get the liquor data
        const response = await fetch(`${API_BASE}/liquor`);
        const result = await response.json();
        
        if (!result.success) {
            console.log('❌ Failed to fetch liquor data');
            return;
        }
        
        // Find ice cubes and sandy bottles
        const iceCube = result.data.find(item => item.type === 'ice_cubes');
        const sandyBottle = result.data.find(item => item.type === 'sandy_bottles');
        
        console.log('1️⃣ Raw data from API:');
        
        if (iceCube) {
            console.log('\nIce Cube raw data:');
            console.log(JSON.stringify(iceCube, null, 2));
            
            // Check for required fields
            const requiredFields = ['name', 'type', 'bottlesInStock', 'pricePerBottle', 'minimumBottles'];
            const missingFields = requiredFields.filter(field => 
                iceCube[field] === undefined || iceCube[field] === null
            );
            
            if (missingFields.length > 0) {
                console.log(`❌ Ice cube missing fields: ${missingFields.join(', ')}`);
            } else {
                console.log('✅ Ice cube has all required fields');
            }
        } else {
            console.log('❌ No ice cube found');
        }
        
        if (sandyBottle) {
            console.log('\nSandy Bottle raw data:');
            console.log(JSON.stringify(sandyBottle, null, 2));
            
            // Check for required fields
            const requiredFields = ['name', 'type', 'bottlesInStock', 'pricePerBottle', 'minimumBottles'];
            const missingFields = requiredFields.filter(field => 
                sandyBottle[field] === undefined || sandyBottle[field] === null
            );
            
            if (missingFields.length > 0) {
                console.log(`❌ Sandy bottle missing fields: ${missingFields.join(', ')}`);
            } else {
                console.log('✅ Sandy bottle has all required fields');
            }
        } else {
            console.log('❌ No sandy bottle found');
        }
        
        // 2. Test menu item transformation
        console.log('\n2️⃣ Testing menu item transformation:');
        
        const testItems = [iceCube, sandyBottle].filter(Boolean);
        
        testItems.forEach(item => {
            // Simulate the menu transformation
            let category;
            if (item.type === 'ice_cubes') {
                category = 'Ice Cubes';
            } else if (item.type === 'sandy_bottles') {
                category = 'Sandy Bottles';
            }
            
            const menuItem = {
                id: `liquor_${item._id}`,
                name: item.name,
                brand: item.brand,
                category: category,
                type: item.type,
                description: item.type === 'ice_cubes'
                    ? `${item.brand || ''} ${item.name} - Ice Cube Bowls`
                    : `${item.brand || ''} ${item.name} - Sandy Bottles`,
                price: item.pricePerBottle,
                pricePerBottle: item.pricePerBottle,
                bottleVolume: item.bottleVolume,
                bottlesInStock: item.bottlesInStock,
                minimumBottles: item.minimumBottles,
                portions: item.portions || [],
                alcoholPercentage: item.alcoholPercentage,
                totalVolumeRemaining: item.totalVolumeRemaining,
                totalSoldVolume: item.totalSoldVolume,
                wastedVolume: item.wastedVolume,
                isFromAPI: true,
                _id: item._id
            };
            
            console.log(`\n${category} menu item:`);
            console.log('  Essential fields for rendering:');
            console.log(`    - id: ${menuItem.id}`);
            console.log(`    - name: ${menuItem.name}`);
            console.log(`    - brand: ${menuItem.brand || 'undefined'}`);
            console.log(`    - category: ${menuItem.category}`);
            console.log(`    - type: ${menuItem.type}`);
            console.log(`    - bottlesInStock: ${menuItem.bottlesInStock}`);
            console.log(`    - minimumBottles: ${menuItem.minimumBottles || 'undefined'}`);
            console.log(`    - pricePerBottle: ${menuItem.pricePerBottle}`);
            console.log(`    - portions: ${menuItem.portions.length} items`);
            
            // Check potential issues
            if (!menuItem.minimumBottles) {
                console.log('    ⚠️  minimumBottles is undefined - could cause stock status calculation issues');
            }
            
            if (!menuItem.brand) {
                console.log('    ⚠️  brand is undefined - should be handled gracefully');
            }
        });
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testSpecificRendering();
