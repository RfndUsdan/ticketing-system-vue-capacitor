import { z } from 'zod'
import { USER_ROLES } from '../utils/constants.js'

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email wajib diisi.')
  .max(255, 'Email maksimal 255 karakter.')
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Format email tidak valid.')

const optionalPassword = z
  .union([
    z.string().min(8, 'Password minimal 8 karakter.'),
    z.literal(''),
    z.null(),
  ])
  .optional()
  .transform((value) => value || undefined)

const optionalNim = z
  .string()
  .trim()
  .max(50, 'NIM maksimal 50 karakter.')
  .optional()
  .nullable()
  .transform((value) => (value === '' ? null : value))

const removeAvatarSchema = z.preprocess(
  (value) => {
    if (value === undefined) return undefined
    return value === true || value === '1' || value === 'true'
  },
  z.boolean().optional(),
)

export const createUserSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi.').max(255),
  email: emailSchema,
  password: z.string().min(8, 'Password minimal 8 karakter.'),
  nim: z.string().trim().min(1, 'NIM wajib diisi.').max(50, 'NIM maksimal 50 karakter.'),
  role: z.enum(USER_ROLES),
})

export const updateUserSchema = z.object({
  name: z.string().trim().min(1, 'Nama tidak boleh kosong.').max(255).optional(),
  email: emailSchema.optional(),
  password: optionalPassword,
  nim: optionalNim,
  role: z.enum(USER_ROLES).optional(),
  remove_avatar: removeAvatarSchema,
})

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi.').max(255),
  email: emailSchema,
  password: optionalPassword,
  nim: z.string().trim().min(1, 'NIM wajib diisi.').max(20, 'NIM maksimal 20 karakter.'),
})
