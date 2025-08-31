import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Liquor from '../models/Liquor.js';

// Load environment variables
dotenv.config();

const standardizeAllLiquorPortions = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB successfully!');

        // Get all hard liquor items (not beer)
        const hardLiquorItems = await Liquor.find({ 
            type: { $nin: ['beer', 'wine'] },
            isActive: true 
        });

        console.log(`Found ${hardLiquorItems.length} hard liquor items to standardize`);

        for (const item of hardLiquorItems) {
            console.log(`\nStandardizing portions for: ${item.name} (${item.bottleVolume}ml)`);
            
            // Generate standard portions for this bottle volume
            const standardPortions = Liquor.generateStandardPortions(item.bottleVolume);
            
            // Preserve existing prices where possible
            const existingPortions = item.portions || [];
            const updatedPortions = standardPortions.map(standardPortion => {
                // Try to find existing portion with same name to preserve price
                const existingPortion = existingPortions.find(ep => 
                    ep.name === standardPortion.name || 
                    (ep.name === '100ml Double' && standardPortion.name === '100ml Shot') ||
                    (ep.name === '100ml Shot' && standardPortion.name === '100ml Shot') ||
                    (ep.name.includes('Single Shot') && standardPortion.name === '25ml Shot') ||
                    (ep.name.includes('Double Shot') && standardPortion.name === '50ml Shot')
                );

                return {
                    name: standardPortion.name,
                    volume: standardPortion.volume,
                    price: existingPortion ? existingPortion.price : 0
                };
            });

            // Update the liquor item with standardized portions
            await Liquor.findByIdAndUpdate(item._id, {
                $set: { portions: updatedPortions }
            });

            console.log(`✅ Standardized ${updatedPortions.length} portions for ${item.name}`);
            updatedPortions.forEach(portion => {
                console.log(`   - ${portion.name}: ${portion.volume}ml (Rs. ${portion.price})`);
            });
        }

        console.log('\n🎉 All liquor portions have been standardized successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error standardizing liquor portions:', error);
        process.exit(1);
    }
};

// Run the standardization
standardizeAllLiquorPortions();
