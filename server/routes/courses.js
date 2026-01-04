import express from 'express';
import connectDB from '../db/connection.js';

const router = express.Router();

// GET all courses
router.get('/', async (req, res) => {
  try {
    const db = await connectDB();
    const courses = await db.collection('courses').find({}).toArray();
    
    const courseMap = {};
    courses.forEach(course => {
      courseMap[course.code] = course.title;
    });
    
    res.json({ ok: true, data: courseMap });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// GET specific course
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const upperCode = code.toUpperCase();
    
    const db = await connectDB();
    
    let course = await db.collection('courses').findOne({ code: upperCode });
    
    if (!course) {
      course = await db.collection('pending_courses').findOne({ code: upperCode });
    }
    
    if (!course) {
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
    
    res.json({ 
      ok: true, 
      data: {
        code: course.code,
        title: course.title,
        description: course.description || '',
        materials: course.materials || [],
        timetable: course.timetable || [],
      }
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// POST request new course
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
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// GET all courses list
router.get('/list', async (req, res) => {
  try {
    const db = await connectDB();
    const courses = await db.collection('courses')
      .find({})
      .sort({ code: 1 })
      .toArray();
    
    res.json({ ok: true, data: courses });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

export default router;
