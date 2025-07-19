import mongoose from 'mongoose';
import Product from './models/Product.js';
import dotenv from 'dotenv';

dotenv.config();

async function debugProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const products = await Product.find();
    console.log('All products in database:');
    
    products.forEach(product => {
      console.log({
        id: product._id,
        name: product.name,
        priceInSui: product.priceInSui,
        priceType: typeof product.priceInSui,
        merchantAddress: product.merchantAddress
      });
    });
    
    // Fix any products with invalid prices
    for (const product of products) {
      if (typeof product.priceInSui !== 'number' || isNaN(product.priceInSui) || product.priceInSui < 0) {
        console.log(`Found problematic product: ${product.name} with price: ${product.priceInSui}`);
        // You could fix it here if needed
        // product.priceInSui = 0.02; // Set a default price
        // await product.save();
      }
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

debugProducts();
