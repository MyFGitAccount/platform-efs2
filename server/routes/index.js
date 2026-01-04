import express from 'express';
import connectDB from '../db/connection.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    ok: true, 
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

// API info
router.get('/info', (req, res) => {
  res.json({
    ok: true,
    name: 'EFS Platform API',
    description: 'Educational Facilitation System API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test database connection
router.get('/test-db', async (req, res) => {
  try {
    const db = await connectDB();
    await db.command({ ping: 1 });
    
    res.json({
      ok: true,
      message: 'Database connection successful'
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: 'Database connection failed'
    });
  }
});

export default router;
