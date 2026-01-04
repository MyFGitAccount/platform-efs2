import { MongoClient } from 'mongodb';

let client;
let db;

const connectDB = async () => {
  if (db) return db;
  
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI, {
      maxPoolSize: 15,
      minPoolSize: 5,
      maxIdleTimeMS: 10000,
      waitQueueTimeoutMS: 10000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
    });

    await client.connect();
  }

  db = client.db();
  return db;
};

export default connectDB;
