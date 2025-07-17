import express from 'express';
import { createPaymentLink, verifyPayment, webhookHandler, getPaymentStatus, validateCreatePayment, getAllPayments, createCustomPaymentLink } from '../controllers/paymentController.js';

const router = express.Router();

// Route to create a payment link with validation
router.post('/create', validateCreatePayment, createPaymentLink);

// Route to create a payment link with a custom price
router.post('/create-link', createCustomPaymentLink);

// Route to verify a payment (with paymentId param)
router.post('/:id/verify', verifyPayment);

// Route to handle webhook notifications
router.post('/webhook', webhookHandler);

// Route to get payment status by ID
router.get('/:id', getPaymentStatus);

// List all payments
router.get('/', getAllPayments);

export default router;