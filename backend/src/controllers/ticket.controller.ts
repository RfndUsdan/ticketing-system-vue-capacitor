import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
import type { Request, Response } from 'express'
import type { Prisma } from '../generated/prisma/client.js'
import { prisma } from '../config/prisma.js'
import { fail, success } from '../utils/response.js'
import { serializeReply, serializeTicket } from '../utils/serializers.js'
import { generateTicketCode } from '../utils/ticketCode.js'
import {
  listTicketsQuerySchema,
  type TicketListQuery,
} from '../validators/ticket.validator.js'

const ticketRelations = {
  reporter: true,
  replies: {
    orderBy: { id: 'asc' as const },
    include: { user: true },
  },
  images: {
    orderBy: { id: 'asc' as const },
  },
}

function getValidatedQuery(req: Request): TicketListQuery {
  const validated = (req as Request & { validatedQuery?: TicketListQuery })
    .validatedQuery
  return validated ?? listTicketsQuerySchema.parse(req.query)
}

function getDateRange(
  date: TicketListQuery['date'],
  now = new Date(),
): { gte: Date; lt: Date } | undefined {
  if (!date) return undefined

  if (date === 'month') {
    return {
      gte: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
      lt: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)),
    }
  }

  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  )

  if (date === 'today') {
    const end = new Date(start)
    end.setUTCDate(end.getUTCDate() + 1)
    return { gte: start, lt: end }
  }

  // Calendar week starts on Monday (UTC), matching the UI label "Minggu Ini".
  const daysSinceMonday = (start.getUTCDay() + 6) % 7
  start.setUTCDate(start.getUTCDate() - daysSinceMonday)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 7)
  return { gte: start, lt: end }
}

async function removeUploadedFile(file?: Express.Multer.File): Promise<void> {
  if (!file) return
  await fs.unlink(file.path).catch(() => undefined)
}

async function removeUploadedFiles(files?: Express.Multer.File[]): Promise<void> {
  if (!files || files.length === 0) return
  await Promise.all(files.map((file) => fs.unlink(file.path).catch(() => undefined)))
}

function normalizeForDuplicateCheck(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('id-ID')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

export async function listTickets(req: Request, res: Response): Promise<void> {
  const user = req.user
  if (!user) {
    fail(res, 401, 'Unauthenticated.')
    return
  }

  const query = getValidatedQuery(req)
  const where: Prisma.TicketWhereInput = { deletedAt: null }

  if (user.role !== 'admin') where.userId = user.id
  if (query.status) where.status = query.status
  if (query.priority) where.priority = query.priority
  if (query.search) {
    where.OR = [
      { code: { contains: query.search, mode: 'insensitive' } },
      { title: { contains: query.search, mode: 'insensitive' } },
    ]
  }

  const dateRange = getDateRange(query.date)
  if (dateRange) where.createdAt = dateRange

  // Pagination is opt-in so the existing Vue store still receives its full array.
  const isPaginated = query.page !== undefined || query.per_page !== undefined
  const page = query.page ?? 1
  const perPage = query.per_page ?? 10

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: ticketRelations,
      ...(isPaginated ? { skip: (page - 1) * perPage, take: perPage } : {}),
    }),
    prisma.ticket.count({ where }),
  ])

  const data = tickets.map((ticket) => serializeTicket(ticket))
  const message = 'Daftar Ticket berhasil ditampilkan'

  if (isPaginated) {
    res.status(200).json({
      message,
      data,
      meta: {
        current_page: page,
        per_page: perPage,
        last_page: Math.max(1, Math.ceil(total / perPage)),
        total,
      },
    })
    return
  }

  success(res, data, message)
}

export async function createTicket(req: Request, res: Response): Promise<void> {
  const user = req.user
  if (!user) {
    await removeUploadedFiles(req.files as Express.Multer.File[] | undefined)
    fail(res, 401, 'Unauthenticated.')
    return
  }

  const { title, category, location, priority, description } = req.body as {
    title: string
    category: string
    location: string
    priority: string
    description: string
  }
  const files = (req.files as Express.Multer.File[] | undefined) ?? []
  const image = files[0] ? `tickets/${files[0].filename}` : null
  const idempotencyKey = req.get('Idempotency-Key')?.trim()

  if (!idempotencyKey || !/^[0-9a-f-]{36}$/i.test(idempotencyKey)) {
    await removeUploadedFiles(files)
    res.status(400).json({ message: 'Header Idempotency-Key wajib berisi UUID yang valid.' })
    return
  }

  const payloadHash = createHash('sha256')
    .update(JSON.stringify({ title, category, location, priority, description }))
  for (const file of files) {
    payloadHash.update(file.mimetype)
    payloadHash.update(await fs.readFile(file.path))
  }
  const idempotencyHash = payloadHash.digest('hex')
  const allowDuplicate = req.get('X-Allow-Duplicate') === 'true'

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Lock the account row so concurrent requests cannot bypass ticket limits.
      await tx.$queryRaw`SELECT "id" FROM "users" WHERE "id" = ${user.id} FOR UPDATE`

      const previousRequest = await tx.ticket.findFirst({
        where: { userId: user.id, idempotencyKey },
        include: { ...ticketRelations, reporter: true },
      })
      if (previousRequest) {
        return previousRequest.idempotencyHash === idempotencyHash
          ? { kind: 'replay' as const, ticket: previousRequest }
          : { kind: 'key-conflict' as const }
      }

      const now = new Date()
      const duplicateWindowStart = new Date(now.getTime() - 10 * 60_000)
      const recentTickets = await tx.ticket.findMany({
        where: {
          userId: user.id,
          deletedAt: null,
          createdAt: { gte: duplicateWindowStart, lte: now },
          category,
          location,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          code: true,
          title: true,
          description: true,
          createdAt: true,
        },
      })
      const normalizedTitle = normalizeForDuplicateCheck(title)
      const normalizedDescription = normalizeForDuplicateCheck(description)
      const duplicate = recentTickets.find((ticket) =>
        normalizeForDuplicateCheck(ticket.title) === normalizedTitle &&
        normalizeForDuplicateCheck(ticket.description) === normalizedDescription,
      )

      if (duplicate && !allowDuplicate) {
        return { kind: 'duplicate' as const, ticket: duplicate }
      }

      const dayStart = new Date(Date.UTC(
        now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
      ))
      const dayEnd = new Date(dayStart)
      dayEnd.setUTCDate(dayEnd.getUTCDate() + 1)

      const ticketsToday = await tx.ticket.count({
        where: { userId: user.id, createdAt: { gte: dayStart, lt: dayEnd } },
      })
      if (ticketsToday >= 5) {
        return { kind: 'daily-limit' as const, retryAt: dayEnd }
      }

      const latestTicket = await tx.ticket.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      })
      const nextAllowedAt = latestTicket
        ? new Date(latestTicket.createdAt.getTime() + 60_000)
        : null
      if (nextAllowedAt && now < nextAllowedAt) {
        return { kind: 'cooldown' as const, retryAt: nextAllowedAt }
      }

      const created = await tx.ticket.create({
        data: {
          code: await generateTicketCode(tx),
          userId: user.id,
          idempotencyKey,
          idempotencyHash,
          title,
          category,
          location,
          priority,
          description,
          image,
          status: 'open',
          completedAt: null,
        },
      })

      if (files.length > 0) {
        await tx.ticketImage.createMany({
          data: files.slice(0, 5).map((file) => ({
            ticketId: created.id,
            path: `tickets/${file.filename}`,
          })),
        })
      }

      const ticket = await tx.ticket.findUniqueOrThrow({
        where: { id: created.id },
        include: { ...ticketRelations, reporter: true },
      })
      return { kind: 'created' as const, ticket }
    })

    if (result.kind === 'key-conflict') {
      await removeUploadedFiles(files)
      res.status(409).json({ message: 'Idempotency-Key sudah digunakan untuk data tiket yang berbeda.' })
      return
    }
    if (result.kind === 'duplicate') {
      await removeUploadedFiles(files)
      res.status(409).json({
        code: 'DUPLICATE_TICKET',
        message: 'Ditemukan tiket serupa yang baru dibuat.',
        duplicate: {
          code: result.ticket.code,
          title: result.ticket.title,
          created_at: result.ticket.createdAt.toISOString(),
        },
      })
      return
    }
    if (result.kind === 'replay') {
      await removeUploadedFiles(files)
      success(
        res,
        serializeTicket(result.ticket, { withReplies: false }),
        'Tiket sebelumnya berhasil dibuat',
        201,
      )
      return
    }

    if (result.kind !== 'created') {
      await removeUploadedFiles(files)
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((result.retryAt.getTime() - Date.now()) / 1000),
      )
      res.setHeader('Retry-After', String(retryAfterSeconds))
      res.status(429).json({
        message: result.kind === 'daily-limit'
          ? 'Batas 5 tiket per hari telah tercapai. Silakan coba lagi besok.'
          : 'Tunggu 1 menit sebelum membuat tiket berikutnya.',
        retry_after_seconds: retryAfterSeconds,
        retry_at: result.retryAt.toISOString(),
      })
      return
    }

    success(
      res,
      serializeTicket(result.ticket, { withReplies: false }),
      'Ticket berhasil ditambahkan',
      201,
    )
  } catch (error) {
    await removeUploadedFiles(files)
    throw error
  }
}

export async function getTicket(req: Request, res: Response): Promise<void> {
  const user = req.user
  if (!user) {
    fail(res, 401, 'Unauthenticated.')
    return
  }

  const ticket = await prisma.ticket.findFirst({
    where: { code: String(req.params.code), deletedAt: null },
    include: ticketRelations,
  })

  if (!ticket) {
    fail(res, 404, 'Ticket tidak ditemukan')
    return
  }

  if (user.role !== 'admin' && ticket.userId !== user.id) {
    fail(res, 403, 'Anda tidak memiliki akses ke ticket ini')
    return
  }

  success(res, serializeTicket(ticket), 'Ticket berhasil ditampilkan')
}

export async function deleteTicket(req: Request, res: Response): Promise<void> {
  const code = String(req.params.code)
  try {
    const result = await prisma.ticket.updateMany({
      where: { code, deletedAt: null },
      data: { deletedAt: new Date() },
    })

    if (result.count === 0) {
      res.status(404).json({ message: 'Ticket tidak ditemukan' })
      return
    }

    res.status(200).json({ message: 'Ticket berhasil dihapus' })
  } catch (error) {
    console.error('Gagal menghapus ticket:', error)
    res.status(500).json({ message: 'Gagal menghapus ticket' })
  }
}

export async function createReply(req: Request, res: Response): Promise<void> {
  const user = req.user
  if (!user) {
    fail(res, 401, 'Unauthenticated.')
    return
  }

  const code = String(req.params.code)
  const content = String(req.body.content ?? '')
  const status = req.body.status as string | undefined

  if (user.role === 'admin' && !status) {
    fail(res, 422, 'Status wajib diisi untuk admin.', {
      status: ['Status wajib diisi untuk admin.'],
    })
    return
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.findFirst({
        where: { code, deletedAt: null },
        select: { id: true, userId: true },
      })

      if (!ticket) return { kind: 'not-found' as const }
      if (user.role !== 'admin' && ticket.userId !== user.id) {
        return { kind: 'forbidden' as const }
      }

      const reply = await tx.ticketReply.create({
        data: { ticketId: ticket.id, userId: user.id, content },
        include: { user: true },
      })

      if (user.role === 'admin' && status) {
        await tx.ticket.update({
          where: { id: ticket.id },
          data: {
            status,
            ...(status === 'resolved' ? { completedAt: new Date() } : {}),
          },
        })
      }

      return { kind: 'created' as const, reply }
    })

    if (result.kind === 'not-found') {
      res.status(404).json({ message: 'Tiket tidak ditemukan' })
      return
    }
    if (result.kind === 'forbidden') {
      res.status(403).json({ message: 'Anda tidak bisa membalas tiket ini' })
      return
    }

    success(
      res,
      serializeReply(result.reply),
      'Balasan tiket berhasil ditambahkan',
      201,
    )
  } catch (error) {
    console.error('Gagal membuat balasan tiket:', error)
    res.status(500).json({
      message: 'Terjadi Kesalahan',
      data: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
