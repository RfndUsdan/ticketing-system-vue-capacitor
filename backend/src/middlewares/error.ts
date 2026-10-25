import type { ErrorRequestHandler, RequestHandler } from 'express'
import { env } from '../config/env.js'
import { fail } from '../utils/response.js'

type AppError = Error & {
  status?: number
  statusCode?: number
  code?: string
  field?: string
  meta?: { target?: string[] | string }
}

export const notFound: RequestHandler = (req, res) => {
  fail(res, 404, `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.`)
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    next(err)
    return
  }

  const error = err as AppError

  if (error.code === 'LIMIT_FILE_SIZE') {
    const maxSizeMb =
      error.field === 'avatar'
        ? env.AVATAR_MAX_UPLOAD_MB
        : env.TICKET_IMAGE_MAX_UPLOAD_MB
    const message = `Ukuran file maksimal ${maxSizeMb} MB.`
    fail(
      res,
      422,
      message,
      error.field ? { [error.field]: [message] } : undefined,
    )
    return
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Field upload tidak sesuai. Gunakan field "image" atau "avatar".'
    fail(
      res,
      422,
      message,
      error.field ? { [error.field]: [message] } : undefined,
    )
    return
  }

  if (error.code === 'P2002') {
    const target = Array.isArray(error.meta?.target)
      ? error.meta.target[0]
      : error.meta?.target
    fail(res, 422, 'Nilai sudah terdaftar.', {
      [target ?? 'field']: ['Nilai sudah terdaftar.'],
    })
    return
  }

  const status = error.status ?? error.statusCode ?? 500
  if (status >= 500) {
    console.error(error)
    if (env.isProduction) {
      res.status(status).json({ message: 'Server Error' })
    } else {
      res.status(status).json({
        message: 'Terjadi Kesalahan',
        error: error.message || 'Unknown error',
      })
    }
    return
  }

  if (status === 422 && error.field) {
    fail(res, status, error.message, { [error.field]: [error.message] })
    return
  }

  fail(res, status, error.message || 'Terjadi kesalahan pada server.')
}
