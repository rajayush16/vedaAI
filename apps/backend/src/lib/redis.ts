import IORedis from "ioredis";
import { env } from "../config";

const globalForRedis = globalThis as typeof globalThis & {
  __vedaaiRedis?: IORedis;
};

export const redis =
  globalForRedis.__vedaaiRedis ??
  new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });

if (!globalForRedis.__vedaaiRedis) {
  globalForRedis.__vedaaiRedis = redis;
}
