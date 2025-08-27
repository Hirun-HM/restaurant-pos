import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Stock from '../models/Stock.js';

// Load environment variables
dotenv.config();

const sampleStockData = [
  {
    name: 'Chicken Breast',
    category: 'ingredients',
    quantity: 15,
    unit: 'kg',
    price: 8.99,
    minimumQuantity: 5,
    supplier: 'Fresh Meat Co.',
    description: 'Fresh boneless chicken breast'
  },
  {
    name: 'Coca Cola',
    category: 'drinks',
    quantity: 24,
    unit: 'bottle',
    price: 1.50,
    minimumQuantity: 10,
    supplier: 'Beverage Distributor',
    description: '500ml Coca Cola bottles'
  },
  {
    name: 'Pizza Dough',
    category: 'ingredients',
    quantity: 5,
    unit: 'kg',
    price: 3.50,
    minimumQuantity: 3,
    supplier: 'Bakery Supplies',
    description: 'Pre-made pizza dough'
  },
  {
    name: 'Tomato Sauce',
    category: 'ingredients',
    quantity: 8,
    unit: 'l',
    price: 4.25,
    minimumQuantity: 2,
    supplier: 'Italian Foods Ltd.',
    description: 'Premium tomato sauce for pizza'
  },
  {
    name: 'Mozzarella Cheese',
    category: 'ingredients',
    quantity: 3,
    unit: 'kg',
    price: 12.99,
    minimumQuantity: 2,
    supplier: 'Dairy Fresh',
    description: 'High-quality mozzarella cheese'
  },
  {
    name: 'Orange Juice',
    category: 'drinks',
    quantity: 0, // This will be marked as low stock
    unit: 'bottle',
    price: 2.99,
    minimumQuantity: 5,
    supplier: 'Fruit Juice Co.',
    description: 'Fresh orange juice 500ml'
  },
  {
    name: 'Paper Napkins',
    category: 'supplies',
    quantity: 50,
    unit: 'pack',
    price: 2.50,
    minimumQuantity: 20,
    supplier: 'Restaurant Supplies Inc.',
    description: 'White paper napkins for dining'
  },
  {
    name: 'Olive Oil',
    category: 'ingredients',
    quantity: 12,
    unit: 'l',
    price: 15.99,
    minimumQuantity: 3,
    supplier: 'Mediterranean Imports',
    description: 'Extra virgin olive oil'
  },
  {
    name: 'Beef Patties',
    category: 'food',
    quantity: 20,
    unit: 'piece',
    price: 3.99,
    minimumQuantity: 10,
    supplier: 'Fresh Meat Co.',
    description: 'Pre-formed beef burger patties'
  },
  {
    name: 'Burger Buns',
    category: 'food',
    quantity: 30,
    unit: 'piece',
    price: 0.75,
    minimumQuantity: 15,
    supplier: 'Local Bakery',
    description: 'Fresh sesame burger buns'
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
