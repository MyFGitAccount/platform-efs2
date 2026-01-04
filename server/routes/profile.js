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

// GET user profile
router.get('/me', requireAuth, async (req, res) => {
  try {
    const db = await connectDB();
    const user = await db.collection('users').findOne(
      { sid: req.user.sid },
      { projection: { password: 0 } }
    );
    
    res.json({ ok: true, data: user });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// PUT update profile
router.put('/update', requireAuth, async (req, res) => {
  try {
    const { 
      email, 
      phone, 
      major, 
      gpa, 
      dse_score, 
      skills, 
      year_of_study, 
      about_me 
    } = req.body;
    
    const db = await connectDB();
    
    const updates = {};
    
    if (email !== undefined) updates.email = email.toLowerCase();
    if (phone !== undefined) updates.phone = phone;
    if (major !== undefined) updates.major = major;
    
    if (gpa !== undefined) {
      const gpaNum = parseFloat(gpa);
      if (!isNaN(gpaNum)) updates.gpa = gpaNum;
    }
    
    if (dse_score !== undefined) updates.dse_score = dse_score;
    
    if (skills !== undefined) {
      updates.skills = Array.isArray(skills) 
        ? skills 
        : typeof skills === 'string' 
          ? skills.split(',').map(s => s.trim()).filter(Boolean)
          : [];
    }
    
    if (year_of_study !== undefined) {
      const year = parseInt(year_of_study);
      if (!isNaN(year)) updates.year_of_study = year;
    }
    
    if (about_me !== undefined) updates.about_me = about_me;
    
    updates.updatedAt = new Date();
    
    await db.collection('users').updateOne(
      { sid: req.user.sid },
      { $set: updates }
    );
    
    res.json({ ok: true, message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// GET user by SID
router.get('/:sid', async (req, res) => {
  try {
    const { sid } = req.params;
    const db = await connectDB();
    
    const user = await db.collection('users').findOne(
      { sid },
      { projection: { password: 0, token: 0 } }
    );
    
    if (!user) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }
    
    res.json({ ok: true, data: user });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

export default router;
