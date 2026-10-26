import fs from 'node:fs/promises'
import type { Request, Response } from 'express'
import type { Prisma } from '../generated/prisma/client.js'
import { prisma } from '../config/prisma.js'
import { fail, success, notImplemented } from '../utils/response.js'
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

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  )
}

async function removeUploadedFile(file?: Express.Multer.File): Promise<void> {
  if (!file) return
  await fs.unlink(file.path).catch(() => undefined)
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
    await removeUploadedFile(req.file)
    fail(res, 401, 'Unauthenticated.')
    return
  }

  const { title, category, priority, description } = req.body as {
    title: string
    category: string
    priority: string
    description: string
  }
  const image = req.file ? `tickets/${req.file.filename}` : null

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const ticket = await prisma.ticket.create({
        data: {
          code: generateTicketCode(),
          userId: user.id,
          title,
          category,
          priority,
          description,
          image,
          status: 'open',
          completedAt: null,
        },
        include: { reporter: true },
      })

      success(
        res,
        serializeTicket(ticket, { withReplies: false }),
        'Ticket berhasil ditambahkan',
        201,
      )
      return
    } catch (error) {
      if (isUniqueConstraintError(error) && attempt < 4) continue
      await removeUploadedFile(req.file)
      throw error
    }
  }

  await removeUploadedFile(req.file)
  const error = new Error('Gagal membuat kode tiket unik.') as Error & {
    status?: number
  }
  error.status = 500
  throw error
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
