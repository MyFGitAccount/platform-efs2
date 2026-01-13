import express from 'express';
import { ObjectId } from 'mongodb';
import nodemailer from 'nodemailer';
import connectDB from '../db/connection.js';

const router = express.Router();

// Enhanced email transporter with explicit Gmail SMTP settings
const createTransporter = () => {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  
  if (!user || !pass) {
    console.error('❌ Gmail credentials are not configured!');
    console.error('📝 Current .env values:');
    console.error(`   GMAIL_USER=${process.env.GMAIL_USER || 'NOT SET'}`);
    console.error(`   GMAIL_APP_PASSWORD=${process.env.GMAIL_APP_PASSWORD ? 'SET (hidden)' : 'NOT SET'}`);
    console.error('\n🔐 How to configure:');
    console.error('   1. Enable 2-Step Verification: https://myaccount.google.com/security');
    console.error('   2. Generate App Password: https://myaccount.google.com/apppasswords');
    console.error('   3. Select "Mail" and "Other (Custom name)"');
    console.error('   4. Name it "EFS Platform" and generate');
    console.error('   5. Copy the 16-character password (like "abcd efgh ijkl mnop")');
    console.error('   6. Add to .env: GMAIL_APP_PASSWORD=abcdefghijklmnop (no spaces)');
    
    throw new Error('Gmail credentials not configured');
  }
  
  console.log('📧 Creating Gmail transporter...');
  console.log(`   User: ${user}`);
  console.log(`   App Password: ${pass ? '✓ Set' : '✗ Missing'}`);
  
  // Explicit Gmail SMTP configuration
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: user,
      pass: pass
    },
    tls: {
      rejectUnauthorized: false // Sometimes needed for local development
    }
  });
  
  // Test the connection
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Gmail connection failed:', error.message);
      console.error('   Error code:', error.code);
      console.error('\n💡 Troubleshooting:');
      console.error('   1. Verify App Password is correct (16 chars, no spaces)');
      console.error('   2. Check 2-Step Verification is enabled');
      console.error('   3. Try different ports: 587 (TLS) or 465 (SSL)');
      console.error('   4. Allow less secure apps (temporarily): https://myaccount.google.com/lesssecureapps');
      console.error('   5. Check firewall/antivirus blocking SMTP');
    } else {
      console.log('✅ Gmail transporter ready!');
      console.log('   Host: smtp.gmail.com');
      console.log('   Port: 587');
      console.log('   Secure: TLS');
      console.log('📤 Email will be actually sent');
    }
  });
  
  return transporter;
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
    
    // Add isOwner flag for each request based on current user
    const token = req.headers['authorization']?.replace('Bearer ', '');
    if (token) {
      const user = await db.collection('users').findOne({ token });
      if (user) {
        requests.forEach(request => {
          request.isOwner = request.sid === user.sid;
        });
      }
    }
    
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
      data: { _id: result.insertedId, ...request, isOwner: true },
      message: 'Group request created successfully' 
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// POST send group invitation
router.post('/requests/:id/invite', requireAuth, async (req, res) => {
  let transporter;
  
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
    
    // Prevent inviting yourself
    if (groupRequest.sid === req.user.sid) {
      return res.status(400).json({ 
        ok: false, 
        error: 'You cannot send an invitation to yourself' 
      });
    }
    
    // Get inviter info
    const inviter = await db.collection('users').findOne({ sid: req.user.sid });
    
    if (!inviter) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }
    
    console.log(`\n🎯 Sending REAL invitation from ${inviter.sid} to ${groupRequest.sid}`);
    console.log(`📧 Recipient email: ${groupRequest.email}`);
    console.log(`📤 Using Gmail: ${process.env.GMAIL_USER}`);
    
    // Send invitation email - ACTUALLY SEND IT
    try {
      transporter = createTransporter();
      
      const mailOptions = {
        from: `"EFS Platform" <${process.env.GMAIL_USER}>`,
        to: groupRequest.email,
        subject: 'Study Group Invitation - EFS Platform',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #1890ff; text-align: center;">📚 Study Group Invitation</h2>
            <p><strong>${inviter.sid}</strong> is interested in forming a study group with you!</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3 style="color: #333;">Your Request Details:</h3>
              <p><strong>Major:</strong> ${groupRequest.major}</p>
              <p><strong>Description:</strong> ${groupRequest.description || 'No description provided'}</p>
            </div>
            
            <div style="background-color: #e6f7ff; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3 style="color: #333;">Inviter's Information:</h3>
              <p><strong>Student ID:</strong> ${inviter.sid}</p>
              <p><strong>Email:</strong> ${inviter.email}</p>
              <p><strong>Phone:</strong> ${inviter.phone || 'Not provided'}</p>
              <p><strong>Major:</strong> ${inviter.major || 'Not specified'}</p>
              <p><strong>Year of Study:</strong> ${inviter.year_of_study || 'Not specified'}</p>
              ${inviter.gpa ? `<p><strong>GPA:</strong> ${inviter.gpa}</p>` : ''}
              ${inviter.dse_score ? `<p><strong>DSE Score:</strong> ${inviter.dse_score}</p>` : ''}
            </div>
            
            <div style="border-left: 4px solid #1890ff; padding-left: 15px; margin: 15px 0;">
              <h3 style="color: #333;">Message from ${inviter.sid}:</h3>
              <p style="font-style: italic;">"${message || 'I would like to form a study group with you!'}"</p>
            </div>
            
            <div style="text-align: center; margin-top: 25px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
              <p>Please contact <strong>${inviter.email}</strong> to coordinate further.</p>
              <p style="color: #666; font-size: 12px; margin-top: 20px;">
                This invitation was sent via the EFS Platform.<br>
                To manage your group requests, visit the platform dashboard.
              </p>
            </div>
          </div>
        `
      };
      
      console.log('📤 Attempting to send email via Gmail SMTP...');
      const info = await transporter.sendMail(mailOptions);
      
      console.log(`\n✅ EMAIL ACTUALLY SENT SUCCESSFULLY!`);
      console.log(`📨 Message ID: ${info.messageId}`);
      console.log(`📤 From: ${mailOptions.from}`);
      console.log(`📬 To: ${mailOptions.to}`);
      console.log(`📝 Response: ${info.response}`);
      
      // Log to database for tracking
      await db.collection('invitations').insertOne({
        fromSid: inviter.sid,
        toSid: groupRequest.sid,
        requestId: new ObjectId(id),
        message: message || '',
        emailSent: true,
        messageId: info.messageId,
        createdAt: new Date()
      });
      
      res.json({ 
        ok: true, 
        message: 'Invitation sent successfully via email',
        data: {
          from: inviter.sid,
          to: groupRequest.sid,
          messageId: info.messageId
        }
      });
      
    } catch (emailErr) {
      console.error('\n❌ REAL EMAIL SENDING FAILED:');
      console.error('   Error:', emailErr.message);
      console.error('   Code:', emailErr.code);
      
      // Provide detailed error information
      let errorMessage = 'Failed to send invitation email';
      let suggestion = '';
      
      if (emailErr.code === 'EAUTH') {
        errorMessage = 'Gmail authentication failed';
        suggestion = 'Check your Gmail App Password in .env file';
      } else if (emailErr.code === 'EENVELOPE') {
        errorMessage = 'Invalid email address';
        suggestion = 'Check the recipient email address';
      } else if (emailErr.message.includes('Invalid login')) {
        errorMessage = 'Invalid Gmail credentials';
        suggestion = 'Use App Password (16 chars), not regular password';
      } else if (emailErr.message.includes('ECONNREFUSED')) {
        errorMessage = 'Connection refused to Gmail SMTP';
        suggestion = 'Check firewall/network or try port 465';
      }
      
      console.error('   Suggestion:', suggestion);
      
      return res.status(500).json({ 
        ok: false, 
        error: errorMessage,
        details: emailErr.message,
        suggestion: suggestion,
        debug: {
          host: transporter?.options?.host,
          port: transporter?.options?.port,
          secure: transporter?.options?.secure
        }
      });
    }
    
  } catch (err) {
    console.error('❌ Error in send invitation:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// POST send invitation and auto-delete request
router.post('/requests/:id/invite-and-delete', requireAuth, async (req, res) => {
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
    
    // Prevent inviting yourself
    if (groupRequest.sid === req.user.sid) {
      return res.status(400).json({ 
        ok: false, 
        error: 'You cannot send an invitation to yourself' 
      });
    }
    
    // Get inviter info
    const inviter = await db.collection('users').findOne({ sid: req.user.sid });
    
    if (!inviter) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }
    
    // Send invitation email
    try {
      const transporter = createTransporter();
      
      const mailOptions = {
        from: `"EFS Platform" <${process.env.GMAIL_USER}>`,
        to: groupRequest.email,
        subject: 'Study Group Invitation - EFS Platform',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #1890ff; text-align: center;">📚 Study Group Invitation</h2>
            <p><strong>${inviter.sid}</strong> is interested in forming a study group with you!</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3 style="color: #333;">Your Request Details:</h3>
              <p><strong>Major:</strong> ${groupRequest.major}</p>
              <p><strong>Description:</strong> ${groupRequest.description || 'No description provided'}</p>
            </div>
            
            <div style="background-color: #e6f7ff; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3 style="color: #333;">Inviter's Information:</h3>
              <p><strong>Student ID:</strong> ${inviter.sid}</p>
              <p><strong>Email:</strong> ${inviter.email}</p>
              <p><strong>Phone:</strong> ${inviter.phone || 'Not provided'}</p>
              <p><strong>Major:</strong> ${inviter.major || 'Not specified'}</p>
              <p><strong>Year of Study:</strong> ${inviter.year_of_study || 'Not specified'}</p>
              ${inviter.gpa ? `<p><strong>GPA:</strong> ${inviter.gpa}</p>` : ''}
              ${inviter.dse_score ? `<p><strong>DSE Score:</strong> ${inviter.dse_score}</p>` : ''}
            </div>
            
            <div style="border-left: 4px solid #1890ff; padding-left: 15px; margin: 15px 0;">
              <h3 style="color: #333;">Message from ${inviter.sid}:</h3>
              <p style="font-style: italic;">"${message || 'I would like to form a study group with you!'}"</p>
            </div>
            
            <div style="text-align: center; margin-top: 25px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
              <p>Please contact <strong>${inviter.email}</strong> to coordinate further.</p>
              <p style="color: #666; font-size: 12px; margin-top: 20px;">
                This invitation was sent via the EFS Platform.<br>
                <strong>Note:</strong> Your group request has been automatically removed from the public list.
              </p>
            </div>
          </div>
        `
      };
      
      const info = await transporter.sendMail(mailOptions);
      
      // Log to database for tracking
      await db.collection('invitations').insertOne({
        fromSid: inviter.sid,
        toSid: groupRequest.sid,
        requestId: new ObjectId(id),
        message: message || '',
        emailSent: true,
        messageId: info.messageId,
        autoDeleted: true,
        createdAt: new Date()
      });
      
      // AUTO-DELETE THE REQUEST after sending invitation
      await db.collection('group_requests').deleteOne({ 
        _id: new ObjectId(id)
      });
      
      res.json({ 
        ok: true, 
        message: 'Invitation sent and request deleted successfully',
        data: {
          from: inviter.sid,
          to: groupRequest.sid,
          messageId: info.messageId,
          requestDeleted: true
        }
      });
      
    } catch (emailErr) {
      console.error('Email sending failed:', emailErr);
      return res.status(500).json({ 
        ok: false, 
        error: 'Failed to send invitation email',
        details: emailErr.message
      });
    }
    
  } catch (err) {
    console.error('Error in send invitation and delete:', err);
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
    
    res.json({ ok: true, message: 'Group request deleted successfully' });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// Alternative transporter for different ports
const createAlternativeTransporter = (port = 465) => {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  
  console.log(`🔄 Trying alternative port: ${port}`);
  
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user: user,
      pass: pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Test email endpoint with multiple port attempts
router.post('/test-email', async (req, res) => {
  try {
    const { to, subject, message } = req.body;
    
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return res.status(400).json({
        ok: false,
        error: 'Gmail credentials not configured',
        instruction: 'Add GMAIL_USER and GMAIL_APP_PASSWORD to .env file'
      });
    }
    
    console.log('\n🔧 Testing Gmail SMTP connection...');
    
    let transporter;
    let success = false;
    let lastError;
    
    // Try port 587 (TLS)
    try {
      console.log('🔄 Trying port 587 (TLS)...');
      transporter = createAlternativeTransporter(587);
      await transporter.verify();
      console.log('✅ Port 587 works!');
      success = true;
    } catch (err587) {
      console.log('❌ Port 587 failed:', err587.message);
      lastError = err587;
    }
    
    // Try port 465 (SSL) if 587 failed
    if (!success) {
      try {
        console.log('🔄 Trying port 465 (SSL)...');
        transporter = createAlternativeTransporter(465);
        await transporter.verify();
        console.log('✅ Port 465 works!');
        success = true;
      } catch (err465) {
        console.log('❌ Port 465 failed:', err465.message);
        lastError = err465;
      }
    }
    
    if (!success) {
      throw new Error(`Both ports failed. Last error: ${lastError?.message}`);
    }
    
    const mailOptions = {
      from: `"EFS Platform Test" <${process.env.GMAIL_USER}>`,
      to: to || process.env.GMAIL_USER,
      subject: subject || 'Test Email from EFS Platform',
      text: message || 'This is a test email from the EFS Platform development server.',
      html: `
        <h2>Test Email from EFS Platform</h2>
        <p>This is a test email sent from the development server.</p>
        <p><strong>Message:</strong> ${message || 'No message provided'}</p>
        <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Port:</strong> ${transporter.options.port}</p>
        <hr>
        <p><small>If you received this, Gmail SMTP is working correctly!</small></p>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`\n✅ TEST EMAIL SENT SUCCESSFULLY!`);
    console.log(`📨 Message ID: ${info.messageId}`);
    console.log(`📬 To: ${mailOptions.to}`);
    console.log(`📤 Using port: ${transporter.options.port}`);
    
    res.json({
      ok: true,
      message: 'Test email sent successfully via Gmail',
      data: {
        messageId: info.messageId,
        to: mailOptions.to,
        from: mailOptions.from,
        port: transporter.options.port,
        response: info.response
      }
    });
    
  } catch (error) {
    console.error('\n❌ Test email failed:', error.message);
    
    let suggestion = '';
    if (error.message.includes('ECONNREFUSED')) {
      suggestion = 'Firewall or network blocking SMTP. Try: 1) Disable firewall temporarily 2) Use mobile hotspot 3) Contact network admin';
    } else if (error.code === 'EAUTH') {
      suggestion = 'Invalid App Password. Regenerate at: https://myaccount.google.com/apppasswords';
    }
    
    res.status(500).json({
      ok: false,
      error: 'Failed to send test email',
      details: error.message,
      suggestion: suggestion,
      debug: {
        gmailUser: process.env.GMAIL_USER,
        hasAppPassword: !!process.env.GMAIL_APP_PASSWORD
      }
    });
  }
});

export default router;
