import express from 'express';
import connectDB from '../db/connection.js';

const router = express.Router();

// Middleware to check authentication
const requireAuth = async (req, res, next) => {
  try {
    console.log('Auth check - Authorization header:', req.headers['authorization']);
    
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      console.log('No authorization header');
      return res.status(401).json({ ok: false, error: 'Authentication required' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    console.log('Extracted token:', token ? 'Token present' : 'No token');
    
    if (!token) {
      return res.status(401).json({ ok: false, error: 'Token missing' });
    }

    const db = await connectDB();
    console.log('Database connected, looking for user with token...');
    
    const user = await db.collection('users').findOne({ token });
    
    if (!user) {
      console.log('User not found with token');
      return res.status(401).json({ ok: false, error: 'Invalid token' });
    }
    
    console.log('User found:', user.sid);
    req.user = user;
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(500).json({ ok: false, error: 'Authentication failed', details: err.message });
  }
};

// GET dashboard summary
router.get('/summary', requireAuth, async (req, res) => {
  try {
    console.log('Loading dashboard for user:', req.user.sid);
    
    const db = await connectDB();
    const sid = req.user.sid;
    
    console.log('Counting documents for user:', sid);
    
    // Initialize with default values
    let courses = 0;
    let groupRequests = 0;
    let questionnaires = 0;
    let materials = 0;
    let pendingApprovals = 0;

    try {
      // Check if collections exist
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      console.log('Available collections:', collectionNames);
      
      // Count courses if collection exists
      if (collectionNames.includes('courses')) {
        courses = await db.collection('courses').countDocuments();
      }
      
      // Count group requests if collection exists
      if (collectionNames.includes('group_requests')) {
        groupRequests = await db.collection('group_requests').countDocuments({ sid });
      }
      
      // Count questionnaires if collection exists
      if (collectionNames.includes('questionnaires')) {
        questionnaires = await db.collection('questionnaires').countDocuments({ creatorSid: sid });
      }
      
      // Count materials if collection exists
      if (collectionNames.includes('materials')) {
        materials = await db.collection('materials').countDocuments({ uploadedBy: sid });
      }

      // Get pending approvals for admin
      if (req.user.role === 'admin' && collectionNames.includes('pending_accounts')) {
        pendingApprovals = await db.collection('pending_accounts').countDocuments();
      }
    } catch (countError) {
      console.error('Error counting documents:', countError);
      // Continue with default values (0)
    }

    console.log('Dashboard stats:', {
      courses,
      groupRequests,
      questionnaires,
      materials,
      pendingApprovals
    });

    res.json({
      ok: true,
      data: {
        user: {
          sid: req.user.sid,
          email: req.user.email,
          role: req.user.role,
          credits: req.user.credits || 0,
          major: req.user.major || 'Not specified',
          year_of_study: req.user.year_of_study || 'Not specified'
        },
        stats: {
          courses,
          myGroupRequests: groupRequests,
          myQuestionnaires: questionnaires,
          myMaterials: materials,
          pendingApprovals
        },
        quickActions: [
          {
            id: 'timetable',
            title: 'Timetable Planner',
            description: 'Organize your weekly schedule',
            icon: 'calendar',
            link: '/calendar',
            color: '#1890ff',
            available: true
          },
          {
            id: 'group',
            title: 'Group Formation',
            description: 'Find study partners',
            icon: 'team',
            link: '/group-formation',
            color: '#52c41a',
            available: true
          },
          {
            id: 'questionnaire',
            title: 'Questionnaire Exchange',
            description: 'Share and fill surveys',
            icon: 'file-text',
            link: '/questionnaire',
            color: '#722ed1',
            available: true
          },
          {
            id: 'materials',
            title: 'Learning Materials',
            description: 'Access course resources',
            icon: 'file',
            link: '/materials',
            color: '#fa8c16',
            available: true
          },
          {
            id: 'admin',
            title: 'Admin Panel',
            description: 'Manage system settings',
            icon: 'setting',
            link: '/admin',
            color: '#f5222d',
            available: req.user.role === 'admin'
          }
        ]
      }
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to load dashboard',
      details: err.message 
    });
  }
});

export default router;
