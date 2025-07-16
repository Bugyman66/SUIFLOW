import mongoose from 'mongoose';
import Merchant from './models/Merchant.js';
import dotenv from 'dotenv';
dotenv.config();

async function getTestMerchantId() {
  await mongoose.connect(process.env.MONGO_URI);
  const merchant = await Merchant.findOne({ email: 'testmerchant@example.com' });
  if (merchant) {
    console.log('Test merchant ID:', merchant._id.toString());
  } else {
    console.log('Test merchant not found.');
  }
  await mongoose.disconnect();
}

getTestMerchantId();
