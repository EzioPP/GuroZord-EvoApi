import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.union([z.ipv4(), z.literal('localhost')]).default('0.0.0.0'),

  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid database URL'),

  // Redis
  REDIS_URI: z.string().url().default('redis://127.0.0.1:6380'),

  // Evolution API (WhatsApp integration)
  EVOLUTION_API_URL: z.string().url().default('http://localhost:8081'),
  EVOLUTION_INSTANCE: z.string().min(1).default('gurozord'),
  AUTHENTICATION_API_KEY: z.string().min(1, 'AUTHENTICATION_API_KEY is required'),

  // Testing
  TEST_WHATSAPP_NUMBER: z.string().optional(),
});

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('\n');
      console.error('❌ Invalid environment variables:\n', issues);
      process.exit(1);
    }
    throw error;
  }
};

export const env = parseEnv();

export type Env = typeof env;
