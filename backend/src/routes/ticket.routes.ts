import { Router } from 'express'
import {
  createTicket,
  deleteTicket,
  getTicket,
  listTickets,
} from '../controllers/ticket.controller.js'
import { authenticate, requireAdmin } from '../middlewares/auth.js'
import { uploadTicketImage } from '../middlewares/upload.js'
import { validate } from '../middlewares/validate.js'
import { createTicketSchema } from '../validators/ticket.validator.js'

const router = Router()

router.use(authenticate)

router.get('/', listTickets)
router.post('/', uploadTicketImage, validate(createTicketSchema), createTicket)
router.get('/:code', getTicket)
router.delete('/:code', requireAdmin, deleteTicket)

export default router
