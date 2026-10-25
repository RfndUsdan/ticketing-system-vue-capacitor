import type { Ticket, TicketReply, User } from '../generated/prisma/client.js'
import { env } from '../config/env.js'

const publicBaseUrl = env.PUBLIC_BASE_URL.replace(/\/+$/, '')

const toIso = (value: Date | null | undefined): string | null =>
  value ? value.toISOString() : null

const toStorageUrl = (filePath: string | null | undefined): string | null => {
  if (!filePath) return null
  if (/^https?:\/\//i.test(filePath)) return filePath
  return `${publicBaseUrl}/storage/${filePath.replace(/^\/+/, '')}`
}

/**
 * Bentuk respons mengikuti kontrak backend Laravel
 * (snake_case untuk field tanggal, `user`, dan `ticket_replies`).
 */
export function serializeUser(user: User | null | undefined) {
  if (!user) return null

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    nim: user.nim ?? null,
    role: user.role,
    avatar: toStorageUrl(user.avatar),
  }
}

export function serializeReply(reply: TicketReply & { user: User }) {
  return {
    id: reply.id,
    content: reply.content,
    created_at: toIso(reply.createdAt),
    user: serializeUser(reply.user),
  }
}

type TicketWithRelations = Ticket & {
  reporter?: User | null
  replies?: Array<TicketReply & { user: User }>
}

export function serializeTicket(
  ticket: TicketWithRelations,
  options: { withReplies?: boolean } = {},
) {
  const withReplies = options.withReplies ?? true

  return {
    id: ticket.id,
    code: ticket.code,
    title: ticket.title,
    category: ticket.category,
    priority: ticket.priority,
    description: ticket.description,
    status: ticket.status,
    image_url: toStorageUrl(ticket.image),
    created_at: toIso(ticket.createdAt),
    updated_at: toIso(ticket.updatedAt),
    completed_at: toIso(ticket.completedAt),
    user: serializeUser(ticket.reporter),
    ...(withReplies
      ? { ticket_replies: (ticket.replies ?? []).map(serializeReply) }
      : {}),
  }
}
