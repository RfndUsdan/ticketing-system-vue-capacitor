import bcrypt from 'bcryptjs'
import type { Request, Response } from 'express'
import type { Prisma } from '../generated/prisma/client.js'
import { env } from '../config/env.js'
import { prisma } from '../config/prisma.js'
import { fail } from '../utils/response.js'
import { serializeUser } from '../utils/serializers.js'
import {
  removeStoredFile,
  removeUploadedFile,
  storedFilePath,
} from '../utils/storage.js'
import {
  listUsersQuerySchema,
  type ListUsersQuery,
} from '../validators/user.validator.js'

const USERS_PER_PAGE = 10

function getValidatedQuery(req: Request): ListUsersQuery {
  const validated = (req as Request & { validatedQuery?: ListUsersQuery })
    .validatedQuery
  return validated ?? listUsersQuerySchema.parse(req.query)
}

function parseId(req: Request): number | null {
  const id = Number(req.params.id)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

function getUniqueErrors(
  matches: Array<{ email: string; nim: string | null }>,
  email?: string,
  nim?: string | null,
): Record<string, string[]> {
  const errors: Record<string, string[]> = {}
  if (email && matches.some((user) => user.email.toLowerCase() === email)) {
    errors.email = ['Email sudah terdaftar.']
  }
  if (nim && matches.some((user) => user.nim === nim)) {
    errors.nim = ['NIM sudah terdaftar.']
  }
  return errors
}

function sendValidationErrors(
  res: Response,
  errors: Record<string, string[]>,
): void {
  const messages = Object.values(errors).flat()
  const remaining = messages.length - 1
  const message =
    remaining > 0
      ? `${messages[0]} (and ${remaining} more ${remaining === 1 ? 'error' : 'errors'})`
      : messages[0] ?? 'Data tidak valid.'
  fail(res, 422, message, errors)
}

async function findUniqueConflicts(
  email?: string,
  nim?: string | null,
  exceptId?: number,
): Promise<Array<{ email: string; nim: string | null }>> {
  const OR: Prisma.UserWhereInput[] = []
  if (email) OR.push({ email: { equals: email, mode: 'insensitive' } })
  if (nim) OR.push({ nim })
  if (OR.length === 0) return []

  return prisma.user.findMany({
    where: {
      ...(exceptId === undefined ? {} : { id: { not: exceptId } }),
      OR,
    },
    select: { email: true, nim: true },
  })
}

function usersPageUrl(page: number, query: ListUsersQuery): string {
  const base = `${env.PUBLIC_BASE_URL.replace(/\/+$/, '')}/api/users`
  const params = new URLSearchParams({ page: String(page) })
  if (query.search) params.set('search', query.search)
  if (query.role) params.set('role', query.role)
  return `${base}?${params.toString()}`
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  const query = getValidatedQuery(req)
  const page = query.page
  const where: Prisma.UserWhereInput = {}

  if (query.role) where.role = query.role
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
      { nim: { contains: query.search, mode: 'insensitive' } },
    ]
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * USERS_PER_PAGE,
      take: USERS_PER_PAGE,
    }),
    prisma.user.count({ where }),
  ])

  const lastPage = Math.max(1, Math.ceil(total / USERS_PER_PAGE))
  const path = `${env.PUBLIC_BASE_URL.replace(/\/+$/, '')}/api/users`
  const pageUrl = (number: number): string => usersPageUrl(number, query)
  const data = users.map((user) => serializeUser(user))
  const pageLinks = Array.from({ length: lastPage }, (_, index) => {
    const linkPage = index + 1
    return {
      url: pageUrl(linkPage),
      label: String(linkPage),
      page: linkPage,
      active: linkPage === page,
    }
  })

  res.status(200).json({
    data,
    links: {
      first: pageUrl(1),
      last: pageUrl(lastPage),
      prev: page > 1 ? pageUrl(page - 1) : null,
      next: page < lastPage ? pageUrl(page + 1) : null,
    },
    meta: {
      current_page: page,
      from: data.length > 0 ? (page - 1) * USERS_PER_PAGE + 1 : null,
      last_page: lastPage,
      links: [
        {
          url: page > 1 ? pageUrl(page - 1) : null,
          label: '&laquo; Previous',
          page: page > 1 ? page - 1 : null,
          active: false,
        },
        ...pageLinks,
        {
          url: page < lastPage ? pageUrl(page + 1) : null,
          label: 'Next &raquo;',
          page: page < lastPage ? page + 1 : null,
          active: false,
        },
      ],
      path,
      per_page: USERS_PER_PAGE,
      to: data.length > 0 ? (page - 1) * USERS_PER_PAGE + data.length : null,
      total,
    },
  })
}

export async function getUser(req: Request, res: Response): Promise<void> {
  const id = parseId(req)
  if (id === null) {
    res.status(404).json({ message: 'User tidak ditemukan' })
    return
  }

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    res.status(404).json({ message: 'User tidak ditemukan' })
    return
  }

  res.status(200).json({ data: serializeUser(user) })
}

export async function createUser(req: Request, res: Response): Promise<void> {
  const { name, email: rawEmail, password, nim, role } = req.body as {
    name: string
    email: string
    password: string
    nim: string
    role: string
  }
  const email = rawEmail.trim().toLowerCase()

  try {
    const conflicts = await findUniqueConflicts(email, nim)
    const errors = getUniqueErrors(conflicts, email, nim)
    if (Object.keys(errors).length > 0) {
      await removeUploadedFile(req.file)
      sendValidationErrors(res, errors)
      return
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: await bcrypt.hash(password, env.BCRYPT_ROUNDS),
        nim,
        role,
        ...(req.file ? { avatar: storedFilePath('avatars', req.file.filename) } : {}),
      },
    })

    res.status(201).json({ data: serializeUser(user) })
  } catch (error) {
    await removeUploadedFile(req.file)
    throw error
  }
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  const id = parseId(req)
  if (id === null) {
    await removeUploadedFile(req.file)
    res.status(404).json({ message: 'User tidak ditemukan' })
    return
  }

  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) {
    await removeUploadedFile(req.file)
    res.status(404).json({ message: 'User tidak ditemukan' })
    return
  }

  const body = req.body as {
    name?: string
    email?: string
    password?: string
    nim?: string | null
    role?: string
    remove_avatar?: boolean
  }
  const email = body.email?.trim().toLowerCase()
  const conflicts = await findUniqueConflicts(email, body.nim, id)
  const errors = getUniqueErrors(conflicts, email, body.nim)
  if (Object.keys(errors).length > 0) {
    await removeUploadedFile(req.file)
    sendValidationErrors(res, errors)
    return
  }

  const data: Prisma.UserUpdateInput = {}
  if (body.name !== undefined) data.name = body.name
  if (email !== undefined) data.email = email
  if (body.nim !== undefined) data.nim = body.nim
  if (body.role !== undefined) data.role = body.role
  if (body.password) data.password = await bcrypt.hash(body.password, env.BCRYPT_ROUNDS)

  const newAvatar = req.file
    ? storedFilePath('avatars', req.file.filename)
    : undefined
  if (newAvatar) data.avatar = newAvatar
  else if (body.remove_avatar) data.avatar = null

  let user
  try {
    user = await prisma.user.update({ where: { id }, data })
  } catch (error) {
    await removeUploadedFile(req.file)
    throw error
  }

  if (existing.avatar && (newAvatar || body.remove_avatar)) {
    await removeStoredFile(existing.avatar).catch((error) => {
      console.error('Gagal menghapus avatar lama:', error)
    })
  }
  res.status(200).json({ data: serializeUser(user) })
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  const id = parseId(req)
  if (id === null) {
    res.status(404).json({ message: 'User tidak ditemukan' })
    return
  }

  if (req.user?.id === id) {
    fail(res, 403, 'Tidak dapat menghapus akun yang sedang digunakan.')
    return
  }

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    res.status(404).json({ message: 'User tidak ditemukan' })
    return
  }

  await prisma.user.delete({ where: { id } })
  await removeStoredFile(user.avatar).catch((error) => {
    console.error('Gagal menghapus avatar user:', error)
  })
  res.status(200).json({ message: 'User berhasil dihapus' })
}
