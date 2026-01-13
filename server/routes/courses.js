import express from 'express';
import connectDB from '../db/connection.js';

const router = express.Router();

// Helper to convert weekday number to day string
const getDayFromWeekday = (weekday) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[weekday] || '';
};

// GET all courses (returns code to title mapping)
router.get('/', async (req, res) => {
  try {
    const db = await connectDB();
    const courseSessions = await db.collection('courses').find({}).toArray();
    
    // Create an array of course objects instead of a map
    const coursesArray = [];
    const seen = new Set();
    
    courseSessions.forEach(session => {
      if (session.code && !seen.has(session.code)) {
        seen.add(session.code);
        coursesArray.push({
          code: session.code,
          title: session.name || session.code,
          // Include additional fields for calendar
          day: session.weekday,
          startTime: session.startTime,
          endTime: session.endTime,
          room: session.room || '',
          classNo: session.classNo || '',
          color: getColorForCourse(session.code) // You'll need to add this function
        });
      }
    });
    
    // Sort by course code
    coursesArray.sort((a, b) => a.code.localeCompare(b.code));
    
    res.json({ ok: true, data: coursesArray });
  } catch (err) {
    console.error('Courses list error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

function getColorForCourse(courseCode) {
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
  ];
  
  let hash = 0;
  for (let i = 0; i < courseCode.length; i++) {
    hash = courseCode.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  
  return colors[index];
}

// GET specific course (aggregates all sessions for a course)
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const upperCode = code.toUpperCase();
    
    const db = await connectDB();
    
    // Find all sessions for this course code
    const courseSessions = await db.collection('courses')
      .find({ code: upperCode })
      .toArray();
    
    if (!courseSessions || courseSessions.length === 0) {
      // Check pending courses
      const pendingCourse = await db.collection('pending_courses').findOne({ code: upperCode });
      
      if (!pendingCourse) {
        return res.status(404).json({ 
          ok: false, 
          error: 'Course not found',
          data: { 
            description: '', 
            materials: [], 
            timetable: [] 
          }
        });
      }
      
      // Return pending course info
      return res.json({ 
        ok: true, 
        data: {
          code: pendingCourse.code,
          title: pendingCourse.title,
          description: '',
          materials: [],
          timetable: [],
        }
      });
    }
    
    // Get the first session to get course info
    const firstSession = courseSessions[0];
    
    // Transform sessions into timetable format
    const timetable = courseSessions.map(session => {
      const day = getDayFromWeekday(session.weekday);
      return {
        day: day,
        time: `${session.startTime}-${session.endTime}`,
        room: session.room || '',
        classNo: session.classNo || '',
        weekday: session.weekday,
        startTime: session.startTime,
        endTime: session.endTime
      };
    }).filter(item => item.day); // Filter out invalid days
    
    res.json({ 
      ok: true, 
      data: {
        code: upperCode,
        title: firstSession.name || upperCode,
        description: '', // Your structure doesn't have description
        materials: [], // Your structure doesn't have materials
        timetable: timetable,
      }
    });
  } catch (err) {
    console.error('Get course error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// POST request new course (unchanged)
router.post('/request', async (req, res) => {
  try {
    const { code, title } = req.body;
    const token = req.headers['authorization']?.replace('Bearer ', '');
    
    if (!code || !title) {
      return res.status(400).json({ ok: false, error: 'Course code and title required' });
    }
    
    if (!token) {
      return res.status(401).json({ ok: false, error: 'Authentication required' });
    }
    
    const db = await connectDB();
    const user = await db.collection('users').findOne({ token });
    
    if (!user) {
      return res.status(401).json({ ok: false, error: 'User not found' });
    }
    
    const upperCode = code.toUpperCase().trim();
    
    // Check if course already exists
    const existingCourse = await db.collection('courses').findOne({ code: upperCode });
    const pendingCourse = await db.collection('pending_courses').findOne({ code: upperCode });
    
    if (existingCourse || pendingCourse) {
      return res.status(409).json({ 
        ok: false, 
        error: 'Course already exists or pending approval' 
      });
    }
    
    // Create pending course request
    const courseRequest = {
      code: upperCode,
      title: title.trim(),
      requestedBy: user.sid,
      status: 'pending',
      createdAt: new Date(),
    };
    
    await db.collection('pending_courses').insertOne(courseRequest);
    
    res.json({ 
      ok: true, 
      message: 'Course request submitted. Awaiting admin approval.' 
    });
  } catch (err) {
    console.error('Course request error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// GET all courses list (returns detailed list)
router.get('/list', async (req, res) => {
  try {
    const db = await connectDB();
    const courseSessions = await db.collection('courses').find({}).toArray();
    
    // Group by course code
    const courseMap = {};
    
    courseSessions.forEach(session => {
      const code = session.code;
      if (!code) return;
      
      if (!courseMap[code]) {
        courseMap[code] = {
          code: code,
          title: session.name || code,
          timetable: []
        };
      }
      
      // Add timetable entry
      const day = getDayFromWeekday(session.weekday);
      if (day) {
        courseMap[code].timetable.push({
          day: day,
          time: `${session.startTime}-${session.endTime}`,
          room: session.room || '',
          classNo: session.classNo || '',
          weekday: session.weekday,
          startTime: session.startTime,
          endTime: session.endTime
        });
      }
    });
    
    // Convert map to array and sort
    const courses = Object.values(courseMap).sort((a, b) => a.code.localeCompare(b.code));
    
    res.json({ ok: true, data: courses });
  } catch (err) {
    console.error('Courses list detailed error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

export default router;
