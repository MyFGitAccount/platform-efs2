import express from 'express';
import connectDB from '../db/connection.js';

const router = express.Router();

// Campus mapping
const campusMap = {
  'ADC': 'Admiralty Learning Centre',
  'CIT': 'CITA Learning Centre',
  'HPC': 'HPSHCC Campus',
  'KEC': 'Kowloon East Campus',
  'KWC': 'Kowloon West Campus',
  'UNC': 'United Centre'
};

// Helper to convert weekday number to day string
const getDayFromWeekday = (weekday) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[weekday] || '';
};

// GET all courses for calendar (UPDATED for your structure)
router.get('/courses', async (req, res) => {
  try {
    const db = await connectDB();
    
    // Get all courses (each document is a course session)
    const courseSessions = await db.collection('courses').find({}).toArray();
    
    // Group by course code to create calendar courses
    const calendarCourses = [];
    const seen = new Set();
    
    courseSessions.forEach(session => {
      const key = `${session.code}-${session.classNo || '01'}`;
      
      // Skip if we've already processed this course+class combination
      if (seen.has(key)) return;
      seen.add(key);
      
      const day = getDayFromWeekday(session.weekday);
      if (!day || !session.startTime || !session.endTime) return null;
      
      calendarCourses.push({
        id: key,
        code: session.code,
        title: session.name || session.code,
        classNo: session.classNo || '',
        startTime: session.startTime,
        endTime: session.endTime,
        weekday: session.weekday,
        day: day,
        room: session.room || '',
        campus: campusMap[session.room?.substring(0, 3).toUpperCase()] || session.room,
        time: `${session.startTime}-${session.endTime}`,
        color: getColorForCourse(session.code),
      });
    });
    
    res.json({ ok: true, data: calendarCourses });
  } catch (err) {
    console.error('Calendar courses error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// GET events for FullCalendar (UPDATED for your structure)
router.get('/events', async (req, res) => {
  try {
    const db = await connectDB();
    
    const courseSessions = await db.collection('courses').find({}).toArray();
    
    const events = [];
    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay() + 1); // Start from Monday
    
    courseSessions.forEach(session => {
      const [startHour, startMin] = (session.startTime || '').split(':').map(Number);
      const [endHour, endMin] = (session.endTime || '').split(':').map(Number);
      
      if (isNaN(startHour)) return;
      
      const weekday = session.weekday || 0;
      const day = getDayFromWeekday(weekday);
      if (!day) return;
      
      // Create events for next 2 weeks
      for (let week = 0; week < 2; week++) {
        const eventDate = new Date(currentWeekStart);
        eventDate.setDate(currentWeekStart.getDate() + (week * 7) + weekday);
        
        const startDate = new Date(eventDate);
        startDate.setHours(startHour, startMin, 0, 0);
        
        const endDate = new Date(eventDate);
        endDate.setHours(endHour, endMin, 0, 0);
        
        events.push({
          id: `${session.code}-${session.classNo || '01'}-${week}`,
          title: `${session.code}${session.classNo ? ' ' + session.classNo : ''}`,
          extendedProps: {
            fullTitle: session.name || session.code,
            room: session.room || '',
            classNo: session.classNo || '',
          },
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          backgroundColor: getColorForCourse(session.code),
          textColor: '#ffffff'
        });
      }
    });
    
    res.json({ ok: true, data: events });
  } catch (err) {
    console.error('Calendar events error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// POST save timetable
router.post('/save', async (req, res) => {
  try {
    const { sid, courses } = req.body;
    
    if (!sid) {
      return res.status(400).json({ ok: false, error: 'Student ID required' });
    }
    
    const db = await connectDB();
    
    await db.collection('user_timetables').updateOne(
      { sid },
      { 
        $set: { 
          courses: courses || [],
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    
    res.json({ ok: true, message: 'Timetable saved' });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// GET user timetable
router.get('/mytimetable', async (req, res) => {
  try {
    const token = req.headers['authorization']?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(400).json({ ok: false, error: 'Authentication required' });
    }
    
    const db = await connectDB();
    const user = await db.collection('users').findOne({ token });
    
    if (!user) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }
    
    const timetable = await db.collection('user_timetables').findOne({ sid: user.sid });
    
    res.json({ 
      ok: true, 
      data: timetable?.courses || [] 
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// Helper function to get color for course
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

export default router;
