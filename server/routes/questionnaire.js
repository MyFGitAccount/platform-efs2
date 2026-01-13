import express from 'express';
import { ObjectId } from 'mongodb';
import connectDB from '../db/connection.js';

const router = express.Router();

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

// GET all active questionnaires
router.get('/', async (req, res) => {
  try {
    const db = await connectDB();
    const questionnaires = await db.collection('questionnaires')
      .find({ status: 'active' })
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json({ ok: true, data: questionnaires });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// POST create questionnaire
router.post('/', requireAuth, async (req, res) => {
  try {
    const { description, link, targetResponses = 30 } = req.body;
    
    if (!description || !link) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Description and link are required' 
      });
    }
    
    const db = await connectDB();
    
    // Check if user has enough credits
    if (req.user.credits <= 0) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Insufficient credits. Need 1 credits.' 
      });
    }
    
    // Check if user already has an active questionnaire
    const existingQuestionnaire = await db.collection('questionnaires').findOne({
      creatorSid: req.user.sid,
      status: 'active'
    });
    
    if (existingQuestionnaire) {
      return res.status(409).json({ 
        ok: false, 
        error: 'You already have an active questionnaire' 
      });
    }
    
    // Deduct 3 credits
    await db.collection('users').updateOne(
      { sid: req.user.sid },
      { $inc: { credits: -1 } }
    );
    
    // Create questionnaire
    const questionnaire = {
      creatorSid: req.user.sid,
      creatorEmail: req.user.email,
      description: description.trim(),
      link: link.trim(),
      targetResponses: parseInt(targetResponses),
      filledBy: [],
      currentResponses: 0,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await db.collection('questionnaires').insertOne(questionnaire);
    
    res.json({ 
      ok: true, 
      data: { _id: result.insertedId, ...questionnaire },
      message: 'Questionnaire posted. 1 credits deducted.' 
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// POST fill questionnaire
router.post('/:id/fill', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const db = await connectDB();
    
    // Get questionnaire
    const questionnaire = await db.collection('questionnaires').findOne({
      _id: new ObjectId(id),
      status: 'active'
    });
    
    if (!questionnaire) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Questionnaire not found' 
      });
    }
    
    // Check if user is the creator
    if (questionnaire.creatorSid === req.user.sid) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Cannot fill your own questionnaire' 
      });
    }
    
    // Check if already filled
    if (questionnaire.filledBy.includes(req.user.sid)) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Already filled this questionnaire' 
      });
    }
    
    // Update questionnaire
    await db.collection('questionnaires').updateOne(
      { _id: new ObjectId(id) },
      { 
        $push: { filledBy: req.user.sid },
        $inc: { currentResponses: 1 }
      }
    );
    
    // Give 1 credit to filler
    await db.collection('users').updateOne(
      { sid: req.user.sid },
      { $inc: { credits: 1 } }
    );
    
    // Check if target reached
    const updatedQuestionnaire = await db.collection('questionnaires').findOne({
      _id: new ObjectId(id)
    });
    
    if (updatedQuestionnaire.currentResponses >= updatedQuestionnaire.targetResponses) {
      await db.collection('questionnaires').updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: 'completed' } }
      );
    }
    
    res.json({ 
      ok: true, 
      message: 'Questionnaire filled. You earned 1 credit!'
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// GET user's questionnaires
router.get('/my', requireAuth, async (req, res) => {
  try {
    const db = await connectDB();
    const questionnaires = await db.collection('questionnaires')
      .find({ creatorSid: req.user.sid })
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json({ ok: true, data: questionnaires });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

export default router;
