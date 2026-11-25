import { z } from 'zod'

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email wajib diisi.')
  .max(255, 'Email maksimal 255 karakter.')
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Format email tidak valid.')

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi.').max(255),
  email: emailSchema,
  password: z.string().min(6, 'Password minimal 6 karakter.'),
  nim: z.string().trim().min(1, 'NIM wajib diisi.').max(20, 'NIM maksimal 20 karakter.'),
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

const resetTokenSchema = z
  .string()
  .regex(/^[a-f0-9]{64}$/i, 'Token reset tidak valid.')

export const resetPasswordSchema = z
  .object({
    token: resetTokenSchema,
    password: z.string().min(6, 'Password minimal 6 karakter.').max(128),
    password_confirmation: z.string().min(1, 'Konfirmasi password wajib diisi.'),
  })
  .refine((value) => value.password === value.password_confirmation, {
    message: 'Konfirmasi password tidak cocok.',
    path: ['password_confirmation'],
  })

