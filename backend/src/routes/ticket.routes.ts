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
import { ticketCreateLimit, ticketDeleteLimit, ticketDetailLimit, ticketListLimit } from '../middlewares/rate-limit.js'
import {
  createTicketSchema,
  listTicketsQuerySchema,
} from '../validators/ticket.validator.js'

const router = Router()

router.use(authenticate)

router.get('/', ticketListLimit, validate(listTicketsQuerySchema, 'query'), listTickets)
router.post('/', ticketCreateLimit, uploadTicketImage, validate(createTicketSchema), createTicket)
router.get('/:code', ticketDetailLimit, getTicket)
router.delete('/:code', ticketDeleteLimit, requireAdmin, deleteTicket)

export default router
