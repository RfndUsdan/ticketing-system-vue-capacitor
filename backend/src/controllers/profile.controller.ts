import type { Request, Response } from 'express'
import { notImplemented } from '../utils/response.js'

/**
 * TODO implementasi profil:
 * - POST /profile
 *   Update name/email/nim/password milik user aktif.
 *   Avatar opsional dari req.file (field "avatar").
 * - DELETE /profile/avatar
 *   Hapus avatar user aktif + file lama.
 */
export async function updateProfile(_req: Request, res: Response): Promise<void> {
  notImplemented(res, 'POST /profile')
}

export async function deleteAvatar(_req: Request, res: Response): Promise<void> {
  notImplemented(res, 'DELETE /profile/avatar')
}
