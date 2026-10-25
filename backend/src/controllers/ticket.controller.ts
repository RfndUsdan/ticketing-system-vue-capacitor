import type { Request, Response } from 'express'
import { notImplemented } from '../utils/response.js'

/**
 * TODO implementasi tiket:
 * - GET /ticket
 *   User biasa hanya melihat tiket miliknya; admin melihat semua.
 *   Dukung search, status, priority; tanpa pagination dan filter tanggal.
 * - POST /ticket
 *   Simpan path image dari req.file, generate kode dengan generateTicketCode(),
 *   status awal "open", lalu kembalikan serializeTicket().
 * - GET /ticket/:code
 *   Sertakan reporter + replies.user; tolak akses jika bukan pemilik/admin.
 * - DELETE /ticket/:code
 *   Admin-only; soft delete melalui deletedAt.
 */
export async function listTickets(_req: Request, res: Response): Promise<void> {
  notImplemented(res, 'GET /ticket')
}

export async function createTicket(_req: Request, res: Response): Promise<void> {
  notImplemented(res, 'POST /ticket')
}

export async function getTicket(_req: Request, res: Response): Promise<void> {
  notImplemented(res, 'GET /ticket/:code')
}

export async function deleteTicket(_req: Request, res: Response): Promise<void> {
  notImplemented(res, 'DELETE /ticket/:code')
}

/**
 * TODO implementasi balasan:
 * - POST /ticket-reply/:code
 * - Simpan TicketReply, lalu update status tiket dalam satu transaksi
 *   status wajib untuk admin; untuk user, abaikan req.body.status.
 * - Set completedAt saat status menjadi "resolved".
 */
export async function createReply(_req: Request, res: Response): Promise<void> {
  notImplemented(res, 'POST /ticket-reply/:code')
}
