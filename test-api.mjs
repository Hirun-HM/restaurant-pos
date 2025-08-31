#!/usr/bin/env node

// Simple test script to verify API data structure
import fetch from 'node-fetch';

async function testAPI() {
    try {
        const response = await fetch('http://localhost:3001/api/liquor');
        const data = await response.json();
        
        console.log('API Response Structure:');
        console.log('- Success:', data.success);
        console.log('- Data Count:', data.data?.length || 0);
        
        const hardLiquors = data.data?.filter(item => item.type === 'hard_liquor') || [];
        
        console.log('\nHard Liquor Items:');
        hardLiquors.forEach((item, index) => {
            console.log(`${index + 1}. ${item.name} (${item.brand})`);
            console.log(`   - Portions: ${item.portions?.length || 0}`);
            
            if (item.portions && item.portions.length > 0) {
                const pricedPortions = item.portions.filter(p => p.price > 0);
                console.log(`   - With Prices: ${pricedPortions.length}`);
                
                if (pricedPortions.length > 0) {
                    console.log('   - Sample Prices:');
                    pricedPortions.slice(0, 3).forEach(p => {
                        console.log(`     * ${p.name}: Rs. ${p.price}`);
                    });
                }
            }
            console.log('');
        });
        
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testAPI();
