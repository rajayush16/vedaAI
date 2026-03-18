import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const envSchema = z.object({
  BACKEND_PORT: z.coerce.number().default(4000),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  MONGODB_URI: z.string().default("mongodb://localhost:27017/vedaai"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  SESSION_SECRET: z.string().default("change-me"),
  OPENAI_API_KEY: z.string().optional(),
  DEMO_TEACHER_EMAIL: z.string().email().default("teacher@vedaai.dev"),
  DEMO_TEACHER_PASSWORD: z.string().min(8).default("Teacher123!"),
});

export const env = envSchema.parse(process.env);
