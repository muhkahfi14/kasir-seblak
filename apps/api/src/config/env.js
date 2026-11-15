import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().default('postgresql://postgres:password@localhost:5432/kasir_seblak?schema=public'),
  SESSION_SECRET: z.string().min(1).default('kasir-seblak-super-secret-key-change-me'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Konfigurasi environment tidak valid:', parsed.error.format());
  throw new Error('Konfigurasi environment tidak valid');
}

export const env = parsed.data;
export default env;
