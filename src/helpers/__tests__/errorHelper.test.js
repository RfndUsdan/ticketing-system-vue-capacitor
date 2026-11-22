import { describe, it, expect } from 'vitest'
import { handleError } from '@/helpers/errorHelper'

describe('handleError', () => {
  it('returns validation errors for 422', () => {
    const err = { response: { status: 422, data: { errors: { email: ['invalid'] } } } }
    expect(handleError(err)).toEqual({ email: ['invalid'] })
  })

  it('returns message for 401/400/500', () => {
    expect(handleError({ response: { status: 401, data: { message: 'Unauthenticated.' } } })).toBe('Unauthenticated.')
    expect(handleError({ response: { status: 400, data: { message: 'Bad' } } })).toBe('Bad')
    expect(handleError({ response: { status: 500, data: { message: 'Server' } } })).toBe('Server')
  })

  it('returns fallback for other status and network/unknown errors', () => {
    expect(handleError({ response: { status: 418, data: {} } })).toBe('Terjadi kesalahan (418)')
    expect(handleError({ request: {} })).toBe('Tidak dapat terhubung ke server. Periksa koneksi jaringan Anda.')
    expect(handleError(new Error('Boom'))).toBe('Boom')
    expect(handleError({})).toBe('Terjadi kesalahan yang tidak diketahui.')
  })
})
