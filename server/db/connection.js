import { MongoClient } from 'mongodb';

// Load environment variables
const loadEnv = async () => {
  if (process.env.NODE_ENV !== 'production') {
    try {
      // Dynamic import for dotenv only in development
      const dotenv = await import('dotenv');
      dotenv.config();
      console.log('Loaded .env file for development');
    } catch (err) {
      console.warn('Could not load dotenv:', err.message);
    }
  } else {
    console.log('Running in production mode');
  }
};

// Call loadEnv immediately
await loadEnv();

let client;
let db;

const connectDB = async () => {
  if (db) return db;

  const mongoURI = process.env.MONGODB_URI;
  
  if (!mongoURI) {
    console.error('MONGODB_URI is not defined in environment variables');
    console.log('Current NODE_ENV:', process.env.NODE_ENV);
    console.log('Available env vars:', Object.keys(process.env));
    throw new Error('MONGODB_URI is required');
  }

  if (!client) {
    console.log('Connecting to MongoDB...');
    console.log('MongoDB URI:', mongoURI.substring(0, 20) + '...'); // Log first part for debugging
    
    client = new MongoClient(mongoURI, {
      maxPoolSize: 15,
      minPoolSize: 5,
      maxIdleTimeMS: 10000,
      waitQueueTimeoutMS: 10000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 1000*5,
    });

    try {
      await client.connect();
      console.log('MongoDB connected successfully');
    } catch (error) {
      console.error('MongoDB connection failed:', error.message);
      throw error;
    }
  }

  db = client.db();
  console.log('Using database:', db.databaseName);
  return db;
};

export default connectDB;
