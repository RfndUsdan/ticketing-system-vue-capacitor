import type { Request, Response } from 'express'
import { notImplemented } from '../utils/response.js'

/**
 * TODO implementasi manajemen user (khusus admin):
 * - GET /users: pagination + search.
 * - GET /users/:id: detail user.
 * - POST /users: buat user; hash password; simpan avatar dari req.file.
 * - PUT/PATCH /users/:id: update parsial; POST tetap sebagai alias frontend.
 * - DELETE /users/:id: cegah admin menghapus dirinya sendiri.
 */
export async function listUsers(_req: Request, res: Response): Promise<void> {
  notImplemented(res, 'GET /users')
}

export async function getUser(_req: Request, res: Response): Promise<void> {
  notImplemented(res, 'GET /users/:id')
}

export async function createUser(_req: Request, res: Response): Promise<void> {
  notImplemented(res, 'POST /users')
}

export async function updateUser(_req: Request, res: Response): Promise<void> {
  notImplemented(res, 'PUT/PATCH /users/:id')
}

export async function deleteUser(_req: Request, res: Response): Promise<void> {
  notImplemented(res, 'DELETE /users/:id')
}
