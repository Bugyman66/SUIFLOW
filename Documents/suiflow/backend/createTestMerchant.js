import mongoose from 'mongoose';
import Merchant from './models/Merchant.js';
import dotenv from 'dotenv';
dotenv.config();

async function createTestMerchant() {
  await mongoose.connect(process.env.MONGO_URI);
  const merchant = new Merchant({
    email: 'testmerchant@example.com',
    password: 'testpassword', // In production, hash passwords!
    businessName: 'Test Merchant',
    walletAddress: '0xTestWalletAddress',
    webhookUrl: 'https://webhook.site/test',
    apiKey: 'test-api-key-123'
  });
  await merchant.save();
  console.log('Test merchant created:', merchant);
  await mongoose.disconnect();
}

createTestMerchant();
