import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { once } from 'node:events'
import fs from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

type ApiResponse = {
  status: number
  body: { message?: string; data?: any }
}

test('API persists tickets, images, replies and status, and enforces ticket ownership', async () => {
  const databaseUrl = process.env.DATABASE_URL
  const databaseName = databaseUrl ? new URL(databaseUrl).pathname.slice(1) : ''
  if (!/(^|[-_])test($|[-_])/i.test(databaseName)) {
    throw new Error(
      'Integration test dibatalkan: DATABASE_URL harus mengarah ke database khusus dengan nama berakhiran _test (contoh: apakabar_test).',
    )
  }

  // Import only after the database safety check: Prisma reads DATABASE_URL at module load.
  const [{ default: app }, { prisma }, { storageDir }] = await Promise.all([
    import('../src/app.js'),
    import('../src/config/prisma.js'),
    import('../src/middlewares/upload.js'),
  ])

  const suffix = randomUUID()
  const email = `integration-${suffix}@example.test`
  const nim = `I${suffix.replaceAll('-', '').slice(0, 19)}`
  const secondEmail = `other-${suffix}@example.test`
  let server: ReturnType<typeof app.listen> | undefined
  let reporterId: number | undefined
  let otherUserId: number | undefined
  let ticketId: number | undefined
  let uploadedPath: string | undefined

  try {
    server = app.listen(0)
    await once(server, 'listening')
    const address = server.address()
    assert.ok(address && typeof address !== 'string')
    const baseUrl = `http://127.0.0.1:${address.port}/api`

    const request = async (
      endpoint: string,
      options: RequestInit = {},
    ): Promise<ApiResponse> => {
      const response = await fetch(`${baseUrl}${endpoint}`, options)
      return { status: response.status, body: await response.json() as ApiResponse['body'] }
    }
    const login = async (userEmail: string, password: string) => {
      const response = await request('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, password }),
      })
      assert.equal(response.status, 200, response.body.message ?? 'Login API gagal')
      return response.body.data.token as string
    }

    const registration = await request('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Integration Reporter', email, nim, password: 'TestPass123!' }),
    })
    assert.equal(registration.status, 201, registration.body.message ?? 'Registrasi pelapor gagal')
    reporterId = registration.body.data.user.id
    const reporterToken = registration.body.data.token as string

    const bcrypt = await import('bcryptjs')
    const adminPassword = 'AdminTest123!'
    const admin = await prisma.user.create({
      data: {
        name: 'Integration Admin',
        email: `admin-${suffix}@example.test`,
        password: await bcrypt.hash(adminPassword, 4),
        role: 'admin',
      },
    })
    const adminToken = await login(admin.email, adminPassword)

    const otherRegistration = await request('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Other Reporter', email: secondEmail, nim: `O${suffix.replaceAll('-', '').slice(0, 19)}`, password: 'TestPass123!' }),
    })
    assert.equal(otherRegistration.status, 201, otherRegistration.body.message ?? 'Registrasi pengguna kedua gagal')
    otherUserId = otherRegistration.body.data.user.id
    const otherToken = otherRegistration.body.data.token as string

    const form = new FormData()
    form.set('title', 'Integration test ticket')
    form.set('category', 'Fasilitas')
    form.set('location', 'K1')
    form.set('priority', 'high')
    form.set('description', 'Tiket untuk pengujian integrasi database.')
    form.set('image', new Blob(['test image content'], { type: 'image/png' }), 'evidence.png')
    const idempotencyKey = randomUUID()
    const created = await request('/ticket', {
      method: 'POST',
      headers: { Authorization: `Bearer ${reporterToken}`, 'Idempotency-Key': idempotencyKey },
      body: form,
    })
    assert.equal(created.status, 201, created.body.message ?? 'Pembuatan tiket gagal')
    const ticket = created.body.data
    ticketId = ticket.id
    uploadedPath = ticket.image_url
      ? path.join(storageDir, 'tickets', path.basename(new URL(ticket.image_url).pathname))
      : undefined
    assert.ok(ticket.code)
    assert.ok(ticket.image_url, 'respons membuat tiket menyertakan URL gambar')

    const persistedTicket = await prisma.ticket.findUnique({ where: { id: ticketId } })
    assert.equal(persistedTicket?.title, 'Integration test ticket')
    assert.ok(persistedTicket?.image, 'path gambar tersimpan di database')

    const ownDetail = await request(`/ticket/${ticket.code}`, {
      headers: { Authorization: `Bearer ${reporterToken}` },
    })
    assert.equal(ownDetail.status, 200)
    const forbiddenDetail = await request(`/ticket/${ticket.code}`, {
      headers: { Authorization: `Bearer ${otherToken}` },
    })
    assert.equal(forbiddenDetail.status, 403)

    const reply = await request(`/ticket-reply/${ticket.code}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Petugas sedang menindaklanjuti.', status: 'in_progress' }),
    })
    assert.equal(reply.status, 201, reply.body.message ?? 'Balasan admin gagal')

    const persistedReply = await prisma.ticketReply.findFirst({
      where: { ticketId, userId: admin.id },
    })
    const updatedTicket = await prisma.ticket.findUnique({ where: { id: ticketId } })
    assert.equal(persistedReply?.content, 'Petugas sedang menindaklanjuti.')
    assert.equal(updatedTicket?.status, 'in_progress')

    const updatedDetail = await request(`/ticket/${ticket.code}`, {
      headers: { Authorization: `Bearer ${reporterToken}` },
    })
    assert.equal(updatedDetail.status, 200)
    assert.equal(updatedDetail.body.data.status, 'in_progress')
    assert.ok(updatedDetail.body.data.ticket_replies.some((item: { content: string }) => item.content === 'Petugas sedang menindaklanjuti.'))
  } finally {
    if (server) {
      server.close()
      await once(server, 'close')
    }
    if (ticketId) {
      await prisma.ticketReply.deleteMany({ where: { ticketId } })
      await prisma.ticketImage.deleteMany({ where: { ticketId } })
      await prisma.ticket.deleteMany({ where: { id: ticketId } })
    }
    if (reporterId || otherUserId) {
      await prisma.user.deleteMany({ where: { id: { in: [reporterId, otherUserId].filter((id): id is number => Boolean(id)) } } })
    }
    await prisma.user.deleteMany({ where: { email: { startsWith: `admin-${suffix}@` } } })
    if (uploadedPath) await fs.unlink(uploadedPath).catch(() => undefined)
    await prisma.$disconnect()
  }
})
