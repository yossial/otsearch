import mongoose from 'mongoose';

interface CachedConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend the global object to persist the connection across hot-reloads in dev
const g = global as typeof globalThis & { _mongooseCache?: CachedConnection };

if (!g._mongooseCache) {
  g._mongooseCache = { conn: null, promise: null };
}

const cache = g._mongooseCache;

export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }

  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, { bufferCommands: false });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
