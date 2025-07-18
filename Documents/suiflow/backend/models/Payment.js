import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  merchant: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant' },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'SUI' },
  description: { type: String },
  reference: { type: String },
  status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  paymentLink: { type: String },
  customerWallet: { type: String },
  txnHash: { type: String },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  merchantAddress: { type: String },
  createdAt: { type: Date, default: Date.now },
  paidAt: { type: Date }
});

export default mongoose.model('Payment', paymentSchema);
