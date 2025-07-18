import jwt from 'jsonwebtoken';
import Merchant from '../models/Merchant.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify merchant still exists and is active
    const merchant = await Merchant.findById(decoded.merchantId);
    if (!merchant || !merchant.isActive) {
      return res.status(401).json({ message: 'Invalid token or merchant deactivated' });
    }

    req.merchant = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(403).json({ message: 'Invalid token' });
  }
};
