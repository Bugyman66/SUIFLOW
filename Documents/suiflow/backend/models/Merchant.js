import mongoose from 'mongoose';

const merchantSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  businessName: { type: String, required: true },
  walletAddress: { type: String, required: true },
  webhookUrl: { type: String },
  apiKey: { type: String, required: true, unique: true },
  isEmailVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Merchant', merchantSchema);
