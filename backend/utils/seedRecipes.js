import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Recipe from '../models/Recipe.js';
import Stock from '../models/Stock.js';

// Load environment variables
dotenv.config();

const sampleRecipes = [
    {
        name: 'Chicken Fried Rice',
        ingredients: [
            {
                name: 'Rice',
                quantity: 0.25, // 250g per portion
                unit: 'kg'
            },
            {
                name: 'Chicken Breast',
                quantity: 0.15, // 150g per portion
                unit: 'kg'
            },
            {
                name: 'Carrots',
                quantity: 0.05, // 50g per portion
                unit: 'kg'
            },
            {
                name: 'Green Peas',
                quantity: 0.03, // 30g per portion
                unit: 'kg'
            },
            {
                name: 'Soy Sauce',
                quantity: 0.015, // 15ml per portion
                unit: 'l'
            },
            {
                name: 'Vegetable Oil',
                quantity: 0.02, // 20ml per portion
                unit: 'l'
            }
        ],
        portionSize: 1, // 1 serving
        description: 'Classic chicken fried rice with mixed vegetables'
    }
];

const seedRecipes = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('Connected to MongoDB');
        
        // Clear existing recipes
        await Recipe.deleteMany({});
        console.log('Cleared existing recipes');

        // Get or create stock items for ingredients
        const recipes = [];
        
        for (const recipeData of sampleRecipes) {
            const recipeIngredients = [];
            
            for (const ingredient of recipeData.ingredients) {
                // Find or create stock item
                let stockItem = await Stock.findOne({ 
                    name: { $regex: new RegExp(ingredient.name, 'i') },
                    unit: ingredient.unit
                });
                
                if (!stockItem) {
                    stockItem = await Stock.create({
                        name: ingredient.name,
                        category: 'ingredients',
                        quantity: 100, // Initial stock
                        unit: ingredient.unit,
                        price: 0, // Set appropriate price
                        minimumQuantity: 10
                    });
                }
                
                recipeIngredients.push({
                    stockItem: stockItem._id,
                    quantity: ingredient.quantity
                });
            }
            
            // Create recipe with stock references
            recipes.push({
                ...recipeData,
                ingredients: recipeIngredients,
                // Note: You'll need to set menuItemId when you have actual menu items
                menuItemId: new mongoose.Types.ObjectId() // Temporary ID
            });
        }
        
        // Insert recipes
        const insertedRecipes = await Recipe.insertMany(recipes);
        console.log(`Successfully seeded ${insertedRecipes.length} recipes`);
        
        // Display recipe details
        for (const recipe of insertedRecipes) {
            console.log(`\nRecipe: ${recipe.name}`);
            console.log('Ingredients:');
            for (const ingredient of recipe.ingredients) {
                const stockItem = await Stock.findById(ingredient.stockItem);
                console.log(`- ${stockItem.name}: ${ingredient.quantity}${stockItem.unit} per portion`);
            }
        }
        
    } catch (error) {
        console.error('Error seeding recipes:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
};

// Run the seed function
seedRecipes();
