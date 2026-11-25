import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createAdminReplySchema,
  createReplySchema,
  createTicketSchema,
  listTicketsQuerySchema,
} from '../src/validators/ticket.validator.js'
import {
  forgotPasswordSchema,
  registerSchema,
  resetPasswordSchema,
} from '../src/validators/auth.validator.js'

test('registrasi menerima data valid dan merapikan nama/email/NIM', () => {
  const result = registerSchema.safeParse({
    name: '  Siti  ',
    email: '  siti@example.com  ',
    nim: ' 12345 ',
    password: 'secret123',
  })

  assert.equal(result.success, true)
  if (result.success) {
    assert.equal(result.data.name, 'Siti')
    assert.equal(result.data.email, 'siti@example.com')
    assert.equal(result.data.nim, '12345')
  }
})

test('registrasi menolak email tidak valid dan password terlalu pendek', () => {
  const result = registerSchema.safeParse({
    name: 'Siti', email: 'bukan-email', nim: '12345', password: '123',
  })

  assert.equal(result.success, false)
})

test('prioritas normal dari frontend dinormalisasi menjadi medium', () => {
  const result = createTicketSchema.safeParse({
    title: ' Lampu rusak ',
    category: 'Fasilitas',
    location: 'K1',
    priority: 'normal',
    description: 'Lampu ruang kelas mati.',
  })

  assert.equal(result.success, true)
  if (result.success) {
    assert.equal(result.data.title, 'Lampu rusak')
    assert.equal(result.data.priority, 'medium')
  }
})

test('balasan menolak konten kosong setelah trim', () => {
  assert.equal(createReplySchema.safeParse({ content: '   ' }).success, false)
})

test('balasan admin wajib memakai status tiket yang valid', () => {
  assert.equal(
    createAdminReplySchema.safeParse({ content: 'Sedang ditangani', status: 'in_progress' }).success,
    true,
  )
  assert.equal(
    createAdminReplySchema.safeParse({ content: 'Selesai', status: 'unknown' }).success,
    false,
  )
})

test('query tiket mengubah alias status frontend dan membaca paginasi', () => {
  const result = listTicketsQuerySchema.safeParse({ status: 'on_progress', page: '2', per_page: '25' })

  assert.equal(result.success, true)
  if (result.success) {
    assert.equal(result.data.status, 'in_progress')
    assert.equal(result.data.page, 2)
    assert.equal(result.data.per_page, 25)
  }
})

test('lupa password menerima email yang sudah dirapikan', () => {
  const result = forgotPasswordSchema.safeParse({ email: '  Siti@Example.com  ' })

  assert.equal(result.success, true)
  if (result.success) assert.equal(result.data.email, 'Siti@Example.com')
})

test('reset password menolak token bukan heksadesimal 64 karakter', () => {
  assert.equal(
    resetPasswordSchema.safeParse({
      token: 'short',
      password: 'newpass123',
      password_confirmation: 'newpass123',
    }).success,
    false,
  )
})

test('reset password menolak konfirmasi yang tidak cocok', () => {
  const result = resetPasswordSchema.safeParse({
    token: 'a'.repeat(64),
    password: 'newpass123',
    password_confirmation: 'otherpass123',
  })

  assert.equal(result.success, false)
})

