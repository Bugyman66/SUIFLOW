import express from 'express';
import { createPaymentLink, verifyPayment, webhookHandler, getPaymentStatus, validateCreatePayment } from '../controllers/paymentController.js';

const router = express.Router();

// Route to create a payment link with validation
router.post('/create', validateCreatePayment, createPaymentLink);

// Route to verify a payment (with paymentId param)
router.post('/:id/verify', verifyPayment);

// Route to handle webhook notifications
router.post('/webhook', webhookHandler);

// Route to get payment status by ID
router.get('/:id', getPaymentStatus);

export default router;