import { GridFSBucket } from 'mongodb';
import { Readable } from 'stream';
import connectDB from './connection.js';

let bucket;

const getBucket = async () => {
  if (!bucket) {
    const db = await connectDB();
    bucket = new GridFSBucket(db, {
      bucketName: 'uploads'
    });
  }
  return bucket;
};

export const uploadToGridFS = async (fileBuffer, filename, metadata = {}) => {
  const bucket = await getBucket();
  
  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: {
        ...metadata,
        uploadedAt: new Date()
      }
    });
    
    const readable = new Readable();
    readable.push(fileBuffer);
    readable.push(null);
    
    readable.pipe(uploadStream)
      .on('error', reject)
      .on('finish', () => {
        resolve({
          fileId: uploadStream.id,
          filename: uploadStream.filename,
          metadata: uploadStream.options.metadata
        });
      });
  });
};

export const downloadFromGridFS = async (fileId) => {
  const bucket = await getBucket();
  
  return new Promise((resolve, reject) => {
    const downloadStream = bucket.openDownloadStream(fileId);
    const chunks = [];
    
    downloadStream.on('data', (chunk) => {
      chunks.push(chunk);
    });
    
    downloadStream.on('error', (err) => {
      if (err.message.includes('FileNotFound')) {
        reject(new Error('File not found in GridFS'));
      } else {
        reject(err);
      }
    });
    
    downloadStream.on('end', () => {
      const buffer = Buffer.concat(chunks);
      resolve(buffer);
    });
  });
};

export const streamFileFromGridFS = async (fileId, res) => {
  const bucket = await getBucket();
  
  return new Promise((resolve, reject) => {
    const downloadStream = bucket.openDownloadStream(fileId);
    
    downloadStream.on('error', reject);
    downloadStream.on('end', resolve);
    
    downloadStream.pipe(res);
  });
};

export const deleteFromGridFS = async (fileId) => {
  const bucket = await getBucket();
  await bucket.delete(fileId);
};

export default {
  uploadToGridFS,
  downloadFromGridFS,
  streamFileFromGridFS,
  deleteFromGridFS
};
