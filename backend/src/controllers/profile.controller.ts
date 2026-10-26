import bcrypt from 'bcryptjs'
import type { Request, Response } from 'express'
import type { Prisma } from '../generated/prisma/client.js'
import { env } from '../config/env.js'
import { prisma } from '../config/prisma.js'
import { fail, success } from '../utils/response.js'
import { serializeUser } from '../utils/serializers.js'
import {
  removeStoredFile,
  removeUploadedFile,
  storedFilePath,
} from '../utils/storage.js'

function sendValidationErrors(
  res: Response,
  errors: Record<string, string[]>,
): void {
  const messages = Object.values(errors).flat()
  const remaining = messages.length - 1
  const message =
    remaining > 0
      ? `${messages[0]} (and ${remaining} more ${remaining === 1 ? 'error' : 'errors'})`
      : messages[0] ?? 'Data tidak valid.'
  fail(res, 422, message, errors)
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const currentUser = req.user
  if (!currentUser) {
    await removeUploadedFile(req.file)
    fail(res, 401, 'Unauthenticated.')
    return
  }

  const { name, email: rawEmail, nim, password } = req.body as {
    name: string
    email: string
    nim: string
    password?: string
  }
  const email = rawEmail.trim().toLowerCase()
  const conflicts = await prisma.user.findMany({
    where: {
      id: { not: currentUser.id },
      OR: [
        { email: { equals: email, mode: 'insensitive' } },
        { nim },
      ],
    },
    select: { email: true, nim: true },
  })

  const errors: Record<string, string[]> = {}
  if (conflicts.some((user) => user.email.toLowerCase() === email)) {
    errors.email = ['Email sudah terdaftar.']
  }
  if (conflicts.some((user) => user.nim === nim)) {
    errors.nim = ['NIM sudah terdaftar.']
  }
  if (Object.keys(errors).length > 0) {
    await removeUploadedFile(req.file)
    sendValidationErrors(res, errors)
    return
  }

  const data: Prisma.UserUpdateInput = { name, email, nim }
  if (password) data.password = await bcrypt.hash(password, env.BCRYPT_ROUNDS)
  const newAvatar = req.file
    ? storedFilePath('avatars', req.file.filename)
    : undefined
  if (newAvatar) data.avatar = newAvatar

  let user
  try {
    user = await prisma.user.update({
      where: { id: currentUser.id },
      data,
    })
  } catch (error) {
    await removeUploadedFile(req.file)
    throw error
  }

  if (newAvatar && currentUser.avatar) {
    await removeStoredFile(currentUser.avatar).catch((error) => {
      console.error('Gagal menghapus avatar lama:', error)
    })
  }
  success(res, serializeUser(user), 'Profil berhasil diperbarui')
}

export async function deleteAvatar(req: Request, res: Response): Promise<void> {
  const currentUser = req.user
  if (!currentUser) {
    fail(res, 401, 'Unauthenticated.')
    return
  }

  const user = await prisma.user.update({
    where: { id: currentUser.id },
    data: { avatar: null },
  })
  await removeStoredFile(currentUser.avatar).catch((error) => {
    console.error('Gagal menghapus avatar profil:', error)
  })
  success(res, serializeUser(user), 'Foto profil berhasil dihapus')
}
