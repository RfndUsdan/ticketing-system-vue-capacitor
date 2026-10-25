import 'dotenv/config'
import { defineConfig } from 'prisma/config'

/**
 * Prisma 7 memisahkan konfigurasi CLI dari schema.
 * URL database dibaca dari environment, bukan dari blok datasource.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
})
