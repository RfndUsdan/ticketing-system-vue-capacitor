import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../config/prisma.js'
import { verifyAccessToken } from '../utils/jwt.js'
import { fail } from '../utils/response.js'

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    fail(res, 401, 'Unauthenticated.')
    return
  }

  try {
    const payload = verifyAccessToken(header.slice(7).trim())
    const rawSubject = typeof payload === 'string' ? undefined : payload.sub
    const userId = Number(rawSubject)

    if (!Number.isInteger(userId)) {
      fail(res, 401, 'Unauthenticated.')
      return
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user) {
      fail(res, 401, 'Unauthenticated.')
      return
    }

    req.user = user
    next()
  } catch {
    fail(res, 401, 'Unauthenticated.')
  }
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.user?.role !== 'admin') {
    fail(res, 403, 'Akses Ditolak, Anda bukan admin')
    return
  }

  next()
}
