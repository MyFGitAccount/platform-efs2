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

// GET dashboard summary
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const db = await connectDB();
    const sid = req.user.sid;
    
    const [
      courses,
      groupRequests,
      questionnaires,
      materials
    ] = await Promise.all([
      db.collection('courses').countDocuments(),
      db.collection('group_requests').countDocuments({ sid }),
      db.collection('questionnaires').countDocuments({ creatorSid: sid }),
      db.collection('materials').countDocuments({ uploadedBy: sid })
    ]);

    // Get pending approvals for admin
    let pendingApprovals = 0;
    if (req.user.role === 'admin') {
      pendingApprovals = await db.collection('pending_accounts').countDocuments();
    }

    res.json({
      ok: true,
      data: {
        user: {
          sid: req.user.sid,
          email: req.user.email,
          role: req.user.role,
          credits: req.user.credits || 0,
          major: req.user.major,
          year_of_study: req.user.year_of_study
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
    res.status(500).json({ ok: false, error: 'Failed to load dashboard' });
  }
});

export default router;
