import jwt, { type SignOptions } from 'jsonwebtoken'
import type { User } from '../generated/prisma/client.js'
import { env } from '../config/env.js'

export function signAccessToken(user: Pick<User, 'id' | 'role'>): string {
  return jwt.sign({ role: user.role }, env.JWT_SECRET, {
    subject: String(user.id),
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  })
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET)
}
