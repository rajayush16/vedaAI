import IORedis, { type RedisOptions } from "ioredis";
import { env } from "../config";

const globalForRedis = globalThis as typeof globalThis & {
  __vedaaiRedis?: IORedis;
};

export function createRedisClient(options: RedisOptions = {}) {
  const client = new IORedis(env.REDIS_URL, {
    family: 4,
    maxRetriesPerRequest: null,
    ...options,
  });

  client.on("error", (error) => {
    console.error("Redis connection error", error.message);
  });

  return client;
}

export const redis =
  globalForRedis.__vedaaiRedis ??
  createRedisClient();

if (!globalForRedis.__vedaaiRedis) {
  globalForRedis.__vedaaiRedis = redis;
}
