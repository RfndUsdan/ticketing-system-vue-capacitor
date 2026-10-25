import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import multer, { type FileFilterCallback } from 'multer'
import type { Request } from 'express'
import { env } from '../config/env.js'

const currentDir = path.dirname(fileURLToPath(import.meta.url))

/** backend/storage — di-serve sebagai /storage */
export const storageDir = path.resolve(currentDir, '../../storage')
const ticketsDir = path.join(storageDir, 'tickets')
const avatarsDir = path.join(storageDir, 'avatars')

for (const dir of [ticketsDir, avatarsDir]) {
  fs.mkdirSync(dir, { recursive: true })
}

const ticketImageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const avatarMimeTypes = new Set(['image/jpeg', 'image/png', 'image/gif'])
const profileAvatarMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

function createStorage(destination: string) {
  return multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, destination),
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase() || '.jpg'
      callback(null, `${randomUUID()}${extension}`)
    },
  })
}

function createFileFilter(allowedMimeTypes: Set<string>, message: string) {
  return (
    _req: Request,
    file: Express.Multer.File,
    callback: FileFilterCallback,
  ): void => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      const error = new Error(message) as Error & {
        status?: number
        field?: string
      }
      error.status = 422
      error.field = file.fieldname
      callback(error)
      return
    }

    callback(null, true)
  }
}

export const uploadTicketImage = multer({
  storage: createStorage(ticketsDir),
  limits: {
    fileSize: env.TICKET_IMAGE_MAX_UPLOAD_MB * 1024 * 1024,
    files: 1,
  },
  fileFilter: createFileFilter(
    ticketImageMimeTypes,
    'Format gambar harus JPG, PNG, atau WEBP.',
  ),
}).single('image')

/** Register dan admin user: avatar boleh GIF. */
export const uploadAvatar = multer({
  storage: createStorage(avatarsDir),
  limits: { fileSize: env.AVATAR_MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
  fileFilter: createFileFilter(
    avatarMimeTypes,
    'Format avatar harus JPG, PNG, atau GIF.',
  ),
}).single('avatar')

/** Profil sendiri: GIF tidak diizinkan. */
export const uploadProfileAvatar = multer({
  storage: createStorage(avatarsDir),
  limits: { fileSize: env.AVATAR_MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
  fileFilter: createFileFilter(
    profileAvatarMimeTypes,
    'Format avatar harus JPG, PNG, atau WEBP.',
  ),
}).single('avatar')
