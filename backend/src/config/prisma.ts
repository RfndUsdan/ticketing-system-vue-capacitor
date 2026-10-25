import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js'
import { env } from './env.js'

/**
 * Prisma 7 mewajibkan driver adapter (tidak ada lagi engine Rust bawaan).
 * Satu instance PrismaClient dipakai ulang selama proses Node hidup.
 */
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL })

export const prisma = new PrismaClient({ adapter })
