import { z } from 'zod'
import {
  TICKET_CATEGORIES,
  TICKET_STATUSES,
} from '../utils/constants.js'

export const createTicketSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Judul wajib diisi.')
    .max(255, 'Judul maksimal 255 karakter.'),
  category: z.enum(TICKET_CATEGORIES),
  priority: z
    .enum(['low', 'normal', 'medium', 'high'])
    .default('medium')
    // Backend menyimpan medium; frontend lama masih mengirim "normal".
    .transform((value) => (value === 'normal' ? 'medium' : value)),
  description: z.string().trim().min(1, 'Deskripsi wajib diisi.'),
})

const replyContentSchema = z.string().trim().min(1, 'Jawaban wajib diisi.')

export const createReplySchema = z.object({
  content: replyContentSchema,
  // Status dari user tidak dipakai oleh controller; pertahankan toleransi payload.
  status: z.unknown().optional(),
})

export const createAdminReplySchema = z.object({
  content: replyContentSchema,
  status: z.enum(TICKET_STATUSES),
})

export const listTicketsQuerySchema = z.object({
  search: z.string().trim().optional(),
  // Accept the current frontend typo as an alias; controller filters canonical values.
  status: z.preprocess(
    (value) => (value === 'on_progress' ? 'in_progress' : value),
    z.string().optional(),
  ),
  // The create form sends normal while this backend stores medium.
  priority: z.preprocess(
    (value) => (value === 'normal' ? 'medium' : value),
    z.string().optional(),
  ),
  date: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.enum(['today', 'week', 'month']).optional(),
  ),
  page: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.coerce.number().int().min(1).optional(),
  ),
  per_page: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.coerce.number().int().min(1).max(100).optional(),
  ),
})

export type TicketListQuery = z.infer<typeof listTicketsQuerySchema>
