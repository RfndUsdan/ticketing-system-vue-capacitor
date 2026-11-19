import type { Request, Response } from 'express'
import { prisma } from '../config/prisma.js'
import { fail, success } from '../utils/response.js'
import { serializeNotification } from '../utils/serializers.js'

export async function listNotifications(req: Request, res: Response): Promise<void> {
  const user = req.user
  if (!user) {
    fail(res, 401, 'Unauthenticated.')
    return
  }

  const page = Math.max(1, Number(req.query.page ?? 1) || 1)
  const perPage = Math.min(50, Math.max(1, Number(req.query.per_page ?? 20) || 20))
  const unreadOnly = String(req.query.unread ?? '') === '1' || String(req.query.unread ?? '') === 'true'

  const where = {
    userId: user.id,
    ...(unreadOnly ? { readAt: null } : {}),
  }

  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
  ])

  res.status(200).json({
    message: 'Daftar notifikasi berhasil ditampilkan',
    data: items.map(serializeNotification),
    meta: {
      current_page: page,
      per_page: perPage,
      last_page: Math.max(1, Math.ceil(total / perPage)),
      total,
      unread_count: unreadCount,
    },
  })
}

export async function unreadCount(req: Request, res: Response): Promise<void> {
  const user = req.user
  if (!user) {
    fail(res, 401, 'Unauthenticated.')
    return
  }

  const count = await prisma.notification.count({
    where: { userId: user.id, readAt: null },
  })

  success(res, { unread_count: count }, 'Jumlah notifikasi belum dibaca')
}

export async function markAsRead(req: Request, res: Response): Promise<void> {
  const user = req.user
  if (!user) {
    fail(res, 401, 'Unauthenticated.')
    return
  }

  const id = Number(req.params.id)
  if (!Number.isFinite(id)) {
    fail(res, 400, 'ID notifikasi tidak valid.')
    return
  }

  const result = await prisma.notification.updateMany({
    where: { id, userId: user.id, readAt: null },
    data: { readAt: new Date() },
  })

  if (result.count === 0) {
    // Could be already read or not found/not owned; treat as success for idempotency
  }

  const notification = await prisma.notification.findFirst({
    where: { id, userId: user.id },
  })

  if (!notification) {
    fail(res, 404, 'Notifikasi tidak ditemukan.')
    return
  }

  success(res, serializeNotification(notification), 'Notifikasi ditandai sudah dibaca')
}

export async function markAllAsRead(req: Request, res: Response): Promise<void> {
  const user = req.user
  if (!user) {
    fail(res, 401, 'Unauthenticated.')
    return
  }

  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  })

  success(res, { ok: true }, 'Semua notifikasi ditandai sudah dibaca')
}

export async function registerDeviceToken(req: Request, res: Response): Promise<void> {
  const user = req.user
  if (!user) {
    fail(res, 401, 'Unauthenticated.')
    return
  }

  const token = typeof req.body?.token === 'string' ? req.body.token.trim() : ''
  const platform = typeof req.body?.platform === 'string' ? req.body.platform.trim() : 'unknown'

  if (!token) {
    fail(res, 422, 'Token perangkat wajib diisi.', { token: ['Token perangkat wajib diisi.'] })
    return
  }

  await prisma.deviceToken.upsert({
    where: { token },
    update: { userId: user.id, platform: platform || 'unknown' },
    create: { userId: user.id, token, platform: platform || 'unknown' },
  })

  success(res, { ok: true }, 'Token perangkat berhasil didaftarkan')
}
