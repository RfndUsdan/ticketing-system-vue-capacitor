import { createHash, randomBytes } from 'node:crypto'
import fs from 'node:fs/promises'
import bcrypt from 'bcryptjs'
import type { Request, Response } from 'express'
import { env } from '../config/env.js'
import { prisma } from '../config/prisma.js'
import { signAccessToken } from '../utils/jwt.js'
import { sendPasswordResetEmail } from '../utils/passwordResetMailer.js'
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

const hashResetToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex')

const isResetTokenShapeValid = (token: string): boolean =>
  /^[a-f0-9]{64}$/i.test(token)

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const email = normalizeEmail(req.body.email)
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  })

  // Respons yang sama untuk email terdaftar maupun tidak, agar tidak membocorkan akun.
  if (!user) {
    success(res, null, 'Jika email terdaftar, tautan reset password telah dikirim.')
    return
  }

  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id, usedAt: null },
  })

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(
    Date.now() + env.PASSWORD_RESET_TTL_MINUTES * 60_000,
  )

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashResetToken(token),
      expiresAt,
    },
  })

  const resetUrl = `${env.FRONTEND_URL.replace(/\/+$/, '')}/auth/reset-password/${token}`
  let delivered = false

  try {
    delivered = await sendPasswordResetEmail(user.email, resetUrl)
  } catch (error) {
    console.error('[password-reset] Gagal mengirim email:', error)
    if (env.isProduction) {
      fail(res, 503, 'Gagal mengirim email reset. Silakan coba lagi nanti.')
      return
    }
  }

  if (!delivered && env.isProduction) {
    fail(res, 503, 'Pengiriman email reset belum dikonfigurasi.')
    return
  }

  // Mode tanpa email provider: tautan dikembalikan agar alur tetap bisa diuji.
  if (!delivered) {
    console.warn(`[password-reset] Tautan reset (development): ${resetUrl}`)
  }

  success(
    res,
    delivered ? null : { dev_reset_url: resetUrl },
    'Jika email terdaftar, tautan reset password telah dikirim.',
  )
}

export async function validateResetToken(
  req: Request,
  res: Response,
): Promise<void> {
  const token = String(req.params.token ?? '')
  if (!isResetTokenShapeValid(token)) {
    fail(res, 400, 'Token reset tidak valid.')
    return
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
    select: {
      usedAt: true,
      expiresAt: true,
      user: { select: { email: true } },
    },
  })

  if (!record || record.usedAt || record.expiresAt <= new Date()) {
    fail(res, 410, 'Tautan reset tidak valid atau sudah kedaluwarsa.')
    return
  }

  const email = record.user.email
  const maskedEmail = email.replace(/^(.{1,2}).*(@.*)$/, '$1***$2')
  success(res, { valid: true, email: maskedEmail }, 'Tautan reset valid.')
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, password } = req.body as { token: string; password: string }

  if (!isResetTokenShapeValid(token)) {
    fail(res, 400, 'Token reset tidak valid.')
    return
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
    select: { id: true, userId: true, usedAt: true, expiresAt: true },
  })

  if (!record || record.usedAt || record.expiresAt <= new Date()) {
    fail(res, 410, 'Tautan reset tidak valid atau sudah kedaluwarsa.')
    return
  }

  const hashedPassword = await bcrypt.hash(password, env.BCRYPT_ROUNDS)
  const now = new Date()

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { password: hashedPassword },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: now },
    }),
    prisma.passwordResetToken.updateMany({
      where: {
        userId: record.userId,
        usedAt: null,
        id: { not: record.id },
      },
      data: { usedAt: now },
    }),
  ])

  success(res, null, 'Password berhasil diubah. Silakan login dengan password baru.')
}

