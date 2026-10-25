import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL wajib diisi'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET minimal 32 karakter'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  PUBLIC_BASE_URL: z
    .string()
    .regex(/^https?:\/\/.+/, 'PUBLIC_BASE_URL harus diawali http:// atau https://')
    .default('http://localhost:8000'),
  AVATAR_MAX_UPLOAD_MB: z.coerce.number().positive().default(2),
  TICKET_IMAGE_MAX_UPLOAD_MB: z.coerce.number().positive().default(10),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Konfigurasi environment tidak valid:')
  console.error(parsed.error.issues)
  process.exit(1)
}

const data = parsed.data

export const env = {
  ...data,
  corsOrigins: data.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  isProduction: data.NODE_ENV === 'production',
}
