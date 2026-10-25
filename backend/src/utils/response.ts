import type { Response } from 'express'

export function success(
  res: Response,
  data: unknown = null,
  message = 'OK',
  status = 200,
): void {
  res.status(status).json({ message, data })
}

export function fail(
  res: Response,
  status: number,
  message: string,
  errors?: Record<string, string[]>,
): void {
  const body: { message: string; errors?: Record<string, string[]> } = { message }
  if (errors) body.errors = errors
  res.status(status).json(body)
}

export function notImplemented(res: Response, feature: string): void {
  fail(res, 501, `Endpoint ${feature} belum diimplementasikan pada scaffold.`)
}
