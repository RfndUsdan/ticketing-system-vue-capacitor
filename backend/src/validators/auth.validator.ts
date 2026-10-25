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
