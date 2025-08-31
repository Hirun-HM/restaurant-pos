import mongoose from 'mongoose';
import { config } from 'dotenv';
import Liquor from '../models/Liquor.js';

config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/restaurant-pos';

async function updateHardLiquorTypes() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB successfully');

        // Define old hard liquor types that need to be updated
        const oldHardLiquorTypes = ['whiskey', 'vodka', 'rum', 'gin', 'brandy', 'tequila'];

        // Find all items with old hard liquor types
        const itemsToUpdate = await Liquor.find({
            type: { $in: oldHardLiquorTypes },
            isActive: true
        });

        console.log(`\nFound ${itemsToUpdate.length} items with old hard liquor types to update`);

        let updatedCount = 0;

        for (const item of itemsToUpdate) {
            console.log(`\n--- Updating: ${item.name} (${item.brand}) ---`);
            console.log(`Current type: ${item.type} → hard_liquor`);

            // Update the type to 'hard_liquor'
            item.type = 'hard_liquor';
            await item.save();
            
            updatedCount++;
            console.log('  ✓ Updated successfully');
        }

        console.log(`\n🎉 Update complete! Updated ${updatedCount} items to 'hard_liquor' type.`);

        // Verify the updates
        console.log('\n--- Verification ---');
        const allItems = await Liquor.find({ isActive: true });
        const typeStats = {};
        
        for (const item of allItems) {
            typeStats[item.type] = (typeStats[item.type] || 0) + 1;
        }

        console.log('\nCurrent type distribution:');
        for (const [type, count] of Object.entries(typeStats)) {
            console.log(`  ${type}: ${count} items`);
        }

        // Check that no old types remain
        const oldTypesRemaining = allItems.filter(item => oldHardLiquorTypes.includes(item.type));
        if (oldTypesRemaining.length === 0) {
            console.log('\n✅ Success! No old hard liquor types remain.');
        } else {
            console.log(`\n⚠️  Warning: ${oldTypesRemaining.length} items still have old types.`);
        }

    } catch (error) {
        console.error('Error updating hard liquor types:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed.');
        process.exit(0);
    }
}

// Run the update
updateHardLiquorTypes();
