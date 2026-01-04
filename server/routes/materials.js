import express from 'express';
import { nanoid } from 'nanoid';
import connectDB from '../db/connection.js';
import { uploadToGridFS, streamFileFromGridFS } from '../db/gridfs.js';

const router = express.Router();

// Authentication middleware for admin
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

// Upload material
router.post('/course/:code', requireAdmin, async (req, res) => {
  try {
    const { code } = req.params;
    const { fileData, fileName, name, description } = req.body;
    
    if (!fileData || !fileName) {
      return res.status(400).json({ ok: false, error: 'File data required' });
    }
    
    const db = await connectDB();
    const upperCode = code.toUpperCase();
    const course = await db.collection('courses').findOne({ code: upperCode });
    
    if (!course) {
      return res.status(404).json({ ok: false, error: 'Course not found' });
    }
    
    // Convert Base64 to buffer
    let fileBuffer;
    try {
      const base64Data = fileData.includes('base64,') 
        ? fileData.split(',')[1] 
        : fileData;
      fileBuffer = Buffer.from(base64Data, 'base64');
    } catch (err) {
      return res.status(400).json({ ok: false, error: 'Invalid file data' });
    }
    
    // Upload to GridFS
    const gridFSResult = await uploadToGridFS(fileBuffer, fileName, {
      originalName: fileName,
      mimetype: req.body.mimetype || 'application/octet-stream',
      uploadedBy: req.user.sid,
      courseCode: upperCode,
      description: description || ''
    });
    
    // Create material record
    const material = {
      id: nanoid(),
      name: name || fileName,
      description: description || '',
      fileName: fileName,
      fileId: gridFSResult.fileId,
      size: fileBuffer.length,
      mimetype: req.body.mimetype || 'application/octet-stream',
      uploadedBy: req.user.sid,
      uploadedAt: new Date(),
      downloads: 0,
      courseCode: upperCode,
      courseName: course.title
    };
    
    // Add to course
    await db.collection('courses').updateOne(
      { code: upperCode },
      { $push: { materials: material } }
    );
    
    // Add to materials collection
    await db.collection('materials').insertOne(material);
    
    res.json({ 
      ok: true, 
      data: material,
      message: 'Material uploaded successfully' 
    });
  } catch (err) {
    console.error('Upload material error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// Download material
router.get('/download/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await connectDB();
    
    const material = await db.collection('materials').findOne({ id });
    
    if (!material) {
      return res.status(404).json({ ok: false, error: 'Material not found' });
    }
    
    // Update download count
    await db.collection('materials').updateOne(
      { id },
      { $inc: { downloads: 1 } }
    );
    
    // Set headers
    res.setHeader('Content-Disposition', `attachment; filename="${material.fileName}"`);
    res.setHeader('Content-Type', material.mimetype);
    
    // Stream file
    await streamFileFromGridFS(material.fileId, res);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ ok: false, error: 'Download failed' });
  }
});

// GET course materials
router.get('/course/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const db = await connectDB();
    
    const course = await db.collection('courses').findOne({ 
      code: code.toUpperCase() 
    });
    
    if (!course) {
      return res.json({ ok: true, data: [] });
    }
    
    res.json({ ok: true, data: course.materials || [] });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

export default router;
