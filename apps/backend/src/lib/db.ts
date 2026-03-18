import mongoose from "mongoose";
import { env } from "../config";

let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectToDatabase() {
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(env.MONGODB_URI);
  }

  return connectionPromise;
}
