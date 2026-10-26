import { randomInt } from 'node:crypto'

export function generateTicketCode(): string {
  return `TICS${randomInt(10000, 100000)}`
}
