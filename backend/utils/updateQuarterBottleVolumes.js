import mongoose from 'mongoose';
import { config } from 'dotenv';
import Liquor from '../models/Liquor.js';

config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/restaurant-pos';

async function updateQuarterBottleVolumes() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB successfully');

        // Find all hard liquor items (exclude beer and wine)
        const hardLiquorItems = await Liquor.find({
            type: { $nin: ['beer', 'wine'] },
            isActive: true
        });

        console.log(`\nFound ${hardLiquorItems.length} hard liquor items to update`);

        let updatedCount = 0;

        for (const liquorItem of hardLiquorItems) {
            console.log(`\n--- Processing: ${liquorItem.name} (${liquorItem.brand}) ---`);
            console.log(`Bottle Volume: ${liquorItem.bottleVolume}ml`);

            let needsUpdate = false;
            const updatedPortions = liquorItem.portions.map(portion => {
                if (portion.name === 'Quarter Bottle') {
                    const correctVolume = liquorItem.bottleVolume === 750 ? 180 : 250;
                    if (portion.volume !== correctVolume) {
                        console.log(`  - Updating Quarter Bottle: ${portion.volume}ml → ${correctVolume}ml`);
                        needsUpdate = true;
                        return { ...portion.toObject(), volume: correctVolume };
                    }
                }
                return portion.toObject();
            });

            if (needsUpdate) {
                liquorItem.portions = updatedPortions;
                await liquorItem.save();
                updatedCount++;
                console.log('  ✓ Updated successfully');
            } else {
                console.log('  - No update needed');
            }
        }

        console.log(`\n🎉 Update complete! Updated ${updatedCount} liquor items.`);

        // Verify the updates
        console.log('\n--- Verification ---');
        const verificationItems = await Liquor.find({
            type: { $nin: ['beer', 'wine'] },
            isActive: true,
            'portions.name': 'Quarter Bottle'
        });

        for (const item of verificationItems) {
            const quarterPortion = item.portions.find(p => p.name === 'Quarter Bottle');
            const expectedVolume = item.bottleVolume === 750 ? 180 : 250;
            const status = quarterPortion.volume === expectedVolume ? '✓' : '✗';
            console.log(`${status} ${item.name} (${item.bottleVolume}ml): Quarter = ${quarterPortion.volume}ml`);
        }

    } catch (error) {
        console.error('Error updating quarter bottle volumes:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed.');
        process.exit(0);
    }
}

// Run the update
updateQuarterBottleVolumes();
