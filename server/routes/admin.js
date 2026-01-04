import express from 'express';
import crypto from 'crypto';
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

// Generate token
const generateUserToken = () => {
  const array = new Uint32Array(8);
  crypto.getRandomValues(array);
  return Array.from(array).map(num => num.toString(36)).join('');
};

// Admin middleware
const requireAdmin = async (req, res, next) => {
  try {
    const token = req.headers['authorization']?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ ok: false, error: 'Authentication required' });
    }

    const db = await connectDB();
    const user = await db.collection('users').findOne({ token });
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'Admin access required' });
    }
    
    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// Apply admin middleware to all routes
router.use(requireAdmin);

// GET pending accounts
router.get('/pending/accounts', async (req, res) => {
  try {
    const db = await connectDB();
    const pendingAccounts = await db.collection('pending_accounts')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json({ ok: true, data: pendingAccounts });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// POST approve account
router.post('/pending/accounts/:sid/approve', async (req, res) => {
  try {
    const { sid } = req.params;
    const db = await connectDB();
    
    const pendingAccount = await db.collection('pending_accounts').findOne({ sid });
    if (!pendingAccount) {
      return res.status(404).json({ ok: false, error: 'Pending account not found' });
    }
    
    // Generate token
    const token = generateUserToken();
    const fullToken = `${sid}-${token}`;
    
    // Create user account
    const user = {
      sid: pendingAccount.sid,
      email: pendingAccount.email,
      password: pendingAccount.password,
      photoFileId: pendingAccount.photoFileId,
      role: 'user',
      token: fullToken,
      credits: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
      gpa: null,
      dse_score: null,
      phone: null,
      major: null,
      skills: [],
      courses: [],
      year_of_study: 1,
      about_me: '',
    };
    
    await db.collection('users').insertOne(user);
    await db.collection('pending_accounts').deleteOne({ sid });
    
    // Send approval email to user
    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: user.email,
        subject: 'Account Approved - EFS Platform',
        html: `
          <h2>Welcome to EFS Platform!</h2>
          <p>Your account has been approved by the administrator.</p>
          <p><strong>Student ID:</strong> ${user.sid}</p>
          <p>You can now login to the platform using your email and password.</p>
          <p>You have received <strong>3 credits</strong> to start using the platform features.</p>
          <br>
          <p>Best regards,<br>EFS Platform Team</p>
        `
      });
    } catch (emailErr) {
      console.error('Failed to send approval email:', emailErr);
    }
    
    res.json({ 
      ok: true, 
      message: 'Account approved successfully',
      data: user 
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// POST reject account
router.post('/pending/accounts/:sid/reject', async (req, res) => {
  try {
    const { sid } = req.params;
    const db = await connectDB();
    
    const pendingAccount = await db.collection('pending_accounts').findOne({ sid });
    if (!pendingAccount) {
      return res.status(404).json({ ok: false, error: 'Pending account not found' });
    }
    
    await db.collection('pending_accounts').deleteOne({ sid });
    
    // Send rejection email to user
    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: pendingAccount.email,
        subject: 'Account Request Rejected - EFS Platform',
        html: `
          <h2>Account Request Status</h2>
          <p>Your account request has been reviewed and rejected.</p>
          <p><strong>Reason:</strong> ${req.body.reason || 'Does not meet requirements'}</p>
          <p><strong>Student ID:</strong> ${sid}</p>
          <br>
          <p>If you believe this is an error, please contact the administrator.</p>
          <p>Best regards,<br>EFS Platform Team</p>
        `
      });
    } catch (emailErr) {
      console.error('Failed to send rejection email:', emailErr);
    }
    
    res.json({ ok: true, message: 'Account rejected' });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// GET pending courses
router.get('/pending/courses', async (req, res) => {
  try {
    const db = await connectDB();
    const pendingCourses = await db.collection('pending_courses')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json({ ok: true, data: pendingCourses });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// POST approve course
router.post('/pending/courses/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await connectDB();
    
    const pendingCourse = await db.collection('pending_courses').findOne({ _id: new ObjectId(id) });
    if (!pendingCourse) {
      return res.status(404).json({ ok: false, error: 'Pending course not found' });
    }
    
    // Create course
    const course = {
      code: pendingCourse.code,
      title: pendingCourse.title,
      description: '',
      materials: [],
      timetable: [],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection('courses').insertOne(course);
    await db.collection('pending_courses').deleteOne({ _id: new ObjectId(id) });
    
    res.json({ 
      ok: true, 
      message: 'Course approved successfully',
      data: course 
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// GET all users
router.get('/users', async (req, res) => {
  try {
    const db = await connectDB();
    const users = await db.collection('users')
      .find({}, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json({ ok: true, data: users });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// DELETE user
router.delete('/users/:sid', async (req, res) => {
  try {
    const { sid } = req.params;
    const db = await connectDB();
    
    if (sid === req.user.sid) {
      return res.status(400).json({ ok: false, error: 'Cannot delete your own account' });
    }
    
    await db.collection('users').deleteOne({ sid });
    
    res.json({ ok: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// GET platform statistics
router.get('/stats', async (req, res) => {
  try {
    const db = await connectDB();
    
    const [
      totalUsers,
      totalCourses,
      pendingAccounts,
      pendingCourses,
      totalMaterials
    ] = await Promise.all([
      db.collection('users').countDocuments(),
      db.collection('courses').countDocuments(),
      db.collection('pending_accounts').countDocuments(),
      db.collection('pending_courses').countDocuments(),
      db.collection('materials').countDocuments()
    ]);
    
    res.json({
      ok: true,
      data: {
        totalUsers,
        totalCourses,
        pendingAccounts,
        pendingCourses,
        totalMaterials
      }
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

export default router;
