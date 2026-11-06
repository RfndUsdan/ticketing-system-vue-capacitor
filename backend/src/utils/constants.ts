export const TICKET_STATUSES = ['open', 'in_progress', 'resolved', 'rejected'] as const
export type TicketStatus = (typeof TICKET_STATUSES)[number]

export const TICKET_PRIORITIES = ['low', 'medium', 'high'] as const
export type TicketPriority = (typeof TICKET_PRIORITIES)[number]

export const TICKET_CATEGORIES = [
  'Fasilitas',
  'Jaringan',
  'Kebersihan',
  'Administrasi',
  'Lainnya',
] as const
export type TicketCategory = (typeof TICKET_CATEGORIES)[number]

export const TICKET_LOCATIONS = [
  'K1',
  'K2',
  'K3',
  'LT',
  'GT',
  'PK1',
  'PK2',
  'PGT',
  'PLT',
] as const
export type TicketLocation = (typeof TICKET_LOCATIONS)[number]

export const USER_ROLES = ['user', 'admin'] as const
export type UserRole = (typeof USER_ROLES)[number]
