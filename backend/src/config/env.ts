import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // 資料庫
  DATABASE_URL: z.string().url(),

  // Redis (可選)
  REDIS_URL: z.string().url().optional(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // API
  API_PORT: z.coerce.number().default(3000),
  API_PREFIX: z.string().default('/api'),
  CORS_ORIGIN: z.string().optional(),

  // Gemini AI
  GEMINI_API_KEY: z.string().optional(),

  // 環境
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
