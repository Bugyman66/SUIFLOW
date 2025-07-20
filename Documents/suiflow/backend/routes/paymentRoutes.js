import express from 'express';
import { createPaymentLink, verifyPayment, webhookHandler, getPaymentStatus, validateCreatePayment, getAllPayments, createCustomPaymentLink, createPayment } from '../controllers/paymentController.js';
import { authenticateToken } from '../middleware/auth.js';
import { SuiClient } from '@mysten/sui.js/client';

const router = express.Router();

// Simple test route
router.get('/test', (req, res) => {
  res.json({ message: 'Payment routes are working!' });
});

// Get all payments for authenticated merchant
router.get('/merchant/payments', authenticateToken, getAllPayments);

// Database test route
router.get('/db-test', async (req, res) => {
  try {
    const Payment = (await import('../models/Payment.js')).default;
    const count = await Payment.countDocuments();
    // Get more details about the payments to debug the merchant association
    const recentPayments = await Payment.find({})
      .populate('merchant')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('_id status createdAt merchant merchantAddress');
    
    // Log the full payment details to see what's stored
    console.log('Recent payments:', JSON.stringify(recentPayments, null, 2));
    
    res.json({ 
      message: 'Database connection working',
      totalPayments: count,
      recentPayments: recentPayments
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Database test failed',
      error: error.message 
    });
  }
});

// Test SUI RPC connection - must come before parameterized routes
router.get('/rpc/test', async (req, res) => {
  try {
    console.log('Testing SUI RPC connection...');
    console.log('RPC URL:', process.env.SUI_RPC_URL);
    
    const suiClient = new SuiClient({ url: process.env.SUI_RPC_URL });
    
    // Try a simple method that should exist
    const version = await suiClient.getRpcApiVersion();
    
    res.json({ 
      success: true, 
      message: 'SUI RPC connection successful',
      version: version,
      rpcUrl: process.env.SUI_RPC_URL
    });
  } catch (error) {
    console.error('SUI RPC test error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'SUI RPC connection failed',
      error: error.message,
      rpcUrl: process.env.SUI_RPC_URL
    });
  }
});

// Test transaction verification
router.get('/verify-txn/:txnHash', async (req, res) => {
  try {
    const { txnHash } = req.params;
    console.log('Testing transaction verification for:', txnHash);
    
    const suiClient = new SuiClient({ url: process.env.SUI_RPC_URL });
    
    const txn = await suiClient.getTransactionBlock({ 
      digest: txnHash,
      options: { showBalanceChanges: true, showEffects: true }
    });
    
    res.json({ 
      success: true, 
      message: 'Transaction found',
      transaction: {
        digest: txn.digest,
        effects: txn.effects?.status,
        balanceChanges: txn.balanceChanges?.length || 0
      }
    });
  } catch (error) {
    console.error('Transaction verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Transaction verification failed',
      error: error.message
    });
  }
});

// Route to handle webhook notifications - must come before parameterized routes
router.post('/webhook', webhookHandler);

// Route to create a payment during checkout (authentication optional for direct checkout)
router.post('/create', createPayment);

// Route to create a payment link with validation
router.post('/create-link', validateCreatePayment, createPaymentLink);

// Route to create a payment link with a custom price
router.post('/create-custom-link', createCustomPaymentLink);

// List all payments (requires authentication) - must come before parameterized routes
router.get('/', authenticateToken, getAllPayments);

// Route to verify a payment (with paymentId param)
router.post('/verify/:id', verifyPayment);

// Route to get payment status by ID
router.get('/status/:id', getPaymentStatus);

export default router;