import { ipKeyGenerator, rateLimit } from 'express-rate-limit'
import type { Request } from 'express'

function accountKey(req: Request): string {
  return req.user ? `user:${req.user.id}` : 'anonymous'
}

function endpointLimit(limit: number, windowMs = 60_000) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Terlalu banyak permintaan. Silakan coba lagi nanti.' },
    keyGenerator: (req) => `${ipKeyGenerator(req.ip ?? '')}:account:${accountKey(req)}`,
  })
}

export const ticketListLimit = endpointLimit(60)
export const ticketCreateLimit = endpointLimit(5)
export const ticketDetailLimit = endpointLimit(120)
export const ticketDeleteLimit = endpointLimit(10)
export const replyCreateLimit = endpointLimit(10)
export const profileUpdateLimit = endpointLimit(10)
export const profileAvatarDeleteLimit = endpointLimit(10)
export const adminReadLimit = endpointLimit(120)
export const adminWriteLimit = endpointLimit(20)

export const loginLimit = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak percobaan login. Silakan coba lagi nanti.' },
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string'
      ? req.body.email.trim().toLowerCase().slice(0, 255)
      : 'unknown'
    return `${ipKeyGenerator(req.ip ?? '')}:account:${email}`
  },
})
