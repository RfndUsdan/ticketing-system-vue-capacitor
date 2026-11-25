import { env } from '../config/env.js'

/**
 * Mengirim email reset melalui webhook HTTP. Tidak menyimpan API key di frontend.
 * Implementasi ini sengaja tidak bergantung pada library email tertentu agar bisa
 * dipakai dengan penyedia mana pun yang menerima payload umum di bawah ini.
 */
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
): Promise<boolean> {
  if (!env.PASSWORD_RESET_EMAIL_URL) return false

  const subject = 'Atur ulang password Apa Kabar'
  const text = `Klik tautan berikut untuk mengatur ulang password Anda: ${resetUrl}\nTautan ini berlaku selama ${env.PASSWORD_RESET_TTL_MINUTES} menit. Jika Anda tidak meminta penggantian password, abaikan email ini.`
  const html = `<p>Klik tautan berikut untuk mengatur ulang password Anda:</p><p><a href="${resetUrl}">Atur ulang password</a></p><p>Tautan ini berlaku selama ${env.PASSWORD_RESET_TTL_MINUTES} menit. Jika Anda tidak meminta penggantian password, abaikan email ini.</p>`

  const response = await fetch(env.PASSWORD_RESET_EMAIL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(env.PASSWORD_RESET_EMAIL_TOKEN
        ? { Authorization: `Bearer ${env.PASSWORD_RESET_EMAIL_TOKEN}` }
        : {}),
    },
    body: JSON.stringify({ to, subject, text, html }),
  })

  if (!response.ok) {
    throw new Error(`Email provider mengembalikan status ${response.status}`)
  }

  return true
}
