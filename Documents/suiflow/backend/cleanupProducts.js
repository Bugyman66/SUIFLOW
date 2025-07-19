import mongoose from 'mongoose';
import Product from './models/Product.js';
import dotenv from 'dotenv';

dotenv.config();

async function cleanupProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Find all products
    const products = await Product.find();
    console.log(`Found ${products.length} products`);
    
    for (const product of products) {
      console.log(`\nProduct: ${product.name}`);
      console.log(`Current price: ${product.priceInSui} (type: ${typeof product.priceInSui})`);
      
      // Check if price is invalid
      if (typeof product.priceInSui !== 'number' || isNaN(product.priceInSui) || product.priceInSui < 0) {
        console.log(`❌ Invalid price detected: ${product.priceInSui}`);
        
        // Delete the problematic product
        await Product.findByIdAndDelete(product._id);
        console.log(`🗑️ Deleted product with invalid price: ${product.name}`);
      } else {
        console.log(`✅ Price is valid: ${product.priceInSui} SUI`);
      }
    }
    
    // Show remaining products
    const remainingProducts = await Product.find();
    console.log(`\n📊 ${remainingProducts.length} products remaining after cleanup`);
    
    remainingProducts.forEach(product => {
      console.log(`- ${product.name}: ${product.priceInSui} SUI`);
    });
    
  } catch (error) {
    console.error('Cleanup error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

cleanupProducts();
