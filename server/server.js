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

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://platform-efs2.vercel.app',
      'https://hku.wiki'
    ];
    
    const allowedPatterns = [
      'https://*.vercel.app'
    ];
    
    // 1. Check for direct match first
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // 2. Check for pattern match (wildcards)
    for (const pattern of allowedPatterns) {
      // Convert pattern to regex
      const regexString = pattern
        .replace(/\./g, '\\.')  // Escape dots
        .replace(/\*/g, '.*');   // Replace * with .*
      const regex = new RegExp(`^${regexString}$`);
      
      if (regex.test(origin)) {
        return callback(null, true);
      }
    }
    
    // 3. In development mode, log and allow for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Development mode: Allowing origin ${origin}`);
      return callback(null, true);
    }
    
    // 4. Origin not allowed
    console.warn('❌ Blocked by CORS:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Import routes
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

// Mount API routes
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

// Health check - explicitly defined route
app.get('/api/health', (req, res) => {
  res.json({ 
    ok: true, 
    message: 'EFS API Server is running',
    timestamp: new Date().toISOString()
  });
});

// API root endpoint - explicitly defined before catch-all
app.get('/api', (req, res) => {
  res.json({
    ok: true,
    message: 'EFS Platform API',
    endpoints: {
      auth: '/api/auth',
      courses: '/api/courses',
      calendar: '/api/calendar',
      group: '/api/group',
      questionnaire: '/api/questionnaire',
      materials: '/api/materials',
      dashboard: '/api/dashboard',
      profile: '/api/profile',
      admin: '/api/admin',
      upload: '/api/upload',
      me: '/api/me',
      health: '/api/health',
      'test-db': '/api/test-db',
      info: '/api/info'
    },
    version: '1.0.0'
  });
});

// Root endpoint redirects to /api
app.get('/', (req, res) => {
  res.redirect('/api');
});

// Catch-all 404 handler for all routes (using a function instead of '*')
app.use((req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    res.status(404).json({
      ok: false,
      error: 'API endpoint not found',
      path: req.originalUrl
    });
  } else {
    res.status(404).json({
      ok: false,
      error: 'Route not found',
      path: req.originalUrl
    });
  }
});

// Global error handler
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

// Only start the server locally 
if (process.env.NODE_ENV !== 'production') { 
   app.listen(PORT, () => { 
     console.log(`🚀 Server running locally on http://localhost:${PORT}`);
     console.log(`🔌 API available at http://localhost:${PORT}/api`);
   }); 
}

// For Vercel, export the app
export default app;
