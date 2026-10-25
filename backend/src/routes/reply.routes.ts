import { Router, type Request } from 'express'
import { createReply } from '../controllers/ticket.controller.js'
import { authenticate } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import {
  createAdminReplySchema,
  createReplySchema,
} from '../validators/ticket.validator.js'

const router = Router()

// Frontend memakai /api/ticket-reply/:code
router.post(
  '/:code',
  authenticate,
  (req: Request, res, next) => {
    const schema =
      req.user?.role === 'admin' ? createAdminReplySchema : createReplySchema
    validate(schema)(req, res, next)
  },
  createReply,
)

export default router
