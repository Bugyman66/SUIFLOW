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
        const payment = await Payment.findById(paymentId).populate('merchant');
        if (!payment) return res.status(404).json({ message: 'Payment not found' });
        // Call Sui verification service
        const isValid = await verifySuiPayment(txnHash, payment.amount, payment.merchant.walletAddress);
        if (isValid) {
            payment.status = 'paid';
            payment.txnHash = txnHash;
            payment.customerWallet = customerWallet;
            payment.paidAt = new Date();
            await payment.save();
            // Trigger merchant webhook
            if (payment.merchant.webhookUrl) {
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
            res.status(400).json({ message: 'Payment verification failed' });
        }
    } catch (error) {
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
    const payments = await Payment.find().populate('product').populate('merchant');
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payments', error: error.message });
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

export { processPayment, getPaymentStatus, createPaymentLink, verifyPayment, webhookHandler, getAllPayments };