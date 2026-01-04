import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import connectDB from '../db/connection.js';
import { uploadToGridFS } from '../db/gridfs.js';

const router = express.Router();

// Email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
};

// Generate token
const generateUserToken = () => {
  const array = new Uint32Array(8);
  crypto.getRandomValues(array);
  return Array.from(array).map(num => num.toString(36)).join('');
};

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { sid, email, password, photoData, fileName = 'student_card.jpg' } = req.body;
    
    if (!sid || !email || !password || !photoData) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }

    const db = await connectDB();

    // Check if user exists
    const existingUser = await db.collection('users').findOne({ 
      $or: [{ sid }, { email: email.toLowerCase() }] 
    });
    
    const pendingUser = await db.collection('pending_accounts').findOne({ 
      $or: [{ sid }, { email: email.toLowerCase() }] 
    });

    if (existingUser || pendingUser) {
      return res.status(409).json({ 
        ok: false, 
        error: 'User already exists or pending approval' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Upload photo to GridFS
    let photoFileId;
    try {
      const base64Data = photoData.includes('base64,') 
        ? photoData.split(',')[1] 
        : photoData;
      const fileBuffer = Buffer.from(base64Data, 'base64');
      
      const gridFSResult = await uploadToGridFS(fileBuffer, fileName, {
        originalName: fileName,
        mimetype: 'image/jpeg',
        uploadedBy: sid,
        type: 'student_card'
      });
      
      photoFileId = gridFSResult.fileId;
    } catch (gridfsErr) {
      console.error('GridFS upload error:', gridfsErr);
      return res.status(500).json({ ok: false, error: 'Failed to process photo' });
    }

    // Create pending account
    const pendingAccount = {
      sid,
      email: email.toLowerCase(),
      password: hashedPassword,
      photoFileId,
      createdAt: new Date(),
    };

    await db.collection('pending_accounts').insertOne(pendingAccount);

    // Send email notification to admin
    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: process.env.ADMIN_EMAIL || 'admin@efs.com',
        subject: 'New Account Request - EFS Platform',
        html: `
          <h2>New Account Request</h2>
          <p><strong>Student ID:</strong> ${sid}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
          <p>Please login to the admin panel to review this request.</p>
        `
      });
    } catch (emailErr) {
      console.error('Failed to send admin notification:', emailErr);
    }

    res.json({ 
      ok: true, 
      message: 'Account request submitted. Awaiting admin approval.' 
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Email and password required' });
    }

    const db = await connectDB();
    const user = await db.collection('users').findOne({ 
      email: email.toLowerCase() 
    });

    if (!user) {
      return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    }

    // Generate new token
    const token = generateUserToken();
    const fullToken = `${user.sid}-${token}`;
    
    await db.collection('users').updateOne(
      { sid: user.sid },
      { $set: { token: fullToken, updatedAt: new Date() } }
    );

    // Remove sensitive data
    const { password: _, ...userData } = user;
    
    res.json({
      ok: true,
      data: {
        ...userData,
        token: fullToken
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// Check authentication
router.get('/check', async (req, res) => {
  try {
    const token = req.headers['authorization']?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ ok: false, error: 'No token provided' });
    }

    const db = await connectDB();
    const user = await db.collection('users').findOne({ token });
    
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Invalid token' });
    }

    const { password, ...userData } = user;
    res.json({ ok: true, data: userData });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

export default router;
