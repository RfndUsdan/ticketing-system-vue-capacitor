import { randomInt } from 'node:crypto'

/**
 * TODO: ganti dengan sequence PostgreSQL (mis. TKT-2026-0001) agar kode
 * dijamin unik tanpa perlu retry saat terjadi collision.
 */
export function generateTicketCode(now = new Date()): string {
  return `TKT-${now.getFullYear()}-${randomInt(100000, 1000000)}`
}
