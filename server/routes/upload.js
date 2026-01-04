import express from 'express';
import connectDB from '../db/connection.js';
import { streamFileFromGridFS } from '../db/gridfs.js';

const router = express.Router();

// GET profile photo
router.get('/profile-photo/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Set headers
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    
    // Stream file
    await streamFileFromGridFS(fileId, res);
  } catch (err) {
    res.status(404).send('Profile photo not found');
  }
});

// GET user's profile photo by SID
router.get('/profile-photo/user/:sid', async (req, res) => {
  try {
    const { sid } = req.params;
    const db = await connectDB();
    
    const user = await db.collection('users').findOne({ sid });
    
    if (!user || !user.photoFileId) {
      return res.status(404).json({ ok: false, error: 'Profile photo not found' });
    }
    
    res.redirect(`/api/upload/profile-photo/${user.photoFileId}`);
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Failed to get profile photo' });
  }
});

export default router;
