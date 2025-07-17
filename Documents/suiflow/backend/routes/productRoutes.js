import express from 'express';
import { createProduct, getProductById, getAllProducts } from '../controllers/productController.js';

const router = express.Router();

// Admin adds a product
router.post('/', createProduct);

// List all products
router.get('/', getAllProducts);

// Get product details
router.get('/:id', getProductById);

export default router; 