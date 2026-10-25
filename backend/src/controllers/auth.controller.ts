import fs from 'node:fs/promises'
import bcrypt from 'bcryptjs'
import type { Request, Response } from 'express'
import { env } from '../config/env.js'
import { prisma } from '../config/prisma.js'
import { signAccessToken } from '../utils/jwt.js'
import { fail, success } from '../utils/response.js'
import { serializeUser } from '../utils/serializers.js'

const normalizeEmail = (email: unknown): string =>
  String(email ?? '').trim().toLowerCase()

const removeUploadedFile = async (file?: Express.Multer.File): Promise<void> => {
  if (!file) return
  await fs.unlink(file.path).catch(() => undefined)
}

export async function register(req: Request, res: Response): Promise<void> {
  const name = String(req.body.name).trim()
  const password = String(req.body.password)
  const nim = String(req.body.nim).trim()
  const email = normalizeEmail(req.body.email)
  const avatar = req.file ? `avatars/${req.file.filename}` : null

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { nim }] },
    select: { email: true, nim: true },
  })

  if (existing) {
    await removeUploadedFile(req.file)

    const errors: Record<string, string[]> = {}
    if (existing.email === email) errors.email = ['Email sudah terdaftar.']
    if (existing.nim === nim) errors.nim = ['NIM sudah terdaftar.']
    const messages = Object.values(errors).flat()
    const remaining = messages.length - 1
    const message =
      remaining > 0
        ? `${messages[0]} (and ${remaining} more ${remaining === 1 ? 'error' : 'errors'})`
        : messages[0] ?? 'Data tidak valid.'
    fail(res, 422, message, errors)
    return
  }

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: await bcrypt.hash(password, env.BCRYPT_ROUNDS),
        nim,
        role: 'user',
        ...(avatar ? { avatar } : {}),
      },
    })

    success(
      res,
      { token: signAccessToken(user), user: serializeUser(user) },
      'Registrasi berhasil',
      201,
    )
  } catch (error) {
    await removeUploadedFile(req.file)
    throw error
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const email = normalizeEmail(req.body?.email)
  const password = String(req.body?.password ?? '')

  const user = await prisma.user.findUnique({ where: { email } })
  const passwordMatches = user
    ? await bcrypt.compare(password, user.password)
    : false

  if (!user || !passwordMatches) {
    res.status(401).json({ message: 'Unauthorized', data: null })
    return
  }

  success(
    res,
    { token: signAccessToken(user), user: serializeUser(user) },
    'Login berhasil',
  )
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    fail(res, 401, 'Unauthenticated.')
    return
  }

  success(res, serializeUser(req.user), 'Profile User berhasil diambil')
}

export async function logout(_req: Request, res: Response): Promise<void> {
  // JWT bersifat stateless; token dihapus di sisi client.
  // TODO: tambahkan refresh token/denylist jika butuh revoke token di server.
  success(res, null, 'Logout berhasil')
}
