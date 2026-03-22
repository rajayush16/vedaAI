import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { z } from "zod";

const envCandidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, "..", ".env"),
  path.resolve(__dirname, "..", "..", ".env"),
  path.resolve(__dirname, "..", "..", "..", ".env"),
];

const envPath = envCandidates.find((candidate) => fs.existsSync(candidate));

dotenv.config(envPath ? { path: envPath } : undefined);

const envSchema = z.object({
  BACKEND_PORT: z.coerce.number().default(Number(process.env.PORT ?? 4000)),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  MONGODB_URI: z.string().default("mongodb://localhost:27017/vedaai"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  SESSION_SECRET: z.string().default("change-me"),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
  GEMINI_API_KEY: z.string().optional(),
  DEMO_TEACHER_EMAIL: z.string().email().default("teacher@vedaai.dev"),
  DEMO_TEACHER_PASSWORD: z.string().min(8).default("Teacher123!"),
});

export const env = envSchema.parse({
  ...process.env,
  BACKEND_PORT: process.env.PORT ?? process.env.BACKEND_PORT,
});
