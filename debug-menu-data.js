#!/usr/bin/env node

/**
 * Debug script to check menu data flow
 */

const API_BASE = 'http://localhost:3001/api';

async function debugMenuData() {
    console.log('🔍 Debugging Menu Data Flow\n');
    
    try {
        // 1. Check raw liquor API data
        console.log('1️⃣ Checking raw liquor API data...');
        const liquorResponse = await fetch(`${API_BASE}/liquor`);
        const liquorResult = await liquorResponse.json();
        
        if (liquorResult.success) {
            console.log(`Total liquor items from API: ${liquorResult.data.length}`);
            
            // Check each type
            const typeGroups = {};
            liquorResult.data.forEach(item => {
                if (!typeGroups[item.type]) {
                    typeGroups[item.type] = [];
                }
                typeGroups[item.type].push(item);
            });
            
            console.log('\nLiquor items by type:');
            Object.entries(typeGroups).forEach(([type, items]) => {
                console.log(`  ${type}: ${items.length} items`);
                items.forEach(item => {
                    console.log(`    - ${item.name} (${item.brand || 'No brand'}) - Stock: ${item.bottlesInStock}`);
                });
            });
            
            // 2. Simulate menu categorization logic
            console.log('\n2️⃣ Simulating menu categorization...');
            
            const liquorMenuItems = liquorResult.data.map(item => {
                let category;
                if (item.type === 'cigarettes') {
                    category = 'Cigarettes';
                } else if (item.type === 'ice_cubes') {
                    category = 'Ice Cubes';
                } else if (item.type === 'sandy_bottles') {
                    category = 'Sandy Bottles';
                } else if (item.type === 'beer' || item.type === 'hard_liquor' || item.type === 'wine') {
                    category = 'Liquor';
                } else if (item.type === 'other') {
                    category = 'Others';
                } else {
                    category = 'Liquor';
                }
                
                return {
                    id: `liquor_${item._id}`,
                    name: item.name,
                    brand: item.brand,
                    category: category,
                    type: item.type,
                    description: item.type === 'cigarettes' 
                        ? `${item.brand} ${item.name} - Pack of ${item.cigarettesPerPack || 20}` 
                        : item.type === 'ice_cubes'
                        ? `${item.brand || ''} ${item.name} - Ice Cube Bowls`
                        : item.type === 'sandy_bottles'
                        ? `${item.brand || ''} ${item.name} - Sandy Bottles`
                        : item.type === 'hard_liquor'
                        ? `${item.brand} ${item.name} - ${item.bottleVolume}ml (${item.alcoholPercentage}% alcohol)`
                        : `${item.brand} ${item.name}${item.bottleVolume ? ` - ${item.bottleVolume}ml` : ''}`,
                    price: item.pricePerBottle,
                    bottlesInStock: item.bottlesInStock,
                    isFromAPI: true,
                    _id: item._id
                };
            });
            
            console.log('\nCategorized menu items:');
            const categoryGroups = {};
            liquorMenuItems.forEach(item => {
                if (!categoryGroups[item.category]) {
                    categoryGroups[item.category] = [];
                }
                categoryGroups[item.category].push(item);
            });
            
            Object.entries(categoryGroups).forEach(([category, items]) => {
                console.log(`\n${category} Category: ${items.length} items`);
                items.forEach(item => {
                    console.log(`  - ${item.name} (ID: ${item.id})`);
                    console.log(`    Category: ${item.category}`);
                    console.log(`    Type: ${item.type}`);
                    console.log(`    Brand: ${item.brand || 'No brand'}`);
                    console.log(`    Stock: ${item.bottlesInStock}`);
                    console.log(`    Description: ${item.description}`);
                });
            });
            
            // 3. Check for Ice Cubes and Sandy Bottles specifically
            console.log('\n3️⃣ Ice Cubes and Sandy Bottles check:');
            const iceCubes = liquorMenuItems.filter(item => item.category === 'Ice Cubes');
            const sandyBottles = liquorMenuItems.filter(item => item.category === 'Sandy Bottles');
            
            console.log(`Ice Cubes items: ${iceCubes.length}`);
            iceCubes.forEach(item => {
                console.log(`  ✅ ${item.name} - Ready for menu display`);
            });
            
            console.log(`Sandy Bottles items: ${sandyBottles.length}`);
            sandyBottles.forEach(item => {
                console.log(`  ✅ ${item.name} - Ready for menu display`);
            });
            
            if (iceCubes.length === 0) {
                console.log('  ❌ No ice cubes found in menu items');
            }
            
            if (sandyBottles.length === 0) {
                console.log('  ❌ No sandy bottles found in menu items');
            }
            
        } else {
            console.log('❌ Failed to fetch liquor data');
        }
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    }
}

debugMenuData();
