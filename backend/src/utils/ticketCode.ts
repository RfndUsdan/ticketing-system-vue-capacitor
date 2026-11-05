import type { Prisma } from '../generated/prisma/client.js'

export async function generateTicketCode(
  tx: Prisma.TransactionClient,
): Promise<string> {
  // Use UTC so every API instance assigns tickets to the same calendar day.
  const dateKey = new Date().toISOString().slice(2, 10).replaceAll('-', '')
  const sequence = await tx.ticketDailySequence.upsert({
    where: { dateKey },
    create: { dateKey, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  })

  if (sequence.lastNumber > 9999) {
    throw new Error(`Nomor tiket harian untuk ${dateKey} sudah mencapai batas.`)
  }

  return `${dateKey}${String(sequence.lastNumber).padStart(4, '0')}`
}
