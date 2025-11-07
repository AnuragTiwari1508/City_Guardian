import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable in .env.local');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Global is used here to maintain a cached connection across hot reloads in development
let cached: MongooseCache = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      // AWS optimized connection options for MongoDB Atlas
      maxPoolSize: 10, // Maximum number of connections in the connection pool
      minPoolSize: 2, // Minimum number of connections in the connection pool
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      serverSelectionTimeoutMS: 10000, // How long to try to connect
      socketTimeoutMS: 45000, // How long to wait for a response
      connectTimeoutMS: 10000, // How long to wait while trying to connect
      heartbeatFrequencyMS: 10000, // How often to check if server is still alive
      retryWrites: true,
      w: 'majority' as const,
      // For AWS MongoDB Atlas
      authSource: 'admin',
      compressors: 'zlib', // Use compression for better performance over network
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached.conn = await cached.promise;
    console.log('✅ MongoDB Atlas (AWS) connected successfully');
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    console.error('❌ MongoDB Atlas (AWS) connection failed:', e);
    throw e;
  }
}

export default dbConnect;