import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Stock from '../models/Stock.js';

// Load environment variables
dotenv.config();

const sampleStockData = [
  // Rice and Grains
  {
    name: 'Basmati Rice',
    category: 'ingredients',
    quantity: 50,
    unit: 'kg',
    price: 2.50,
    minimumQuantity: 20,
    supplier: 'Global Grains Ltd.',
    description: 'Premium basmati rice for fried rice and curry dishes'
  },
  {
    name: 'White Rice',
    category: 'ingredients',
    quantity: 100,
    unit: 'kg',
    price: 1.80,
    minimumQuantity: 30,
    supplier: 'Local Rice Suppliers',
    description: 'Standard white rice for daily use'
  },

  // Meats
  {
    name: 'Chicken Breast',
    category: 'ingredients',
    quantity: 25,
    unit: 'kg',
    price: 8.99,
    minimumQuantity: 10,
    supplier: 'Fresh Meat Co.',
    description: 'Fresh boneless chicken breast'
  },
  {
    name: 'Ground Beef',
    category: 'ingredients',
    quantity: 15,
    unit: 'kg',
    price: 12.99,
    minimumQuantity: 5,
    supplier: 'Fresh Meat Co.',
    description: 'Fresh ground beef for burgers and other dishes'
  },

  // Vegetables
  {
    name: 'Carrots',
    category: 'ingredients',
    quantity: 20,
    unit: 'kg',
    price: 1.99,
    minimumQuantity: 8,
    supplier: 'Fresh Veggies Inc.',
    description: 'Fresh carrots for various dishes'
  },
  {
    name: 'Green Peas',
    category: 'ingredients',
    quantity: 15,
    unit: 'kg',
    price: 2.99,
    minimumQuantity: 5,
    supplier: 'Fresh Veggies Inc.',
    description: 'Frozen green peas'
  },
  {
    name: 'Spring Onions',
    category: 'ingredients',
    quantity: 5,
    unit: 'kg',
    price: 1.50,
    minimumQuantity: 2,
    supplier: 'Fresh Veggies Inc.',
    description: 'Fresh spring onions for garnishing'
  },

  // Sauces and Oils
  {
    name: 'Soy Sauce',
    category: 'ingredients',
    quantity: 20,
    unit: 'l',
    price: 4.99,
    minimumQuantity: 5,
    supplier: 'Asian Foods Ltd.',
    description: 'Premium soy sauce for Asian dishes'
  },
  {
    name: 'Vegetable Oil',
    category: 'ingredients',
    quantity: 50,
    unit: 'l',
    price: 3.99,
    minimumQuantity: 15,
    supplier: 'Restaurant Supplies Inc.',
    description: 'Cooking oil for general use'
  },
  {
    name: 'Sesame Oil',
    category: 'ingredients',
    quantity: 5,
    unit: 'l',
    price: 8.99,
    minimumQuantity: 2,
    supplier: 'Asian Foods Ltd.',
    description: 'Pure sesame oil for Asian cuisine'
  },

  // Beverages
  {
    name: 'Coca Cola',
    category: 'drinks',
    quantity: 100,
    unit: 'bottle',
    price: 1.50,
    minimumQuantity: 40,
    supplier: 'Beverage Distributor',
    description: '500ml Coca Cola bottles'
  },
  {
    name: 'Sprite',
    category: 'drinks',
    quantity: 80,
    unit: 'bottle',
    price: 1.50,
    minimumQuantity: 30,
    supplier: 'Beverage Distributor',
    description: '500ml Sprite bottles'
  },
  {
    name: 'Orange Juice',
    category: 'drinks',
    quantity: 40,
    unit: 'bottle',
    price: 2.99,
    minimumQuantity: 15,
    supplier: 'Fruit Juice Co.',
    description: 'Fresh orange juice 500ml'
  },

  // Supplies
  {
    name: 'Paper Napkins',
    category: 'supplies',
    quantity: 100,
    unit: 'pack',
    price: 2.50,
    minimumQuantity: 30,
    supplier: 'Restaurant Supplies Inc.',
    description: 'White paper napkins for dining'
  },
  {
    name: 'Takeout Containers',
    category: 'supplies',
    quantity: 200,
    unit: 'piece',
    price: 0.25,
    minimumQuantity: 50,
    supplier: 'Restaurant Supplies Inc.',
    description: 'Medium-sized takeout containers'
  },
  {
    name: 'Disposable Chopsticks',
    category: 'supplies',
    quantity: 500,
    unit: 'pair',
    price: 0.10,
    minimumQuantity: 100,
    supplier: 'Restaurant Supplies Inc.',
    description: 'Disposable wooden chopsticks'
  },

  // Spices and Seasonings
  {
    name: 'Black Pepper',
    category: 'ingredients',
    quantity: 5,
    unit: 'kg',
    price: 15.99,
    minimumQuantity: 1,
    supplier: 'Spice Traders',
    description: 'Ground black pepper'
  },
  {
    name: 'Salt',
    category: 'ingredients',
    quantity: 10,
    unit: 'kg',
    price: 1.99,
    minimumQuantity: 3,
    supplier: 'Restaurant Supplies Inc.',
    description: 'Regular table salt'
  },
  {
    name: 'MSG',
    category: 'ingredients',
    quantity: 2,
    unit: 'kg',
    price: 5.99,
    minimumQuantity: 0.5,
    supplier: 'Asian Foods Ltd.',
    description: 'Flavor enhancer for Asian cuisine'
  }
];

const seedStock = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Clear existing stock data
    await Stock.deleteMany({});
    console.log('Cleared existing stock data');
    
    // Insert sample data
    const insertedStock = await Stock.insertMany(sampleStockData);
    console.log(`Successfully seeded ${insertedStock.length} stock items`);
    
    // Display summary
    const categories = await Stock.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$quantity', '$price'] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('\nStock Summary by Category:');
    categories.forEach(cat => {
      console.log(`${cat._id}: ${cat.count} items, Total Value: LKR ${cat.totalValue.toFixed(2)}`);
    });
    
    const totalValue = categories.reduce((sum, cat) => sum + cat.totalValue, 0);
    console.log(`\nTotal Inventory Value: LKR ${totalValue.toFixed(2)}`);
    
  } catch (error) {
    console.error('Error seeding stock data:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

// Run the seed function
seedStock();
