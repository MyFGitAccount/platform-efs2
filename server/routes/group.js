import express from 'express';
import { ObjectId } from 'mongodb';
import nodemailer from 'nodemailer';
import connectDB from '../db/connection.js';

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

// Authentication middleware
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
    res.status(500).json({ ok: false, error: err.message });
  }
};

// GET all group requests
router.get('/requests', async (req, res) => {
  try {
    const db = await connectDB();
    const requests = await db.collection('group_requests')
      .find({ status: 'active' })
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json({ ok: true, data: requests });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// POST create group request
router.post('/requests', requireAuth, async (req, res) => {
  try {
    const { 
      description, 
      email, 
      phone, 
      major, 
      desired_groupmates, 
      gpa, 
      dse_score 
    } = req.body;
    
    if (!major) {
      return res.status(400).json({ ok: false, error: 'Major is required' });
    }
    
    const db = await connectDB();
    
    // Check if user already has an active request
    const existingRequest = await db.collection('group_requests').findOne({ 
      sid: req.user.sid,
      status: 'active'
    });
    
    if (existingRequest) {
      return res.status(409).json({ 
        ok: false, 
        error: 'You already have an active group request' 
      });
    }
    
    // Create group request
    const request = {
      sid: req.user.sid,
      description: description || '',
      email: email || req.user.email,
      phone: phone || req.user.phone || '',
      major: major.trim(),
      desired_groupmates: desired_groupmates || '',
      gpa: gpa ? parseFloat(gpa) : null,
      dse_score: dse_score || '',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await db.collection('group_requests').insertOne(request);
    
    res.json({ 
      ok: true, 
      data: { _id: result.insertedId, ...request },
      message: 'Group request created' 
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// POST send group invitation
router.post('/requests/:id/invite', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const db = await connectDB();
    
    // Get group request
    const groupRequest = await db.collection('group_requests').findOne({ 
      _id: new ObjectId(id),
      status: 'active'
    });
    
    if (!groupRequest) {
      return res.status(404).json({ ok: false, error: 'Group request not found' });
    }
    
    // Get inviter info
    const inviter = await db.collection('users').findOne({ sid: req.user.sid });
    
    // Get request creator info
    const requestCreator = await db.collection('users').findOne({ sid: groupRequest.sid });
    
    if (!inviter || !requestCreator) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }
    
    // Send invitation email
    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: groupRequest.email,
        subject: 'Group Formation Invitation - EFS Platform',
        html: `
          <h2>Group Formation Invitation</h2>
          <p><strong>${inviter.sid}</strong> is interested in forming a study group with you!</p>
          <br>
          <h3>Your Request Details:</h3>
          <p><strong>Major:</strong> ${groupRequest.major}</p>
          <p><strong>Description:</strong> ${groupRequest.description || 'No description provided'}</p>
          <br>
          <h3>Inviter's Information:</h3>
          <p><strong>Student ID:</strong> ${inviter.sid}</p>
          <p><strong>Email:</strong> ${inviter.email}</p>
          <p><strong>Phone:</strong> ${inviter.phone || 'Not provided'}</p>
          <p><strong>Major:</strong> ${inviter.major || 'Not specified'}</p>
          <p><strong>Year of Study:</strong> ${inviter.year_of_study || 'Not specified'}</p>
          ${inviter.gpa ? `<p><strong>GPA:</strong> ${inviter.gpa}</p>` : ''}
          ${inviter.dse_score ? `<p><strong>DSE Score:</strong> ${inviter.dse_score}</p>` : ''}
          <br>
          <h3>Message from ${inviter.sid}:</h3>
          <p>${message || 'I would like to form a study group with you!'}</p>
          <br>
          <p>Please contact ${inviter.email} to coordinate further.</p>
          <br>
          <p>Best regards,<br>EFS Platform Team</p>
        `
      });
    } catch (emailErr) {
      console.error('Failed to send invitation email:', emailErr);
      return res.status(500).json({ ok: false, error: 'Failed to send invitation email' });
    }
    
    res.json({ 
      ok: true, 
      message: 'Invitation sent successfully' 
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// DELETE group request
router.delete('/requests/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await connectDB();
    
    const result = await db.collection('group_requests').deleteOne({ 
      _id: new ObjectId(id),
      sid: req.user.sid
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Request not found or not authorized' 
      });
    }
    
    res.json({ ok: true, message: 'Group request deleted' });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

export default router;
