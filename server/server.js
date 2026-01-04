import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables for development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
  console.log('📁 Loaded .env file for development');
} else {
  console.log('🚀 Running in production mode');
}

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://platform-efs.vercel.app',
    ];
    
    if (process.env.NODE_ENV === 'development' || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Import and use routes
import indexRouter from './routes/index.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import coursesRouter from './routes/courses.js';
import calendarRouter from './routes/calendar.js';
import dashboardRouter from './routes/dashboard.js';
import groupRouter from './routes/group.js';
import materialsRouter from './routes/materials.js';
import profileRouter from './routes/profile.js';
import questionnaireRouter from './routes/questionnaire.js';
import uploadRouter from './routes/upload.js';
import meRouter from './routes/me.js';

app.use('/api', indexRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/group', groupRouter);
app.use('/api/materials', materialsRouter);
app.use('/api/profile', profileRouter);
app.use('/api/questionnaire', questionnaireRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/me', meRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    ok: true, 
    message: 'EFS API Server is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    ok: false, 
    error: 'API endpoint not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      ok: false,
      error: 'CORS Error: Origin not allowed'
    });
  }
  
  res.status(err.status || 500).json({
    ok: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// For Vercel, export the app
export default app;
