import Merchant from '../models/Merchant.js';
import Payment from '../models/Payment.js';
import { verifySuiPayment } from '../services/suiPaymentVerifier.js';
import { triggerWebhook } from '../utils/webhook.js';
import { body, validationResult } from 'express-validator';

const processPayment = async (req, res) => {
    try {
        const paymentData = req.body;
        const result = await paymentService.verifyPayment(paymentData);
        if (result.isValid) {
            // Logic to process the payment
            res.status(200).json({ message: 'Payment processed successfully', data: result });
        } else {
            res.status(400).json({ message: 'Invalid payment data', errors: result.errors });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error processing payment', error: error.message });
    }
};

const getPaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await Payment.findById(id);
        if (payment) {
            res.status(200).json({ message: 'Payment status retrieved', status: payment.status, payment });
        } else {
            res.status(404).json({ message: 'Payment not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving payment status', error: error.message });
    }
};

const createPaymentLink = async (req, res) => {
    try {
        const { merchantId, amount, description, reference, productId } = req.body;
        let paymentData = { description, reference };
        // If productId is provided, fetch product and use its details
        if (productId) {
            const Product = (await import('../models/Product.js')).default;
            const product = await Product.findById(productId);
            if (!product) return res.status(404).json({ message: 'Product not found' });
            paymentData.product = product._id;
            paymentData.amount = product.priceInSui;
            paymentData.merchantAddress = product.merchantAddress; // Store merchant wallet address
            paymentData.paymentLink = product.paymentLink;
        } else {
            // Find merchant
            const merchant = await Merchant.findById(merchantId);
            if (!merchant) return res.status(404).json({ message: 'Merchant not found' });
            paymentData.merchant = merchant._id;
            paymentData.amount = amount;
            paymentData.paymentLink = `https://suiflow.app/pay/${Math.random().toString(36).substr(2, 9)}`;
        }
        // Create payment record
        const payment = new Payment(paymentData);
        await payment.save();
        res.status(201).json({ paymentLink: payment.paymentLink, paymentId: payment._id });
    } catch (error) {
        res.status(500).json({ message: 'Error creating payment link', error: error.message });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const { paymentId, txnHash, customerWallet } = req.body;
        const paymentIdFromUrl = req.params.id;
        
        console.log('Verification request received:');
        console.log('- Payment ID from URL params:', paymentIdFromUrl);
        console.log('- Payment ID from body:', paymentId);
        console.log('- Transaction Hash:', txnHash);
        console.log('- Customer Wallet:', customerWallet);
        
        // Use the ID from URL params if body doesn't have it
        const idToLookup = paymentIdFromUrl || paymentId;
        console.log('- ID to lookup:', idToLookup);
        
        const payment = await Payment.findById(idToLookup).populate('merchant');
        
        if (!payment) {
            console.error(`Payment not found with ID: ${idToLookup}`);
            console.log('Available payment IDs in database:');
            const allPayments = await Payment.find({}).select('_id product merchant status createdAt');
            console.log(allPayments.map(p => ({ id: p._id, product: p.product, merchant: p.merchant, status: p.status, createdAt: p.createdAt })));
            return res.status(404).json({ message: 'Payment not found' });
        }
        
        console.log('Payment found:', {
            id: payment._id,
            product: payment.product,
            merchant: payment.merchant,
            amount: payment.amount,
            status: payment.status
        });
        
        // Get merchant address - either from populated merchant or direct field
        let merchantAddress = payment.merchantAddress;
        if (!merchantAddress && payment.merchant) {
            merchantAddress = payment.merchant.walletAddress;
        }
        
        if (!merchantAddress) {
            console.error('No merchant address found for payment:', paymentId);
            return res.status(400).json({ message: 'Payment has no merchant address' });
        }
        
        console.log(`Verifying payment ${paymentId} with txn ${txnHash}`);
        console.log(`Expected amount: ${payment.amount} SUI`);
        console.log(`Merchant address: ${merchantAddress}`);
        
        // Call Sui verification service
        const isValid = await verifySuiPayment(txnHash, payment.amount, merchantAddress);
        
        if (isValid) {
            payment.status = 'paid';
            payment.txnHash = txnHash;
            payment.customerWallet = customerWallet;
            payment.paidAt = new Date();
            await payment.save();
            
            console.log(`Payment ${paymentId} verified successfully`);
            
            // Trigger merchant webhook if merchant has webhook URL
            if (payment.merchant && payment.merchant.webhookUrl) {
                await triggerWebhook(payment.merchant.webhookUrl, {
                    event: 'payment.success',
                    amount: payment.amount,
                    txn: payment.txnHash,
                    status: payment.status,
                    reference: payment.reference,
                    paidAt: payment.paidAt,
                    createdAt: payment.createdAt
                });
            }
            
            // Redirect if product has redirectURL
            if (payment.product) {
                const Product = (await import('../models/Product.js')).default;
                const product = await Product.findById(payment.product);
                if (product && product.redirectURL) {
                    return res.redirect(`${product.redirectURL}?paymentId=${payment._id}`);
                }
            }
            
            res.status(200).json({ message: 'Payment verified', payment });
        } else {
            console.log(`Payment verification failed for payment ${paymentId}`);
            res.status(400).json({ message: 'Payment verification failed' });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ message: 'Error verifying payment', error: error.message });
    }
};

const webhookHandler = async (req, res) => {
    try {
        // Example: receive webhook event and log
        const event = req.body;
        // TODO: Add logic to process webhook event
        res.status(200).json({ message: 'Webhook received', event });
    } catch (error) {
        res.status(500).json({ message: 'Error handling webhook', error: error.message });
    }
};

const getAllPayments = async (req, res) => {
  try {
    // Get the authenticated merchant from the request (set by auth middleware)
    const merchantId = req.merchant?._id;
    
    if (!merchantId) {
      return res.status(401).json({ message: 'Merchant not authenticated' });
    }
    
    // Filter payments by merchant
    const payments = await Payment.find({ merchant: merchantId })
      .populate('product')
      .populate('merchant')
      .sort({ createdAt: -1 }); // Most recent first
    
    console.log(`Found ${payments.length} payments for merchant ${merchantId}`);
    
    res.status(200).json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Error fetching payments', error: error.message });
  }
};

// Add this new controller for custom price payment links
const createCustomPaymentLink = async (req, res) => {
    try {
        const { productId, customPrice } = req.body;
        if (!productId || !customPrice) {
            return res.status(400).json({ message: 'Product ID and custom price are required.' });
        }
        const Product = (await import('../models/Product.js')).default;
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        // Generate a unique payment link
        const paymentLink = `https://suiflow.app/pay/${Math.random().toString(36).substr(2, 9)}`;
        // Create payment record with custom price
        const payment = new Payment({
            product: product._id,
            amount: customPrice,
            merchantAddress: product.merchantAddress,
            paymentLink,
            description: product.description || '',
            reference: '',
        });
        await payment.save();
        res.status(201).json({ paymentLink, paymentId: payment._id });
    } catch (error) {
        res.status(500).json({ message: 'Error creating custom payment link', error: error.message });
    }
};

// Add this new controller for creating payments during checkout
const createPayment = async (req, res) => {
    try {
        const { productId } = req.body;
        const merchantId = req.merchant?._id;
        
        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }
        
        // Find the product
        const Product = (await import('../models/Product.js')).default;
        const product = await Product.findById(productId);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        // Always set merchant to authenticated merchant's _id, or fallback to product.merchant
        const payment = new Payment({
            product: product._id,
            merchant: merchantId || product.merchant, // <--- THIS IS THE FIX
            amount: product.priceInSui,
            merchantAddress: product.merchantAddress,
            status: 'pending',
            description: product.description || '',
            reference: '',
        });
        
        await payment.save();
        
        console.log(`Created payment ${payment._id} for product ${productId} by merchant ${merchantId || product.merchant}`);
        
        res.status(201).json({ 
            paymentId: payment._id,
            amount: payment.amount,
            status: payment.status
        });
        
    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({ message: 'Error creating payment', error: error.message });
    }
};

// Validation middleware for payment creation
export const validateCreatePayment = [
  body('productId').optional().isString(),
  body('merchantId').optional().isString(),
  body('amount').optional().isNumeric(),
  body('description').optional().isString(),
  body('reference').optional().isString(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

export { processPayment, getPaymentStatus, createPaymentLink, verifyPayment, webhookHandler, getAllPayments, createCustomPaymentLink, createPayment };