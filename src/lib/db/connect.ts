import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI in .env.local");
}
/**
 * Next.js dev mode hot-reloads modules, which would otherwise create
 * a new Mongo connection on every file save. We cache the connection
 * on the global object to survive hot reloads.
 */
let cached = (global as any).mongooseConn;

if (!cached) {
  cached = (global as any).mongooseConn = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI as string).then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}