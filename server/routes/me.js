import express from 'express';
import connectDB from '../db/connection.js';

const router = express.Router();

// Middleware to check authentication
const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers['authorization']?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ ok: false, error: 'Authentication required' });
    }

    const db = await connectDB();
    const user = await db.collection('users').findOne({ token });
    
    if (!user) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Authentication failed' });
  }
};

// GET current user
router.get('/', requireAuth, async (req, res) => {
  try {
    const { password, token, ...safeUser } = req.user;
    res.json({ ok: true, data: safeUser });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// GET user credits
router.get('/credits', requireAuth, async (req, res) => {
  try {
    res.json({ 
      ok: true, 
      credits: req.user.credits || 0 
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

export default router;
