import type { NextFunction, Request, Response } from 'express'
import type { ZodType } from 'zod'

type ValidationSource = 'body' | 'query'

/**
 * Mengubah error Zod menjadi format yang sudah dipahami frontend:
 * { message, errors: { field: ['pesan', ...] } }
 */
export function validate(schema: ZodType, source: ValidationSource = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source])

    if (result.success) {
      if (source === 'body') {
        req.body = result.data
      } else {
        const requestWithQuery = req as Request & { validatedQuery?: unknown }
        requestWithQuery.validatedQuery = result.data
      }
      next()
      return
    }

    const errors: Record<string, string[]> = {}
    for (const issue of result.error.issues) {
      const field = issue.path.length > 0 ? issue.path.join('.') : '_form'
      errors[field] ??= []
      errors[field].push(issue.message)
    }

    const messages = Object.values(errors).flat()
    const remaining = messages.length - 1
    const message =
      remaining > 0
        ? `${messages[0]} (and ${remaining} more ${remaining === 1 ? 'error' : 'errors'})`
        : messages[0] ?? 'Data tidak valid.'

    res.status(422).json({ message, errors })
  }
}
