import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { once } from 'node:events'
import fs from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

type ApiResponse = {
  status: number
  body: { message?: string; data?: any; meta?: any; code?: string; duplicate?: any }
}

test('API critical flows: auth, multi-image ticket, duplicate/idempotency, reply/status notifications, pagination', async () => {
  const databaseUrl = process.env.DATABASE_URL
  const databaseName = databaseUrl ? new URL(databaseUrl).pathname.slice(1) : ''
  if (!/(^|[-_])test($|[-_])/i.test(databaseName)) {
    throw new Error(
      'Integration test dibatalkan: DATABASE_URL harus mengarah ke database khusus dengan nama berakhiran _test (contoh: apakabar_test).',
    )
  }

  const [{ default: app }, { prisma }, { storageDir }] = await Promise.all([
    import('../src/app.js'),
    import('../src/config/prisma.js'),
    import('../src/middlewares/upload.js'),
  ])

  const suffix = randomUUID().replaceAll('-', '')
  const reporterEmail = `flow-reporter-${suffix}@example.test`
  const reporterNim = `F${suffix.slice(0, 19)}`
  const otherEmail = `flow-other-${suffix}@example.test`
  const otherNim = `G${suffix.slice(0, 19)}`
  const adminEmail = `flow-admin-${suffix}@example.test`
  const adminPassword = 'AdminTest123!'
  const reporterPassword = 'TestPass123!'

  let server: ReturnType<typeof app.listen> | undefined
  const createdTicketIds: number[] = []
  const createdUserIds: number[] = []
  const uploadedPaths: string[] = []

  try {
    server = app.listen(0)
    await once(server, 'listening')
    const address = server.address()
    assert.ok(address && typeof address !== 'string')
    const baseUrl = `http://127.0.0.1:${address.port}/api`

    const request = async (endpoint: string, options: RequestInit = {}): Promise<ApiResponse> => {
      const response = await fetch(`${baseUrl}${endpoint}`, options)
      return { status: response.status, body: await response.json() as ApiResponse['body'] }
    }
    const login = async (email: string, password: string) => {
      const res = await request('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      assert.equal(res.status, 200, res.body.message ?? 'Login gagal')
      return res.body.data.token as string
    }

    // --- Auth ---
    const reg = await request('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Flow Reporter', email: reporterEmail, nim: reporterNim, password: reporterPassword }),
    })
    assert.equal(reg.status, 201, reg.body.message ?? 'Registrasi gagal')
    createdUserIds.push(reg.body.data.user.id)
    const reporterToken = reg.body.data.token as string

    const badLogin = await request('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: reporterEmail, password: 'wrong-password' }),
    })
    assert.equal(badLogin.status, 401)

    const bcrypt = await import('bcryptjs')
    const admin = await prisma.user.create({
      data: { name: 'Flow Admin', email: adminEmail, password: await bcrypt.hash(adminPassword, 4), role: 'admin' },
    })
    createdUserIds.push(admin.id)
    const adminToken = await login(adminEmail, adminPassword)

    const otherReg = await request('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Flow Other', email: otherEmail, nim: otherNim, password: reporterPassword }),
    })
    assert.equal(otherReg.status, 201)
    createdUserIds.push(otherReg.body.data.user.id)
    const otherToken = otherReg.body.data.token as string

    // --- Multi-image create ticket ---
    const form = new FormData()
    form.set('title', 'Multi image ticket')
    form.set('category', 'Fasilitas')
    form.set('location', 'Lab A')
    form.set('priority', 'high')
    form.set('description', 'Tiket dengan beberapa gambar.')
    form.set('images', new Blob(['img1'], { type: 'image/png' }), 'one.png')
    form.append('images', new Blob(['img2'], { type: 'image/jpeg' }), 'two.jpg')

    const created = await request('/ticket', {
      method: 'POST',
      headers: { Authorization: `Bearer ${reporterToken}`, 'Idempotency-Key': randomUUID() },
      body: form,
    })
    assert.equal(created.status, 201, created.body.message ?? 'Create multi-image gagal')
    const ticket = created.body.data
    createdTicketIds.push(ticket.id)
    assert.equal(Array.isArray(ticket.images), true)
    assert.equal(ticket.images.length, 2)
    assert.ok(ticket.image_url)
    for (const img of ticket.images) {
      if (img?.path) {
        uploadedPaths.push(path.join(storageDir, img.path.replace(/^tickets\//, 'tickets/')))
      }
    }

    // --- Idempotency replay ---
    const idemKey = randomUUID()
    const idemForm = () => {
      const f = new FormData()
      f.set('title', 'Idempotent ticket')
      f.set('category', 'Jaringan')
      f.set('location', 'Lab B')
      f.set('priority', 'medium')
      f.set('description', 'Pengujian idempotency key.')
      f.set('images', new Blob(['same-image'], { type: 'image/png' }), 'idem.png')
      return f
    }
    const first = await request('/ticket', {
      method: 'POST',
      headers: { Authorization: `Bearer ${reporterToken}`, 'Idempotency-Key': idemKey },
      body: idemForm(),
    })
    assert.equal(first.status, 201, first.body.message)
    createdTicketIds.push(first.body.data.id)

    const replay = await request('/ticket', {
      method: 'POST',
      headers: { Authorization: `Bearer ${reporterToken}`, 'Idempotency-Key': idemKey },
      body: idemForm(),
    })
    assert.equal(replay.status, 201)
    assert.equal(replay.body.data.code, first.body.data.code)

    // --- Idempotency conflict (same key, different payload) ---
    const conflictForm = new FormData()
    conflictForm.set('title', 'Different payload')
    conflictForm.set('category', 'Jaringan')
    conflictForm.set('location', 'Lab B')
    conflictForm.set('priority', 'medium')
    conflictForm.set('description', 'Payload berbeda.')
    conflictForm.set('images', new Blob(['different'], { type: 'image/png' }), 'diff.png')
    const conflict = await request('/ticket', {
      method: 'POST',
      headers: { Authorization: `Bearer ${reporterToken}`, 'Idempotency-Key': idemKey },
      body: conflictForm,
    })
    assert.equal(conflict.status, 409)

    // --- Duplicate detection (seed recent similar ticket directly to avoid rate/cooldown issues) ---
    const now = new Date()
    const dupTicket = await prisma.ticket.create({
      data: {
        code: `DUP-${suffix.slice(0, 8)}`,
        userId: reg.body.data.user.id,
        title: 'Duplicate title',
        category: 'Fasilitas',
        location: 'Lab C',
        priority: 'low',
        description: 'Deskripsi duplikat yang sama persis.',
        status: 'open',
        createdAt: now,
        updatedAt: now,
      },
    })
    createdTicketIds.push(dupTicket.id)

    const dupForm = new FormData()
    dupForm.set('title', 'Duplicate title')
    dupForm.set('category', 'Fasilitas')
    dupForm.set('location', 'Lab C')
    dupForm.set('priority', 'low')
    dupForm.set('description', 'Deskripsi duplikat yang sama persis.')
    const dupRes = await request('/ticket', {
      method: 'POST',
      headers: { Authorization: `Bearer ${reporterToken}`, 'Idempotency-Key': randomUUID() },
      body: dupForm,
    })
    assert.equal(dupRes.status, 409)
    assert.equal(dupRes.body.code, 'DUPLICATE_TICKET')

    const dupAllowed = await request('/ticket', {
      method: 'POST',
      headers: { Authorization: `Bearer ${reporterToken}`, 'Idempotency-Key': randomUUID(), 'X-Allow-Duplicate': 'true' },
      body: dupForm,
    })
    // may be 201 or 429 due to cooldown; seed last ticket old enough to avoid cooldown
    // We'll assert it is not 409 duplicate when allow flag set
    assert.notEqual(dupAllowed.status, 409)
    if (dupAllowed.status === 201) createdTicketIds.push(dupAllowed.body.data.id)

    // --- Cooldown (business rule) by setting recent ticket ---
    // Create a fresh user for cooldown test to avoid rate limit collision
    const cdEmail = `flow-cd-${suffix}@example.test`
    const cdReg = await request('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Cooldown User', email: cdEmail, nim: `C${suffix.slice(0, 19)}`, password: reporterPassword }),
    })
    assert.equal(cdReg.status, 201)
    createdUserIds.push(cdReg.body.data.user.id)
    const cdToken = cdReg.body.data.token as string

    await prisma.ticket.create({
      data: {
        code: `CD-${suffix.slice(0, 8)}`,
        userId: cdReg.body.data.user.id,
        title: 'Recent ticket',
        category: 'Lainnya',
        location: 'X',
        priority: 'low',
        description: 'recent',
        status: 'open',
        createdAt: new Date(), // just now => cooldown active
      },
    }).then((t) => createdTicketIds.push(t.id))

    const cdForm = new FormData()
    cdForm.set('title', 'Should cooldown')
    cdForm.set('category', 'Lainnya')
    cdForm.set('location', 'Y')
    cdForm.set('priority', 'low')
    cdForm.set('description', 'should be blocked by cooldown')
    const cdRes = await request('/ticket', {
      method: 'POST',
      headers: { Authorization: `Bearer ${cdToken}`, 'Idempotency-Key': randomUUID() },
      body: cdForm,
    })
    assert.equal(cdRes.status, 429)

    // --- Reply/status and notifications ---
    const replyRes = await request(`/ticket-reply/${ticket.code}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Sedang diproses oleh admin.', status: 'in_progress' }),
    })
    assert.equal(replyRes.status, 201, replyRes.body.message)

    const reporterNotifs = await request('/notifications', {
      headers: { Authorization: `Bearer ${reporterToken}` },
    })
    assert.equal(reporterNotifs.status, 200)
    assert.ok(Array.isArray(reporterNotifs.body.data))
    assert.ok(reporterNotifs.body.data.some((n: any) => n.data?.ticket_code === ticket.code))

    const unread = await request('/notifications/unread-count', {
      headers: { Authorization: `Bearer ${reporterToken}` },
    })
    assert.equal(unread.status, 200)
    assert.equal(typeof unread.body.data.unread_count, 'number')

    // mark read
    const firstNotif = reporterNotifs.body.data[0]
    if (firstNotif) {
      const mark = await request(`/notifications/${firstNotif.id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${reporterToken}` },
      })
      assert.equal(mark.status, 200)
      assert.ok(mark.body.data.read_at)
    }

    const markAll = await request('/notifications/read-all', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${reporterToken}` },
    })
    assert.equal(markAll.status, 200)

    // user replies -> admin gets notification
    const userReply = await request(`/ticket-reply/${ticket.code}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${reporterToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Terima kasih, saya tunggu.' }),
    })
    assert.equal(userReply.status, 201, userReply.body.message)

    const adminNotifs = await request('/notifications', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    assert.equal(adminNotifs.status, 200)
    assert.ok(adminNotifs.body.data.some((n: any) => n.data?.ticket_code === ticket.code))

    // --- Pagination ---
    // seed extra tickets for pagination (direct DB to avoid limits)
    for (let i = 0; i < 12; i++) {
      const t = await prisma.ticket.create({
        data: {
          code: `PG-${suffix.slice(0, 6)}-${i}`,
          userId: reg.body.data.user.id,
          title: `Pagination ticket ${i}`,
          category: 'Fasilitas',
          location: 'Lab P',
          priority: 'low',
          description: `Pagination ${i}`,
          status: 'open',
          createdAt: new Date(Date.now() - i * 1000),
        },
      })
      createdTicketIds.push(t.id)
    }
    const page1 = await request('/ticket?page=1&per_page=5', {
      headers: { Authorization: `Bearer ${reporterToken}` },
    })
    assert.equal(page1.status, 200)
    assert.equal(page1.body.data.length, 5)
    assert.equal(page1.body.meta.current_page, 1)
    assert.equal(page1.body.meta.per_page, 5)
    assert.ok(page1.body.meta.total >= 12)

    const page2 = await request('/ticket?page=2&per_page=5', {
      headers: { Authorization: `Bearer ${reporterToken}` },
    })
    assert.equal(page2.status, 200)
    assert.equal(page2.body.data.length, 5)
    assert.notEqual(page1.body.data[0].code, page2.body.data[0].code)

    // ownership still enforced
    const forbidden = await request(`/ticket/${ticket.code}`, { headers: { Authorization: `Bearer ${otherToken}` } })
    assert.equal(forbidden.status, 403)

    // device token endpoint
    const dt = await request('/notifications/device-token', {
      method: 'POST',
      headers: { Authorization: `Bearer ${reporterToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: `test-device-${suffix}`, platform: 'android' }),
    })
    assert.equal(dt.status, 200)
  } finally {
    if (server) {
      server.close()
      await once(server, 'close')
    }
    if (createdTicketIds.length) {
      await prisma.notification.deleteMany({ where: { userId: { in: createdUserIds } } })
      await prisma.ticketReply.deleteMany({ where: { ticketId: { in: createdTicketIds } } })
      await prisma.ticketImage.deleteMany({ where: { ticketId: { in: createdTicketIds } } })
      await prisma.ticket.deleteMany({ where: { id: { in: createdTicketIds } } })
    }
    await prisma.deviceToken.deleteMany({ where: { token: { startsWith: `test-device-${suffix}` } } })
    if (createdUserIds.length) {
      await prisma.notification.deleteMany({ where: { userId: { in: createdUserIds } } })
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } })
    }
    for (const p of uploadedPaths) {
      const normalized = path.isAbsolute(p) ? p : path.join(storageDir, p.replace(/^tickets[\\/]/, 'tickets/'))
      await fs.unlink(normalized).catch(() => undefined)
    }
    await prisma.$disconnect()
  }
})

test('API critical flows: daily limit, notification ownership, admin delete ticket', async () => {
  const databaseUrl = process.env.DATABASE_URL
  const databaseName = databaseUrl ? new URL(databaseUrl).pathname.slice(1) : ''
  if (!/(^|[-_])test($|[-_])/i.test(databaseName)) {
    throw new Error('Integration test dibatalkan: DATABASE_URL harus mengarah ke database khusus dengan nama berakhiran _test.')
  }

  const [{ default: app }, { prisma }] = await Promise.all([
    import('../src/app.js'),
    import('../src/config/prisma.js'),
  ])

  const suffix = randomUUID().replaceAll('-', '')
  let server: ReturnType<typeof app.listen> | undefined
  const createdTicketIds: number[] = []
  const createdUserIds: number[] = []

  try {
    server = app.listen(0)
    await once(server, 'listening')
    const address = server.address()
    assert.ok(address && typeof address !== 'string')
    const baseUrl = `http://127.0.0.1:${address.port}/api`

    const request = async (endpoint: string, options: RequestInit = {}): Promise<ApiResponse> => {
      const response = await fetch(`${baseUrl}${endpoint}`, options)
      return { status: response.status, body: await response.json() as ApiResponse['body'] }
    }

    const userPass = 'TestPass123!'
    const reg = await request('/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Limit User', email: `limit-${suffix}@example.test`, nim: `L${suffix.slice(0, 19)}`, password: userPass }),
    })
    assert.equal(reg.status, 201)
    createdUserIds.push(reg.body.data.user.id)
    const userToken = reg.body.data.token as string

    const reg2 = await request('/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Other User', email: `other2-${suffix}@example.test`, nim: `M${suffix.slice(0, 19)}`, password: userPass }),
    })
    assert.equal(reg2.status, 201)
    createdUserIds.push(reg2.body.data.user.id)
    const otherToken = reg2.body.data.token as string

    const bcrypt = await import('bcryptjs')
    const admin = await prisma.user.create({
      data: { name: 'Admin', email: `admin2-${suffix}@example.test`, password: await bcrypt.hash('AdminTest123!', 4), role: 'admin' },
    })
    createdUserIds.push(admin.id)
    const adminLogin = await request('/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: admin.email, password: 'AdminTest123!' }) })
    assert.equal(adminLogin.status, 200)
    const adminToken = adminLogin.body.data.token as string

    // daily limit: seed 5 tickets today for user
    const dayStart = new Date()
    dayStart.setUTCHours(0, 0, 0, 0)
    for (let i = 0; i < 5; i++) {
      const t = await prisma.ticket.create({
        data: {
          code: `DL-${suffix.slice(0, 6)}-${i}`,
          userId: reg.body.data.user.id,
          title: `Daily ${i}`, category: 'Fasilitas', location: 'X', priority: 'low', description: 'd', status: 'open',
          createdAt: new Date(dayStart.getTime() + i * 60000),
        },
      })
      createdTicketIds.push(t.id)
    }
    const overLimitForm = new FormData()
    overLimitForm.set('title', 'Over limit')
    overLimitForm.set('category', 'Fasilitas')
    overLimitForm.set('location', 'X')
    overLimitForm.set('priority', 'low')
    overLimitForm.set('description', 'should fail daily limit')
    const overLimit = await request('/ticket', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}`, 'Idempotency-Key': randomUUID() },
      body: overLimitForm,
    })
    assert.equal(overLimit.status, 429)

    // notification ownership
    const notif = await prisma.notification.create({
      data: { userId: reg.body.data.user.id, type: 'test', title: 't', message: 'm', data: { ticket_code: 'X' } },
    })
    const otherRead = await request(`/notifications/${notif.id}/read`, { method: 'PATCH', headers: { Authorization: `Bearer ${otherToken}` } })
    assert.equal(otherRead.status, 404)
    await prisma.notification.delete({ where: { id: notif.id } })

    // admin delete ticket
    const ticket = await prisma.ticket.create({
      data: { code: `DEL-${suffix.slice(0, 8)}`, userId: reg.body.data.user.id, title: 'To delete', category: 'Fasilitas', location: 'Y', priority: 'low', description: 'd', status: 'open' },
    })
    createdTicketIds.push(ticket.id)
    const del = await request(`/ticket/${ticket.code}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } })
    assert.equal(del.status, 200)
  } finally {
    if (server) { server.close(); await once(server, 'close') }
    if (createdTicketIds.length) {
      await prisma.notification.deleteMany({ where: { userId: { in: createdUserIds } } })
      await prisma.ticketReply.deleteMany({ where: { ticketId: { in: createdTicketIds } } })
      await prisma.ticketImage.deleteMany({ where: { ticketId: { in: createdTicketIds } } })
      await prisma.ticket.deleteMany({ where: { id: { in: createdTicketIds } } })
    }
    if (createdUserIds.length) {
      await prisma.notification.deleteMany({ where: { userId: { in: createdUserIds } } })
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } })
    }
    await prisma.$disconnect()
  }
})